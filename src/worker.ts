export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach(cookie => {
    let [name, ...rest] = cookie.split("=");
    name = name?.trim();
    if (!name) return;
    list[name] = decodeURIComponent(rest.join("=").trim());
  });
  return list;
}

async function getSessionUser(request: Request, env: Env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const sessionId = cookies["session_id"];
  if (!sessionId) return null;
  const session: any = await env.DB.prepare(
    "SELECT users.id, users.email FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?"
  ).bind(sessionId, Date.now()).first();
  return session || null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Health Endpoint
    if (url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 as alive").first();
        return new Response(JSON.stringify({ status: "ok", db: result ? "connected" : "idle" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // 2. Auth: Register
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { email, password } = await request.json() as any;
        if (!email || !password) return new Response(JSON.stringify({ error: "Email dan password wajib diisi" }), { status: 400 });
        
        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) return new Response(JSON.stringify({ error: "Email sudah terdaftar" }), { status: 409 });

        const id = crypto.randomUUID();
        const hash = await hashPassword(password);
        const now = Date.now();
        await env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, email, hash, now, now).run();

        return new Response(JSON.stringify({ success: true, userId: id }), { status: 201 });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
    }

    // 3. Auth: Login
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json() as any;
        const hash = await hashPassword(password);
        const user: any = await env.DB.prepare(
          "SELECT id, email FROM users WHERE email = ? AND password_hash = ?"
        ).bind(email, hash).first();

        if (!user) return new Response(JSON.stringify({ error: "Email atau password salah" }), { status: 401 });

        const sessionId = crypto.randomUUID();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        await env.DB.prepare(
          "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
        ).bind(sessionId, user.id, expiresAt, Date.now()).run();

        const headers = new Headers({ "Content-Type": "application/json" });
        headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
        return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email } }), { status: 200, headers });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 400 });
      }
    }

    // 4. Auth: Me
    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ user: null }), { status: 401 });
      return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // 5. Auth: Logout
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookies = parseCookies(request.headers.get("Cookie"));
      const sessionId = cookies["session_id"];
      if (sessionId) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", "session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // 6. Proyek: List & Create
    if (url.pathname === "/api/projects" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const rows = await env.DB.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id).all();
      return new Response(JSON.stringify({ projects: rows.results }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/projects" && request.method === "POST") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const { name } = await request.json() as any;
      if (!name) return new Response(JSON.stringify({ error: "Nama proyek wajib diisi" }), { status: 400 });

      const id = "proj_" + crypto.randomUUID().slice(0, 8);
      const now = Date.now();
      await env.DB.prepare(
        "INSERT INTO projects (id, user_id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(id, user.id, name, "active", now, now).run();

      return new Response(JSON.stringify({ success: true, project: { id, name, status: "active", updated_at: now } }), { status: 201 });
    }

    // 7. AI Visual Flux Generator + Catat ke D1
    if (url.pathname === "/api/ai/image" && request.method === "POST") {
      try {
        const user = await getSessionUser(request, env);
        const { prompt } = await request.json() as any;
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt gambar wajib diisi" }), { status: 400 });

        const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
          prompt,
          steps: 4
        });

        const buffer = await new Response(response).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const imageUrl = `data:image/jpeg;base64,${base64}`;

        // Simpan log ke tabel ai_logs D1
        const logId = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO ai_logs (id, user_id, mode, model_used, prompt, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(logId, user ? user.id : "anonymous", "image", "flux-1-schnell", prompt, "[base64_image_data]", Date.now()).run();

        return new Response(JSON.stringify({ imageUrl }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: "Gagal membuat gambar: " + err.message }), { status: 500 });
      }
    }

    // 8. AI Text Inference (9router) + Catat ke D1
    if (url.pathname === "/api/ai/run" && request.method === "POST") {
      try {
        const user = await getSessionUser(request, env);
        const { prompt, model, systemPrompt } = await request.json() as any;
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt tidak boleh kosong" }), { status: 400 });

        const targetModel = model || "Comku";
        const apiKey = env.NINE_ROUTER_API_KEY;
        const baseUrl = (env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1").replace(/\/+$/, "");

        const messages = [];
        if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
        messages.push({ role: "user", content: prompt });

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: targetModel,
            messages,
            stream: false
          })
        });

        const rawText = await response.text();
        let finalReply = "";

        try {
          const parsed = JSON.parse(rawText);
          finalReply = parsed.choices?.[0]?.message?.content || parsed.choices?.[0]?.text || parsed.error?.message || "";
        } catch (_) {}

        if (!finalReply && rawText.includes("data:")) {
          let accumulated = "";
          for (const line of rawText.split("\n")) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
              try {
                const chunk = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                accumulated += (chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.text || "");
              } catch (_) {}
            }
          }
          if (accumulated.trim().length > 0) finalReply = accumulated;
        }

        if (!finalReply) finalReply = rawText;

        // Catat log eksekusi ke D1
        const logId = crypto.randomUUID();
        await env.DB.prepare(
          "INSERT INTO ai_logs (id, user_id, mode, model_used, prompt, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(logId, user ? user.id : "anonymous", "text", targetModel, prompt, finalReply, Date.now()).run();

        return new Response(JSON.stringify({ reply: finalReply }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
