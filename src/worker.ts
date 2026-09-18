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

// Master 118 Model Terverifikasi Aktif
const RAW_118_MODELS: string[] = [
  "Atria-Dawn-Preview/Atria-Dawn-Preview",
  "Oc-uni/gpt-6-astra",
  "Oc-full/cx/gpt-6-astra",
  "Oc-full/cc/claude-opus-5",
  "Oc-full/cc/claude-opus-4-8",
  "Oc-full/cc/claude-opus-4-7",
  "Oc-full/cc/claude-opus-4-6",
  "ag/claude-opus-4-6-thinking",
  "Oc-uni/claude-opus-4-8",
  "Oc-uni/claude-opus-4-7",
  "Oc-uni/claude-opus-4-6",
  "Oc-full/xai/grok-4.6",
  "Oc-full/qwen/qwen3.8-max",
  "cx/gpt-5.6-terra",
  "cx/gpt-5.6-terra-review",
  "ag/claude-sonnet-4-6",
  "Oc-full/cc/claude-sonnet-5",
  "Oc-full/cc/claude-sonnet-4-6",
  "ag/gemini-3.8-flash-high",
  "ag/gemini-3.7-flash-high",
  "ag/gemini-3.6-flash-high",
  "Oc-full/ag/gemini-3.7-flash-high",
  "Oc-full/ag/gemini-3.6-flash-high",
  "Oc-uni/deepseek/deepseek-v4-pro",
  "Oc-full/ds/deepseek-v4-pro",
  "Oc-full/glm/glm-5.3",
  "Oc-full/glm/glm-5.3-flash",
  "Oc-full/qwen/qwen3.7-max",
  "Oc-full/am/nemotron-3-ultra-550b-a55b",
  "ag/gpt-oss-120b-medium",
  "Oc-full/ag/gpt-oss-120b-medium",
  "Oc-full/xai/grok-4.5",
  "Oc-full/xai/grok-4.20-0309-reasoning",
  "Oc-full/xai/grok-4.20-multi-agent-0309",
  "Oc-full/cx/gpt-5.6-sol",
  "Oc-uni/gpt-5.6-sol",
  "cx/gpt-5.6-luna",
  "cx/gpt-5.6-luna-review",
  "cx/gpt-5.5",
  "cx/gpt-5.5-review",
  "Oc-full/cx/gpt-5.6-luna",
  "Oc-full/cx/gpt-5.5",
  "Oc-uni/gpt-5.5",
  "ag/gemini-3.8-flash-medium",
  "ag/gemini-3.8-flash",
  "ag/gemini-3.7-flash-medium",
  "ag/gemini-3.6-flash-medium",
  "gemini/gemini-3.8-flash",
  "gemini/gemini-3.7-flash",
  "gemini/gemini-3.6-flash",
  "ag/gemini-3-flash-agent",
  "ag/gemini-pro-agent",
  "Oc-full/glm/glm-5.2",
  "Oc-full/glm/glm-5.1",
  "Oc-full/glm/glm-5",
  "Oc-full/glm/glm-4.7",
  "Oc-full/glm/glm-4.6v",
  "Oc-uni/z-ai/glm-5.1",
  "Oc-full/ds/deepseek-v4-flash",
  "Oc-uni/deepseek/deepseek-v4-flash",
  "Oc-full/xai/grok-4.3",
  "Oc-uni/x-ai/grok-4.3",
  "Oc-full/xai/grok-build-0.1",
  "gh/copilot-search-a",
  "gh/copilot-search-b",
  "gh/copilot-search-c",
  "gh/exec-agent-a",
  "gh/exec-agent-b",
  "gh/exec-agent-c",
  "gh/gpt-4.1-2025-04-14",
  "gh/gpt-4.1",
  "gh/gpt-4o",
  "gh/gpt-4o-2024-11-20",
  "gh/gpt-4o-2024-08-06",
  "gh/gpt-4o-2024-05-13",
  "gh/gpt-4-o-preview",
  "Oc-full/am/nemotron-3-super-120b-a12b",
  "Oc-full/am/nemotron-3.5-lightning-30b-a3b",
  "Oc-full/am/laguna-xs-2.1",
  "Oc-full/am/llama-3.2-11b-vision-instruct",
  "Oc-full/am/nemotron-3-nano-omni-30b-a3b-reasoning",
  "Oc-full/am/diffusiongemma-26b-a4b-it",
  "Oc-full/am/gpt-oss-20b",
  "Oc-full/cx/gpt-image-2",
  "Oc-full/ag/gemini-3.1-flash-image",
  "Oc-uni/google/gemini-3-pro-image",
  "ag/gemini-3.8-flash-low",
  "ag/gemini-3.7-flash-low",
  "ag/gemini-3.6-flash-low",
  "ag/gemini-3.5-flash-low",
  "ag/gemini-3.5-flash-extra-low",
  "ag/gemini-3.1-pro-low",
  "ag/gemini-3-flash",
  "gemini/gemini-3.5-flash-lite",
  "gemini/gemini-3.1-flash-lite-preview",
  "gemini/gemini-3-flash-preview",
  "Oc-full/ag/gemini-3.7-flash-medium",
  "Oc-full/ag/gemini-3.7-flash-low",
  "Oc-full/ag/gemini-3.6-flash-medium",
  "Oc-full/ag/gemini-2.5-flash",
  "Oc-full/ag/gemini-2.5-flash-lite",
  "Oc-full/ag/gemini-3.1-flash-lite-preview",
  "Oc-uni/google/gemini-3.5-flash",
  "Oc-uni/google/gemini-3.1-pro-preview",
  "Oc-uni/google/gemini-3.1-flash-lite",
  "gh/gpt-4o-mini-2024-07-18",
  "gh/gpt-4o-mini",
  "gh/gpt-3.5-turbo-0613",
  "Oc-full/cc/claude-haiku-4-5-20251001",
  "Oc-uni/claude-haiku-4-5-20251001",
  "Oc-full/am/riva-translate-4b-instruct-v2",
  "Oc-full/am/nemotron-3.5-content-safety",
  "Oc-full/am/free",
  "Coba"
];

function classifyModel(id: string) {
  const lower = id.toLowerCase();
  let tier: "ULTRA" | "HIGH" | "MEDIUM" | "LOW" | "FREE" = "MEDIUM";
  let tierWeight = 2;
  let task = "chat";
  let supportsVision = false;

  if (lower.includes("free") || lower.includes("coba") || lower.includes("3.5-turbo")) {
    tier = "FREE";
    tierWeight = 0;
  } else if (lower.includes("dawn") || lower.includes("astra") || lower.includes("opus") || lower.includes("grok-4.6") || lower.includes("qwen3.8-max")) {
    tier = "ULTRA";
    tierWeight = 4;
  } else if (lower.includes("terra") || lower.includes("sonnet") || lower.includes("pro") || lower.includes("high") || lower.includes("thinking") || lower.includes("glm-5.3") || lower.includes("nemotron-3-ultra")) {
    tier = "HIGH";
    tierWeight = 3;
  } else if (lower.includes("mini") || lower.includes("low") || lower.includes("lite") || lower.includes("extra-low") || lower.includes("haiku")) {
    tier = "LOW";
    tierWeight = 1;
  }

  if (lower.includes("image") || lower.includes("vision") || lower.includes("4.6v")) {
    task = "vision";
    supportsVision = true;
  } else if (lower.includes("terra") || lower.includes("build") || lower.includes("spark") || lower.includes("exec-agent")) {
    task = "code";
  } else if (lower.includes("copilot-search") || lower.includes("agent") || lower.includes("reasoning") || lower.includes("thinking")) {
    task = "reasoning";
  }

  let displayName = id;
  if (id.includes("/")) {
    const parts = id.split("/");
    displayName = parts[parts.length - 1];
  }

  return {
    id,
    name: displayName,
    provider: id.includes("/") ? id.split("/")[0] : "9router",
    tier,
    tierWeight,
    task,
    supportsVision,
    isCombine: false
  };
}

const TIER_POOLS: Record<string, string[]> = {
  ULTRA: [
    "Oc-uni/gpt-6-astra",
    "Atria-Dawn-Preview/Atria-Dawn-Preview",
    "Oc-full/cc/claude-opus-5",
    "Oc-full/xai/grok-4.6",
    "Oc-full/qwen/qwen3.8-max"
  ],
  HIGH: [
    "ag/claude-sonnet-4-6",
    "cx/gpt-5.6-terra",
    "ag/gemini-3.8-flash-high",
    "Oc-uni/deepseek/deepseek-v4-pro",
    "Oc-full/glm/glm-5.3"
  ],
  MEDIUM: [
    "cx/gpt-5.6-luna",
    "ag/gemini-3.8-flash-medium",
    "gh/gpt-4o",
    "Oc-full/ds/deepseek-v4-flash",
    "Oc-full/glm/glm-5.2"
  ],
  LOW: [
    "ag/gemini-3.8-flash-low",
    "gh/gpt-4o-mini",
    "gemini/gemini-3.5-flash-lite",
    "Oc-uni/claude-haiku-4-5-20251001"
  ],
  FREE: [
    "Oc-full/am/free",
    "Coba",
    "gh/gpt-3.5-turbo-0613"
  ]
};

const COMBO_PRESETS: Record<string, { name: string; engines: string[]; arbiter: string }> = {
  epic: {
    name: "Epic Frontier Trio",
    engines: ["Atria-Dawn-Preview/Atria-Dawn-Preview", "Oc-uni/gpt-6-astra", "ag/claude-sonnet-4-6"],
    arbiter: "ag/claude-sonnet-4-6"
  },
  ultra: {
    name: "Ultra Apex Consensus",
    engines: ["Oc-full/xai/grok-4.6", "Oc-uni/gpt-6-astra", "Oc-full/cc/claude-opus-5"],
    arbiter: "Oc-uni/gpt-6-astra"
  },
  high: {
    name: "High Logic & Code",
    engines: ["cx/gpt-5.6-terra", "ag/claude-sonnet-4-6", "Oc-uni/deepseek/deepseek-v4-pro"],
    arbiter: "ag/claude-sonnet-4-6"
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

const rrIndices: Record<string, number> = { ULTRA: 0, HIGH: 0, MEDIUM: 0, LOW: 0, FREE: 0 };

function getNextRoundRobin(tier: string): string {
  const pool = TIER_POOLS[tier] || TIER_POOLS.MEDIUM;
  const idx = (rrIndices[tier] || 0) % pool.length;
  rrIndices[tier] = idx + 1;
  return pool[idx];
}

function parseStreamOrJson(rawText: string): string {
  if (!rawText) return "";
  const trimmed = rawText.trim();
  try {
    const data = JSON.parse(trimmed);
    const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.delta?.content;
    if (content) return content;
  } catch (_) {}

  let combined = "";
  const lines = trimmed.split(/\r?\n/);
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
      body: JSON.stringify({ model: modelName, messages, temperature: 0.7, stream: false }),
      signal: controller.signal
    });
    clearTimeout(timer);

    const raw = await res.text();
    const parsed = parseStreamOrJson(raw);
    if (res.ok && parsed) return { ok: true, content: parsed };
  } catch (_) {}
  return { ok: false, content: "" };
}

async function executeComboPreset(presetKey: string, messages: any[]) {
  const cfg = COMBO_PRESETS[presetKey] || COMBO_PRESETS.epic;
  const promptUser = typeof messages[messages.length - 1]?.content === "string"
    ? messages[messages.length - 1]?.content
    : JSON.stringify(messages[messages.length - 1]?.content || "");

  const results = await Promise.all(cfg.engines.map(engineId => callStrictEngine(messages, engineId, 45000)));

  const perspectives: Record<string, string> = {};
  cfg.engines.forEach((engineId, idx) => {
    perspectives[engineId] = results[idx].ok ? results[idx].content : "(Upstream sibuk / antrean penuh)";
  });

  const judgePrompt = `Anda Arbiter Konsensus Cerdas (${cfg.name}).
Pertanyaan: "${promptUser}"

Berikut draf perspektif dari para engine:
${cfg.engines.map((id, idx) => `[${id}]:${results[idx].content || "Tidak merespons"}`).join("\n\n")}

Buat sintesis final jawaban yang utuh, mendalam, presisi, dan terstruktur.`;

  const arbiterRes = await callStrictEngine([{ role: "user", content: judgePrompt }], cfg.arbiter, 50000);

  return {
    name: cfg.name,
    reply: arbiterRes.ok ? arbiterRes.content : (results.find(r => r.ok)?.content || "Gagal merumuskan konsensus."),
    perspectives
  };
}

async function attemptStream(model: string, messages: any[], timeoutMs = 25000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${TARGET_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PRIMARY_KEY}`
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, stream: true }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok && res.body) return res;
  } catch (_) {}
  return null;
}

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    // Endpoint /api/models: Mengirim 118 model terklasifikasi ke UI
    if (url.pathname === "/api/models" && request.method === "GET") {
      try {
        let modelIds = RAW_118_MODELS;
        try {
          const upstreamRes = await fetch(`${TARGET_BASE}/models`, {
            headers: { "Authorization": `Bearer ${PRIMARY_KEY}` }
          });
          if (upstreamRes.ok) {
            const data: any = await upstreamRes.json();
            const rawList = data.data || data || [];
            const fetched = rawList.map((m: any) => m.id || m).filter(Boolean);
            if (Array.isArray(fetched) && fetched.length >= 50) modelIds = fetched;
          }
        } catch (_) {}

        const classifiedList = modelIds.map(classifyModel);
        return json({ success: true, count: classifiedList.length, data: classifiedList });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 500);
      }
    }

    // Endpoint Chat Execution (Multimodal, Streaming, Controlled Fallback)
    if (url.pathname === "/api/playground/execute" && request.method === "POST") {
      try {
        const body: any = await request.json();
        const isCombo = Boolean(body.isCombo);
        const comboPreset = body.comboPreset || "epic";
        const enableRoundRobin = Boolean(body.enableRoundRobin);
        const enableFallback = Boolean(body.enableFallback);
        const selectedTier = body.tier || "ULTRA";
        let targetModel = (body.model || "Oc-uni/gpt-6-astra").trim();
        const incomingMessages = Array.isArray(body.messages) && body.messages.length > 0
          ? body.messages
          : [{ role: "user", content: body.prompt || "" }];

        // 1. Eksekusi Mode Combo
        if (isCombo) {
          const comboRes = await executeComboPreset(comboPreset, incomingMessages);
          return json({
            success: true,
            model: comboRes.name,
            reply: comboRes.reply,
            perspectives: comboRes.perspectives
          });
        }

        // 2. Eksekusi Mode Single Model
        if (enableRoundRobin) {
          targetModel = getNextRoundRobin(selectedTier);
        }

        const modelMeta = classifyModel(targetModel);
        const currentTier = modelMeta.tier;
        const pool = TIER_POOLS[currentTier] || TIER_POOLS.MEDIUM;
        const candidates = enableFallback
          ? [targetModel, ...pool.filter(m => m !== targetModel)]
          : [targetModel];

        let activeStreamRes: Response | null = null;
        let successfulModel = targetModel;
        let failoverNote = "";

        for (const candidate of candidates) {
          activeStreamRes = await attemptStream(candidate, incomingMessages, 25000);
          if (activeStreamRes) {
            successfulModel = candidate;
            if (candidate !== targetModel) {
              failoverNote = `[Smart Fallback: ${targetModel} antre -> dialihkan ke ${candidate} (${currentTier})]\n\n`;
            }
            break;
          }
        }

        if (!activeStreamRes || !activeStreamRes.body) {
          return json({
            success: false,
            model: targetModel,
            error: enableFallback
              ? `Semua model di tier ${currentTier} sedang penuh antrean.`
              : `Upstream '${targetModel}' tidak merespons (Smart Fallback OFF).`
          }, 502);
        }

        const transformStream = new TransformStream({
          start(controller) {
            if (failoverNote) {
              const metaChunk = { choices: [{ delta: { content: failoverNote } }] };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(metaChunk)}\n\n`));
            }
          }
        });

        const pipedBody = activeStreamRes.body.pipeThrough(transformStream);
        return new Response(pipedBody, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Model-Used": successfulModel,
            ...corsHeaders()
          }
        });
      } catch (err: any) {
        return json({ success: false, error: err.message }, 500);
      }
    }

    return json({ message: "X AWD Major Facelift Gateway Online" });
  }
};
