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
    const origin = req.headers.get("Origin") || "*";

    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true"
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const json = (d: any, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

    const botToken = "8815160199:AAHsPauxuowZ5BS9Of08V-PLiHAFsyeXyy8";
    const nineBase = env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1";
    const nineKey = env.NINE_ROUTER_API_KEY || "";

    const sendToTelegram = async (chatId: number | string, textMsg: string) => {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: textMsg, parse_mode: "Markdown" })
      });
      const data: any = await res.json().catch(() => ({}));
      if (!data.ok) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: textMsg })
        });
      }
    };

    // Handler Webhook Telegram
    if (url.pathname === "/api/telegram/webhook" && req.method === "POST") {
      try {
        const update: any = await req.json();
        const msg = update.message;
        if (!msg) return new Response("OK", { status: 200 });

        const chatId = msg.chat.id;
        const text = (msg.text || "").trim();

        const sendAction = (act: string) => {
          fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, action: act })
          }).catch(() => {});
        };

        if (text.startsWith("/start")) {
          const w = "⚡ *X AWD Autonomous Engine Online*\n\nBot terhubung langsung ke 9Router AI & Cloudflare Flux.\n\n*Perintah Tersedia:*\n💬 *Chat Biasa* -> Tanya langsung ke model 9Router\n🧠 */think <topik>* -> Penalaran mendalam & evaluasi kritis\n💻 */code <tugas>* -> Pemrograman & debugging kode\n🎨 */image <deskripsi>* -> Render gambar Flux langsung ke chat";
          await sendToTelegram(chatId, w);
          return new Response("OK", { status: 200 });
        }

        if (text.startsWith("/image")) {
          const p = text.replace("/image", "").trim();
          if (!p) {
            await sendToTelegram(chatId, "⚠️ Masukkan deskripsi gambar. Contoh: `/image mobil sport cyberpunk`");
            return new Response("OK", { status: 200 });
          }
          sendAction("upload_photo");
          try {
            const r = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: p, steps: 4 });
            const buf = await new Response(r).arrayBuffer();
            const blob = new Blob([buf], { type: "image/jpeg" });
            const fd = new FormData();
            fd.append("chat_id", chatId.toString());
            fd.append("photo", blob, "xawd.jpg");
            fd.append("caption", `🎨 *Output:* ${p}`);
            await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, { method: "POST", body: fd });
          } catch (e: any) {
            await sendToTelegram(chatId, "❌ Gagal merender gambar: " + e.message);
          }
          return new Response("OK", { status: 200 });
        }

        sendAction("typing");
        let sysPrompt = "Kamu adalah asisten pintar X AWD. Berikan jawaban yang cerdas, padat, dan jelas.";
        let cleanText = text;

        if (text.startsWith("/think")) {
          sysPrompt = "Mode Penalaran X AWD: Analisis masalah langkah demi langkah dengan logis dan rinci.";
          cleanText = text.replace("/think", "").trim();
        } else if (text.startsWith("/code")) {
          sysPrompt = "Mode Koding X AWD: Berikan kode yang terstruktur, bersih, dan solutif.";
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
          let d: any = null;

          try {
            d = JSON.parse(rawText);
          } catch (_) {
            // Tangani respons jika 9Router tetap mengalirkan SSE (data: {...})
            const lines = rawText.split("\n");
            let accumulated = "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
                try {
                  const chunk = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                  accumulated += chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content || "";
                } catch (e) {}
              }
            }
            if (accumulated) {
              aiReply = accumulated;
            }
          }

          if (!aiReply && d) {
            if (d.choices && d.choices[0]?.message?.content) {
              aiReply = d.choices[0].message.content;
            } else if (d.error) {
              aiReply = "9Router Error: " + (d.error.message || JSON.stringify(d.error));
            } else {
              aiReply = JSON.stringify(d);
            }
          }

          if (!aiReply) {
            aiReply = "Respons dari 9Router tidak terbaca: " + rawText.slice(0, 300);
          }
        } catch (netErr: any) {
          aiReply = "Koneksi ke 9Router gagal: " + netErr.message;
        }

        await sendToTelegram(chatId, aiReply);
        return new Response("OK", { status: 200 });
      } catch (err: any) {
        return new Response("OK", { status: 200 });
      }
    }

    return env.ASSETS.fetch(req);
  }
};
