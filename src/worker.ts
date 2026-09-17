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

    // MEMORI PERMANEN X AWD (Coretax Grounding Context)
    const CORE_SYSTEM_MEMORY = `__CORETAX_MEMORY_PLACEHOLDER__`;

    // Inisialisasi Database D1
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

    // 2. ENDPOINT AKTIVASI AGENT DARI DASHBOARD
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
        return json({ success: true, message: "Agent diaktifkan sebagai otak Telegram!", id: agentId });
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
              .bind(id, name, role, prompt, 1, Date.now()).run();
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
          const menu = "⚡ *X AWD Autonomous Engine Online*\n\n" +
            "• *Default Model Engine*: `Comku` & `All` Router (Akses 100+ Model)\n" +
            "• *Memory Status*: Coretax Knowledge Active\n\n" +
            "Silakan ajukan pertanyaan seputar Coretax atau instruksi lainnya secara langsung.";
          await sendMsg(menu);
          return new Response("OK", { status: 200 });
        }

        // Susun System Prompt: Memori Coretax + Instruksi Agent Aktif (jika ada)
        let activePrompt = "";
        try {
          const activeAgent: any = await env.DB.prepare("SELECT prompt FROM xawd_agents WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first();
          if (activeAgent?.prompt) activePrompt = "\n[Instruksi Tambahan]:\n" + activeAgent.prompt;
        } catch (_) {}

        const finalSystemPrompt = `Kamu adalah X AWD, asisten cerdas berpengetahuan tinggi.\n\n[MEMORI SISTEM CORETAX]:\n${CORE_SYSTEM_MEMORY}${activePrompt}\n\nGunakan pengetahuan di atas sebagai rujukan utama dalam menjawab pertanyaan. Jawab dengan lugas, cerdas, akurat, dan terstruktur.`;

        // MODEL DEFAULT: "Comku" & "All" diprioritaskan utama
        const candidateModels = ["Comku", "All", "cx/gpt-6-astra", "ag/gemini-3.8-flash-high"];
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
                  { role: "system", content: finalSystemPrompt },
                  { role: "user", content: text }
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

            if (aiReply) break; // Berhasil dijawab oleh Comku atau All
          } catch (_) {}
        }

        if (!aiReply) {
          aiReply = "Maaf, mesin router Comku/All sedang memproses beban tinggi. Silakan coba kembali.";
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
