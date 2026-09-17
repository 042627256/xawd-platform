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

    // Fungsi pengiriman aman ke Telegram (Anti-Drop)
    const sendToTelegram = async (chatId: number | string, textMsg: string) => {
      // Coba kirim format Markdown terlebih dahulu
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: textMsg, parse_mode: "Markdown" })
      });
      const data: any = await res.json().catch(() => ({}));
      
      // Jika ditolak karena formatting error, kirim sebagai teks mentah
      if (!data.ok) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: textMsg })
        });
      }
    };

    // 1. TELEGRAM WEBHOOK HANDLER
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

        // Generate Gambar Flux
        if (text.startsWith("/image")) {
          const p = text.replace("/image", "").trim();
          if (!p) {
            await sendToTelegram(chatId, "⚠️ Masukkan deskripsi gambar. Contoh: `/image mobil balap masa depan`");
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

        // Teks: 9Router AI (/think, /code, chat)
        sendAction("typing");
        let sysPrompt = "Kamu adalah agen kecerdasan pribadi X AWD. Jawab dengan cerdas, lugas, dan akurat.";
        let cleanText = text;

        if (text.startsWith("/think")) {
          sysPrompt = "Mode Penalaran Mendalam X AWD: Analisis masalah langkah demi langkah dengan logika berlapis.";
          cleanText = text.replace("/think", "").trim();
        } else if (text.startsWith("/code")) {
          sysPrompt = "Mode Koding X AWD: Berikan kode yang terstruktur, bersih, dan langsung dapat dieksekusi.";
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
              messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: cleanText }
              ]
            })
          });

          const d: any = await r.json();
          if (d.choices && d.choices[0]?.message?.content) {
            aiReply = d.choices[0].message.content;
          } else if (d.error) {
            aiReply = "9Router API Error: " + (d.error.message || JSON.stringify(d.error));
          } else {
            aiReply = "9Router merespon tanpa teks: " + JSON.stringify(d);
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

    // Endpoint Website Studio
    if (url.pathname === "/api/execute" && req.method === "POST") {
      try {
        const { task, prompt } = await req.json() as any;
        if (task === "image") {
          const r = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt: prompt || "abstract art", steps: 4 });
          const buf = await new Response(r).arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          return json({ success: true, task: "image", result: "data:image/jpeg;base64," + b64 });
        }

        const r = await fetch(nineBase + "/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(nineKey ? { "Authorization": `Bearer ${nineKey}` } : {})
          },
          body: JSON.stringify({
            model: "Comku",
            messages: [{ role: "user", content: prompt }]
          })
        });
        const d: any = await r.json();
        return json({ success: true, task, result: d.choices?.[0]?.message?.content || JSON.stringify(d) });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    return env.ASSETS.fetch(req);
  }
};