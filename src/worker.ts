export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
  TELEGRAM_BOT_TOKEN?: string;
}

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

    // Inisialisasi Database D1 untuk Custom Agent & Konfigurasi Bot
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS custom_agents (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          system_prompt TEXT,
          model TEXT,
          temperature REAL DEFAULT 0.7,
          is_active_telegram INTEGER DEFAULT 0,
          created_at INTEGER
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS agent_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `).run();

      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS chat_logs (
          id TEXT PRIMARY KEY,
          agent_id TEXT,
          sender TEXT,
          message TEXT,
          response TEXT,
          created_at INTEGER
        )
      `).run();
    } catch (_) {}

    // 1. TELEGRAM WEBHOOK RECEIVER (Dipanggil otomatis oleh server Telegram)
    if (url.pathname === "/api/telegram/webhook" && req.method === "POST") {
      try {
        const update: any = await req.json();
        const msg = update.message;
        if (!msg || !msg.text) return new Response("OK", { status: 200 });

        const chatId = msg.chat.id;
        const userText = msg.text;

        // Ambil Agent aktif yang dipasangkan ke Telegram
        let activeAgent: any = await env.DB.prepare("SELECT * FROM custom_agents WHERE is_active_telegram = 1 LIMIT 1").first();
        if (!activeAgent) {
          activeAgent = await env.DB.prepare("SELECT * FROM custom_agents ORDER BY created_at DESC LIMIT 1").first();
        }

        const sysPrompt = activeAgent ? activeAgent.system_prompt : "Kamu adalah asisten AI cerdas pribadi.";
        const modelTarget = activeAgent ? activeAgent.model : "Comku";

        // Ambil token bot dari database atau env
        const botTokenRow: any = await env.DB.prepare("SELECT value FROM agent_settings WHERE key = 'bot_token'").first();
        const activeBotToken = botTokenRow ? botTokenRow.value : (env.TELEGRAM_BOT_TOKEN || "");

        if (!activeBotToken) return new Response("Bot Token Not Configured", { status: 200 });

        // Kirim typing action
        fetch(`https://api.telegram.org/bot${activeBotToken}/sendChatAction`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, action: "typing" })
        }).catch(() => {});

        // Jalankan Penalaran AI Agent Buatan Sendiri
        let reply = "Maaf, agent sedang offline.";
        try {
          const aiRes = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
            body: JSON.stringify({
              model: modelTarget || "Comku",
              messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: userText }
              ]
            })
          });
          const d: any = await aiRes.json();
          reply = d.choices?.[0]?.message?.content || "Respon kosong.";
        } catch (e: any) {
          reply = "Agent error: " + e.message;
        }

        // Kirim balasan AI kembali ke Telegram Chat
        await fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: reply,
            parse_mode: "Markdown"
          })
        }).catch(() => {
          // Fallback tanpa markdown jika format parse gagal
          fetch(`https://api.telegram.org/bot${activeBotToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: reply })
          });
        });

        // Simpan log percakapan
        await env.DB.prepare("INSERT INTO chat_logs (id, agent_id, sender, message, response, created_at) VALUES (?, ?, ?, ?, ?, ?)")
          .bind("chat_" + crypto.randomUUID().slice(0, 8), activeAgent ? activeAgent.id : "default", `tg_${chatId}`, userText, reply, Date.now()).run();

        return new Response("OK", { status: 200 });
      } catch (err: any) {
        return new Response("OK", { status: 200 });
      }
    }

    // 2. KELOLA CUSTOM AGENT (CRUD)
    if (url.pathname === "/api/agents" && req.method === "GET") {
      const agents = await env.DB.prepare("SELECT * FROM custom_agents ORDER BY created_at DESC").all();
      return json({ agents: agents.results || [] });
    }

    if (url.pathname === "/api/agents" && req.method === "POST") {
      try {
        const { name, description, system_prompt, model, temperature } = await req.json() as any;
        const id = "agt_" + crypto.randomUUID().slice(0, 8);
        await env.DB.prepare(`
          INSERT INTO custom_agents (id, name, description, system_prompt, model, temperature, is_active_telegram, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        `).bind(id, name || "Custom Agent", description || "", system_prompt || "", model || "Comku", temperature || 0.7, Date.now()).run();
        return json({ success: true, id });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (url.pathname === "/api/agents/set-telegram" && req.method === "POST") {
      try {
        const { agent_id } = await req.json() as any;
        await env.DB.prepare("UPDATE custom_agents SET is_active_telegram = 0").run();
        await env.DB.prepare("UPDATE custom_agents SET is_active_telegram = 1 WHERE id = ?").bind(agent_id).run();
        return json({ success: true, active_agent_id: agent_id });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // 3. SETTINGS & AUTO WEBHOOK REGISTRATION
    if (url.pathname === "/api/telegram/set-webhook" && req.method === "POST") {
      try {
        const { bot_token, webhook_url } = await req.json() as any;
        if (!bot_token) return json({ error: "Bot Token wajib diisi" }, 400);

        const targetWebhook = webhook_url || `https://${url.host}/api/telegram/webhook`;

        // Simpan token ke D1
        await env.DB.prepare("INSERT INTO agent_settings (key, value) VALUES ('bot_token', ?) ON CONFLICT(key) DO UPDATE SET value = ?")
          .bind(bot_token.trim(), bot_token.trim()).run();

        // Panggil API Telegram untuk pasang Webhook otomatis
        const setRes = await fetch(`https://api.telegram.org/bot${bot_token.trim()}/setWebhook?url=${encodeURIComponent(targetWebhook)}`);
        const setData: any = await setRes.json();

        // Cek info bot
        const meRes = await fetch(`https://api.telegram.org/bot${bot_token.trim()}/getMe`);
        const meData: any = await meRes.json();

        return json({
          success: setData.ok,
          telegram_response: setData,
          webhook_url: targetWebhook,
          bot_info: meData.result || null
        });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // 4. CHAT TESTING LANGSUNG DENGAN AGENT DI WEB
    if (url.pathname === "/api/agents/chat" && req.method === "POST") {
      try {
        const { agent_id, message } = await req.json() as any;
        const agent: any = await env.DB.prepare("SELECT * FROM custom_agents WHERE id = ?").bind(agent_id).first();
        const sysPrompt = agent ? agent.system_prompt : "Kamu adalah asisten cerdas.";
        const modelTarget = agent ? agent.model : "Comku";

        const aiRes = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
          body: JSON.stringify({
            model: modelTarget || "Comku",
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: message }
            ]
          })
        });
        const d: any = await aiRes.json();
        return json({ response: d.choices?.[0]?.message?.content || "Selesai dieksekusi." });
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // Logs percakapan telegram
    if (url.pathname === "/api/telegram/logs" && req.method === "GET") {
      const logs = await env.DB.prepare("SELECT * FROM chat_logs ORDER BY created_at DESC LIMIT 30").all();
      return json({ logs: logs.results || [] });
    }

    return env.ASSETS.fetch(req);
  }
};
