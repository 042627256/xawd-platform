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

    // WebAuthn / Passkey: Inisialisasi Challenge
    if (url.pathname === "/api/auth/passkey/challenge" && request.method === "POST") {
      const challengeBytes = new Uint8Array(32);
      crypto.getRandomValues(challengeBytes);
      let binary = "";
      for (let i = 0; i < challengeBytes.byteLength; i++) binary += String.fromCharCode(challengeBytes[i]);
      const challenge = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const challengeId = crypto.randomUUID();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      await env.DB.prepare("INSERT INTO auth_challenges (id, challenge, expires_at) VALUES (?, ?, ?)")
        .bind(challengeId, challenge, expiresAt).run();

      return new Response(JSON.stringify({ challengeId, challenge }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // WebAuthn / Passkey: Simpan Kredensial Baru
    if (url.pathname === "/api/auth/passkey/register" && request.method === "POST") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Silakan login terlebih dahulu untuk mendaftarkan passkey" }), { status: 401 });

      const { credentialId, publicKey } = await request.json() as any;
      if (!credentialId || !publicKey) {
        return new Response(JSON.stringify({ error: "Data kredensial tidak valid" }), { status: 400 });
      }

      await env.DB.prepare(
        "INSERT INTO passkey_credentials (id, user_id, credential_id, public_key, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), user.id, credentialId, publicKey, Date.now()).run();

      return new Response(JSON.stringify({ success: true, message: "Passkey berhasil terdaftar" }), { status: 201 });
    }

    // Auth: Me
    if (url.pathname === "/api/auth/me") {
      const user = await getSessionUser(request, env);
      return new Response(JSON.stringify({ user }), { status: user ? 200 : 401, headers: { "Content-Type": "application/json" } });
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

    // AI & Core Routing Forwarding
    if (url.pathname === "/api/ai/image" && request.method === "POST") {
      const body = await request.json() as any;
      const prompt = body?.prompt?.trim();
      if (!prompt) return new Response(JSON.stringify({ error: "Prompt gambar kosong" }), { status: 400 });

      const response = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 });
      const buffer = await new Response(response).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const imageUrl = `data:image/jpeg;base64,${btoa(binary)}`;

      return new Response(JSON.stringify({ imageUrl }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/ai/run" && request.method === "POST") {
      const body = await request.json() as any;
      const prompt = body?.prompt?.trim();
      if (!prompt) return new Response(JSON.stringify({ error: "Prompt kosong" }), { status: 400 });

      const targetModel = body?.model || "Comku";
      const baseUrl = (env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1").replace(/\/+$/, "");

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
        body: JSON.stringify({ model: targetModel, messages: [{ role: "user", content: prompt }] })
      });
      const data: any = await res.json();
      const reply = data.choices?.[0]?.message?.content || data.reply || "Respons diterima.";
      return new Response(JSON.stringify({ reply }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    return env.ASSETS.fetch(request);
  }
};
