export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
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
  try {
    const cookies = parseCookies(request.headers.get("Cookie"));
    const sessionId = cookies["session_id"];
    if (!sessionId) return null;
    const session: any = await env.DB.prepare(
      "SELECT users.id, users.email, users.role FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?"
    ).bind(sessionId, Date.now()).first();
    return session || null;
  } catch (_) {
    return null;
  }
}

// Helper: Ambil atau inisialisasi meteran pemakaian user bulan ini
async function getOrCreateUsage(env: Env, userId: string) {
  const period = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
  let meter: any = await env.DB.prepare(
    "SELECT * FROM usage_meter WHERE user_id = ? AND month_period = ?"
  ).bind(userId, period).first();

  if (!meter) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO usage_meter (id, user_id, tier, tokens_used, images_generated, month_period, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, userId, "Free", 0, 0, period, Date.now()).run();
    meter = { id, user_id: userId, tier: "Free", tokens_used: 0, images_generated: 0, month_period: period };
  }
  return meter;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "healthy", timestamp: Date.now() }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Auth: Me
    if (url.pathname === "/api/auth/me") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ user: null }), { status: 401, headers: { "Content-Type": "application/json" } });
      const usage = await getOrCreateUsage(env, user.id);
      return new Response(JSON.stringify({ user, usage }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Auth: Logout
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookies = parseCookies(request.headers.get("Cookie"));
      const sessionId = cookies["session_id"];
      if (sessionId) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", "session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Usage Meter Check
    if (url.pathname === "/api/usage" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const usage = await getOrCreateUsage(env, user.id);
      return new Response(JSON.stringify({ usage }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Projects CRUD
    if (url.pathname === "/api/projects") {
      const user = await getSessionUser(request, env);
      if (request.method === "GET") {
        if (!user) return new Response(JSON.stringify({ projects: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
        const rows = await env.DB.prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id).all();
        return new Response(JSON.stringify({ projects: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (request.method === "POST") {
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const { name } = await request.json() as any;
        const id = "proj_" + crypto.randomUUID().slice(0, 8);
        const now = Date.now();
        await env.DB.prepare("INSERT INTO projects (id, user_id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, user.id, name, "active", now, now).run();
        return new Response(JSON.stringify({ success: true, project: { id, name, status: "active", updated_at: now } }), { status: 201 });
      }
    }

    // Logs Fetcher
    if (url.pathname === "/api/logs" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      const rows = await env.DB.prepare("SELECT * FROM ai_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").bind(user ? user.id : "anonymous").all();
      return new Response(JSON.stringify({ logs: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // BYOK
    if (url.pathname === "/api/byok") {
      const user = await getSessionUser(request, env);
      if (request.method === "GET") {
        if (!user) return new Response(JSON.stringify({ keys: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
        const rows = await env.DB.prepare("SELECT id, provider, updated_at FROM byok_keys WHERE user_id = ?").bind(user.id).all();
        return new Response(JSON.stringify({ keys: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (request.method === "POST") {
        if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        const { provider, apiKey } = await request.json() as any;
        const id = crypto.randomUUID();
        const now = Date.now();
        await env.DB.prepare("INSERT INTO byok_keys (id, user_id, provider, api_key_encrypted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(id, user.id, provider, apiKey, now, now).run();
        return new Response(JSON.stringify({ success: true }), { status: 201 });
      }
    }

    // AI Image Generator dengan Usage Quota Gate
    if (url.pathname === "/api/ai/image" && request.method === "POST") {
      try {
        const user = await getSessionUser(request, env);
        const body = await request.json() as any;
        const prompt = body?.prompt?.trim();
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt gambar wajib diisi" }), { status: 400, headers: { "Content-Type": "application/json" } });

        // Gate: Cek Kuota Akun Free (Batas 10 gambar/bln)
        if (user) {
          const usage = await getOrCreateUsage(env, user.id);
          if (usage.tier === "Free" && usage.images_generated >= 10) {
            return new Response(JSON.stringify({
              error: "Batas kuota visual paket Free tercapai (10 gambar). Upgrade ke Plus atau gunakan BYOK."
            }), { status: 429, headers: { "Content-Type": "application/json" } });
          }
        }

        const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 });
        const buffer = await new Response(response).arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        const imageUrl = `data:image/jpeg;base64,${btoa(binary)}`;

        // Potong Kuota & Catat Log
        if (user) {
          await env.DB.prepare(
            "UPDATE usage_meter SET images_generated = images_generated + 1, updated_at = ? WHERE user_id = ?"
          ).bind(Date.now(), user.id).run();
        }

        await env.DB.prepare("INSERT INTO ai_logs (id, user_id, mode, model_used, prompt, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(crypto.randomUUID(), user ? user.id : "anonymous", "image", "flux-1-schnell", prompt, imageUrl, Date.now()).run();

        return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: "Visual error: " + e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // AI Text Chat dengan Usage Gate & Cost Controller
    if (url.pathname === "/api/ai/run" && request.method === "POST") {
      try {
        const user = await getSessionUser(request, env);
        const body = await request.json() as any;
        const prompt = body?.prompt?.trim();

        if (!prompt) {
          return new Response(JSON.stringify({ error: "Prompt tidak boleh kosong" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // Gate: Cek Kuota Akun Free (Batas 50 request teks/bln)
        if (user) {
          const usage = await getOrCreateUsage(env, user.id);
          if (usage.tier === "Free" && usage.tokens_used >= 50) {
            return new Response(JSON.stringify({
              error: "Batas kuota teks paket Free tercapai (50 chat). Masukkan API Key Anda di tab AI Studio (BYOK) untuk akses tanpa batas."
            }), { status: 429, headers: { "Content-Type": "application/json" } });
          }
        }

        const targetModel = body?.model || "Comku";
        const apiKey = env.NINE_ROUTER_API_KEY;
        const baseUrl = (env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1").replace(/\/+$/, "");

        const messages = [];
        if (body?.systemPrompt?.trim()) messages.push({ role: "system", content: body.systemPrompt.trim() });
        messages.push({ role: "user", content: prompt });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let response: Response;
        try {
          response = await fetch(`${baseUrl}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: JSON.stringify({ model: targetModel, messages, stream: false }),
            signal: controller.signal
          });
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          return new Response(JSON.stringify({ error: "Gateway timeout / unreach: " + fetchErr.message }), { status: 504, headers: { "Content-Type": "application/json" } });
        } finally {
          clearTimeout(timeoutId);
        }

        const rawText = await response.text();
        let reply = "";
        try {
          const parsed = JSON.parse(rawText);
          reply = parsed.choices?.[0]?.message?.content || parsed.choices?.[0]?.text || parsed.error?.message;
        } catch (_) {}

        if (!reply) reply = rawText || "Respons kosong.";

        // Tambah hitungan kuota pemakaian di D1
        if (user) {
          await env.DB.prepare(
            "UPDATE usage_meter SET tokens_used = tokens_used + 1, updated_at = ? WHERE user_id = ?"
          ).bind(Date.now(), user.id).run();
        }

        await env.DB.prepare("INSERT INTO ai_logs (id, user_id, mode, model_used, prompt, response_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(crypto.randomUUID(), user ? user.id : "anonymous", "text", targetModel, prompt, reply, Date.now()).run();

        return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
