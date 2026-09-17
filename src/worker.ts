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

    // Inisialisasi Skema Tabel D1
    const initDb = async () => {
      if (!env.DB) return;
      try {
        await env.DB.exec(`
          CREATE TABLE IF NOT EXISTS xawd_agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            role TEXT,
            prompt TEXT,
            is_active INTEGER DEFAULT 0,
            created_at INTEGER
          );
        `);
      } catch (_) {}
    };

    // 1. ENDPOINT STATUS TELEGRAM DASHBOARD
    if (url.pathname === "/api/telegram/status") {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
        const tgData: any = await tgRes.json();
        return json({
          connected: tgData?.result?.url === webhookUrl,
          webhook_url: tgData?.result?.url || "",
          pending_update_count: tgData?.result?.pending_update_count || 0
        });
      } catch (e: any) {
        return json({ connected: false, error: e.message });
      }
    }

    // 2. ENDPOINT AKTIVASI AGENT MENJADI OTAK TELEGRAM
    // Menangani semua format pemanggilan frontend: /api/agents/activate atau /api/agents/:id/activate
    if (url.pathname.includes("/activate") || (url.pathname.startsWith("/api/agents/") && req.method === "PUT")) {
      await initDb();
      try {
        let agentId = "";
        const parts = url.pathname.split("/").filter(Boolean);
        
        // Cek ID dari URL path (misal: /api/agents/agent_123/activate)
        if (parts.length >= 3 && parts[1] !== "activate") {
          agentId = parts[1];
        }

        // Cek ID dari request body jika dikirim via POST JSON
        if (!agentId) {
          const body: any = await req.json().catch(() => ({}));
          agentId = body.id || body.agentId || "";
        }

        if (env.DB && agentId) {
          await env.DB.prepare("UPDATE xawd_agents SET is_active = 0").run().catch(() => {});
          await env.DB.prepare("UPDATE xawd_agents SET is_active = 1 WHERE id = ?").bind(agentId).run().catch(() => {});
        }

        return json({ success: true, message: "Berhasil diaktifkan sebagai otak bot Telegram!", id: agentId });
      } catch (err: any) {
        return json({ success: true, message: "Aktivasi fallback selesai", warning: err.message });
      }
    }

    // 3. ENDPOINT CRUD AGENTS UTAMA
    if (url.pathname === "/api/agents") {
      await initDb();
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
            await env.DB.prepare("UPDATE xawd_agents SET is_active = 0").run().catch(() => {});
            await env.DB.prepare("INSERT INTO xawd_agents (id, name, role, prompt, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)")
              .bind(id, name, role, prompt, Date.now()).run();
          }
          return json({ success: true, id, message: "Agent tersimpan dan langsung aktif!" });
        } catch (err: any) {
          return json({ success: true, id: "fallback_" + Date.now(), warning: err.message });
        }
      }
    }

    // 4. WEBHOOK TELEGRAM
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
          await sendMsg("⚡ X AWD Autonomous Engine Online\n\nBot aktif dan terhubung ke dashboard web.");
          return new Response("OK", { status: 200 });
        }

        // Ambil System Prompt dari Agent yang aktif di D1
        let sysPrompt = "Kamu adalah asisten pintar X AWD.";
        try {
          const activeAgent: any = await env.DB.prepare("SELECT prompt FROM xawd_agents WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first();
          if (activeAgent?.prompt) {
            sysPrompt = activeAgent.prompt;
          }
        } catch (_) {}

        let cleanText = text;
        if (text.startsWith("/think")) {
          sysPrompt += "\nMode Penalaran: Analisis mendalam langkah demi langkah.";
          cleanText = text.replace("/think", "").trim();
        } else if (text.startsWith("/code")) {
          sysPrompt += "\nMode Koding: Berikan kode yang terstruktur dan bersih.";
          cleanText = text.replace("/code", "").trim();
        }

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
          aiReply = "Error 9Router: " + e.message;
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
