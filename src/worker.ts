const TELEGRAM_BOT_TOKEN = "8815160199:AAHsPauxuowZ5BS9Of08V-PLiHAFsyeXyy8";
const PRIMARY_KEY = "sk-6e4c5defb3de6300-yzpgcc-d5eeb935";
const TARGET_BASE = "https://9rxawd.up.railway.app/v1";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*"
  };
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
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

async function callStrictEngine(messages: any[], modelName: string, timeoutMs = 60000): Promise<{ ok: boolean; content: string }> {
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

  const [engineA, engineB, engineC] = await Promise.all([
    callStrictEngine(messages, "Atria-Dawn-Preview/Atria-Dawn-Preview", 75000),
    callStrictEngine(messages, "Oc-uni/gpt-6-astra", 75000),
    callStrictEngine(messages, "ag/claude-sonnet-4-6", 60000)
  ]);

  const perspectives: Record<string, string> = {
    "Atria Dawn Preview": engineA.ok ? engineA.content : "(Model tidak merespons)",
    "GPT-6 Astra": engineB.ok ? engineB.content : "(Model tidak merespons)",
    "Claude Sonnet 4.6": engineC.ok ? engineC.content : "(Model tidak merespons)"
  };

  const judgePrompt = `Anda adalah Arbiter Konsensus Cerdas X AWD (Mode Combo Epic).
Pertanyaan Pengguna: "${promptUser}"

Berikut draf sudut pandang dari 3 engine:
[Atria Dawn Preview]: ${engineA.content || "Tidak merespons"}
[GPT-6 Astra]: ${engineB.content || "Tidak merespons"}
[Claude Sonnet 4.6]: ${engineC.content || "Tidak merespons"}

Tugas Anda:
1. Analisis dan padukan wawasan paling akurat dari ketiga engine secara komprehensif.
2. Buat satu jawaban final yang utuh, presisi, dan terstruktur.`;

  const arbiterRes = await callStrictEngine(
    [{ role: "user", content: judgePrompt }],
    "ag/claude-sonnet-4-6",
    60000
  );

  return {
    reply: arbiterRes.ok ? arbiterRes.content : (engineA.content || engineB.content || engineC.content || "Konsensus gagal didapatkan."),
    perspectives
  };
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const isCombo = Boolean(body.isCombo);
        const requestedModel = (body.model || "Oc-uni/gpt-6-astra").trim();
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

        // Single Stream Pipeline
        const upstreamRes = await fetch(`${TARGET_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${PRIMARY_KEY}`
          },
          body: JSON.stringify({
            model: requestedModel,
            messages: incomingMessages,
            temperature: 0.7,
            stream: true
          })
        });

        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text();
          return json({
            success: false,
            model: requestedModel,
            error: `Upstream error (${upstreamRes.status}): ${errText}`
          }, upstreamRes.status);
        }

        return new Response(upstreamRes.body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            ...corsHeaders()
          }
        });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 500);
      }
    }

    // Telegram Bot
    if (url.pathname === "/api/telegram/webhook" && request.method === "POST") {
      try {
        const update: any = await request.json();
        const msg = update?.message;
        if (msg && msg.text) {
          const chatId = msg.chat.id;
          const userText = msg.text.trim();
          const task = (async () => {
            if (userText.startsWith("/start")) {
              await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: "Halo! Bot X AWD aktif." })
              });
              return;
            }
            if (userText.startsWith("/combo")) {
              const query = userText.replace("/combo", "").trim() || "Beri saya panduan.";
              const comboRes = await executeComboEpic([{ role: "user", content: query }]);
              await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `⚡ [KONSENSUS COMBO EPIC]\n\n${comboRes.reply}`.slice(0, 4000) })
              });
              return;
            }
            const res = await callStrictEngine([{ role: "user", content: userText }], "Oc-uni/gpt-6-astra");
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: (res.ok ? res.content : "Upstream sedang memproses.").slice(0, 4000) })
            });
          })();
          if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
          else await task;
        }
      } catch (_) {}
      return json({ ok: true });
    }

    return json({ message: "X AWD Gateway Online" });
  }
};
