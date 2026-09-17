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

async function executeAI(messages: any[], requestedModel = "ag/gemini-3.8-flash-medium"): Promise<string> {
  const executionPlan = [
    requestedModel,
    "ag/gemini-3.8-flash-medium",
    "gh/gpt-4o-mini",
    "gh/gpt-4o"
  ];

  for (const target of executionPlan) {
    for (const apiKey of PRIMARY_KEYS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20000);

        const res = await fetch(`${TARGET_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: target,
            messages: messages,
            temperature: 0.7
          }),
          signal: controller.signal
        });
        clearTimeout(timer);

        const rawText = await res.text();
        const extracted = parseUpstreamResponse(rawText);
        if (res.ok && extracted) return extracted;
      } catch (_) {}
    }
  }
  return "Maaf, antrean model AI sedang padat. Silakan kirim pesan Anda kembali.";
}

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
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

    // 1. Endpoint Web App Playground
    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const requestedModel = (body.model || "ag/gemini-3.8-flash-medium").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

        const reply = await executeAI(incomingMessages, requestedModel);
        return json({ success: true, model: requestedModel, reply });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 400);
      }
    }

    // 2. Endpoint Webhook Telegram (Background Execution via ctx.waitUntil)
    if (url.pathname === "/api/telegram/webhook" && request.method === "POST") {
      try {
        const update: any = await request.json();
        if (update?.message?.text) {
          const chatId = update.message.chat.id;
          const userText = update.message.text.trim();

          const task = (async () => {
            if (userText.startsWith("/start")) {
              await sendTelegramMessage(
                chatId,
                "Halo! Saya bot asisten cerdas X AWD.\n\nKetik pesan teks apa saja untuk mulai berinteraksi."
              );
              return;
            }

            if (userText.startsWith("/help")) {
              await sendTelegramMessage(
                chatId,
                "Panduan Penggunaan Bot X AWD:\n\n1. Kirim pesan apa saja untuk langsung dijawab oleh engine AI.\n2. Akses UI lengkap di https://xawd.my.id."
              );
              return;
            }

            const reply = await executeAI([{ role: "user", content: userText }]);
            await sendTelegramMessage(chatId, reply);
          })();

          if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(task);
          } else {
            await task;
          }
        }
      } catch (_) {}
      
      // Balas HTTP 200 instan ke Telegram agar tidak timeout
      return json({ ok: true });
    }

    return json({ message: "X AWD Core Engine + Telegram Connected" });
  }
};
