const TELEGRAM_BOT_TOKEN = "8815160199:AAHsPauxuowZ5BS9Of08V-PLiHAFsyeXyy8";

const PRIMARY_KEYS = [
  "sk-6e4c5defb3de6300-twi7qt-24c79688",
  "sk-6e4c5defb3de6300-yzpgcc-d5eeb935"
];

const TARGET_BASE = "https://9rxawd.up.railway.app/v1";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*"
    }
  });
}

function parseUpstreamResponse(text: string): string {
  if (!text) return "";
  try {
    const data = JSON.parse(text);
    if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data?.choices?.[0]?.delta?.content) return data.choices[0].delta.content;
  } catch (_) {}

  if (text.includes("data:")) {
    let combined = "";
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
        try {
          const chunk = JSON.parse(trimmed.replace(/^data:\s*/, ""));
          combined += chunk?.choices?.[0]?.delta?.content || "";
        } catch (_) {}
      }
    }
    if (combined.trim()) return combined.trim();
  }
  return "";
}

async function callSingleEngine(messages: any[], modelName: string, timeoutMs = 25000): Promise<string> {
  for (const apiKey of PRIMARY_KEYS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(`${TARGET_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      const raw = await res.text();
      const parsed = parseUpstreamResponse(raw);
      if (res.ok && parsed) return parsed;
    } catch (_) {}
  }
  return "";
}

// Fallback cascade normal
async function executeAI(messages: any[], requestedModel = "ag/gemini-3.8-flash-high"): Promise<string> {
  const plan = [requestedModel, "ag/gemini-3.8-flash-medium", "gh/gpt-4o"];
  for (const target of plan) {
    const ans = await callSingleEngine(messages, target);
    if (ans) return ans;
  }
  return "Maaf, seluruh cluster AI sedang mengalami antrean. Coba beberapa saat lagi.";
}

// Combo Epic: 3 Model Paralel + 1 Arbiter Synthesizer
async function executeComboEpic(messages: any[]): Promise<{ reply: string; perspectives: Record<string, string> }> {
  const promptUser = messages[messages.length - 1]?.content || "";

  // 1. Eksekusi paralel 3 engine lintas klaster
  const [claudeAns, geminiAns, gptAns] = await Promise.all([
    callSingleEngine(messages, "ag/claude-sonnet-4-6", 20000),
    callSingleEngine(messages, "ag/gemini-3.8-flash-high", 20000),
    callSingleEngine(messages, "gh/gpt-4o", 20000)
  ]);

  const perspectives: Record<string, string> = {
    "Claude Sonnet 4.6": claudeAns || "(Tidak merespons)",
    "Gemini 3.8 Flash": geminiAns || "(Tidak merespons)",
    "GPT-4o": gptAns || "(Tidak merespons)"
  };

  // 2. Synthesizer / Juri Konsensus
  const judgePrompt = `Anda adalah Arbiter Konsensus Cerdas X AWD (Mode Combo Epic).
Pertanyaan Pengguna: "${promptUser}"

Berikut draf respons dari 3 engine AI berbeda:
[Model Claude]: ${claudeAns || "Tidak tersedia"}
[Model Gemini]: ${geminiAns || "Tidak tersedia"}
[Model GPT-4o]: ${gptAns || "Tidak tersedia"}

Tugas Anda:
1. Evaluasi kebenaran, akurasi, dan kedalaman ketiga jawaban di atas.
2. Buang halusinasi, asumsi keliru, atau inkonsistensi.
3. Rangkum dan susun satu kesimpulan jawaban terbaik yang sangat terstruktur, jelas, dan kredibel.`;

  const finalConsensus = await callSingleEngine(
    [{ role: "user", content: judgePrompt }],
    "ag/gemini-3.8-flash-high",
    25000
  );

  return {
    reply: finalConsensus || claudeAns || geminiAns || gptAns || "Gagal melakukan sintesis konsensus.",
    perspectives
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (_) {}
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    // 1. Endpoint Playground Web
    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const isCombo = Boolean(body.isCombo);
        const requestedModel = (body.model || "ag/gemini-3.8-flash-high").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

        if (isCombo) {
          const comboResult = await executeComboEpic(incomingMessages);
          return json({
            success: true,
            model: "Combo Epic (Consensus Trio)",
            reply: comboResult.reply,
            perspectives: comboResult.perspectives
          });
        } else {
          const reply = await executeAI(incomingMessages, requestedModel);
          return json({ success: true, model: requestedModel, reply });
        }
      } catch (err: any) {
        return json({ success: false, error: err.message }, 400);
      }
    }

    // 2. Webhook Telegram
    if (url.pathname === "/api/telegram/webhook" && request.method === "POST") {
      try {
        const update: any = await request.json();
        const msg = update?.message;

        if (msg && msg.text) {
          const chatId = msg.chat.id;
          const userText = msg.text.trim();

          const task = (async () => {
            if (userText.startsWith("/start")) {
              await sendTelegramMessage(chatId, "Halo! Bot X AWD siap melayani obrolan cerdas dan mode Combo Epic.");
              return;
            }
            if (userText.startsWith("/combo")) {
              const query = userText.replace("/combo", "").trim() || "Jelaskan konsensus terbaik untuk topik ini.";
              const comboRes = await executeComboEpic([{ role: "user", content: query }]);
              await sendTelegramMessage(chatId, `⚡ [HASIL KONSENSUS COMBO EPIC]\n\n${comboRes.reply}`);
              return;
            }

            const res = await executeAI([{ role: "user", content: userText }]);
            await sendTelegramMessage(chatId, res);
          })();

          if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(task);
          } else {
            await task;
          }
        }
      } catch (_) {}

      return json({ ok: true });
    }

    return json({ message: "X AWD Core Engine + Combo Epic Active" });
  }
};
