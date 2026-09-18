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

export default function App() {
  const [models, setModels] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>("ag/gemini-3.8-flash-high");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");

  const [isComboActive, setIsComboActive] = useState(false);
  const [comboPreset, setComboPreset] = useState("epic");
  const [enableFallback, setEnableFallback] = useState(false);
  const [enableRoundRobin, setEnableRoundRobin] = useState(false);

  // Agent System Instructions
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState<string>(() => {
    return localStorage.getItem("xawd_agent_instructions") || "";
  });

  // Persistent Chat History
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("xawd_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "Sistem X AWD Gateway aktif. Silakan tentukan model, gunakan instruksi agen persona, atau manfaatkan konsensus Combo Engine.",
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
      const content = reader.result as string;
      setAgentInstructions(content);
      localStorage.setItem("xawd_agent_instructions", content);
    };
    reader.readAsText(file);
  };

  const handleExportChatMarkdown = () => {
    const md = messages.map(m => `### ${m.role === 'user' ? 'Anda' : (m.model || 'X AWD')} (${m.timestamp})\n${m.content}\n`).join("\n---\n\n");
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
      content: userText + (currentImg ? " [Lampiran Gambar]" : ""),
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
        data = { success: false, error: rawText.slice(0, 200) || "Gagal membaca balasan" };
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
            content: `Gagal: ${data.error || "Terjadi kendala pada gateway upstream"}`,
            model: "Error",
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
          content: `Koneksi gagal: ${err.message}`,
          model: "Error",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="xawd-viewport">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { width: 100%; height: 100%; background: #090d16; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
        .xawd-viewport { width: 100vw; height: 100dvh; display: flex; justify-content: center; background: #090d16; overflow: hidden; }
        .xawd-shell { width: 100%; max-width: 920px; height: 100%; display: flex; flex-direction: column; background: #0f172a; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; position: relative; }

        /* BRANDING HEADER */
        .top-navbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(15, 23, 42, 0.95); border-bottom: 1px solid #1e293b; z-index: 50; }
        .brand-logo-wrap { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .brand-icon { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; color: #fff; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); }
        .brand-info { display: flex; flex-direction: column; }
        .brand-title { font-weight: 800; font-size: 15px; letter-spacing: 0.5px; background: linear-gradient(90deg, #60a5fa, #93c5fd); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .brand-status { font-size: 10px; color: #10b981; display: flex; align-items: center; gap: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }

        /* ACTION CONTROLS */
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .pill-btn { border: 1px solid #334155; background: #1e293b; color: #cbd5e1; border-radius: 20px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; white-space: nowrap; }
        .pill-btn:hover { background: #334155; color: #fff; }
        .pill-btn.combo { border-color: #eab308; color: #facc15; background: rgba(234, 179, 8, 0.1); }
        .pill-btn.combo.active { background: #eab308; color: #0f172a; box-shadow: 0 0 12px rgba(234, 179, 8, 0.4); }
        .pill-btn.agent-active { border-color: #38bdf8; color: #38bdf8; background: rgba(56, 189, 248, 0.1); }

        /* SECONDARY TOOLBAR */
        .sub-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #0b1120; border-bottom: 1px solid #1e293b; font-size: 12px; flex-wrap: wrap; gap: 8px; }
        .toggle-group { display: flex; align-items: center; gap: 14px; }
        .toggle-switch-lbl { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 12px; font-weight: 600; }
        .toggle-switch-lbl input { accent-color: #3b82f6; width: 14px; height: 14px; cursor: pointer; }
        .preset-select-ctrl { background: #1e293b; color: #facc15; border: 1px solid #ca8a04; border-radius: 8px; padding: 4px 8px; font-size: 11.5px; font-weight: bold; outline: none; }

        /* CHAT AREA */
        .chat-body-scroller { flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column; gap: 14px; min-height: 0; }
        .msg-row { display: flex; width: 100%; }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }
        .bubble-card { max-width: 86%; padding: 13px 17px; border-radius: 18px; font-size: 14.5px; line-height: 1.6; word-break: break-word; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
        .bubble-card.user { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; border-bottom-right-radius: 4px; }
        .bubble-card.assistant { background: #1e293b; border: 1px solid #334155; color: #f1f5f9; border-bottom-left-radius: 4px; }
        .bubble-meta { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-bottom: 6px; gap: 12px; font-weight: 500; }

        /* FOOTER INPUT */
        .chat-footer-bar { padding: 12px 16px; background: #0f172a; border-top: 1px solid #1e293b; }
        .input-box-wrapper { display: flex; align-items: flex-end; gap: 10px; width: 100%; }
        .primary-textarea { flex: 1; min-height: 56px; max-height: 160px; background: #090d16; color: #f8fafc; border: 1px solid #334155; border-radius: 18px; padding: 12px 16px; font-size: 15px; line-height: 1.45; outline: none; resize: none; font-family: inherit; }
        .primary-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        .icon-circle-btn { width: 46px; height: 46px; border-radius: 50%; border: 1px solid #334155; background: #1e293b; color: #f8fafc; font-size: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .send-pill-btn { width: 46px; height: 46px; border-radius: 50%; border: none; background: #2563eb; color: #fff; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .send-pill-btn:disabled { background: #334155; color: #64748b; cursor: not-allowed; }

        /* MODAL */
        .custom-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .custom-modal-box { width: 100%; max-width: 540px; max-height: 85vh; background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 16px 36px rgba(0,0,0,0.5); }
      `}</style>

      <div className="xawd-shell">
        {/* BRANDING TOP NAVBAR */}
        <header className="top-navbar">
          <div className="brand-logo-wrap">
            <div className="brand-icon">X</div>
            <div className="brand-info">
              <span className="brand-title">X AWD Gateway</span>
              <span className="brand-status"><span className="status-dot" /> High-Speed Neural Core</span>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              onClick={() => setIsComboActive(!isComboActive)}
              className={`pill-btn combo ${isComboActive ? 'active' : ''}`}
            >
              ⚡ {isComboActive ? 'Combo ON' : 'Combo'}
            </button>

            <button
              type="button"
              onClick={() => setIsAgentModalOpen(true)}
              className={`pill-btn ${agentInstructions ? 'agent-active' : ''}`}
            >
              🤖 Agent {agentInstructions ? '✓' : ''}
            </button>

            {!isComboActive && (
              <button
                type="button"
                onClick={() => setIsDropdownOpen(true)}
                className="pill-btn"
                style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {activeModel.name}
              </button>
            )}

            <button
              type="button"
              onClick={handleExportChatMarkdown}
              className="pill-btn"
              title="Download Riwayat Chat (.md)"
            >
              💾 Simpan
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm("Mulai obrolan baru dan reset sesi layar?")) {
                  setMessages([messages[0]]);
                  localStorage.removeItem("xawd_chat_history");
                }
              }}
              className="pill-btn"
            >
              + Baru
            </button>
          </div>
        </header>

        {/* SUB TOOLBAR CONTROLS */}
        <div className="sub-toolbar">
          <div className="toggle-group">
            <label className="toggle-switch-lbl" style={{ color: enableFallback ? '#10b981' : '#94a3b8' }}>
              <input
                type="checkbox"
                checked={enableFallback}
                onChange={e => setEnableFallback(e.target.checked)}
              />
              <span>Fallback {enableFallback ? '(ON)' : '(OFF)'}</span>
            </label>

            <label className="toggle-switch-lbl" style={{ color: enableRoundRobin ? '#38bdf8' : '#94a3b8' }}>
              <input
                type="checkbox"
                checked={enableRoundRobin}
                onChange={e => setEnableRoundRobin(e.target.checked)}
              />
              <span>Round Robin {enableRoundRobin ? '(ON)' : '(OFF)'}</span>
            </label>
          </div>

          {isComboActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#facc15', fontWeight: 'bold' }}>Preset:</span>
              <select
                className="preset-select-ctrl"
                value={comboPreset}
                onChange={e => setComboPreset(e.target.value)}
              >
                <option value="epic">⚡ Epic Frontier (Astra/Dawn/Sonnet)</option>
                <option value="ultra">⚡ Ultra Apex (Grok/Opus/Qwen)</option>
                <option value="high">⚡ High Logic (Terra/Gemini/DeepSeek)</option>
                <option value="medium">⚡ Medium Balanced (Luna/Gemini/GPT-4o)</option>
                <option value="low">⚡ Low Speed (Lite/Mini/Haiku)</option>
              </select>
            </div>
          )}
        </div>

        {/* CHAT BODY */}
        <div className="chat-body-scroller">
          {agentInstructions && (
            <div style={{ padding: '8px 12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', fontSize: '12px', color: '#38bdf8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🤖 <strong>System Persona Aktif:</strong> Instruksi tersimpan akan memandu output model.</span>
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsAgentModalOpen(true)}>Edit</span>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`msg-row ${msg.role}`}>
              <div className={`bubble-card ${msg.role}`}>
                <div className="bubble-meta">
                  <span style={{ fontWeight: 'bold' }}>{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '11px', color: '#facc15', fontWeight: 'bold', marginBottom: '6px' }}>Perspektif 3 Engine:</div>
                    {Object.entries(msg.perspectives).map(([eng, text]) => (
                      <div key={eng} style={{ marginBottom: '6px', padding: '8px', background: '#090d16', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '2px' }}>{eng}</div>
                        <div style={{ color: '#cbd5e1' }}>{text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isExecuting && (
            <div className="msg-row assistant">
              <div className="bubble-card assistant" style={{ color: '#94a3b8', fontSize: '13px' }}>
                X AWD sedang merumuskan respons cerdas...
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* PREVIEW GAMBAR PASTE */}
        {attachedImage && (
          <div style={{ padding: '8px 16px', background: '#090d16', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src={attachedImage} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #10b981' }} />
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Screenshot terlampir siap dikirim</span>
            </div>
            <button type="button" onClick={() => setAttachedImage(null)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}>✕ Batal</button>
          </div>
        )}

        {/* FOOTER INPUT */}
        <footer className="chat-footer-bar">
          <div className="input-box-wrapper">
            <button
              type="button"
              onClick={() => setIsAttachOpen(true)}
              className="icon-circle-btn"
              title="Menu Aksi Multimodal"
            >
              {attachedImage ? '✓' : '+'}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = () => setAttachedImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
              accept="image/*"
              style={{ display: 'none' }}
            />

            <textarea
              className="primary-textarea"
              rows={2}
              placeholder={isComboActive ? "Ketik prompt konsensus Combo..." : "Ketik pesan untuk X AWD..."}
              value={inputPrompt}
              onChange={e => setInputPrompt(e.target.value)}
              onPaste={handlePasteClipboard}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <button
              type="button"
              disabled={isExecuting || (!inputPrompt.trim() && !attachedImage)}
              onClick={handleSend}
              className="send-pill-btn"
            >
              ➤
            </button>
          </div>
        </footer>

        {/* MODAL AGENT SYSTEM INSTRUCTIONS */}
        {isAgentModalOpen && (
          <div className="custom-overlay" onClick={() => setIsAgentModalOpen(false)}>
            <div className="custom-modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>🤖 System Prompt / Persona Agen</span>
                <button type="button" onClick={() => setIsAgentModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>

              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Instruksi ini akan tersimpan otomatis dan disuntikkan ke setiap giliran chat model. Anda bisa memuat file <code>AGENTS.md</code> atau <code>.txt</code> langsung dari HP.
              </p>

              <input
                type="file"
                ref={agentFileRef}
                onChange={handleLoadAgentFile}
                accept=".txt,.md"
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => agentFileRef.current?.click()}
                  className="pill-btn"
                  style={{ borderColor: '#38bdf8', color: '#38bdf8' }}
                >
                  📁 Muat File (.txt / .md)
                </button>
                {agentInstructions && (
                  <button
                    type="button"
                    onClick={() => {
                      setAgentInstructions("");
                      localStorage.removeItem("xawd_agent_instructions");
                    }}
                    className="pill-btn"
                    style={{ borderColor: '#f87171', color: '#f87171' }}
                  >
                    Reset
                  </button>
                )}
              </div>

              <textarea
                style={{ width: '100%', minHeight: '200px', background: '#090d16', color: '#f8fafc', border: '1px solid #334155', borderRadius: '12px', padding: '12px', fontSize: '13px', fontFamily: 'monospace', outline: 'none' }}
                placeholder="Tulis persona agen atau panduan kerja sistem di sini... (contoh: 'Anda adalah Senior AI Architect yang selalu memberikan solusi clean code teroptimasi...')"
                value={agentInstructions}
                onChange={e => setAgentInstructions(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsAgentModalOpen(false)} className="pill-btn">Batal</button>
                <button type="button" onClick={handleSaveInstructions} className="pill-btn" style={{ background: '#2563eb', color: '#fff', borderColor: '#2563eb' }}>Simpan Instruksi</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL MODEL PICKER */}
        {isDropdownOpen && (
          <div className="custom-overlay" onClick={() => setIsDropdownOpen(false)}>
            <div className="custom-modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Pilih Model AI (118 Model)</span>
                <button type="button" onClick={() => setIsDropdownOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>

              <input
                type="text"
                placeholder="Cari model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: '#090d16', color: '#fff', border: '1px solid #334155', borderRadius: '10px', outline: 'none', fontSize: '13px' }}
                autoFocus
              />

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTier(t)}
                    className="pill-btn"
                    style={{ background: selectedTier === t ? '#2563eb' : '#090d16', color: selectedTier === t ? '#fff' : '#94a3b8', borderColor: selectedTier === t ? '#2563eb' : '#334155', padding: '3px 9px', fontSize: '11px' }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '50vh' }}>
                {filteredModels.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setIsDropdownOpen(false);
                    }}
                    style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: selectedModel === m.id ? 'rgba(37, 99, 235, 0.2)' : '#090d16', border: selectedModel === m.id ? '1px solid #3b82f6' : '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{m.name}</div>
                      <div style={{ fontSize: '10.5px', color: '#64748b' }}>{m.id}</div>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '6px', background: '#334155', color: '#f8fafc', fontWeight: 'bold' }}>{m.tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL MULTIMODAL ACTION SHEET */}
        {isAttachOpen && (
          <div className="custom-overlay" style={{ alignItems: 'flex-end', padding: 0 }} onClick={() => setIsAttachOpen(false)}>
            <div style={{ width: '100%', maxWidth: '600px', background: '#1e293b', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '18px 20px 28px', borderTop: '1px solid #334155' }} onClick={e => e.stopPropagation()}>
              <div style={{ width: '40px', height: '4px', background: '#475569', borderRadius: '2px', margin: '0 auto 16px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { name: "Kamera", icon: "📷" },
                  { name: "Gambar", icon: "🖼️" },
                  { name: "Files", icon: "📁" },
                  { name: "Drive", icon: "☁️" }
                ].map(item => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setIsAttachOpen(false);
                      fileInputRef.current?.click();
                    }}
                    style={{ background: '#090d16', border: '1px solid #334155', borderRadius: '12px', padding: '12px 6px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: "Chat", desc: "Mode dialog terstruktur", icon: "💬" },
                  { name: "Voices", desc: "Sintesis audio & suara", icon: "🎙️" },
                  { name: "Video", desc: "Analisis frame visual", icon: "🎥" },
                  { name: "Canvas", desc: "Editor dokumen & kode", icon: "🎨" }
                ].map(f => (
                  <div
                    key={f.name}
                    onClick={() => {
                      setIsAttachOpen(false);
                      setInputPrompt(prev => `[${f.name}] ${prev}`);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', background: '#090d16', border: '1px solid #1e293b' }}
                  >
                    <span style={{ fontSize: '18px' }}>{f.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{f.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{f.desc}</div>
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
