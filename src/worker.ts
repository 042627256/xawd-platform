export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 as alive").first();
        return new Response(JSON.stringify({ status: "ok", db: result ? "connected" : "idle" }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const { email, password } = await request.json() as any;
        if (!email || !password) {
          return new Response(JSON.stringify({ error: "Email dan password wajib diisi" }), { status: 400 });
        }
        const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (existing) {
          return new Response(JSON.stringify({ error: "Email sudah terdaftar" }), { status: 409 });
        }

        const id = crypto.randomUUID();
        const hash = await hashPassword(password);
        const now = Date.now();

        await env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(id, email, hash, now, now).run();

        return new Response(JSON.stringify({ success: true, message: "User registered", userId: id }), {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = await request.json() as any;
        const hash = await hashPassword(password);
        const user: any = await env.DB.prepare(
          "SELECT id, email FROM users WHERE email = ? AND password_hash = ?"
        ).bind(email, hash).first();

        if (!user) {
          return new Response(JSON.stringify({ error: "Email atau password salah" }), { status: 401 });
        }

        const sessionId = crypto.randomUUID();
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        await env.DB.prepare(
          "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
        ).bind(sessionId, user.id, expiresAt, now).run();

        const headers = new Headers({ "Content-Type": "application/json" });
        headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);

        return new Response(JSON.stringify({ success: true, user: { id: user.id, email: user.email } }), {
          status: 200,
          headers
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      try {
        const cookies = parseCookies(request.headers.get("Cookie"));
        const sessionId = cookies["session_id"];
        if (!sessionId) return new Response(JSON.stringify({ user: null }), { status: 401 });

        const session: any = await env.DB.prepare(
          "SELECT users.id, users.email FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?"
        ).bind(sessionId, Date.now()).first();

        if (!session) return new Response(JSON.stringify({ user: null }), { status: 401 });

        return new Response(JSON.stringify({ user: session }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookies = parseCookies(request.headers.get("Cookie"));
      const sessionId = cookies["session_id"];
      if (sessionId) {
        await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
      }
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", "session_id=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    // Endpoint Eksekusi AI AWD (Parsing response JSON maupun SSE Stream)
    if (url.pathname === "/api/ai/run" && request.method === "POST") {
      try {
        const { prompt, model } = await request.json() as any;
        if (!prompt) {
          return new Response(JSON.stringify({ error: "Prompt tidak boleh kosong" }), { status: 400 });
        }

        const apiKey = env.NINE_ROUTER_API_KEY;
        const baseUrl = env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1";
        const cleanBase = baseUrl.replace(/\/+$/, "");

        const response = await fetch(`${cleanBase}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            stream: false
          })
        });

        const rawText = await response.text();

        // 1. Parsing jika response JSON standar
        try {
          const parsed = JSON.parse(rawText);
          const reply = parsed.choices?.[0]?.message?.content || parsed.choices?.[0]?.text || parsed.error?.message;
          if (reply) {
            return new Response(JSON.stringify({ reply }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
        } catch (_) {}

        // 2. Parsing jika fallback format SSE (data: {...})
        if (rawText.includes("data:")) {
          let accumulated = "";
          const lines = rawText.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
              try {
                const chunkJson = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                const content = chunkJson.choices?.[0]?.delta?.content || chunkJson.choices?.[0]?.text || "";
                accumulated += content;
              } catch (_) {}
            }
          }
          if (accumulated.trim().length > 0) {
            return new Response(JSON.stringify({ reply: accumulated }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }
        }

        return new Response(JSON.stringify({ reply: rawText }), {
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
