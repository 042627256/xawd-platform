export interface Env { DB: D1Database; ASSETS: Fetcher; AI: any; NINE_ROUTER_API_KEY: string; NINE_ROUTER_BASE_URL: string; }
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get("Origin") || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

    try {
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, full_name TEXT, id_number TEXT, gender TEXT, phone TEXT, address TEXT, role TEXT, created_at INTEGER)").run();
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT, expires_at INTEGER)").run();
    } catch (_) {}

    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      try {
        const { email, full_name, id_number, gender, phone, address } = await req.json() as any;
        if (!email || !full_name) return json({ error: "Email dan Nama Lengkap wajib diisi" }, 400);
        const em = email.trim().toLowerCase();
        let u: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(em).first();
        const uid = u ? u.id : "usr_" + crypto.randomUUID().slice(0, 8);
        if (u) {
          await env.DB.prepare("UPDATE users SET full_name = ?, id_number = ?, gender = ?, phone = ?, address = ? WHERE id = ?").bind(full_name, id_number || "", gender || "", phone || "", address || "", uid).run();
        } else {
          await env.DB.prepare("INSERT INTO users (id, email, full_name, id_number, gender, phone, address, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "developer", ?)").bind(uid, em, full_name, id_number || "", gender || "Male", phone || "", address || "", Date.now()).run();
        }
        const tok = "xawd_live_" + crypto.randomUUID().replace(/-/g, "");
        await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").bind(tok, uid, Date.now() + 2592000000).run();
        return json({ success: true, token: tok, user: { id: uid, email: em, full_name, role: "developer" } });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (url.pathname === "/api/auth/quick-login" && req.method === "POST") {
      try {
        const { email, provider, full_name } = await req.json() as any;
        const em = (email || ("operator_" + Date.now().toString(36) + "@xawd.io")).trim().toLowerCase();
        let u: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(em).first();
        if (!u) {
          const uid = "usr_" + crypto.randomUUID().slice(0, 8);
          const name = full_name || em.split("@")[0].toUpperCase();
          await env.DB.prepare("INSERT INTO users (id, email, full_name, role, created_at) VALUES (?, ?, ?, "developer", ?)").bind(uid, em, name, Date.now()).run();
          u = { id: uid, email: em, full_name: name, role: "developer" };
        }
        const tok = "xawd_sess_" + crypto.randomUUID().replace(/-/g, "");
        await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").bind(tok, u.id, Date.now() + 2592000000).run();
        return json({ success: true, token: tok, user: u });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (url.pathname === "/api/auth/me") {
      const auth = req.headers.get("Authorization") || "";
      const tok = auth.replace("Bearer ", "").trim();
      if (!tok) return json({ user: null });
      const sess: any = await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?").bind(tok, Date.now()).first();
      return json({ user: sess || null });
    }

    if (url.pathname === "/api/ai/image" && req.method === "POST") {
      try {
        const { prompt } = await req.json() as any;
        const res = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: prompt || "cyberpunk machine architecture", steps: 4 });
        const buf = await new Response(res).arrayBuffer();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        return json({ imageUrl: "data:image/jpeg;base64," + b64 });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (url.pathname === "/api/ai/run" && req.method === "POST") {
      try {
        const { prompt } = await req.json() as any;
        const r = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.NINE_ROUTER_API_KEY },
          body: JSON.stringify({ model: "Comku", messages: [{ role: "user", content: prompt }] })
        });
        const d: any = await r.json();
        return json({ reply: d.choices?.[0]?.message?.content || "Neural computation complete." });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (url.pathname === "/api/developer/keys" && req.method === "POST") {
      const { name } = await req.json() as any;
      return json({ success: true, key: "xawd_live_" + crypto.randomUUID().replace(/-/g, ""), name: name || "Production Key" });
    }

    return env.ASSETS.fetch(req);
  }
};