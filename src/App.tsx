import React, { useState, useRef, useEffect, useMemo } from 'react';
import staticModelList from './data/models.json';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task?: string;
  tier: string;
  supportsVision?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
  perspectives?: Record<string, string>;
}

export default function App() {
  const [models, setModels] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>("ag/gemini-3.8-flash-high");

  // Controls State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"name" | "tier" | "provider">("name");

  const [isComboActive, setIsComboActive] = useState(false);
  const [comboPreset, setComboPreset] = useState("epic");
  const [enableFallback, setEnableFallback] = useState(false);
  const [enableRoundRobin, setEnableRoundRobin] = useState(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Halo! Sistem X AWD aktif dengan 118 model terverifikasi, kendali manual Smart Fallback, Round Robin, dan Mode Combo. Pilih model dan mulai obrolan.",
      model: "X AWD Master",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
    return models
      .filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase());
        const matchesTier = selectedTier === "ALL" || m.tier === selectedTier;
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => (a[sortBy] || "").localeCompare(b[sortBy] || ""));
  }, [models, search, selectedTier, sortBy]);

  const activeModel = useMemo(() => {
    return models.find(m => m.id === selectedModel) || {
      id: selectedModel,
      name: selectedModel.split("/").pop() || selectedModel,
      tier: "HIGH"
    };
  }, [models, selectedModel]);

  
  const handleFeaturePick = (name: string) => {
    setIsAttachOpen(false);
    if (name === "Kamera" || name === "Files" || name === "Gambar" || name === "Drive") {
      fileInputRef.current?.click();
    } else {
      setInputPrompt(prev => `[${name}] ${prev}`);
    }
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
          reader.onload = () => {
            setAttachedImage(reader.result as string);
          };
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
      content: userText + (currentImg ? " [Gambar Terlampir]" : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsExecuting(true);

    try {
      const payloadMessages = messages.map(m => ({ role: m.role, content: m.content }));
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
          comboPreset: comboPreset,
          enableFallback: enableFallback,
          enableRoundRobin: enableRoundRobin,
          tier: activeModel.tier || "ULTRA"
        })
      });

      // Anti-Crash Response Parser
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = { success: false, error: rawText.slice(0, 200) || "Respons tidak dapat dibaca" };
      }

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply || "Tidak ada jawaban yang dikembalikan.",
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
    <div className="xawd-viewport-lock">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; height: 100dvh; overflow: hidden; background: #0e0f10; color: #e3e3e3; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .xawd-viewport-lock { position: fixed; inset: 0; width: 100vw; height: 100dvh; display: flex; justify-content: center; background: #0e0f10; overflow: hidden; }
        .xawd-app-shell { width: 100%; max-width: 900px; height: 100%; display: grid; grid-template-rows: auto auto 1fr auto; background: #131314; border-left: 1px solid #232427; border-right: 1px solid #232427; overflow: hidden; position: relative; }
        
        .header-fixed-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: rgba(30, 31, 32, 0.98); border-bottom: 1px solid #28292a; z-index: 100; }
        .header-left { display: flex; align-items: center; gap: 8px; }
        .brand-badge { background: #1a73e8; color: #fff; font-weight: 700; border-radius: 8px; padding: 5px 11px; font-size: 13px; }
        .combo-btn { background: #2b2615; color: #ffd700; border: 1px solid #7c6818; border-radius: 20px; padding: 5px 12px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .combo-btn.active { background: #ffd700; color: #000; }
        .model-btn { background: #282a2c; border: 1px solid #3c4043; color: #e3e3e3; border-radius: 20px; padding: 5px 12px; font-size: 12.5px; cursor: pointer; max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .new-btn { background: transparent; border: 1px solid #3c4043; color: #8ab4f8; border-radius: 16px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; }

        .facelift-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; background: #1a1b1e; border-bottom: 1px solid #28292a; font-size: 11.5px; flex-wrap: wrap; gap: 8px; z-index: 90; }
        .facelift-toggles { display: flex; align-items: center; gap: 14px; }
        .facelift-label { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; font-weight: 600; }
        .preset-select { background: #282a2c; color: #ffd700; border: 1px solid #7c6818; border-radius: 6px; padding: 3px 8px; font-size: 11.5px; font-weight: bold; outline: none; }

        .chat-scroll-row { overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; scroll-behavior: smooth; }
        .msg-line { display: flex; width: 100%; }
        .msg-line.user { justify-content: flex-end; }
        .msg-line.assistant { justify-content: flex-start; }
        .bubble { max-width: 86%; padding: 12px 16px; border-radius: 18px; font-size: 14.5px; line-height: 1.55; word-break: break-word; }
        .bubble.user { background: #2b2c2f; color: #fff; border-bottom-right-radius: 4px; }
        .bubble.assistant { background: #1e1f20; border: 1px solid #333538; color: #e3e3e3; border-bottom-left-radius: 4px; }
        .b-head { display: flex; justify-content: space-between; font-size: 11px; color: #9aa0a6; margin-bottom: 5px; gap: 10px; }
        .b-text { white-space: pre-wrap; }

        .details-box { margin-top: 10px; padding: 8px 12px; background: #18191b; border: 1px solid #2e2f30; border-radius: 10px; font-size: 12.5px; }
        .details-box summary { cursor: pointer; color: #ffd700; font-weight: 600; outline: none; }
        .details-content { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
        .perspective-card { padding: 6px 10px; background: #232427; border-radius: 6px; }
        .perspective-title { font-weight: 700; color: #8ab4f8; margin-bottom: 2px; }

        .footer-fixed-row { display: flex; align-items: center; padding: 10px 14px; background: #1e1f20; border-top: 1px solid #28292a; gap: 10px; z-index: 100; }
        .btn-round { width: 42px; height: 42px; border-radius: 50%; border: none; background: #2b2c2f; color: #fff; font-size: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .btn-round.send { background: #1a73e8; font-size: 17px; }
        .btn-round.send:disabled { background: #3c4043; color: #888; cursor: not-allowed; }
        .chat-in { flex: 1; background: #2b2c2f; border: 1px solid #3c4043; border-radius: 22px; padding: 10px 16px; color: #fff; font-size: 14.5px; outline: none; resize: none; font-family: inherit; }

        .dropdown-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 200; }
        .dropdown-box { position: fixed; top: 60px; left: 16px; right: 16px; max-width: 520px; margin: 0 auto; background: #232427; border: 1px solid #3c4043; border-radius: 16px; padding: 14px; z-index: 210; box-shadow: 0 12px 32px rgba(0,0,0,0.7); }
        .search-in { width: 100%; padding: 10px 14px; background: #131314; border: 1px solid #3c4043; border-radius: 10px; color: #fff; margin-bottom: 10px; outline: none; }
        .filter-controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 8px; flex-wrap: wrap; }
        .tier-pills { display: flex; gap: 6px; flex-wrap: wrap; }
        .pill-btn { background: #18191b; border: 1px solid #3c4043; color: #9aa0a6; border-radius: 12px; padding: 4px 9px; font-size: 11px; cursor: pointer; font-weight: 600; }
        .pill-btn.active { background: #1a73e8; color: #fff; border-color: #1a73e8; }
        .model-items { max-height: 48vh; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .m-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
        .m-row:hover, .m-row.selected { background: #333538; }
        .m-name { font-size: 13.5px; font-weight: 500; }
        .m-id { font-size: 11px; color: #9aa0a6; }
        .t-badge { font-size: 10px; padding: 3px 7px; border-radius: 5px; font-weight: 600; text-transform: uppercase; background: #3c4043; color: #fff; }
        .t-badge.ultra { background: #e040fb; color: #fff; }
        .t-badge.high { background: #5c2b29; color: #f28b82; }
        .t-badge.medium { background: #4a3b1a; color: #fdd663; }
        .t-badge.low { background: #1e3a29; color: #81c995; }
        .t-badge.free { background: #1a73e8; color: #fff; }
      `}
        /* Area Input Diperbesar */
        .footer-fixed-row { display: flex; align-items: flex-end; padding: 12px 16px; background: #1e1f20; border-top: 1px solid #28292a; gap: 12px; z-index: 100; }
        .chat-in { flex: 1; background: #2b2c2f; border: 1px solid #3c4043; border-radius: 18px; padding: 14px 18px; color: #fff; font-size: 15px; line-height: 1.5; outline: none; resize: none; min-height: 52px; max-height: 180px; font-family: inherit; }
        .chat-in:focus { border-color: #1a73e8; }
        .btn-round { width: 46px; height: 46px; border-radius: 50%; border: none; background: #2b2c2f; color: #fff; font-size: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; margin-bottom: 3px; }
        .btn-round.send { background: #1a73e8; font-size: 18px; }

        /* Action Sheet Modal */
        .sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 250; display: flex; align-items: flex-end; justify-content: center; }
        .sheet-body { width: 100%; max-width: 600px; background: #1e1f20; border-top-left-radius: 24px; border-top-right-radius: 24px; padding: 18px 20px 30px; max-height: 72vh; overflow-y: auto; }
        .sheet-drag { width: 44px; height: 5px; background: #5f6368; border-radius: 3px; margin: 0 auto 16px; }
        .sheet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
        .grid-btn { background: #2b2c2f; border: none; border-radius: 14px; padding: 12px 6px; color: #e3e3e3; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
        .feat-list { display: flex; flex-direction: column; gap: 6px; }
        .feat-item { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 12px; cursor: pointer; color: #e3e3e3; }
        .feat-item:hover { background: #2b2c2f; }

      </style>

      <div className="xawd-app-shell">
        <header className="header-fixed-row">
          <div className="header-left">
            <span className="brand-badge">X AWD</span>
            <button
              onClick={() => setIsComboActive(!isComboActive)}
              className={`combo-btn ${isComboActive ? 'active' : ''}`}
            >
              ⚡ {isComboActive ? 'Combo ON' : 'Combo Epic'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!isComboActive && (
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="model-btn">
                <span>{activeModel.name}</span>
                <span>{isDropdownOpen ? '▴' : '▾'}</span>
              </button>
            )}
            <button onClick={() => setMessages([messages[0]])} className="new-btn">
              + Baru
            </button>
          </div>
        </header>

        {/* Major Facelift Toolbar */}
        <div className="facelift-toolbar">
          <div className="facelift-toggles">
            <label className="facelift-label" style={{ color: enableFallback ? '#10b981' : '#9aa0a6' }}>
              <input
                type="checkbox"
                checked={enableFallback}
                onChange={e => setEnableFallback(e.target.checked)}
                style={{ accentColor: '#10b981' }}
              />
              <span>Smart Fallback {enableFallback ? '(ON)' : '(OFF)'}</span>
            </label>
            <label className="facelift-label" style={{ color: enableRoundRobin ? '#38bdf8' : '#9aa0a6' }}>
              <input
                type="checkbox"
                checked={enableRoundRobin}
                onChange={e => setEnableRoundRobin(e.target.checked)}
                style={{ accentColor: '#38bdf8' }}
              />
              <span>Round Robin {enableRoundRobin ? '(ON)' : '(OFF)'}</span>
            </label>
          </div>

          {isComboActive && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>Preset:</span>
              <select
                className="preset-select"
                value={comboPreset}
                onChange={e => setComboPreset(e.target.value)}
              >
                <option value="epic">⚡ Epic Frontier Trio</option>
                <option value="ultra">⚡ Ultra Apex Trio</option>
                <option value="high">⚡ High Logic & Code</option>
                <option value="medium">⚡ Medium Balanced</option>
                <option value="low">⚡ Low Speed Trio</option>
              </select>
            </div>
          )}
        </div>

        {/* Chat Body */}
        <main className="chat-scroll-row">
          {messages.map(msg => (
            <div key={msg.id} className={`msg-line ${msg.role}`}>
              <div className={`bubble ${msg.role}`}>
                <div className="b-head">
                  <span>{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="b-text">{msg.content}</div>

                {msg.perspectives && Object.keys(msg.perspectives).length > 0 && (
                  <details className="details-box">
                    <summary>Lihat Sudut Pandang 3 Engine</summary>
                    <div className="details-content">
                      {Object.entries(msg.perspectives).map(([engineName, perspectiveText]) => (
                        <div key={engineName} className="perspective-card">
                          <div className="perspective-title">{engineName}</div>
                          <div>{perspectiveText}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
          {isExecuting && (
            <div className="msg-line assistant">
              <div className="bubble assistant">
                <span style={{ color: '#9aa0a6' }}>X AWD sedang berpikir & merumuskan respons...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </main>

        {/* Footer */}
        
        {/* Preview Badge Screenshot Clipboard */}
        {attachedImage && (
          <div className="preview-badge-container" style={{ padding: "8px 16px", background: "#1a1b1e", display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #28292a" }}>
            <img src={attachedImage} alt="Preview" style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", border: "1px solid #10b981" }} />
            <span style={{ fontSize: "12px", color: "#10b981", flex: 1, fontWeight: 600 }}>Screenshot terlampir siap dikirim</span>
            <button type="button" onClick={() => setAttachedImage(null)} style={{ background: "transparent", border: "none", color: "#f28b82", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>✕ Hapus</button>
          </div>
        )}

        <footer className="footer-fixed-row">
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
          <button
            type="button"
            onClick={() => setIsAttachOpen(true)}
            className="btn-round"
            style={{ color: attachedImage ? '#10b981' : '#fff' }}
          >
            {attachedImage ? '✓' : '+'}
          </button>
          <textarea
            rows={2} onPaste={handlePasteClipboard}
            placeholder={isComboActive ? "Ketik prompt untuk konsensus Combo..." : "Ketik pesan untuk X AWD..."}
            value={inputPrompt}
            onChange={e => setInputPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="chat-in"
          />
          <button
            type="button"
            disabled={isExecuting || (!inputPrompt.trim() && !attachedImage)}
            onClick={handleSend}
            className="btn-round send"
          >
            ➤
          </button>
        </footer>

        {/* Model Picker Modal */}
        {isDropdownOpen && (
          <>
            <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
            <div className="dropdown-box">
              <input
                type="text"
                placeholder="Cari dari 118 model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-in"
                autoFocus
              />
              <div className="filter-controls-row">
                <div className="tier-pills">
                  {['ALL', 'ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'FREE'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      className={`pill-btn ${selectedTier === t ? 'active' : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  style={{ background: '#18191b', border: '1px solid #3c4043', color: '#fff', borderRadius: '10px', padding: '4px 8px', fontSize: '11px' }}
                >
                  <option value="name">Nama</option>
                  <option value="tier">Tier</option>
                  <option value="provider">Provider</option>
                </select>
              </div>

              <div className="model-items">
                {filteredModels.map(m => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`m-row ${selectedModel === m.id ? 'selected' : ''}`}
                  >
                    <div>
                      <div className="m-name">{m.name}</div>
                      <div className="m-id">{m.id}</div>
                    </div>
                    <span className={`t-badge ${(m.tier || 'medium').toLowerCase()}`}>{m.tier}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      
        {/* Action Sheet Menu Multimodal */}
        {isAttachOpen && (
          <div className="sheet-backdrop" onClick={() => setIsAttachOpen(false)}>
            <div className="sheet-body" onClick={e => e.stopPropagation()}>
              <div className="sheet-drag" />
              <div className="sheet-grid">
                {[
                  { name: "Kamera", icon: "📷" },
                  { name: "Gambar", icon: "🖼️" },
                  { name: "Files", icon: "📁" },
                  { name: "Drive", icon: "☁️" }
                ].map(item => (
                  <button key={item.name} type="button" onClick={() => handleFeaturePick(item.name)} className="grid-btn">
                    <span style={{ fontSize: "22px" }}>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>

              <div className="feat-list">
                {[
                  { name: "Chat", desc: "Mode dialog reguler & instruksi teks", icon: "💬" },
                  { name: "Voices", desc: "Perintah suara & sintesis audio", icon: "🎙️" },
                  { name: "Video", desc: "Analisis frame visual dinamis", icon: "🎥" },
                  { name: "Canvas", desc: "Editor interaktif kode & dokumen", icon: "🎨" }
                ].map(f => (
                  <div key={f.name} onClick={() => handleFeaturePick(f.name)} className="feat-item">
                    <span style={{ fontSize: "19px" }}>{f.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{f.name}</div>
                      <div style={{ fontSize: "11px", color: "#9aa0a6" }}>{f.desc}</div>
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
