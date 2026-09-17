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

async function sha256(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getSessionUser(request: Request, env: Env) {
  try {
    const cookies = parseCookies(request.headers.get("Cookie"));
    const sessionId = cookies["session_id"];
    if (sessionId) {
      const session: any = await env.DB.prepare(
        "SELECT users.id, users.email, users.role FROM sessions JOIN users ON sessions.user_id = users.id WHERE sessions.id = ? AND sessions.expires_at > ?"
      ).bind(sessionId, Date.now()).first();
      if (session) return session;
    }

    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer xawd_live_")) {
      const rawKey = authHeader.replace("Bearer ", "").trim();
      const hash = await sha256(rawKey);
      const apiKeyRow: any = await env.DB.prepare(
        "SELECT user_id, tier, is_active FROM api_keys WHERE key_hash = ?"
      ).bind(hash).first();

      if (apiKeyRow && apiKeyRow.is_active === 1) {
        await env.DB.prepare("UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?").bind(Date.now(), hash).run();
        const user: any = await env.DB.prepare("SELECT id, email, role FROM users WHERE id = ?").bind(apiKeyRow.user_id).first();
        if (user) return { ...user, isApiKey: true, apiTier: apiKeyRow.tier };
      }
    }
    return null;
  } catch (_) {
    return null;
  }
}

async function getOrCreateUsage(env: Env, userId: string) {
  const period = new Date().toISOString().slice(0, 7);
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
    const host = url.hostname.toLowerCase();

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": request.headers.get("Origin") || "*", "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "healthy", host, timestamp: Date.now() }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": request.headers.get("Origin") || "*", "Access-Control-Allow-Credentials": "true" }
      });
    }

    // Quick Login / Auto-Register
    if (url.pathname === "/api/auth/quick-login" && request.method === "POST") {
      const { email } = await request.json() as any;
      if (!email?.trim()) return new Response(JSON.stringify({ error: "Email wajib diisi" }), { status: 400 });
      const cleanEmail = email.trim().toLowerCase();
      let user: any = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(cleanEmail).first();
      if (!user) {
        const id = "usr_" + crypto.randomUUID().slice(0, 8);
        await env.DB.prepare("INSERT INTO users (id, email, role, created_at) VALUES (?, ?, ?, ?)").bind(id, cleanEmail, "user", Date.now()).run();
        user = { id, email: cleanEmail, role: "user" };
      }
      const sessionId = crypto.randomUUID();
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await env.DB.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").bind(sessionId, user.id, expiresAt).run();
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", `session_id=${sessionId}; Path=/; Domain=.xawd.my.id; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      return new Response(JSON.stringify({ success: true, user }), { status: 200, headers });
    }

    if (url.pathname === "/api/auth/me") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ user: null }), { status: 401, headers: { "Content-Type": "application/json" } });
      const usage = await getOrCreateUsage(env, user.id);
      return new Response(JSON.stringify({ user, usage }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const cookies = parseCookies(request.headers.get("Cookie"));
      const sessionId = cookies["session_id"];
      if (sessionId) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", "session_id=; Path=/; Domain=.xawd.my.id; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    if (url.pathname === "/api/billing/checkout" && request.method === "POST") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Silakan login terlebih dahulu" }), { status: 401 });
      const { planTier } = await request.json() as any;
      const prices: Record<string, number> = { Plus: 59000, Pro: 149000, Team: 799000 };
      const amount = prices[planTier] || 59000;
      const invoiceId = "INV-" + Date.now().toString(36).toUpperCase();
      await env.DB.prepare("INSERT INTO subscriptions (id, user_id, plan_tier, amount_idr, status, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(invoiceId, user.id, planTier, amount, "pending", Date.now()).run();
      return new Response(JSON.stringify({
        success: true,
        invoiceId,
        planTier,
        amountIdr: amount,
        paymentInstructions: `Transfer tepat Rp${amount.toLocaleString("id-ID")} via QRIS/BCA/Mandiri.`
      }), { status: 201, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/referrals" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      const referralCode = "AWD-" + user.id.slice(0, 6).toUpperCase();
      const rows = await env.DB.prepare("SELECT * FROM referrals WHERE referrer_id = ?").bind(user.id).all();
      return new Response(JSON.stringify({
        referralCode,
        referralUrl: `https://xawd.my.id/?ref=${referralCode}`,
        stats: { totalInvited: rows.results?.length || 0, verifiedAccounts: 0 }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/developer/keys") {
      const user = await getSessionUser(request, env);
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      if (request.method === "GET") {
        const rows = await env.DB.prepare("SELECT id, name, prefix, tier, created_at FROM api_keys WHERE user_id = ?").bind(user.id).all();
        return new Response(JSON.stringify({ keys: rows.results || [] }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (request.method === "POST") {
        const { name } = await request.json() as any;
        const key = "xawd_live_" + crypto.randomUUID().replace(/-/g, "");
        const hash = await sha256(key);
        await env.DB.prepare("INSERT INTO api_keys (id, user_id, name, key_hash, prefix, tier, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)").bind(crypto.randomUUID(), user.id, name || "Key", hash, key.slice(0, 15) + "...", "Standard", Date.now()).run();
        return new Response(JSON.stringify({ success: true, key }), { status: 201, headers: { "Content-Type": "application/json" } });
      }
    }

    if (url.pathname === "/api/ai/image" && request.method === "POST") {
      try {
        const { prompt } = await request.json() as any;
        if (!prompt?.trim()) return new Response(JSON.stringify({ error: "Prompt kosong" }), { status: 400 });
        const res = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: prompt.trim(), steps: 4 });
        const buf = await new Response(res).arrayBuffer();
        const bytes = new Uint8Array(buf);
        let b = "";
        for (let i = 0; i < bytes.byteLength; i++) b += String.fromCharCode(bytes[i]);
        return new Response(JSON.stringify({ imageUrl: "data:image/jpeg;base64," + btoa(b) }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    if (url.pathname === "/api/ai/run" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const p = (body?.prompt || body?.query || "").trim();
        if (!p) return new Response(JSON.stringify({ error: "Query kosong" }), { status: 400 });
        const r = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
          body: JSON.stringify({ model: body?.model || "Comku", messages: [{ role: "user", content: p }], stream: false })
        });
        const data: any = await r.json();
        return new Response(JSON.stringify({ reply: data.choices?.[0]?.message?.content || "Respons diterima." }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (e: any) { return new Response(JSON.stringify({ error: e.message }), { status: 500 }); }
    }

    return env.ASSETS.fetch(request);
  }
};
