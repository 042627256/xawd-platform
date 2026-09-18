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
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

function classifyModel(id: string) {
  const lower = id.toLowerCase();
  let tier: "ULTRA" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
  let tierWeight = 2;
  let task = "chat";
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

// Parser universal: menangani JSON standar, SSE streaming chunks, dan membuang ping comment
function parseStreamOrJson(rawText: string): string {
  if (!rawText) return "";
  const trimmedText = rawText.trim();

  // Coba parse JSON langsung
  try {
    const data = JSON.parse(trimmedText);
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.delta?.content;
    if (content) return content;
  } catch (_) {}

  // Parse baris demi baris jika formatnya SSE stream
  let combined = "";
  const lines = trimmedText.split(/\r?\n/);
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith("data:") && !l.includes("[DONE]")) {
      try {
        const chunk = JSON.parse(l.replace(/^data:\s*/, ""));
        combined += chunk?.choices?.[0]?.delta?.content || chunk?.choices?.[0]?.message?.content || "";
      } catch (_) {}
    }
  }
  return combined.trim();
}

async function callStrictEngine(messages: any[], modelName: string, timeoutMs = 45000): Promise<{ ok: boolean; content: string }> {
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

// Combo Epic Trio Frontier Konsensus
async function executeComboEpic(messages: any[]): Promise<{ reply: string; perspectives: Record<string, string> }> {
  const promptUser = messages[messages.length - 1]?.content || "";

  const [engineA, engineB, engineC] = await Promise.all([
    callStrictEngine(messages, "Atria-Dawn-Preview/Atria-Dawn-Preview", 40000),
    callStrictEngine(messages, "Oc-uni/gpt-6-astra", 40000),
    callStrictEngine(messages, "ag/claude-sonnet-4-6", 40000)
  ]);

  const perspectives: Record<string, string> = {
    "Atria Dawn Preview": engineA.ok ? engineA.content : "(Model upstream sedang sibuk / antrean penuh)",
    "GPT-6 Astra": engineB.ok ? engineB.content : "(Model upstream sedang sibuk / antrean penuh)",
    "Claude Sonnet 4.6": engineC.ok ? engineC.content : "(Model upstream sedang sibuk / antrean penuh)"
  };

  const judgePrompt = `Anda adalah Arbiter Konsensus Cerdas X AWD (Mode Combo Epic).
Pertanyaan Pengguna: "${promptUser}"

Berikut draf sudut pandang dari 3 engine frontier:
[Atria Dawn Preview]: ${engineA.content || "Tidak merespons"}
[GPT-6 Astra]: ${engineB.content || "Tidak merespons"}
[Claude Sonnet 4.6]: ${engineC.content || "Tidak merespons"}

Tugas Anda:
1. Evaluasi keakuratan dan pandangan tiap engine secara tajam dan objektif.
2. Buat satu sintesis kesimpulan jawaban akhir yang utuh, presisi, dan terstruktur.`;

  const arbiterRes = await callStrictEngine(
    [{ role: "user", content: judgePrompt }],
    "ag/claude-sonnet-4-6",
    45000
  );

  return {
    reply: arbiterRes.ok ? arbiterRes.content : (engineC.content || engineB.content || engineA.content || "Konsensus gagal dirumuskan."),
    perspectives
  };
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // 1. Endpoint Live Fetch Models
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

    // 2. Endpoint Chat Playground
    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const isCombo = Boolean(body.isCombo);
        const requestedModel = (body.model || "Oc-uni/gpt-6-astra").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

        // Jika mode combo, jalankan konsensus 3 engine
        if (isCombo) {
          const comboResult = await executeComboEpic(incomingMessages);
          return json({
            success: true,
            model: "Combo Epic (Trio)",
            reply: comboResult.reply,
            perspectives: comboResult.perspectives
          });
        }

        // Mode single model: panggil upstream langsung dan kembalikan JSON bersih
        const result = await callStrictEngine(incomingMessages, requestedModel, 45000);
        if (result.ok) {
          return json({
            success: true,
            model: requestedModel,
            reply: result.content
          });
        } else {
          return json({
            success: false,
            model: requestedModel,
            error: `Upstream model '${requestedModel}' sedang sibuk atau tidak merespons. Tidak ada silent fallback.`
          }, 502);
        }
      } catch (err: any) {
        return json({ success: false, error: err.message }, 400);
      }
    }

    // 3. Telegram Bot Webhook
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
                body: JSON.stringify({ chat_id: chatId, text: "Halo! Sistem X AWD aktif." })
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
              body: JSON.stringify({ chat_id: chatId, text: (res.ok ? res.content : "Upstream sedang memproses antrean.").slice(0, 4000) })
            });
          })();
          if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(task);
          else await task;
        }
      } catch (_) {}
      return json({ ok: true });
    }

    return json({ message: "X AWD Universal Pure Gateway Online" });
  }
};
