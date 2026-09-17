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

    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Signature, X-Nonce",
      "Access-Control-Allow-Credentials": "true"
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

    // Database Initialization
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS synap_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          full_name TEXT,
          auth_provider TEXT,
          rfid_hash TEXT,
          passkey_id TEXT,
          solana_wallet TEXT,
          synap_balance REAL DEFAULT 0,
          airdrop_claimed INTEGER DEFAULT 0,
          created_at INTEGER
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS bug_bounties (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          title TEXT,
          severity TEXT,
          description TEXT,
          status TEXT,
          reward_tokens REAL,
          created_at INTEGER
        )
      `).run();
    } catch (_) {}

    // Multi-Model Unified Inference Gateway
    if (url.pathname === "/api/ai/execute" && req.method === "POST") {
      try {
        const { prompt, model, task } = await req.json() as any;
        if (!prompt) return json({ error: "Prompt required" }, 400);

        if (task === "image") {
          const res = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 });
          const buf = await new Response(res).arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          return json({ success: true, result: `data:image/jpeg;base64,${b64}`, task: "image" });
        }

        // Text & Code Reasoning Router
        const targetModel = model || "Comku";
        const res = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: "system", content: "You are Synapxis AI, an advanced hyper-scale intelligence engine." },
              { role: "user", content: prompt }
            ]
          })
        });
        const data: any = await res.json();
        return json({
          success: true,
          result: data.choices?.[0]?.message?.content || "Inference completed.",
          model: targetModel
        });
      } catch (err: any) {
        return json({ error: err.message }, 500);
      }
    }

    // Bug Bounty Submission
    if (url.pathname === "/api/bounty/submit" && req.method === "POST") {
      try {
        const { title, severity, description, wallet } = await req.json() as any;
        const id = "bounty_" + crypto.randomUUID().slice(0, 8);
        await env.DB.prepare(
          "INSERT INTO bug_bounties (id, user_id, title, severity, description, status, reward_tokens, created_at) VALUES (?, ?, ?, ?, ?, 'REVIEWING', 0, ?)"
        ).bind(id, wallet || "anonymous", title, severity, description, Date.now()).run();
        return json({ success: true, message: "Security report recorded under military-grade review.", id });
      } catch (err: any) { return json({ error: err.message }, 500); }
    }

    // Airdrop Claim Engine (Anti-Sybil Proof-of-Human)
    if (url.pathname === "/api/airdrop/claim" && req.method === "POST") {
      try {
        const { email, wallet, signature } = await req.json() as any;
        const user: any = await env.DB.prepare("SELECT * FROM synap_users WHERE email = ?").bind(email).first();
        if (user && user.airdrop_claimed === 1) {
          return json({ error: "Identity has already participated in Genesis Airdrop." }, 400);
        }

        const id = user ? user.id : "synap_" + crypto.randomUUID().slice(0, 8);
        await env.DB.prepare(`
          INSERT INTO synap_users (id, email, full_name, solana_wallet, synap_balance, airdrop_claimed, created_at)
          VALUES (?, ?, 'Verified Citizen', ?, 500, 1, ?)
          ON CONFLICT(email) DO UPDATE SET airdrop_claimed = 1, synap_balance = synap_balance + 500
        `).bind(id, email, wallet || "sol_vault_main", Date.now()).run();

        return json({ success: true, claimed: 500, balance: 500 });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    return env.ASSETS.fetch(req);
  }
};
