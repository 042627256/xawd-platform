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

// Kirim sinyal aksi sedang menganalisis / mengetik
async function sendChatAction(chatId: number, action = "typing") {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action })
    });
  } catch (_) {}
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

// Unduh file Telegram dan ubah ke format Base64 Data URL
async function getTelegramFileBase64(fileId: string): Promise<string | null> {
  try {
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData: any = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;

    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
    const mediaRes = await fetch(downloadUrl);
    const arrayBuffer = await mediaRes.arrayBuffer();

    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const ext = fileData.result.file_path.split(".").pop()?.toLowerCase() || "jpeg";
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    return `data:${mime};base64,${base64}`;
  } catch (_) {
    return null;
  }
}

// Engine Eksekusi AI yang mendukung teks & gambar / dokumen visual
async function executeAI(messages: any[], requestedModel = "ag/gemini-3.8-flash-high"): Promise<string> {
  const executionPlan = [
    requestedModel,
    "ag/gemini-3.8-flash-high",
    "gh/gpt-4o",
    "Oc-full/am/llama-3.2-11b-vision-instruct"
  ];

  for (const target of executionPlan) {
    for (const apiKey of PRIMARY_KEYS) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(`${TARGET_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: target,
            messages,
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
  return "Maaf, engine visual sedang sibuk memproses antrean. Silakan coba beberapa saat lagi.";
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
        const requestedModel = (body.model || "ag/gemini-3.8-flash-high").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

        const reply = await executeAI(incomingMessages, requestedModel);
        return json({ success: true, model: requestedModel, reply });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 400);
      }
    }

    // 2. Webhook Telegram (Mendukung Teks, Foto, dan Dokumen Gambar)
    if (url.pathname === "/api/telegram/webhook" && request.method === "POST") {
      try {
        const update: any = await request.json();
        const msg = update?.message;

        if (msg) {
          const chatId = msg.chat.id;

          const backgroundTask = (async () => {
            // Tangani Text Biasa
            if (msg.text) {
              const text = msg.text.trim();
              if (text.startsWith("/start")) {
                await sendTelegramMessage(chatId, "Halo! Saya bot asisten cerdas X AWD. Kirim pertanyaan, gambar, atau dokumen untuk saya analisis.");
                return;
              }
              if (text.startsWith("/help")) {
                await sendTelegramMessage(chatId, "Kirimkan teks atau foto/dokumen berkas (nota, tabel, tangkapan layar), dan saya akan menganalisis isinya.");
                return;
              }

              await sendChatAction(chatId, "typing");
              const reply = await executeAI([{ role: "user", content: text }]);
              await sendTelegramMessage(chatId, reply);
              return;
            }

            // Tangani Foto atau Dokumen Gambar
            let fileId: string | null = null;
            if (Array.isArray(msg.photo) && msg.photo.length > 0) {
              // Ambil resolusi gambar terbesar
              fileId = msg.photo[msg.photo.length - 1].file_id;
            } else if (msg.document && msg.document.mime_type?.startsWith("image/")) {
              fileId = msg.document.file_id;
            }

            if (fileId) {
              await sendChatAction(chatId, "upload_photo");
              const base64Url = await getTelegramFileBase64(fileId);
              const caption = msg.caption || "Analisis dan jelaskan detail gambar/dokumen ini.";

              if (base64Url) {
                const visionPayload = [
                  {
                    role: "user",
                    content: [
                      { type: "text", text: caption },
                      { type: "image_url", image_url: { url: base64Url } }
                    ]
                  }
                ];

                await sendChatAction(chatId, "typing");
                const visionReply = await executeAI(visionPayload, "ag/gemini-3.8-flash-high");
                await sendTelegramMessage(chatId, visionReply);
              } else {
                await sendTelegramMessage(chatId, "Gagal mengunduh file media dari Telegram.");
              }
            }
          })();

          if (ctx && typeof ctx.waitUntil === "function") {
            ctx.waitUntil(backgroundTask);
          } else {
            await backgroundTask;
          }
        }
      } catch (_) {}

      return json({ ok: true });
    }

    return json({ message: "X AWD Multimodal Engine Online" });
  }
};
