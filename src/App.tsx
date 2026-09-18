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

  // Agent Instructions State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentInstructions, setAgentInstructions] = useState<string>(() => {
    return localStorage.getItem("xawd_agent_instructions") || "";
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "X AWD Platform siap digunakan. Input bar telah diperbaiki, kendali System Instructions Agent aktif dan tersimpan.",
      model: "X AWD Core",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentFileRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isExecuting]);

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
      setAgentInstructions(reader.result as string);
      localStorage.setItem("xawd_agent_instructions", reader.result as string);
    };
    reader.readAsText(file);
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
      
      // Sisipkan System Instruction jika tersedia
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
        data = { success: false, error: rawText.slice(0, 200) || "Gagal mengurai respons" };
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
    <div className="app-shell">
      <style>{`
        :root { --bg-dark: #0d1117; --surface-dark: #161b22; --border-dark: #30363d; }
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: var(--bg-dark); color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
        .app-shell { display: flex; flex-direction: column; height: 100%; width: 100%; max-width: 900px; margin: 0 auto; background: var(--surface-dark); border-left: 1px solid var(--border-dark); border-right: 1px solid var(--border-dark); position: relative; }
        
        .app-header { background: #161b22; border-bottom: 1px solid var(--border-dark); padding: 10px 14px; flex-shrink: 0; }
        .app-toolbar { background: #0d1117; border-bottom: 1px solid var(--border-dark); padding: 8px 14px; font-size: 12px; flex-shrink: 0; }
        .app-chat-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        
        /* Area Footer Input Luas & Anti Gepeng */
        .app-footer { background: #161b22; border-top: 1px solid var(--border-dark); padding: 12px 14px; flex-shrink: 0; z-index: 10; }
        .input-row { display: flex; align-items: flex-end; gap: 10px; width: 100%; }
        .chat-textarea { flex: 1; width: 100%; min-height: 58px; max-height: 160px; background: #0d1117 !important; color: #fff !important; border: 1px solid var(--border-dark) !important; border-radius: 18px !important; padding: 12px 16px !important; font-size: 15px !important; line-height: 1.4 !important; outline: none !important; resize: none; }
        .chat-textarea:focus { border-color: #58a6ff !important; box-shadow: 0 0 0 1px #58a6ff !important; }
        .action-circle-btn { width: 46px; height: 46px; border-radius: 50%; border: 1px solid var(--border-dark); background: #21262d; color: #c9d1d9; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; cursor: pointer; }
        .send-circle-btn { width: 46px; height: 46px; border-radius: 50%; border: none; background: #1f6feb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; cursor: pointer; }
        .send-circle-btn:disabled { background: #30363d; color: #8b949e; cursor: not-allowed; }

        .chat-bubble { max-width: 86%; padding: 12px 16px; border-radius: 16px; line-height: 1.55; font-size: 14.5px; word-break: break-word; }
        .bubble-user { background: #1f6feb; color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; }
        .bubble-ai { background: #21262d; color: #f0f6fc; align-self: flex-start; border: 1px solid var(--border-dark); border-bottom-left-radius: 2px; }
      `}</style>

      {/* Header Bar */}
      <div className="app-header d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary px-2 py-2 fs-6">X AWD</span>
          <button
            type="button"
            onClick={() => setIsComboActive(!isComboActive)}
            className={`btn btn-sm fw-bold rounded-pill px-3 ${isComboActive ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
          >
            ⚡ {isComboActive ? 'Combo ON' : 'Combo Epic'}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Tombol Agent Instructions */}
          <button
            type="button"
            onClick={() => setIsAgentModalOpen(true)}
            className={`btn btn-sm rounded-pill px-3 fw-semibold ${agentInstructions ? 'btn-outline-info' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-robot me-1"></i> Agent {agentInstructions ? '✓' : ''}
          </button>

          {!isComboActive && (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(true)}
              className="btn btn-sm btn-dark border border-secondary text-truncate rounded-pill px-3"
              style={{ maxWidth: '140px' }}
            >
              {activeModel.name}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            className="btn btn-sm btn-outline-secondary rounded-pill"
          >
            + Baru
          </button>
        </div>
      </div>

      {/* Toolbar Kontrol */}
      <div className="app-toolbar d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="fbCheck"
              checked={enableFallback}
              onChange={e => setEnableFallback(e.target.checked)}
            />
            <label className={`form-check-label ${enableFallback ? 'text-success fw-bold' : 'text-secondary'}`} htmlFor="fbCheck">
              Fallback
            </label>
          </div>

          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="rrCheck"
              checked={enableRoundRobin}
              onChange={e => setEnableRoundRobin(e.target.checked)}
            />
            <label className={`form-check-label ${enableRoundRobin ? 'text-info fw-bold' : 'text-secondary'}`} htmlFor="rrCheck">
              Round Robin
            </label>
          </div>
        </div>

        {isComboActive && (
          <div className="d-flex align-items-center gap-2">
            <span className="text-warning fw-bold">Preset:</span>
            <select
              className="form-select form-select-sm bg-dark text-warning border-secondary"
              value={comboPreset}
              onChange={e => setComboPreset(e.target.value)}
              style={{ width: 'auto' }}
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

      {/* Chat Messages */}
      <div className="app-chat-body">
        {agentInstructions && (
          <div className="p-2 rounded bg-dark border border-info border-opacity-25 small text-info d-flex justify-content-between align-items-center">
            <span><i className="bi bi-info-circle me-1"></i> System Instructions Agen Aktif</span>
            <button onClick={() => setIsAgentModalOpen(true)} className="btn btn-sm btn-link text-info p-0 text-decoration-none">Edit</button>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
            <div className="d-flex justify-content-between small opacity-75 mb-1 gap-3">
              <span className="fw-bold">{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
              <span>{msg.timestamp}</span>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

            {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
              <div className="mt-2 pt-2 border-top border-secondary">
                <div className="small fw-bold text-warning mb-2">Perspektif 3 Engine:</div>
                {Object.entries(msg.perspectives).map(([eng, text]) => (
                  <div key={eng} className="mb-2 p-2 rounded bg-black border border-secondary small">
                    <div className="text-info fw-semibold">{eng}</div>
                    <div className="text-secondary">{text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isExecuting && (
          <div className="chat-bubble bubble-ai text-secondary small">
            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            X AWD sedang memproses respons...
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Preview Gambar Paste */}
      {attachedImage && (
        <div className="px-3 py-2 bg-dark border-top d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img src={attachedImage} alt="Attachment" className="rounded border border-success" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
            <span className="small text-success fw-bold">Screenshot siap dikirim</span>
          </div>
          <button type="button" onClick={() => setAttachedImage(null)} className="btn btn-sm btn-link text-danger text-decoration-none">Batal</button>
        </div>
      )}

      {/* Footer Input Luas & Responsif */}
      <div className="app-footer">
        <div className="input-row">
          <button
            type="button"
            onClick={() => setIsAttachOpen(true)}
            className="action-circle-btn"
          >
            <i className={`bi ${attachedImage ? 'bi-check2 text-success' : 'bi-plus-lg'}`}></i>
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
            className="form-control chat-textarea"
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
            className="send-circle-btn"
          >
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>

      {/* Modal Agent System Instructions */}
      {isAgentModalOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1100 }}>
          <div className="bg-dark p-3 rounded-4 w-100 border border-secondary" style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold fs-6 text-light"><i className="bi bi-sliders me-2 text-primary"></i>Instruksi Agen (System Prompt)</span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setIsAgentModalOpen(false)}></button>
            </div>
            
            <p className="small text-secondary mb-2">
              Instruksi ini akan disuntikkan permanen ke model pada setiap prompt. Anda dapat mengunggah file <code>AGENTS.md</code> atau <code>.txt</code>.
            </p>

            <input
              type="file"
              ref={agentFileRef}
              onChange={handleLoadAgentFile}
              accept=".txt,.md"
              style={{ display: 'none' }}
            />

            <div className="d-flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => agentFileRef.current?.click()}
                className="btn btn-sm btn-outline-info rounded-pill"
              >
                <i className="bi bi-file-earmark-arrow-up me-1"></i> Load File (.txt / .md)
              </button>
              {agentInstructions && (
                <button
                  type="button"
                  onClick={() => {
                    setAgentInstructions("");
                    localStorage.removeItem("xawd_agent_instructions");
                  }}
                  className="btn btn-sm btn-outline-danger rounded-pill"
                >
                  Reset / Kosongkan
                </button>
              )}
            </div>

            <textarea
              className="form-control bg-black text-white border-secondary mb-3 flex-grow-1"
              style={{ minHeight: '180px', fontFamily: 'monospace', fontSize: '13px' }}
              placeholder="Tulis sistem persona atau instruksi agen di sini... (contoh: 'Anda adalah software engineer senior, selalu gunakan kode teroptimasi...')"
              value={agentInstructions}
              onChange={e => setAgentInstructions(e.target.value)}
            />

            <div className="d-flex justify-content-end gap-2">
              <button type="button" onClick={() => setIsAgentModalOpen(false)} className="btn btn-sm btn-secondary rounded-pill px-3">Tutup</button>
              <button type="button" onClick={handleSaveInstructions} className="btn btn-sm btn-primary rounded-pill px-4">Simpan Instruksi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Action Sheet */}
      {isAttachOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-end justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }} onClick={() => setIsAttachOpen(false)}>
          <div className="bg-dark p-3 rounded-top-4 w-100 border-top border-secondary" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="fw-bold">Pilih Aksi / Lampiran</span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setIsAttachOpen(false)}></button>
            </div>
            <div className="row g-2 text-center mb-3">
              {[
                { name: "Kamera", icon: "bi-camera" },
                { name: "Gambar", icon: "bi-image" },
                { name: "Files", icon: "bi-folder2-open" },
                { name: "Drive", icon: "bi-cloud-arrow-up" }
              ].map(item => (
                <div key={item.name} className="col-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="btn btn-dark border border-secondary w-100 py-3 rounded-3"
                  >
                    <i className={`bi ${item.icon} fs-5 text-primary`}></i>
                    <div className="small mt-1">{item.name}</div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Model Picker */}
      {isDropdownOpen && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1050 }} onClick={() => setIsDropdownOpen(false)}>
          <div className="bg-dark p-3 rounded-4 w-100 border border-secondary" style={{ maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold">Pilih Model</span>
              <button type="button" className="btn-close btn-close-white" onClick={() => setIsDropdownOpen(false)}></button>
            </div>
            <input
              type="text"
              placeholder="Cari model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control bg-black text-white border-secondary mb-2"
              autoFocus
            />
            <div className="d-flex gap-1 flex-wrap mb-2">
              {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setSelectedTier(t)}
                  className={`btn btn-sm ${selectedTier === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="overflow-auto flex-grow-1">
              {filteredModels.map(m => (
                <div
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`p-2 rounded d-flex justify-content-between align-items-center mb-1 cursor-pointer ${selectedModel === m.id ? 'bg-primary text-white' : 'bg-transparent text-light border border-secondary'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div>
                    <div className="small fw-semibold">{m.name}</div>
                    <div className="text-secondary" style={{ fontSize: '10px' }}>{m.id}</div>
                  </div>
                  <span className="badge bg-secondary">{m.tier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
