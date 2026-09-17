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

    // OTAK INSTRUKSI PERSONA UTAMA
    const AGENT_BASE_INSTRUCTION = `__AGENT_BRAIN_PLACEHOLDER__`;

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

    // 2. WEBHOOK TELEGRAM: ULTRA-FLAGSHIP COMBINE ROUTING
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
          const welcome = "⚡ *X AWD Engine Online*\n\n" +
            "• *Architecture*: Ultra-Flagship Multi-Model Combine\n" +
            "• *Tier 1 (Default)*: GLM-5.3 & GLM-5.1 (Zhipu AI)\n" +
            "• *Tier 2 (Reasoning)*: Claude Opus 5 & Sonnet 5\n" +
            "• *Tier 3 (Logic)*: GPT-5.6 Terra & GPT-4o\n" +
            "• *Tier 4 (Deep Analysis)*: DeepSeek-V4 Pro & Kimi-K3\n" +
            "• *Tier 5 (Failover Reserve)*: Gemini 3.8 / 3.7 Flash High\n" +
            "• *Persona*: Coretax Knowledge Base Active\n\n" +
            "Silakan ajukan pertanyaan atau instruksi Anda.";
          await sendMsg(welcome);
          return new Response("OK", { status: 200 });
        }

        let activePrompt = "";
        if (env.DB) {
          try {
            const activeAgent: any = await env.DB.prepare("SELECT prompt FROM xawd_agents WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1").first();
            if (activeAgent?.prompt) activePrompt = "\n\n" + activeAgent.prompt;
          } catch (_) {}
        }

        // Persona enforcement: model apapun yang menjawab WAJIB bertindak sebagai X AWD
        const finalSystemPrompt = `${AGENT_BASE_INSTRUCTION}${activePrompt}\n\n[PENTING]: Kamu adalah agen X AWD. Jangan pernah mengidentifikasi dirimu sebagai Google Gemini, OpenAI, Zhipu, atau Anthropic secara mentah. Jawablah sesuai kepribadian dan pengetahuan perpajakan Coretax yang diberikan.`;

        // DAFTAR MODEL TERTINGGI DARI MASING-MASING KELOMPOK
        const FLAGSHIP_COMBINE = [
          // Tier 1: GLM Paling Mutakhir (Primary)
          "Oc-full/glm/glm-5.3",
          "Oc-full/glm/glm-5.1",
          "Oc-uni/z-ai/glm-5.2",
          
          // Tier 2: Claude Flagship (Reasoning & Writing)
          "Oc-full/cc/claude-opus-5",
          "Oc-full/cc/claude-sonnet-5",
          "ag/claude-opus-4-6-thinking",
          
          // Tier 3: OpenAI Flagship (Coding & Logic)
          "cx/gpt-5.6-terra",
          "gh/gpt-4o",
          "gh/gpt-4.1",

          // Tier 4: Reasoning & Deep Analysis
          "Oc-uni/deepseek/deepseek-v4-pro",
          "Oc-uni/moonshotai/kimi-k3",
          "Oc-full/xai/grok-4.6",

          // Tier 5: Gemini Tier Tertinggi (Hanya Failover jika di atas limit)
          "ag/gemini-3.8-flash-high",
          "Oc-full/ag/gemini-3.7-flash-medium",
          "ag/gemini-3.7-flash-high"
        ];

        let aiReply = "";

        for (const m of FLAGSHIP_COMBINE) {
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

            if (!r.ok) continue;

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

            if (aiReply) break; // Berhasil dijawab oleh flagship yang tersedia
          } catch (_) {}
        }

        if (!aiReply) {
          aiReply = "Maaf, seluruh cluster model flagship sedang memproses antrean tinggi. Silakan ulangi pertanyaan Anda.";
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
