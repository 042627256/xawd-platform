import React, { useState, useRef, useEffect, useMemo } from 'react';
import staticModelList from './data/models.json';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  tier: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: string;
  perspectives?: Record<string, string>;
}

export default function RootRouter() {
  const [subdomain, setSubdomain] = useState<string>("landing");

  useEffect(() => {
    const host = window.location.hostname.toLowerCase();
    if (host.startsWith("app.") || window.location.search.includes("view=app")) {
      setSubdomain("app");
    } else if (host.startsWith("dash.") || window.location.search.includes("view=dash")) {
      setSubdomain("dash");
    } else {
      setSubdomain("landing");
    }
  }, []);

  if (subdomain === "landing") return <LandingPageView />;
  if (subdomain === "dash") return <DashboardView />;
  return <ChatAppView />;
}

function LandingPageView() {
  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f9fafb", overflowY: "auto", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(11,15,25,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>X</div>
          <span style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.5px" }}>X AWD</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <a href="https://dash.xawd.my.id" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>Dashboard</a>
          <a href="https://app.xawd.my.id" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", padding: "8px 18px", borderRadius: "12px", textDecoration: "none", fontSize: "14px", fontWeight: 700, boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
            Buka Studio →
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "80px 20px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "30px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", color: "#c7d2fe", fontSize: "13px", fontWeight: 600, marginBottom: "28px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 10px #6366f1" }}></span>
          X AWD Autonomous Neural Intelligence Architecture
        </div>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1.5px", marginBottom: "20px" }}>
          Automate Everything with <br />
          <span style={{ background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            X AWD Neural Agents
          </span>
        </h1>
        <p style={{ fontSize: "18px", color: "#9ca3af", maxWidth: "680px", margin: "0 auto 36px", lineHeight: 1.6 }}>
          Platform komputasi AI cerdas generasi baru dengan 118 model lintas tier, arsitektur consensus engine isolated, dan failover otomatis tanpa hambatan.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "60px" }}>
          <a href="https://app.xawd.my.id" style={{ padding: "14px 32px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, textDecoration: "none", fontSize: "15px", boxShadow: "0 6px 20px rgba(99,102,241,0.45)" }}>
            Buka Chat Studio (app.xawd.my.id)
          </a>
          <a href="https://dash.xawd.my.id" style={{ padding: "14px 28px", borderRadius: "16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#f3f4f6", fontWeight: 600, textDecoration: "none", fontSize: "15px" }}>
            Buka Dashboard (dash.xawd.my.id)
          </a>
        </div>

        <div style={{ borderRadius: "24px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(17,24,39,0.7)", padding: "24px", boxShadow: "0 24px 60px rgba(0,0,0,0.8)", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></span>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }}></span>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></span>
            </div>
            <span style={{ fontSize: "12px", color: "#9ca3af", fontFamily: "monospace" }}>X AWD Dashboard ◆ dash.xawd.my.id</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div style={{ background: "#030712", padding: "18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "#9ca3af", fontSize: "12px", fontWeight: 600 }}>Active Multi-Models</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>118 Model</div>
              <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px" }}>● Terpetakan ke 5 Tier</div>
            </div>
            <div style={{ background: "#030712", padding: "18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "#9ca3af", fontSize: "12px", fontWeight: 600 }}>Konsensus Trio</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>Epic / Ultra / High</div>
              <div style={{ fontSize: "11px", color: "#38bdf8", marginTop: "4px" }}>Engine Terisolasi Mandiri</div>
            </div>
            <div style={{ background: "#030712", padding: "18px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ color: "#9ca3af", fontSize: "12px", fontWeight: 600 }}>Penyimpanan Sesi</div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginTop: "4px" }}>Persistent</div>
              <div style={{ fontSize: "11px", color: "#a855f7", marginTop: "4px" }}>AGENTS.md &amp; Ekspor Otomatis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "#f9fafb", padding: "24px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: 800 }}>X AWD Platform Operations</h2>
            <p style={{ color: "#9ca3af", fontSize: "14px" }}>Pemantauan telemetri cluster &amp; kesehatan 118 model</p>
          </div>
          <a href="https://app.xawd.my.id" style={{ background: "#4f46e5", color: "#fff", padding: "10px 20px", borderRadius: "12px", textDecoration: "none", fontWeight: 700, fontSize: "13px" }}>
            Buka Chat Studio →
          </a>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "20px" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>Router Upstream</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#10b981", margin: "8px 0" }}>● Operational</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>9rxawd Gateway Aktif &amp; Siap</div>
          </div>
          <div style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "20px" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>Mode Combo Konsensus</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#facc15", margin: "8px 0" }}>Isolated Trios</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Epic Frontier, Ultra Apex, High Logic, Med, Low</div>
          </div>
          <div style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", borderRadius: "20px" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>Konfigurasi Agen</div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "#818cf8", margin: "8px 0" }}>LocalStorage + MD</div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Mendukung berkas AGENTS.md permanen</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatAppView() {
  const [models, setModels] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>("ag/gemini-3.8-flash-high");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  const [isComboActive, setIsComboActive] = useState(false);
  const [comboPreset, setComboPreset] = useState("epic");
  const [enableFallback, setEnableFallback] = useState(true);
  const [enableRoundRobin, setEnableRoundRobin] = useState(false);

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState<string>(() => {
    return localStorage.getItem("xawd_agent_instructions") || "";
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("xawd_chat_history");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (Array.isArray(p) && p.length > 0) return p;
      } catch (_) {}
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "X AWD Neural Workspace aktif di app.xawd.my.id. 118 model siap digunakan, mode Combo Trio terisolasi, dan instruksi persona agen aktif.",
        model: "X AWD Core",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentFileRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("xawd_chat_history", JSON.stringify(messages));
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExecuting]);

  useEffect(() => {
    fetch("/api/models")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setModels(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
      const matchTier = selectedTier === "ALL" || m.tier === selectedTier;
      return matchSearch && matchTier;
    });
  }, [models, search, selectedTier]);

  const activeModel = useMemo(() => {
    return models.find(m => m.id === selectedModel) || {
      id: selectedModel,
      name: selectedModel.split("/").pop() || selectedModel,
      tier: "HIGH"
    };
  }, [models, selectedModel]);

  const handleSaveInstructions = () => {
    localStorage.setItem("xawd_agent_instructions", agentInstructions);
    setIsAgentModalOpen(false);
  };

  const handleLoadAgentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const c = reader.result as string;
      setAgentInstructions(c);
      localStorage.setItem("xawd_agent_instructions", c);
    };
    reader.readAsText(file);
  };

  const handleExportChatMarkdown = () => {
    const md = messages.map(m => `### ${m.role === 'user' ? 'Operator' : (m.model || 'X AWD')} (${m.timestamp})\n${m.content}\n`).join("\n---\n\n");
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `X_AWD_Chat_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePasteClipboard = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setAttachedImage(reader.result as string);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleSend = async () => {
    if ((!inputPrompt.trim() && !attachedImage) || isExecuting) return;

    const userText = inputPrompt.trim();
    setInputPrompt("");
    const currentImg = attachedImage;
    setAttachedImage(null);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText + (currentImg ? " [Screenshot Terlampir]" : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsExecuting(true);

    try {
      const payloadMessages: any[] = [];
      if (agentInstructions.trim()) {
        payloadMessages.push({ role: "system", content: agentInstructions.trim() });
      }
      messages.forEach(m => {
        payloadMessages.push({ role: m.role, content: m.content });
      });

      let newMsgContent: any = userText;
      if (currentImg) {
        newMsgContent = [
          { type: "text", text: userText || "Analisis gambar ini:" },
          { type: "image_url", image_url: { url: currentImg } }
        ];
      }
      payloadMessages.push({ role: "user", content: newMsgContent });

      const res = await fetch("/api/playground/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          prompt: userText,
          model: selectedModel,
          isCombo: isComboActive,
          comboPreset,
          enableFallback,
          enableRoundRobin,
          tier: activeModel.tier || "ULTRA"
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = { success: false, error: rawText.slice(0, 200) || "Gateway output invalid" };
      }

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply || "Respons kosong diterima.",
            model: data.model || activeModel.name,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            perspectives: data.perspectives
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `Engine Error: ${data.error || "Gagal menghubungi gateway"}`,
            model: "System",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Koneksi gateway terputus: ${err.message}`,
          model: "Error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100dvh", display: "flex", justifyContent: "center", background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15) 0%, rgba(3,7,18,0.98) 75%)", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "960px", height: "100%", display: "flex", flexDirection: "column", background: "rgba(11,15,25,0.75)", backdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
        
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "rgba(17,24,39,0.85)", borderBottom: "1px solid rgba(255,255,255,0.08)", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>X</div>
            <div>
              <span style={{ fontWeight: 800, fontSize: "15px", color: "#fff" }}>X AWD Studio</span>
              <span style={{ fontSize: "10px", color: "#818cf8", display: "block", fontWeight: 600 }}>app.xawd.my.id</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setIsComboActive(!isComboActive)} style={{ background: isComboActive ? "linear-gradient(135deg, #eab308, #f59e0b)" : "rgba(255,255,255,0.05)", color: isComboActive ? "#000" : "#facc15", border: "1px solid rgba(234,179,8,0.4)", borderRadius: "12px", padding: "6px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
              ⚡ {isComboActive ? "Combo ON" : "Combo"}
            </button>
            <button onClick={() => setIsAgentModalOpen(true)} style={{ background: agentInstructions ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              🤖 Agent {agentInstructions ? "✓" : ""}
            </button>
            {!isComboActive && (
              <button onClick={() => setIsDropdownOpen(true)} style={{ background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, cursor: "pointer", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeModel.name}
              </button>
            )}
            <button onClick={handleExportChatMarkdown} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", borderRadius: "12px", padding: "6px 10px", cursor: "pointer" }}>💾</button>
            <button onClick={() => { if(confirm("Bersihkan percakapan sesi ini?")) { setMessages([messages[0]]); localStorage.removeItem("xawd_chat_history"); } }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", borderRadius: "12px", padding: "6px 10px", cursor: "pointer" }}>+ New</button>
          </div>
        </header>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px", background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "12px", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", color: enableFallback ? "#818cf8" : "#9ca3af", fontWeight: 600 }}>
              <input type="checkbox" checked={enableFallback} onChange={e => setEnableFallback(e.target.checked)} style={{ accentColor: "#6366f1" }} />
              <span>Fallback {enableFallback ? "(ON)" : "(OFF)"}</span>
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", color: enableRoundRobin ? "#38bdf8" : "#9ca3af", fontWeight: 600 }}>
              <input type="checkbox" checked={enableRoundRobin} onChange={e => setEnableRoundRobin(e.target.checked)} style={{ accentColor: "#38bdf8" }} />
              <span>Round Robin</span>
            </label>
          </div>

          {isComboActive && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#facc15", fontWeight: 700 }}>Preset:</span>
              <select value={comboPreset} onChange={e => setComboPreset(e.target.value)} style={{ background: "#1e1b4b", color: "#facc15", border: "1px solid #ca8a04", borderRadius: "8px", padding: "4px 8px", fontSize: "11.5px", fontWeight: "bold", outline: "none" }}>
                <option value="epic">⚡ Epic Frontier (Astra/Dawn/Sonnet)</option>
                <option value="ultra">⚡ Ultra Apex (Grok/Opus/Qwen)</option>
                <option value="high">⚡ High Logic (Terra/Gemini/DeepSeek)</option>
                <option value="medium">⚡ Medium Balanced (Luna/Gemini/GPT-4o)</option>
                <option value="low">⚡ Low Speed (Lite/Mini/Haiku)</option>
              </select>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px", display: "flex", flexDirection: "column", gap: "14px", minHeight: 0 }}>
          {agentInstructions && (
            <div style={{ padding: "8px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "12px", fontSize: "12px", color: "#c7d2fe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🤖 <strong>Instruksi Agen Aktif:</strong> Persona sistem disuntikkan ke setiap giliran prompt.</span>
              <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setIsAgentModalOpen(true)}>Edit</span>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display: "flex", width: "100%", justifyContent: msg.role === 'user' ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "86%", padding: "14px 18px", borderRadius: "20px", fontSize: "14.5px", lineHeight: 1.6, wordBreak: "break-word", background: msg.role === 'user' ? "linear-gradient(135deg, #4f46e5, #6366f1)" : "rgba(17,24,39,0.85)", border: msg.role === 'user' ? "none" : "1px solid rgba(255,255,255,0.08)", color: "#f3f4f6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#9ca3af", marginBottom: "6px", gap: "12px" }}>
                  <span style={{ fontWeight: 700 }}>{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>

                {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
                  <details style={{ marginTop: "10px", padding: "8px 12px", background: "rgba(3,7,18,0.7)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "10px", fontSize: "12px" }}>
                    <summary style={{ cursor: "pointer", fontWeight: 700, color: "#facc15" }}>Lihat Perspektif 3 Engine Konsensus</summary>
                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {Object.entries(msg.perspectives).map(([eng, text]) => (
                        <div key={eng} style={{ padding: "8px", borderRadius: "6px", background: "rgba(31,41,55,0.5)" }}>
                          <div style={{ color: "#818cf8", fontWeight: 700 }}>{eng}</div>
                          <div style={{ color: "#d1d5db" }}>{text}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {isExecuting && (
            <div style={{ display: "flex", width: "100%", justifyContent: "flex-start" }}>
              <div style={{ padding: "12px 18px", borderRadius: "18px", background: "rgba(17,24,39,0.85)", border: "1px solid rgba(255,255,255,0.08)", color: "#9ca3af", fontSize: "13px" }}>
                X AWD neural engine sedang merumuskan respons cerdas...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {attachedImage && (
          <div style={{ padding: "8px 18px", background: "rgba(15,23,42,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={attachedImage} alt="Attachment" style={{ width: "38px", height: "38px", borderRadius: "8px", objectFit: "cover", border: "1px solid #10b981" }} />
              <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>Screenshot clipboard terlampir</span>
            </div>
            <button onClick={() => setAttachedImage(null)} style={{ background: "none", border: "none", color: "#f87171", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>✕ Hapus</button>
          </div>
        )}

        <footer style={{ padding: "12px 18px 16px", background: "rgba(17,24,39,0.9)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <button onClick={() => setIsAttachOpen(true)} style={{ width: "48px", height: "48px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(31,41,55,0.7)", color: "#e5e7eb", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              {attachedImage ? "✓" : "+"}
            </button>

            <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setAttachedImage(r.result as string); r.readAsDataURL(f); } }} accept="image/*" style={{ display: "none" }} />

            <textarea
              rows={2}
              placeholder={isComboActive ? "Ketik prompt konsensus Combo..." : "Ketik pesan untuk X AWD, atau tempel screenshot langsung..."}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onPaste={handlePasteClipboard}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              style={{ flex: 1, minHeight: "54px", maxHeight: "160px", background: "rgba(3,7,18,0.85)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "18px", padding: "12px 18px", fontSize: "14.5px", fontFamily: "inherit", lineHeight: 1.5, outline: "none", resize: "none" }}
            />

            <button disabled={isExecuting || (!inputPrompt.trim() && !attachedImage)} onClick={handleSend} style={{ width: "48px", height: "48px", borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              ➤
            </button>
          </div>
        </footer>

        {isAgentModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setIsAgentModalOpen(false)}>
            <div style={{ width: "100%", maxWidth: "560px", background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "15px" }}>🤖 Persona &amp; Instruksi Agen</span>
                <button onClick={() => setIsAgentModalOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "18px", cursor: "pointer" }}>✕</button>
              </div>
              <p style={{ fontSize: "12px", color: "#9ca3af" }}>Instruksi ini akan tersimpan otomatis dan disuntikkan ke model pada setiap prompt. Anda bisa memuat file <code>AGENTS.md</code> atau <code>.txt</code> langsung.</p>

              <input type="file" ref={agentFileRef} onChange={handleLoadAgentFile} accept=".txt,.md" style={{ display: "none" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => agentFileRef.current?.click()} style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  📁 Muat File (.txt / .md)
                </button>
                {agentInstructions && (
                  <button onClick={() => { setAgentInstructions(""); localStorage.removeItem("xawd_agent_instructions"); }} style={{ background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    Reset
                  </button>
                )}
              </div>

              <textarea value={agentInstructions} onChange={e => setAgentInstructions(e.target.value)} style={{ width: "100%", minHeight: "180px", background: "#030712", color: "#f3f4f6", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "12px", fontSize: "13px", fontFamily: "monospace", outline: "none" }} placeholder="Tulis instruksi persona agen di sini..." />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button onClick={() => setIsAgentModalOpen(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e7eb", borderRadius: "10px", padding: "8px 14px", cursor: "pointer" }}>Tutup</button>
                <button onClick={handleSaveInstructions} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: "10px", padding: "8px 18px", fontWeight: 700, cursor: "pointer" }}>Simpan Instruksi</button>
              </div>
            </div>
          </div>
        )}

        {isDropdownOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setIsDropdownOpen(false)}>
            <div style={{ width: "100%", maxWidth: "540px", maxHeight: "80vh", background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "15px" }}>Pilih Model AI (118 Model)</span>
                <button onClick={() => setIsDropdownOpen(false)} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "18px", cursor: "pointer" }}>✕</button>
              </div>

              <input type="text" placeholder="Cari model..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#030712", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", outline: "none", fontSize: "13px" }} autoFocus />

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                  <button key={t} onClick={() => setSelectedTier(t)} style={{ background: selectedTier === t ? "#4f46e5" : "rgba(255,255,255,0.05)", color: selectedTier === t ? "#fff" : "#9ca3af", border: "none", borderRadius: "10px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                    {t}
                  </button>
                ))}
              </div>

              <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredModels.map(m => (
                  <div key={m.id} onClick={() => { setSelectedModel(m.id); setIsDropdownOpen(false); }} style={{ padding: "10px 14px", borderRadius: "12px", cursor: "pointer", background: selectedModel === m.id ? "rgba(99,102,241,0.2)" : "rgba(3,7,18,0.6)", border: selectedModel === m.id ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>{m.name}</div>
                      <div style={{ fontSize: "10.5px", color: "#9ca3af" }}>{m.id}</div>
                    </div>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.1)", color: "#f3f4f6", fontWeight: 700 }}>{m.tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isAttachOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(3,7,18,0.75)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setIsAttachOpen(false)}>
            <div style={{ width: "100%", maxWidth: "600px", background: "#0f172a", borderTopLeftRadius: "28px", borderTopRightRadius: "28px", padding: "18px 22px 30px", borderTop: "1px solid rgba(255,255,255,0.12)" }} onClick={e => e.stopPropagation()}>
              <div style={{ width: "40px", height: "4px", background: "#4b5563", borderRadius: "2px", margin: "0 auto 16px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
                {[
                  { name: "Kamera", icon: "📷" },
                  { name: "Gambar", icon: "🖼️" },
                  { name: "Files", icon: "📁" },
                  { name: "Drive", icon: "☁️" }
                ].map(item => (
                  <button key={item.name} type="button" onClick={() => { setIsAttachOpen(false); fileInputRef.current?.click(); }} style={{ background: "#030712", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "14px", padding: "12px 6px", color: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { name: "Chat", desc: "Mode dialog terstruktur & instruksi", icon: "💬" },
                  { name: "Voices", desc: "Sintesis audio & suara percakapan", icon: "🎙️" },
                  { name: "Video", desc: "Analisis frame visual dinamis", icon: "🎥" },
                  { name: "Canvas", desc: "Workspace interaktif kode & dokumen", icon: "🎨" }
                ].map(f => (
                  <div key={f.name} onClick={() => { setIsAttachOpen(false); setInputPrompt(prev => `[${f.name}] ${prev}`); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "12px", cursor: "pointer", background: "#030712", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "18px" }}>{f.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "13px" }}>{f.name}</div>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
