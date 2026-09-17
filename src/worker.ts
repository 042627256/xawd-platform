export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  AI: any;
  NINE_ROUTER_API_KEY: string;
  NINE_ROUTER_BASE_URL: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
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

    // Inisialisasi Database D1
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS personal_logs (
          id TEXT PRIMARY KEY,
          event_type TEXT,
          payload TEXT,
          created_at INTEGER
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS personal_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `).run();
    } catch (_) {}

    // Telegram Bot Gateway: Kirim Pesan & Notifikasi Otomatis
    if (url.pathname === "/api/telegram/send" && req.method === "POST") {
      try {
        const { text, botToken, chatId } = await req.json() as any;
        const activeToken = botToken || env.TELEGRAM_BOT_TOKEN || "";
        const activeChatId = chatId || env.TELEGRAM_CHAT_ID || "";

        if (!activeToken || !activeChatId) {
          return json({
            error: "Telegram Bot Token atau Chat ID belum disetel.",
            hint: "Masukkan Bot Token dan Chat ID di menu Telegram Gateway."
          }, 400);
        }

        const tgUrl = `https://api.telegram.org/bot${activeToken}/sendMessage`;
        const tgRes = await fetch(tgUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: activeChatId,
            text: text || "⚡ [SYNAPXIS OS] Signal alert: System ping verified.",
            parse_mode: "Markdown"
          })
        });

        const tgData: any = await tgRes.json();
        if (!tgData.ok) {
          return json({ error: tgData.description || "Gagal mengirim ke Telegram" }, 400);
        }

        // Catat ke log D1
        await env.DB.prepare("INSERT INTO personal_logs (id, event_type, payload, created_at) VALUES (?, 'TELEGRAM_DISPATCH', ?, ?)")
          .bind("tg_" + crypto.randomUUID().slice(0, 8), text, Date.now()).run();

        return json({ success: true, message: "Pesan berhasil dikirim ke Telegram!", result: tgData.result });
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // Telegram Bot Status Check
    if (url.pathname === "/api/telegram/status" && req.method === "POST") {
      try {
        const { botToken } = await req.json() as any;
        const activeToken = botToken || env.TELEGRAM_BOT_TOKEN || "";
        if (!activeToken) return json({ error: "Token belum diisi" }, 400);

        const r = await fetch(`https://api.telegram.org/bot${activeToken}/getMe`);
        const d: any = await r.json();
        return json(d);
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    // AI Dual Engine: Text Reasoning & Visual Diffusion
    if (url.pathname === "/api/ai/execute" && req.method === "POST") {
      try {
        const { prompt, model, task, syncToTelegram, botToken, chatId } = await req.json() as any;
        if (!prompt) return json({ error: "Prompt tidak boleh kosong" }, 400);

        if (task === "image") {
          const res = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", { prompt, steps: 4 });
          const buf = await new Response(res).arrayBuffer();
          const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
          return json({ success: true, result: `data:image/jpeg;base64,${b64}`, task: "image" });
        }

        const targetModel = model || "Comku";
        const res = await fetch((env.NINE_ROUTER_BASE_URL || "https://9rxawd.up.railway.app/v1") + "/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.NINE_ROUTER_API_KEY}` },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: "system", content: "You are the private autonomous executive AI of the user. Be concise, direct, hyper-intelligent, and proactive." },
              { role: "user", content: prompt }
            ]
          })
        });
        const data: any = await res.json();
        const reply = data.choices?.[0]?.message?.content || "Selesai dieksekusi.";

        // Jika opsi syncToTelegram aktif, kirim salinan hasil AI langsung ke bot Telegram
        if (syncToTelegram && (botToken || env.TELEGRAM_BOT_TOKEN) && (chatId || env.TELEGRAM_CHAT_ID)) {
          const activeTok = botToken || env.TELEGRAM_BOT_TOKEN;
          const activeChat = chatId || env.TELEGRAM_CHAT_ID;
          await fetch(`https://api.telegram.org/bot${activeTok}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: activeChat,
              text: `🤖 *[AI Compute Result]*\n\n*Prompt:* ${prompt.slice(0, 100)}...\n\n*Output:*\n${reply.slice(0, 3000)}`,
              parse_mode: "Markdown"
            })
          }).catch(() => {});
        }

        return json({ success: true, result: reply, model: targetModel });
      } catch (err: any) {
        return json({ error: err.message }, 500);
      }
    }

    // Health & Edge Cluster Status
    if (url.pathname === "/api/health") {
      return json({ status: "healthy", timestamp: Date.now(), mode: "PERSONAL_AUTONOMOUS_OS" });
    }

    return env.ASSETS.fetch(req);
  }
};
