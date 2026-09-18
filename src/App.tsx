import React, { useState, useEffect, useRef } from "react";

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  tier: "ULTRA" | "HIGH" | "MEDIUM" | "LOW";
  task: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  perspectives?: Record<string, string>;
}

// 118 Model Aktif Terverifikasi
const VERIFIED_MODELS: ModelItem[] = [
  { id: "Atria-Dawn-Preview/Atria-Dawn-Preview", name: "Atria Dawn Preview", provider: "Atria", tier: "ULTRA", task: "chat" },
  { id: "Oc-uni/gpt-6-astra", name: "GPT-6 Astra (Uni)", provider: "OpenAI", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/cx/gpt-6-astra", name: "GPT-6 Astra (Full)", provider: "OpenAI", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/cc/claude-opus-5", name: "Claude Opus 5", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/cc/claude-opus-4-8", name: "Claude Opus 4.8", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/cc/claude-opus-4-7", name: "Claude Opus 4.7", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/cc/claude-opus-4-6", name: "Claude Opus 4.6", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "ag/claude-opus-4-6-thinking", name: "Claude Opus 4.6 Thinking", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-uni/claude-opus-4-8", name: "Claude Opus 4.8 (Uni)", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-uni/claude-opus-4-7", name: "Claude Opus 4.7 (Uni)", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-uni/claude-opus-4-6", name: "Claude Opus 4.6 (Uni)", provider: "Anthropic", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/xai/grok-4.6", name: "Grok 4.6", provider: "xAI", tier: "ULTRA", task: "chat" },
  { id: "Oc-full/qwen/qwen3.8-max", name: "Qwen 3.8 Max", provider: "Alibaba", tier: "ULTRA", task: "chat" },
  { id: "cx/gpt-5.6-terra", name: "GPT-5.6 Terra", provider: "OpenAI", tier: "HIGH", task: "chat" },
  { id: "cx/gpt-5.6-terra-review", name: "GPT-5.6 Terra Review", provider: "OpenAI", tier: "HIGH", task: "chat" },
  { id: "ag/claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", tier: "HIGH", task: "chat" },
  { id: "Oc-full/cc/claude-sonnet-5", name: "Claude Sonnet 5", provider: "Anthropic", tier: "HIGH", task: "chat" },
  { id: "Oc-full/cc/claude-sonnet-4-6", name: "Claude Sonnet 4.6 (Full)", provider: "Anthropic", tier: "HIGH", task: "chat" },
  { id: "ag/gemini-3.8-flash-high", name: "Gemini 3.8 Flash High", provider: "Google", tier: "HIGH", task: "chat" },
  { id: "ag/gemini-3.7-flash-high", name: "Gemini 3.7 Flash High", provider: "Google", tier: "HIGH", task: "chat" },
  { id: "ag/gemini-3.6-flash-high", name: "Gemini 3.6 Flash High", provider: "Google", tier: "HIGH", task: "chat" },
  { id: "Oc-full/ag/gemini-3.7-flash-high", name: "Gemini 3.7 Flash High (Full)", provider: "Google", tier: "HIGH", task: "chat" },
  { id: "Oc-full/ag/gemini-3.6-flash-high", name: "Gemini 3.6 Flash High (Full)", provider: "Google", tier: "HIGH", task: "chat" },
  { id: "Oc-uni/deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro (Uni)", provider: "DeepSeek", tier: "HIGH", task: "chat" },
  { id: "Oc-full/ds/deepseek-v4-pro", name: "DeepSeek V4 Pro", provider: "DeepSeek", tier: "HIGH", task: "chat" },
  { id: "Oc-full/glm/glm-5.3", name: "GLM 5.3", provider: "Zhipu", tier: "HIGH", task: "chat" },
  { id: "Oc-full/glm/glm-5.3-flash", name: "GLM 5.3 Flash", provider: "Zhipu", tier: "HIGH", task: "chat" },
  { id: "Oc-full/qwen/qwen3.7-max", name: "Qwen 3.7 Max", provider: "Alibaba", tier: "HIGH", task: "chat" },
  { id: "Oc-full/am/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B", provider: "NVIDIA", tier: "HIGH", task: "chat" },
  { id: "ag/gpt-oss-120b-medium", name: "GPT-OSS 120B", provider: "OpenAI", tier: "HIGH", task: "chat" },
  { id: "Oc-full/ag/gpt-oss-120b-medium", name: "GPT-OSS 120B (Full)", provider: "OpenAI", tier: "HIGH", task: "chat" },
  { id: "Oc-full/xai/grok-4.5", name: "Grok 4.5", provider: "xAI", tier: "HIGH", task: "chat" },
  { id: "Oc-full/xai/grok-4.20-0309-reasoning", name: "Grok 4.20 Reasoning", provider: "xAI", tier: "HIGH", task: "chat" },
  { id: "Oc-full/xai/grok-4.20-multi-agent-0309", name: "Grok 4.20 Multi-Agent", provider: "xAI", tier: "HIGH", task: "chat" },
  { id: "Oc-full/cx/gpt-5.6-sol", name: "GPT-5.6 Sol", provider: "OpenAI", tier: "HIGH", task: "chat" },
  { id: "Oc-uni/gpt-5.6-sol", name: "GPT-5.6 Sol (Uni)", provider: "OpenAI", tier: "HIGH", task: "chat" },
  { id: "cx/gpt-5.6-luna", name: "GPT-5.6 Luna", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "cx/gpt-5.6-luna-review", name: "GPT-5.6 Luna Review", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "cx/gpt-5.5", name: "GPT-5.5", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "cx/gpt-5.5-review", name: "GPT-5.5 Review", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/cx/gpt-5.6-luna", name: "GPT-5.6 Luna (Full)", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/cx/gpt-5.5", name: "GPT-5.5 (Full)", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-uni/gpt-5.5", name: "GPT-5.5 (Uni)", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-3.8-flash-medium", name: "Gemini 3.8 Flash Medium", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-3.8-flash", name: "Gemini 3.8 Flash", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-3.7-flash-medium", name: "Gemini 3.7 Flash Medium", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-3.6-flash-medium", name: "Gemini 3.6 Flash Medium", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "gemini/gemini-3.8-flash", name: "Gemini 3.8 Flash Native", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "gemini/gemini-3.7-flash", name: "Gemini 3.7 Flash Native", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "gemini/gemini-3.6-flash", name: "Gemini 3.6 Flash Native", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-3-flash-agent", name: "Gemini 3 Flash Agent", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-pro-agent", name: "Gemini Pro Agent", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/glm/glm-5.2", name: "GLM 5.2", provider: "Zhipu", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/glm/glm-5.1", name: "GLM 5.1", provider: "Zhipu", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/glm/glm-5", name: "GLM 5", provider: "Zhipu", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/glm/glm-4.7", name: "GLM 4.7", provider: "Zhipu", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/glm/glm-4.6v", name: "GLM 4.6v", provider: "Zhipu", tier: "MEDIUM", task: "chat" },
  { id: "Oc-uni/z-ai/glm-5.1", name: "GLM 5.1 (Uni)", provider: "Zhipu", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/ds/deepseek-v4-flash", name: "DeepSeek V4 Flash", provider: "DeepSeek", tier: "MEDIUM", task: "chat" },
  { id: "Oc-uni/deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash (Uni)", provider: "DeepSeek", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/xai/grok-4.3", name: "Grok 4.3", provider: "xAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-uni/x-ai/grok-4.3", name: "Grok 4.3 (Uni)", provider: "xAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/xai/grok-build-0.1", name: "Grok Build 0.1", provider: "xAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/copilot-search-a", name: "Copilot Search A", provider: "GitHub", tier: "MEDIUM", task: "chat" },
  { id: "gh/copilot-search-b", name: "Copilot Search B", provider: "GitHub", tier: "MEDIUM", task: "chat" },
  { id: "gh/copilot-search-c", name: "Copilot Search C", provider: "GitHub", tier: "MEDIUM", task: "chat" },
  { id: "gh/exec-agent-a", name: "Exec Agent A", provider: "GitHub", tier: "MEDIUM", task: "chat" },
  { id: "gh/exec-agent-b", name: "Exec Agent B", provider: "GitHub", tier: "MEDIUM", task: "chat" },
  { id: "gh/exec-agent-c", name: "Exec Agent C", provider: "GitHub", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4.1-2025-04-14", name: "GPT-4.1 2025", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4.1", name: "GPT-4.1", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4o", name: "GPT-4o", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4o-2024-11-20", name: "GPT-4o (Nov)", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4o-2024-08-06", name: "GPT-4o (Aug)", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4o-2024-05-13", name: "GPT-4o (May)", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "gh/gpt-4-o-preview", name: "GPT-4o Preview", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/nemotron-3-super-120b-a12b", name: "Nemotron 3 Super 120B", provider: "NVIDIA", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/nemotron-3.5-lightning-30b-a3b", name: "Nemotron 3.5 Lightning", provider: "NVIDIA", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/laguna-xs-2.1", name: "Laguna XS 2.1", provider: "NVIDIA", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/llama-3.2-11b-vision-instruct", name: "Llama 3.2 Vision", provider: "Meta", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/nemotron-3-nano-omni-30b-a3b-reasoning", name: "Nemotron Omni Reasoning", provider: "NVIDIA", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/diffusiongemma-26b-a4b-it", name: "DiffusionGemma 26B", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/am/gpt-oss-20b", name: "GPT-OSS 20B", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/cx/gpt-image-2", name: "GPT Image 2", provider: "OpenAI", tier: "MEDIUM", task: "chat" },
  { id: "Oc-full/ag/gemini-3.1-flash-image", name: "Gemini 3.1 Flash Image", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "Oc-uni/google/gemini-3-pro-image", name: "Gemini 3 Pro Image", provider: "Google", tier: "MEDIUM", task: "chat" },
  { id: "ag/gemini-3.8-flash-low", name: "Gemini 3.8 Flash Low", provider: "Google", tier: "LOW", task: "chat" },
  { id: "ag/gemini-3.7-flash-low", name: "Gemini 3.7 Flash Low", provider: "Google", tier: "LOW", task: "chat" },
  { id: "ag/gemini-3.6-flash-low", name: "Gemini 3.6 Flash Low", provider: "Google", tier: "LOW", task: "chat" },
  { id: "ag/gemini-3.5-flash-low", name: "Gemini 3.5 Flash Low", provider: "Google", tier: "LOW", task: "chat" },
  { id: "ag/gemini-3.5-flash-extra-low", name: "Gemini 3.5 Extra Low", provider: "Google", tier: "LOW", task: "chat" },
  { id: "ag/gemini-3.1-pro-low", name: "Gemini 3.1 Pro Low", provider: "Google", tier: "LOW", task: "chat" },
  { id: "ag/gemini-3-flash", name: "Gemini 3 Flash", provider: "Google", tier: "LOW", task: "chat" },
  { id: "gemini/gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", provider: "Google", tier: "LOW", task: "chat" },
  { id: "gemini/gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Lite Preview", provider: "Google", tier: "LOW", task: "chat" },
  { id: "gemini/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-full/ag/gemini-3.7-flash-medium", name: "Gemini 3.7 Flash Med", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-full/ag/gemini-3.7-flash-low", name: "Gemini 3.7 Flash Low (Full)", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-full/ag/gemini-3.6-flash-medium", name: "Gemini 3.6 Flash Med (Full)", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-full/ag/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-full/ag/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-full/ag/gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-uni/google/gemini-3.5-flash", name: "Gemini 3.5 Flash (Uni)", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-uni/google/gemini-3.1-pro-preview", name: "Gemini 3.1 Pro Preview", provider: "Google", tier: "LOW", task: "chat" },
  { id: "Oc-uni/google/gemini-3.1-flash-lite", name: "Gemini 3.1 Lite (Uni)", provider: "Google", tier: "LOW", task: "chat" },
  { id: "gh/gpt-4o-mini-2024-07-18", name: "GPT-4o Mini 2024", provider: "OpenAI", tier: "LOW", task: "chat" },
  { id: "gh/gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", tier: "LOW", task: "chat" },
  { id: "gh/gpt-3.5-turbo-0613", name: "GPT-3.5 Turbo 0613", provider: "OpenAI", tier: "LOW", task: "chat" },
  { id: "Oc-full/cc/claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "Anthropic", tier: "LOW", task: "chat" },
  { id: "Oc-uni/claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Uni)", provider: "Anthropic", tier: "LOW", task: "chat" },
  { id: "Oc-full/am/riva-translate-4b-instruct-v2", name: "Riva Translate 4B", provider: "NVIDIA", tier: "LOW", task: "chat" },
  { id: "Oc-full/am/nemotron-3.5-content-safety", name: "Nemotron Content Safety", provider: "NVIDIA", tier: "LOW", task: "chat" },
  { id: "Oc-full/am/free", name: "Am Free Tier", provider: "Custom", tier: "LOW", task: "chat" },
  { id: "Coba", name: "Coba Sandbox", provider: "Local", tier: "LOW", task: "chat" }
];

export default function App() {
  const [models] = useState<ModelItem[]>(VERIFIED_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>("Oc-uni/gpt-6-astra");
  const [isCombo, setIsCombo] = useState<boolean>(false);
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Halo! Sistem X AWD siap digunakan. 118 Model terverifikasi aktif dengan respon instan." }
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showModelDrawer, setShowModelDrawer] = useState<boolean>(false);
  const [activeDrawerPerspectives, setActiveDrawerPerspectives] = useState<Record<string, string> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const res = await fetch("https://api.xawd.my.id/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isCombo,
          model: isCombo ? "Combo Epic (Trio)" : selectedModel,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let errMsg = "Upstream gagal merespons.";
        try {
          errMsg = JSON.parse(errText).error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      // Jika Combo Mode, backend mengembalikan JSON berisi konsensus dan perspektif 3 engine
      if (isCombo) {
        const data = await res.json();
        setMessages(prev => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
            next[lastIdx] = {
              role: "assistant",
              content: data.reply || "Gagal memperoleh konsensus.",
              perspectives: data.perspectives
            };
          }
          return next;
        });
        setIsLoading(false);
        return;
      }

      // Single Chat: Baca SSE stream secara langsung
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:") && !trimmed.includes("[DONE]")) {
              try {
                const parsed = JSON.parse(trimmed.replace(/^data:\s*/, ""));
                const token = parsed?.choices?.[0]?.delta?.content || "";
                if (token) {
                  accumulated += token;
                  setMessages(prev => {
                    const next = [...prev];
                    const lastIdx = next.length - 1;
                    if (lastIdx >= 0 && next[lastIdx].role === "assistant") {
                      next[lastIdx] = { role: "assistant", content: accumulated };
                    }
                    return next;
                  });
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant") {
          last.content = `[Error] ${err.message || "Gagal memproses pesan."}`;
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModels = models.filter(m => tierFilter === "ALL" || m.tier === tierFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#0b0f19", color: "#f3f4f6", fontFamily: "sans-serif" }}>
      {/* Header Sticky */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1f2937", backgroundColor: "#111827", zIndex: 10 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#38bdf8" }}>X AWD AI Gateway</h1>
          <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            Mode: {isCombo ? "⚡ Combo Epic (Atria Dawn + GPT-6 Astra + Claude Sonnet 4.6)" : `Model: ${selectedModel}`}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsCombo(!isCombo)}
            style={{
              background: isCombo ? "#10b981" : "#374151",
              color: "#fff",
              border: "none",
              padding: "8px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600
            }}
          >
            {isCombo ? "⚡ Combo Aktif" : "Combo Mode"}
          </button>
          <button
            disabled={isCombo}
            onClick={() => setShowModelDrawer(!showModelDrawer)}
            style={{
              background: isCombo ? "#1f2937" : "#2563eb",
              color: isCombo ? "#6b7280" : "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              cursor: isCombo ? "not-allowed" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 600
            }}
          >
            Model ({models.length})
          </button>
        </div>
      </header>

      {/* Drawer Model */}
      {showModelDrawer && !isCombo && (
        <div style={{ position: "absolute", top: "56px", right: "20px", width: "320px", maxHeight: "80vh", background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", padding: "12px", zIndex: 50, display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {["ALL", "ULTRA", "HIGH", "MEDIUM", "LOW"].map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  background: tierFilter === t ? "#38bdf8" : "#374151",
                  color: tierFilter === t ? "#000" : "#fff",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredModels.map(m => (
              <div
                key={m.id}
                onClick={() => { setSelectedModel(m.id); setShowModelDrawer(false); }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "4px",
                  background: selectedModel === m.id ? "#1d4ed8" : "#111827",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{m.name}</span>
                <span style={{ fontSize: "0.65rem", padding: "2px 4px", borderRadius: "3px", background: "#374151" }}>{m.tier}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drawer Perspektif Combo Engine */}
      {activeDrawerPerspectives && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "420px", maxWidth: "90%", background: "#111827", height: "100%", padding: "20px", overflowY: "auto", borderLeft: "1px solid #374151", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0, color: "#38bdf8" }}>Perspektif Asli Engine</h2>
              <button onClick={() => setActiveDrawerPerspectives(null)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>
            {Object.entries(activeDrawerPerspectives).map(([engine, text]) => (
              <div key={engine} style={{ background: "#1f2937", padding: "12px", borderRadius: "6px", border: "1px solid #374151" }}>
                <h3 style={{ fontSize: "0.85rem", color: "#10b981", margin: "0 0 6px 0" }}>{engine}</h3>
                <p style={{ fontSize: "0.8rem", color: "#d1d5db", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Area Chat */}
      <main style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: msg.role === "user" ? "#2563eb" : "#1f2937",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: "12px",
              lineHeight: 1.5,
              fontSize: "0.95rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
            {msg.content || (isLoading && i === messages.length - 1 ? "Sedang merumuskan jawaban..." : "")}
            {msg.perspectives && (
              <div style={{ marginTop: "10px", borderTop: "1px solid #374151", paddingTop: "8px" }}>
                <button
                  onClick={() => setActiveDrawerPerspectives(msg.perspectives!)}
                  style={{ background: "#374151", color: "#38bdf8", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  🔍 Lihat Transparansi 3 Engine
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </main>

      {/* Input Chat Box Sticky */}
      <footer style={{ padding: "14px 20px", background: "#111827", borderTop: "1px solid #1f2937" }}>
        <form onSubmit={handleSend} style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isCombo ? "Tanyakan pada Trio Combo Frontier..." : `Ketik pesan untuk ${selectedModel}...`}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "0.95rem",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "12px 24px",
              background: isLoading ? "#4b5563" : (isCombo ? "#10b981" : "#38bdf8"),
              color: "#000",
              fontWeight: "bold",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "0.95rem"
            }}
          >
            {isLoading ? "..." : "Kirim"}
          </button>
        </form>
      </footer>
    </div>
  );
}
