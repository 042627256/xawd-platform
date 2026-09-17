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

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const json = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: cors });

    const botToken = "8815160199:AAHsPauxuowZ5BS9Of08V-PLiHAFsyeXyy8";
    const webhookUrl = "https://api.xawd.my.id/api/telegram/webhook";
    const nineBase = env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1";
    const nineKey = env.NINE_ROUTER_API_KEY || "comku";

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

    if (url.pathname.includes("/activate") || (url.pathname.startsWith("/api/agents/") && req.method === "PUT")) {
      await initDb();
      try {
        let agentId = "";
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts.length >= 3 && parts[1] !== "activate") agentId = parts[1];
        if (!agentId) {
          const body: any = await req.json().catch(() => ({}));
          agentId = body.id || body.agentId || "";
        }
        if (env.DB && agentId) {
          await env.DB.prepare("UPDATE xawd_agents SET is_active = 0").run().catch(() => {});
          await env.DB.prepare("UPDATE xawd_agents SET is_active = 1 WHERE id = ?").bind(agentId).run().catch(() => {});
        }
        return json({ success: true, message: "Agent aktif sebagai otak bot Telegram!", id: agentId });
      } catch (err: any) {
        return json({ success: true, id: agentId, warning: err.message });
      }
    }

    if (url.pathname === "/api/agents") {
      await initDb();
      if (req.method === "GET") {
        try {
          const { results } = await env.DB.prepare("SELECT * FROM xawd_agents ORDER BY created_at DESC").all();
          return json({ agents: results || [] });
        } catch (_) {
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
          return json({ success: true, id, message: "Agent tersimpan dan aktif!" });
        } catch (err: any) {
          return json({ success: true, id: "fallback_" + Date.now(), warning: err.message });
        }
      }
    }

    // TELEGRAM WEBHOOK
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
          const menu = "⚡ *X AWD Engine (Multi-LLM 9Router)*\n\n" +
            "*Pilihan Model Langsung:*\n" +
            "• `/claude <pesan>` -> Claude Sonnet 4.6 (`ag/claude-sonnet-4-6`)\n" +
            "• `/opus <pesan>` -> Claude Opus 4.6 Thinking (`ag/claude-opus-4-6-thinking`)\n" +
            "• `/gpt <pesan>` -> GPT-6 Astra (`cx/gpt-6-astra`)\n" +
            "• `/sol <pesan>` -> GPT-5.6 Sol (`cx/gpt-5.6-sol`)\n" +
            "• `/terra <pesan>` -> GPT-5.6 Terra (`cx/gpt-5.6-terra`)\n" +
            "• `/luna <pesan>` -> GPT-5.6 Luna (`cx/gpt-5.6-luna`)\n" +
            "• `/think <pesan>` -> Deep Reasoning (`ag/claude-opus-4-6-thinking`)\n" +
            "• `/code <pesan>` -> Expert Coder (`ag/gpt-oss-120b-medium`)\n" +
            "• `/flash <pesan>` -> Respon Kilat (`ag/gemini-3.8-flash-high`)\n" +
            "• *Chat biasa* -> Auto Router (`All` / `Comku`)\n\n" +
            "Kirim `/models` untuk cek daftar model lengkap.";
          await sendMsg(menu);
          return new Response("OK", { status: 200 });
        }

        if (text === "/models") {
          try {
            const mRes = await fetch(nineBase + "/models", {
              headers: { "Authorization": `Bearer ${nineKey}` }
            });
            const mData: any = await mRes.json();
            const list = (mData?.data || []).map((m: any) => "• `" + m.id + "`").slice(0, 45).join("\n");
            await sendMsg("📋 *Model Tersedia di 9Router:*\n\n" + (list || "Comku, All aktif"));
          } catch (e: any) {
            await sendMsg("Gagal mengambil model: " + e.message);
          }
          return new Response("OK", { status: 200 });
        }

        // Ambil System Prompt Agen Aktif
        let sysPrompt = "Kamu adalah asisten pintar X AWD. Berikan jawaban cerdas, lugas, dan akurat.";
        try {
          const activeAgent: any = await env.DB.prepare("SELECT prompt FROM xawd_agents WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first();
          if (activeAgent?.prompt) sysPrompt = activeAgent.prompt;
        } catch (_) {}

        // Pemetaan Perintah ke ID Model Persis di 9Router
        let targetModel = "All";
        let cleanText = text;

        if (text.startsWith("/claude ")) {
          targetModel = "ag/claude-sonnet-4-6";
          cleanText = text.replace("/claude ", "").trim();
        } else if (text.startsWith("/opus ")) {
          targetModel = "ag/claude-opus-4-6-thinking";
          cleanText = text.replace("/opus ", "").trim();
        } else if (text.startsWith("/gpt ")) {
          targetModel = "cx/gpt-6-astra";
          cleanText = text.replace("/gpt ", "").trim();
        } else if (text.startsWith("/sol ")) {
          targetModel = "cx/gpt-5.6-sol";
          cleanText = text.replace("/sol ", "").trim();
        } else if (text.startsWith("/terra ")) {
          targetModel = "cx/gpt-5.6-terra";
          cleanText = text.replace("/terra ", "").trim();
        } else if (text.startsWith("/luna ")) {
          targetModel = "cx/gpt-5.6-luna";
          cleanText = text.replace("/luna ", "").trim();
        } else if (text.startsWith("/think ")) {
          sysPrompt += "\nLakukan penalaran langkah demi langkah secara mendalam.";
          targetModel = "ag/claude-opus-4-6-thinking";
          cleanText = text.replace("/think ", "").trim();
        } else if (text.startsWith("/code ")) {
          sysPrompt += "\nMode Pemrograman Ahli: Tulis kode modular, bersih, dan efisien.";
          targetModel = "ag/gpt-oss-120b-medium";
          cleanText = text.replace("/code ", "").trim();
        } else if (text.startsWith("/flash ")) {
          targetModel = "ag/gemini-3.8-flash-high";
          cleanText = text.replace("/flash ", "").trim();
        }

        // Jalur Eksekusi Failover
        const candidates = [targetModel, "Comku", "All", "cx/gpt-6-astra", "ag/gemini-3.8-flash-high"];
        let aiReply = "";

        for (const m of candidates) {
          try {
            const r = await fetch(nineBase + "/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${nineKey}`
              },
              body: JSON.stringify({
                model: m,
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
              aiReply = d.choices?.[0]?.message?.content || "";
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
              if (acc) aiReply = acc;
            }

            if (aiReply) break;
          } catch (_) {}
        }

        if (!aiReply) {
          aiReply = "Respons dari model tidak berhasil dimuat. Silakan coba lagi.";
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
