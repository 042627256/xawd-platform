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

function classifyModel(id: string) {
  const lower = id.toLowerCase();
  let tier: "ULTRA" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  let tierWeight = 2;
  let task: "text" | "code" | "vision" | "research" | "audio" = "text";
  let supportsVision = false;

  if (lower.includes("dawn") || lower.includes("astra") || lower.includes("opus") || lower.includes("grok-4.6") || lower.includes("qwen3.8-max")) {
    tier = "ULTRA";
    tierWeight = 4;
  } else if (lower.includes("terra") || lower.includes("sonnet") || lower.includes("pro") || lower.includes("high") || lower.includes("thinking") || lower.includes("glm-5.3") || lower.includes("nemotron-3-ultra") || lower.includes("gpt-oss-120b")) {
    tier = "HIGH";
    tierWeight = 3;
  } else if (lower.includes("mini") || lower.includes("low") || lower.includes("lite") || lower.includes("extra-low") || lower.includes("free") || lower.includes("coba")) {
    tier = "LOW";
    tierWeight = 1;
  }

  if (lower.includes("image") || lower.includes("vision")) {
    task = "vision";
    supportsVision = true;
  } else if (lower.includes("terra") || lower.includes("build") || lower.includes("spark") || lower.includes("exec-agent")) {
    task = "code";
  } else if (lower.includes("copilot-search") || lower.includes("agent")) {
    task = "research";
  } else if (lower.includes("riva") || lower.includes("translate")) {
    task = "audio";
  }

  return {
    id,
    name: id.includes("/") ? id.split("/").slice(1).join("/") : id,
    provider: id.includes("/") ? id.split("/")[0] : "9router",
    tier,
    tierWeight,
    task,
    supportsVision,
    isCombine: false
  };
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

    // Ambil daftar model live
    if (url.pathname === "/api/models" && request.method === "GET") {
      try {
        const upstreamRes = await fetch(`${TARGET_BASE}/models`, {
          headers: { "Authorization": `Bearer ${PRIMARY_KEY}` }
        });
        const data: any = await upstreamRes.json();
        const rawList = data.data || data || [];
        const modelIds = rawList.map((m: any) => m.id || m).filter(Boolean);
        const dynamicModels = modelIds.map(classifyModel);
        return json({ success: true, count: dynamicModels.length, data: dynamicModels });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 500);
      }
    }

    // Direct SSE Stream
    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const requestedModel = (body.model || "Oc-uni/gpt-6-astra").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

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
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*"
          }
        });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 500);
      }
    }

    // Telegram Bot Webhook
    if (url.pathname === "/api/telegram/webhook" && request.method === "POST") {
      try {
        const update: any = await request.json();
        const msg = update?.message;
        if (msg && msg.text) {
          const chatId = msg.chat.id;
          const userText = msg.text.trim();
          const task = (async () => {
            const res = await fetch(`${TARGET_BASE}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${PRIMARY_KEY}`
              },
              body: JSON.stringify({
                model: "Oc-uni/gpt-6-astra",
                messages: [{ role: "user", content: userText }]
              })
            });
            const d: any = await res.json().catch(() => ({}));
            const reply = d?.choices?.[0]?.message?.content || "Upstream tidak merespons.";
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: reply.slice(0, 4000) })
            });
          })();
          if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
          else await task;
        }
      } catch (_) {}
      return json({ ok: true });
    }

    return json({ message: "X AWD Dynamic Pure Stream Gateway Active" });
  }
};
