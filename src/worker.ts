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

    // Header CORS Lengkap untuk menangani fetch antar subdomain
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const json = (data: any, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: cors });

    const botToken = "8815160199:AAHsPauxuowZ5BS9Of08V-PLiHAFsyeXyy8";
    const webhookUrl = "https://api.xawd.my.id/api/telegram/webhook";
    const nineBase = env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1";
    const nineKey = env.NINE_ROUTER_API_KEY || "";

    // Inisialisasi skema tabel jika belum tersedia
    if (env.DB) {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS xawd_agents (
          id TEXT PRIMARY KEY,
          name TEXT,
          role TEXT,
          prompt TEXT,
          is_active INTEGER DEFAULT 0,
          created_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS xawd_config (
          key TEXT PRIMARY KEY,
          value TEXT
        );
      `).catch(() => {});
    }

    // 1. ENDPOINT STATUS TELEGRAM DASHBOARD
    if (url.pathname === "/api/telegram/status") {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const tgData: any = await tgRes.json();
        return json({
          connected: tgData?.result?.url === webhookUrl,
          webhook_url: tgData?.result?.url || "",
          pending_update_count: tgData?.result?.pending_update_count || 0,
          last_error_message: tgData?.result?.last_error_message || null
        });
      } catch (e: any) {
        return json({ connected: false, error: e.message });
      }
    }

    // 2. ENDPOINT CONNECT / SET WEBHOOK MANUAL
    if (url.pathname === "/api/telegram/connect" && req.method === "POST") {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: webhookUrl })
        });
        const tgData: any = await tgRes.json();
        return json({ success: tgData.ok, result: tgData });
      } catch (e: any) {
        return json({ success: false, error: e.message }, 500);
      }
    }

    // 3. ENDPOINT CRUD AGENTS
    if (url.pathname === "/api/agents") {
      if (req.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM xawd_agents ORDER BY created_at DESC").all();
          return json({ agents: results || [] });
        } catch (e: any) {
          return json({ agents: [] });
        }
      }

      if (req.method === "POST") {
        try {
          const body: any = await req.json().catch(() => ({}));
          const id = "agent_" + Date.now();
          const name = body.name || "Agent X";
          const role = body.role || "Assistant";
          const prompt = body.prompt || "";

          if (env.DB) {
            // Nonaktifkan agent lain dan aktifkan yang baru
            await env.DB.prepare("UPDATE xawd_agents SET is_active = 0").run().catch(() => {});
            await env.DB.prepare("INSERT INTO xawd_agents (id, name, role, prompt, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)")
              .bind(id, name, role, prompt, Date.now()).run();
          }
          return json({ success: true, id, message: "Agent berhasil disimpan dan dihubungkan ke bot." });
        } catch (err: any) {
          return json({ success: true, id: "fallback_" + Date.now(), warning: err.message });
        }
      }
    }

    // 4. WEBHOOK TELEGRAM ENGINE
    if (url.pathname === "/api/telegram/webhook" && req.method === "POST") {
      try {
        const update: any = await req.json();
        const msg = update.message;
        if (!msg) return new Response("OK", { status: 200 });

        const chatId = msg.chat.id;
        const text = (msg.text || "").trim();

        const sendMsg = async (t: string) => {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: t })
          });
        };

        if (text.startsWith("/start")) {
          await sendMsg("⚡ X AWD Autonomous Engine Online\n\nBot aktif dan terhubung ke dashboard web & 9Router AI.");
          return new Response("OK", { status: 200 });
        }

        // Ambil System Prompt dari Agent aktif di D1
        let sysPrompt = "Kamu adalah asisten pintar X AWD. Berikan jawaban cerdas dan lugas.";
        try {
          const activeAgent: any = await env.DB.prepare("SELECT prompt FROM xawd_agents WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first();
          if (activeAgent?.prompt) {
            sysPrompt = activeAgent.prompt;
          }
        } catch (_) {}

        let cleanText = text;
        if (text.startsWith("/think")) {
          sysPrompt += "\nMode Penalaran: Analisis secara logis dan mendalam.";
          cleanText = text.replace("/think", "").trim();
        } else if (text.startsWith("/code")) {
          sysPrompt += "\nMode Koding: Berikan solusi pemrograman bersih.";
          cleanText = text.replace("/code", "").trim();
        }

        // Request ke 9Router dengan safe SSE parser
        let aiReply = "";
        try {
          const r = await fetch(nineBase + "/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(nineKey ? { "Authorization": `Bearer ${nineKey}` } : {})
            },
            body: JSON.stringify({
              model: "Comku",
              stream: false,
              messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: cleanText }
              ]
            })
          });

          const rawText = await r.text();
          try {
            const d = JSON.parse(rawText);
            aiReply = d.choices?.[0]?.message?.content || d.error?.message || rawText;
          } catch (_) {
            const lines = rawText.split("\n");
            let acc = "";
            for (const line of lines) {
              const tr = line.trim();
              if (tr.startsWith("data:") && !tr.includes("[DONE]")) {
                try {
                  const chunk = JSON.parse(tr.replace(/^data:\s*/, ""));
                  acc += chunk.choices?.[0]?.delta?.content || "";
                } catch (e) {}
              }
            }
            aiReply = acc || rawText.slice(0, 500);
          }
        } catch (e: any) {
          aiReply = "Error koneksi 9Router: " + e.message;
        }

        await sendMsg(aiReply);
        return new Response("OK", { status: 200 });
      } catch (e) {
        return new Response("OK", { status: 200 });
      }
    }

    return env.ASSETS.fetch(req);
  }
};
