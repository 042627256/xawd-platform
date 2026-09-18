const TELEGRAM_BOT_TOKEN = "8815160199:AAHsPauxuowZ5BS9Of08V-PLiHAFsyeXyy8";
const PRIMARY_KEY = "sk-6e4c5defb3de6300-yzpgcc-d5eeb935";
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

function parseStreamOrJson(rawText: string): string {
  if (!rawText) return "";
  try {
    const data = JSON.parse(rawText);
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.delta?.content;
    if (content) return content;
  } catch (_) {}

  let combined = "";
  const lines = rawText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
      try {
        const chunk = JSON.parse(trimmed.replace(/^data:\s*/, ""));
        combined += chunk?.choices?.[0]?.delta?.content || chunk?.choices?.[0]?.message?.content || "";
      } catch (_) {}
    }
  }
  return combined.trim();
}

async function callStrictEngine(messages: any[], modelName: string, timeoutMs = 35000): Promise<{ ok: boolean; content: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${TARGET_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PRIMARY_KEY}`
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
    const parsed = parseStreamOrJson(raw);
    if (res.ok && parsed) {
      return { ok: true, content: parsed };
    }
  } catch (_) {}
  return { ok: false, content: "" };
}

async function executeComboEpic(messages: any[]): Promise<{ reply: string; perspectives: Record<string, string> }> {
  const promptUser = messages[messages.length - 1]?.content || "";

  // Trio Frontier: Atria Dawn Preview + Claude Sonnet 4.6 + GPT-5.6 Terra
  const [engineA, engineB, engineC] = await Promise.all([
    callStrictEngine(messages, "Atria-Dawn-Preview/Atria-Dawn-Preview", 32000),
    callStrictEngine(messages, "ag/claude-sonnet-4-6", 32000),
    callStrictEngine(messages, "cx/gpt-5.6-terra", 32000)
  ]);

  const perspectives: Record<string, string> = {
    "Atria Dawn Preview": engineA.ok ? engineA.content : "(Engine offline / upstream busy)",
    "Claude Sonnet 4.6": engineB.ok ? engineB.content : "(Engine offline / upstream busy)",
    "GPT-5.6 Terra": engineC.ok ? engineC.content : "(Engine offline / upstream busy)"
  };

  const judgePrompt = `Anda adalah Arbiter Konsensus Cerdas X AWD (Mode Combo Epic).
Pertanyaan Pengguna: "${promptUser}"

Berikut draf sudut pandang dari 3 engine tier frontier:
[Atria Dawn Preview]: ${engineA.content || "Tidak merespons"}
[Claude Sonnet 4.6]: ${engineB.content || "Tidak merespons"}
[GPT-5.6 Terra]: ${engineC.content || "Tidak merespons"}

Tugas Anda:
1. Evaluasi kebenaran, akurasi, dan kelemahan masing-masing engine secara ringkas.
2. Buat satu sintesis kesimpulan jawaban final yang utuh, mendalam, dan terstruktur.`;

  const arbiterRes = await callStrictEngine(
    [{ role: "user", content: judgePrompt }],
    "ag/claude-sonnet-4-6",
    35000
  );

  return {
    reply: arbiterRes.ok ? arbiterRes.content : (engineA.content || engineB.content || engineC.content || "Gagal memperoleh konsensus trio."),
    perspectives
  };
}

async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const maxLen = 4000;
    const chunk = text.length > maxLen ? text.slice(0, maxLen) + "\n\n...(pesan terpotong batas Telegram)" : text;
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk })
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

    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const isCombo = Boolean(body.isCombo);
        const requestedModel = (body.model || "Atria-Dawn-Preview/Atria-Dawn-Preview").trim();
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

        const result = await callStrictEngine(incomingMessages, requestedModel);
        if (result.ok) {
          return json({ success: true, model: requestedModel, reply: result.content });
        } else {
          return json({
            success: false,
            model: requestedModel,
            error: `Upstream model '${requestedModel}' tidak merespons. Tidak ada silent fallback.`
          }, 502);
        }
      } catch (err: any) {
        return json({ success: false, error: err.message }, 400);
      }
    }

    if (url.pathname === "/api/telegram/webhook" && request.method === "POST") {
      try {
        const update: any = await request.json();
        const msg = update?.message;

        if (msg && msg.text) {
          const chatId = msg.chat.id;
          const userText = msg.text.trim();

          const task = (async () => {
            if (userText.startsWith("/start")) {
              await sendTelegramMessage(chatId, "Halo! Bot X AWD aktif dengan 118 model frontier terverifikasi.");
              return;
            }
            if (userText.startsWith("/combo")) {
              const query = userText.replace("/combo", "").trim() || "Beri saya wawasan konsensus.";
              const comboRes = await executeComboEpic([{ role: "user", content: query }]);
              await sendTelegramMessage(chatId, `⚡ [KONSENSUS COMBO EPIC]\n\n${comboRes.reply}`);
              return;
            }

            const res = await callStrictEngine([{ role: "user", content: userText }], "Atria-Dawn-Preview/Atria-Dawn-Preview");
            await sendTelegramMessage(chatId, res.ok ? res.content : "Upstream model sedang memproses antrean. Silakan coba lagi.");
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

    return json({ message: "X AWD Pure Engine Gateway v2 Online" });
  }
};
