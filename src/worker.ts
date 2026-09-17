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
    // Menggunakan comku sebagai API key default
    const nineKey = env.NINE_ROUTER_API_KEY || "comku";

    // Inisialisasi Skema D1
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

    // 1. ENDPOINT STATUS TELEGRAM
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

    // 2. ENDPOINT AKTIVASI AGENT
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

    // 3. ENDPOINT CRUD AGENTS
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

    // 4. WEBHOOK TELEGRAM DENGAN MULTI-MODEL DYNAMIC ROUTING
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
          const menu = "⚡ *X AWD Universal Multi-Model Engine Online*\n\n" +
            "Terhubung ke 9Router dengan API Key `comku` (100+ Model LLM).\n\n" +
            "*Perintah & Pilihan Model:*\n" +
            "• `/models` : Cek daftar model aktif di 9Router\n" +
            "• `/claude <teks>` : Gunakan Claude 3.5 Sonnet / Haiku\n" +
            "• `/gpt <teks>` : Gunakan OpenAI GPT-4o / GPT-4o-mini\n" +
            "• `/deepseek <teks>` : Gunakan DeepSeek Coder / R1 Reasoning\n" +
            "• `/qwen <teks>` : Gunakan Qwen 2.5 72B\n" +
            "• `/llama <teks>` : Gunakan Llama 3.3 70B\n" +
            "• `/think <teks>` : Mode Penalaran Logika Berlapis\n" +
            "• `/code <teks>` : Mode Koding & Arsitektur Sistem\n" +
            "• *Chat biasa* : Menggunakan model router pintar comku";
          await sendMsg(menu);
          return new Response("OK", { status: 200 });
        }

        // Cek daftar model yang terdaftar di 9Router
        if (text === "/models") {
          try {
            const mRes = await fetch(nineBase + "/models", {
              headers: { "Authorization": `Bearer ${nineKey}` }
            });
            const mData: any = await mRes.json();
            const list = (mData?.data || []).map((m: any) => "• `" + m.id + "`").slice(0, 40).join("\n");
            await sendMsg("📋 *Model Tersedia di 9Router (Sebagian):*\n\n" + (list || "Model default: comku aktif"));
          } catch (e: any) {
            await sendMsg("Gagal mengambil daftar model: " + e.message);
          }
          return new Response("OK", { status: 200 });
        }

        // Ambil System Prompt dari DB jika ada
        let sysPrompt = "Kamu adalah asisten pintar X AWD. Berikan jawaban cerdas, lugas, dan akurat.";
        try {
          const activeAgent: any = await env.DB.prepare("SELECT prompt FROM xawd_agents WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first();
          if (activeAgent?.prompt) sysPrompt = activeAgent.prompt;
        } catch (_) {}

        // Routing Model Berdasarkan Prefix Perintah
        let targetModel = "comku";
        let cleanText = text;

        if (text.startsWith("/claude ")) {
          targetModel = "claude-3-5-sonnet";
          cleanText = text.replace("/claude ", "").trim();
        } else if (text.startsWith("/gpt ")) {
          targetModel = "gpt-4o";
          cleanText = text.replace("/gpt ", "").trim();
        } else if (text.startsWith("/deepseek ")) {
          targetModel = "deepseek-reasoner";
          cleanText = text.replace("/deepseek ", "").trim();
        } else if (text.startsWith("/qwen ")) {
          targetModel = "qwen-2.5-72b";
          cleanText = text.replace("/qwen ", "").trim();
        } else if (text.startsWith("/llama ")) {
          targetModel = "llama-3.3-70b";
          cleanText = text.replace("/llama ", "").trim();
        } else if (text.startsWith("/think ")) {
          sysPrompt += "\nMode Penalaran: Analisis secara logis dan mendalam.";
          targetModel = "deepseek-reasoner";
          cleanText = text.replace("/think ", "").trim();
        } else if (text.startsWith("/code ")) {
          sysPrompt += "\nMode Koding: Berikan solusi pemrograman bersih.";
          targetModel = "deepseek-coder";
          cleanText = text.replace("/code ", "").trim();
        }

        // Daftar failover berurutan jika model target mengalami kendala
        const candidateModels = [targetModel, "comku", "claude-3-5-haiku", "gpt-4o-mini", "llama-3.1-8b"];
        let aiReply = "";

        for (const m of candidateModels) {
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

            if (aiReply) break; // Berhasil mendapatkan jawaban
          } catch (_) {}
        }

        if (!aiReply) {
          aiReply = "Maaf, seluruh model di 9Router sedang sibuk atau respons tidak terbaca.";
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
