export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
}

function parseCookies(header) {
  const list = {};
  if (!header) return list;
  header.split(";").forEach(c => {
    let [k, ...v] = c.split("=");
    if (k) list[k.trim()] = decodeURIComponent(v.join("=").trim());
  });
  return list;
}

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getSessionUser(req, env) {
  try {
    const cookies = parseCookies(req.headers.get("Cookie"));
    if (cookies.session_id) {
      const s = await env.DB.prepare("SELECT users.id, users.email FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?").bind(cookies.session_id, Date.now()).first();
      if (s) return s;
    }
    const auth = req.headers.get("Authorization");
    if (auth && auth.startsWith("Bearer xawd_live_")) {
      const hash = await sha256(auth.replace("Bearer ", "").trim());
      const row = await env.DB.prepare("SELECT user_id, tier FROM api_keys WHERE key_hash = ? AND is_active = 1").bind(hash).first();
      if (row) {
        const u = await env.DB.prepare("SELECT id, email FROM users WHERE id = ?").bind(row.user_id).first();
        if (u) return { ...u, isApiKey: true, apiTier: row.tier };
      }
    }
    return null;
  } catch (_) { return null; }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
    }
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "healthy", time: Date.now() }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
    if (url.pathname === "/api/auth/me") {
      const user = await getSessionUser(req, env);
      return new Response(JSON.stringify({ user }), { status: user ? 200 : 401, headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/billing/checkout" && req.method === "POST") {
      const user = await getSessionUser(req, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const { planTier } = await req.json();
      const p = { Plus: 59000, Pro: 149000, Team: 799000 };
      const amount = p[planTier] || 59000;
      const inv = "INV-" + Date.now().toString(36).toUpperCase();
      await env.DB.prepare("INSERT INTO subscriptions (id, user_id, plan_tier, amount_idr, status, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(inv, user.id, planTier, amount, "pending", Date.now()).run();
      return new Response(JSON.stringify({ success: true, invoiceId: inv, amountIdr: amount, planTier }), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/developer/keys") {
      const user = await getSessionUser(req, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      if (req.method === "GET") {
        const rows = await env.DB.prepare("SELECT id, name, prefix, tier, created_at FROM api_keys WHERE user_id = ?").bind(user.id).all();
        return new Response(JSON.stringify({ keys: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (req.method === "POST") {
        const { name } = await req.json();
        const key = "xawd_live_" + crypto.randomUUID().replace(/-/g, "");
        const hash = await sha256(key);
        await env.DB.prepare("INSERT INTO api_keys (id, user_id, name, key_hash, prefix, tier, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)").bind(crypto.randomUUID(), user.id, name || "Key", hash, key.slice(0, 15) + "...", "Standard", Date.now()).run();
        return new Response(JSON.stringify({ success: true, key }), { status: 201, headers: { "Content-Type": "application/json" } });
      }
    }
    if (url.pathname === "/api/referrals" && req.method === "GET") {
      const user = await getSessionUser(req, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const ref = "AWD-" + user.id.slice(0, 6).toUpperCase();
      const rows = await env.DB.prepare("SELECT * FROM referrals WHERE referrer_id = ?").bind(user.id).all();
      return new Response(JSON.stringify({ referralCode: ref, referralUrl: "https://xawd.my.id/?ref=" + ref, stats: { totalInvited: rows.results?.length || 0 } }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/api/ai/image" && req.method === "POST") {
      try {
        const { prompt } = await req.json();
        if (!prompt?.trim()) return new Response(JSON.stringify({ error: "Prompt kosong" }), { status: 400 });
        const res = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: prompt.trim(), steps: 4 });
        const buf = await new Response(res).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let b = "";
        for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
        return new Response(JSON.stringify({ imageUrl: "data:image/jpeg;base64," + btoa(b) }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }
    if (url.pathname === "/api/ai/run" && req.method === "POST") {
      try {
        const body = await req.json();
        const p = (body?.prompt || body?.query || "").trim();
        if (!p) return new Response(JSON.stringify({ error: "Query kosong" }), { status: 400 });
        const r = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.NINE_ROUTER_API_KEY },
          body: JSON.stringify({ model: body?.model || "Comku", messages: [{ role: "user", content: p }], stream: false })
        });
        const data = await r.json();
        return new Response(JSON.stringify({ reply: data.choices?.[0]?.message?.content || "Respons diterima." }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }
    return env.ASSETS.fetch(req);
  }
};