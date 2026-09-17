export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "*";
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    if (url.pathname === "/api/health") {
      return json({ status: "healthy", timestamp: Date.now(), region: "ID-SUB" });
    }

    if (url.pathname === "/api/auth/quick-login" && req.method === "POST") {
      try {
        const { email, provider } = await req.json() as any;
        const cleanEmail = (email || `user_${Date.now().toString(36)}@xawd.my.id`).trim().toLowerCase();
        
        let user: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
        if (!user) {
          const id = "usr_" + crypto.randomUUID().slice(0, 8);
          await env.DB.prepare("INSERT INTO users (id, email, role, created_at) VALUES (?, ?, 'user', ?)").bind(id, cleanEmail, Date.now()).run();
          user = { id, email: cleanEmail, role: "user" };
        }

        const token = "xawd_sess_" + crypto.randomUUID().replace(/-/g, "");
        const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
        await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expiresAt).run();

        return json({ success: true, user, token, provider: provider || "email" });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/auth/me") {
      const auth = req.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ user: null });

      const session: any = await env.DB.prepare(
        "SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?"
      ).bind(token, Date.now()).first();

      return json({ user: session || null });
    }

    if (url.pathname === "/api/developer/keys") {
      if (req.method === "POST") {
        const { name } = await req.json() as any;
        const rawKey = "xawd_live_" + crypto.randomUUID().replace(/-/g, "");
        return json({ success: true, key: rawKey, name: name || "Default Key" });
      }
      return json({ keys: [] });
    }

    if (url.pathname === "/api/ai/image" && req.method === "POST") {
      try {
        const { prompt } = await req.json() as any;
        const res = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: prompt || "cyberpunk futuristic interface", steps: 4 });
        const buf = await new Response(res).arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        return json({ imageUrl: "data:image/jpeg;base64," + b64 });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    if (url.pathname === "/api/ai/run" && req.method === "POST") {
      try {
        const { prompt, model } = await req.json() as any;
        const res = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
          body: JSON.stringify({ model: model || "Comku", messages: [{ role: "user", content: prompt }] })
        });
        const data: any = await res.json();
        return json({ reply: data.choices?.[0]?.message?.content || "Respons selesai." });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    return env.ASSETS.fetch(req);
  }
};
