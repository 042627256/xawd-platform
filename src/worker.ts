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

// Eksekusi model strictly sesuai nama yang diminta tanpa fallback ke model lain
async function callStrictEngine(messages: any[], modelName: string, timeoutMs = 30000): Promise<{ ok: boolean; content: string }> {
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
      if (res.ok && parsed) {
        return { ok: true, content: parsed };
      }
    } catch (_) {}
  }
  return { ok: false, content: "" };
}

// Combo Epic: Menggunakan model-model tier tertinggi + cx/gpt-5.6-terra
async function executeComboEpic(messages: any[]): Promise<{ reply: string; perspectives: Record<string, string> }> {
  const promptUser = messages[messages.length - 1]?.content || "";

  // Eksekusi paralel 3 engine independen
  const [engineA, engineB, engineC] = await Promise.all([
    callStrictEngine(messages, "ag/claude-sonnet-4-6", 25000),
    callStrictEngine(messages, "cx/gpt-5.6-terra", 25000),
    callStrictEngine(messages, "ag/gemini-3.8-flash-high", 25000)
  ]);

  const perspectives: Record<string, string> = {
    "Claude Sonnet 4.6": engineA.ok ? engineA.content : "(Model tidak merespons)",
    "GPT-5.6 Terra": engineB.ok ? engineB.content : "(Model tidak merespons)",
    "Gemini 3.8 Flash": engineC.ok ? engineC.content : "(Model tidak merespons)"
  };

  const judgePrompt = `Anda adalah Arbiter Konsensus Cerdas X AWD (Mode Combo Epic).
Pertanyaan Pengguna: "${promptUser}"

Berikut draf respons dari engine:
[Claude Sonnet 4.6]: ${engineA.content || "Tidak merespons"}
[GPT-5.6 Terra]: ${engineB.content || "Tidak merespons"}
[Gemini 3.8 Flash]: ${engineC.content || "Tidak merespons"}

Tugas Anda:
1. Evaluasi kebenaran, akurasi, dan kedalaman jawaban di atas.
2. Rangkum dan susun satu kesimpulan jawaban terbaik yang sangat jelas, terstruktur, dan utuh.`;

  const arbiterRes = await callStrictEngine(
    [{ role: "user", content: judgePrompt }],
    "ag/claude-sonnet-4-6",
    30000
  );

  return {
    reply: arbiterRes.ok ? arbiterRes.content : (engineB.content || engineA.content || engineC.content || "Gagal memperoleh sintesis konsensus."),
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
        const requestedModel = (body.model || "").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

        if (isCombo) {
          const comboResult = await executeComboEpic(incomingMessages);
          return json({
            success: true,
            model: "Combo Epic (Trio)",
            reply: comboResult.reply,
            perspectives: comboResult.perspectives
          });
        }

        if (!requestedModel) {
          return json({ success: false, error: "Model target tidak ditentukan." }, 400);
        }

        // Jalankan HANYA model yang dipilih, tanpa fallback ke model lain
        const result = await callStrictEngine(incomingMessages, requestedModel);
        if (result.ok) {
          return json({ success: true, model: requestedModel, reply: result.content });
        } else {
          return json({
            success: false,
            model: requestedModel,
            error: `Upstream model '${requestedModel}' gagal merespons atau tidak aktif di upstream router.`
          }, 502);
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
              await sendTelegramMessage(chatId, "Halo! Bot X AWD aktif.");
              return;
            }
            if (userText.startsWith("/combo")) {
              const query = userText.replace("/combo", "").trim() || "Jelaskan konsensus terbaik.";
              const comboRes = await executeComboEpic([{ role: "user", content: query }]);
              await sendTelegramMessage(chatId, `⚡ [KONSENSUS COMBO EPIC]\n\n${comboRes.reply}`);
              return;
            }

            // Gunakan default model Claude / Terra murni
            const res = await callStrictEngine([{ role: "user", content: userText }], "ag/claude-sonnet-4-6");
            await sendTelegramMessage(chatId, res.ok ? res.content : "Upstream sedang tidak merespons.");
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

    return json({ message: "X AWD Pure Engine Gateway Online" });
  }
};
