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

// Parser universal: Menangani respons JSON murni, SSE stream (data: ...), ataupun teks mentah
function cleanUpstreamPayload(rawText: string): string {
  if (!rawText || !rawText.trim()) return "";
  const trimmed = rawText.trim();

  // 1. Jika JSON valid biasa
  try {
    const parsed = JSON.parse(trimmed);
    const content = parsed.choices?.[0]?.message?.content ?? parsed.choices?.[0]?.delta?.content;
    if (content !== undefined) return content;
  } catch (_) {}

  // 2. Jika respons SSE (data: {...})
  let accumulated = "";
  const lines = trimmed.split("\n");
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith("data:") && !l.includes("[DONE]")) {
      try {
        const jsonPart = JSON.parse(l.replace(/^data:\s*/, ""));
        const chunk = jsonPart.choices?.[0]?.delta?.content ?? jsonPart.choices?.[0]?.message?.content;
        if (chunk) accumulated += chunk;
      } catch (_) {}
    }
  }

  if (accumulated.length > 0) return accumulated;

  // 3. Fallback pembersihan regex jika format SSE tidak standar
  const matches = [...trimmed.matchAll(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  if (matches.length > 0) {
    return matches.map(m => {
      try { return JSON.parse(`"${m[1]}"`); } catch (_) { return m[1]; }
    }).join("");
  }

  return trimmed;
}

const TIER_POOLS: Record<string, string[]> = {
  ULTRA: ["Oc-uni/gpt-6-astra", "Atria-Dawn-Preview/Atria-Dawn-Preview", "Oc-full/cc/claude-opus-5", "Oc-full/xai/grok-4.6"],
  HIGH: ["cx/gpt-5.6-terra", "ag/claude-sonnet-4-6", "ag/gemini-3.8-flash-high", "Oc-uni/deepseek/deepseek-v4-pro"],
  MEDIUM: ["cx/gpt-5.6-luna", "ag/gemini-3.8-flash-medium", "gh/gpt-4o", "Oc-full/ds/deepseek-v4-flash"],
  LOW: ["ag/gemini-3.8-flash-low", "gh/gpt-4o-mini", "gemini/gemini-3.5-flash-lite"],
  FREE: ["Oc-full/am/free", "Coba", "gh/gpt-3.5-turbo-0613"]
};

const COMBO_PRESETS: Record<string, { name: string; engines: string[]; arbiter: string }> = {
  epic: {
    name: "Epic Frontier Trio",
    engines: ["Atria-Dawn-Preview/Atria-Dawn-Preview", "Oc-uni/gpt-6-astra", "ag/claude-sonnet-4-6"],
    arbiter: "ag/claude-sonnet-4-6"
  },
  ultra: {
    name: "Ultra Apex Trio",
    engines: ["Oc-full/xai/grok-4.6", "Oc-uni/gpt-6-astra", "Oc-full/cc/claude-opus-5"],
    arbiter: "Oc-uni/gpt-6-astra"
  },
  high: {
    name: "High Logic & Code",
    engines: ["cx/gpt-5.6-terra", "ag/claude-sonnet-4-6", "Oc-uni/deepseek/deepseek-v4-pro"],
    arbiter: "cx/gpt-5.6-terra"
  },
  medium: {
    name: "Medium Balanced",
    engines: ["cx/gpt-5.6-luna", "ag/gemini-3.8-flash-medium", "gh/gpt-4o"],
    arbiter: "gh/gpt-4o"
  },
  low: {
    name: "Low Speed Trio",
    engines: ["ag/gemini-3.8-flash-low", "gh/gpt-4o-mini", "gemini/gemini-3.5-flash-lite"],
    arbiter: "gh/gpt-4o-mini"
  }
};

let rrIndex: Record<string, number> = { ULTRA: 0, HIGH: 0, MEDIUM: 0, LOW: 0, FREE: 0 };

async function fetchFromUpstream(model: string, messages: any[]): Promise<string> {
  const res = await fetch(`${TARGET_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PRIMARY_KEY}`
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, stream: false })
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Upstream ${res.status}: ${raw.slice(0, 150)}`);
  }
  const cleaned = cleanUpstreamPayload(raw);
  if (!cleaned) throw new Error("Upstream mengembalikan respon kosong");
  return cleaned;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    // Endpoint models
    if (url.pathname === "/api/models" && request.method === "GET") {
      try {
        const up = await fetch(`${TARGET_BASE}/models`, { headers: { "Authorization": `Bearer ${PRIMARY_KEY}` } });
        if (up.ok) {
          const d: any = await up.json();
          const list = (d.data || d || []).map((m: any) => m.id || m).filter(Boolean);
          return json({ success: true, count: list.length, data: list.map((id: string) => {
            const parts = id.split("/");
            const lower = id.toLowerCase();
            let tier = "MEDIUM";
            if (lower.includes("free") || lower.includes("coba") || lower.includes("3.5-turbo")) tier = "FREE";
            else if (lower.includes("dawn") || lower.includes("astra") || lower.includes("opus") || lower.includes("grok-4.6") || lower.includes("qwen3.8-max")) tier = "ULTRA";
            else if (lower.includes("terra") || lower.includes("sonnet") || lower.includes("pro") || lower.includes("high") || lower.includes("thinking") || lower.includes("glm-5.3")) tier = "HIGH";
            else if (lower.includes("mini") || lower.includes("low") || lower.includes("lite") || lower.includes("extra-low") || lower.includes("haiku")) tier = "LOW";

            return {
              id,
              name: parts[parts.length - 1],
              provider: parts.length > 1 ? parts[0] : "9router",
              tier,
              supportsVision: lower.includes("vision") || lower.includes("image") || lower.includes("4.6v")
            };
          })});
        }
      } catch (_) {}
      return json({ success: false, error: "Gagal mengambil daftar model" }, 500);
    }

    // Endpoint eksekusi chat
    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const { isCombo, comboPreset = "epic", enableFallback, enableRoundRobin, tier = "ULTRA" } = body;
        let model = (body.model || "Oc-uni/gpt-6-astra").trim();
        const messages = Array.isArray(body.messages) && body.messages.length > 0 
          ? body.messages 
          : [{ role: "user", content: body.prompt || "" }];

        // 1. COMBO MODE
        if (isCombo) {
          const presetKey = (comboPreset || "epic").toLowerCase();
          const cfg = COMBO_PRESETS[presetKey] || COMBO_PRESETS.epic;
          const perspectives: Record<string, string> = {};

          await Promise.all(cfg.engines.map(async (eng) => {
            try {
              perspectives[eng] = await fetchFromUpstream(eng, messages);
            } catch (e: any) {
              perspectives[eng] = `(Engine timeout/sibuk: ${e.message})`;
            }
          }));

          const judgePrompt = `Anda Arbiter Konsensus (${cfg.name}).
Pertanyaan: ${messages[messages.length - 1]?.content}
Berikut perspektif dari engines:
${cfg.engines.map(e => `[${e}]:${perspectives[e]}`).join("\n\n")}
Berikan sintesis konsensus jawaban yang tajam, utuh, dan terstruktur.`;

          let finalReply = "";
          try {
            finalReply = await fetchFromUpstream(cfg.arbiter, [{ role: "user", content: judgePrompt }]);
          } catch (_) {
            const validReplies = Object.values(perspectives).filter(t => !t.startsWith("(Engine timeout"));
            finalReply = validReplies[0] || Object.values(perspectives)[0] || "Gagal menyusun konsensus.";
          }

          return json({ success: true, model: cfg.name, reply: finalReply, perspectives });
        }

        // 2. ROUND ROBIN
        if (enableRoundRobin) {
          const pool = TIER_POOLS[tier] || TIER_POOLS.ULTRA;
          const idx = (rrIndex[tier] || 0) % pool.length;
          rrIndex[tier] = idx + 1;
          model = pool[idx];
        }

        // 3. SINGLE MODEL + OPTIONAL FALLBACK
        const pool = TIER_POOLS[tier] || TIER_POOLS.ULTRA;
        const candidates = enableFallback ? [model, ...pool.filter(m => m !== model)] : [model];

        let lastErr = "";
        for (const cand of candidates) {
          try {
            const reply = await fetchFromUpstream(cand, messages);
            const failoverNote = (cand !== model) ? `[Smart Fallback: ${model} dialihkan ke ${cand}]\n\n` : "";
            return json({
              success: true,
              model: cand,
              reply: failoverNote + reply
            });
          } catch (e: any) {
            lastErr = e.message;
          }
        }

        return json({
          success: false,
          model,
          error: enableFallback ? `Semua cadangan tier ${tier} gagal: ${lastErr}` : `Model ${model} gagal: ${lastErr}`
        }, 502);

      } catch (err: any) {
        return json({ success: false, error: err.message }, 500);
      }
    }

    return json({ message: "X AWD Gateway Online" });
  }
};
