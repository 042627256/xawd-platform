import React, { useState, useRef, useEffect } from 'react';
import staticModelList from './data/models.json';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task: string;
  tier: string;
  isCombine: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: string;
}

export default function App() {
  const [models] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedModel, setSelectedModel] = useState<string>(
    staticModelList.length > 0 ? (staticModelList[0] as any).id : 'ag/gemini-3.8-flash-medium'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Halo! Saya asisten cerdas X AWD. Ada yang bisa saya bantu hari ini?',
      model: 'X AWD',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting]);

  const handleSend = async (textToSendRaw?: string) => {
    const textToSend = textToSendRaw || inputPrompt;
    if (!textToSend.trim() || isExecuting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    setIsExecuting(false);
    setIsExecuting(true);

    try {
      const conversationPayload = newHistory
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('https://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: conversationPayload,
          prompt: textToSend.trim()
        })
      });

      const data = await res.json();
      const replyContent = data.reply || data.error || 'Tidak ada balasan dari engine.';

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyContent,
          model: data.model || selectedModel,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Koneksi terputus: ' + err.message,
          model: 'Error',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFeaturePick = (name: string) => {
    setIsAttachOpen(false);
    if (name === 'Kamera' || name === 'File' || name === 'Foto' || name === 'Drive') {
      fileInputRef.current?.click();
    } else {
      setInputPrompt(`[${name}] `);
    }
  };

  const activeModel = models.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.split('/').pop() || selectedModel,
    tier: 'MEDIUM'
  };

  return (
    <div className="xawd-root">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body, html { height: 100%; background: #131314; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .xawd-root { display: flex; flex-direction: column; height: 100vh; max-width: 850px; margin: 0 auto; background: #131314; color: #e3e3e3; position: relative; }
        
        /* Navbar */
        .chat-nav { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #1e1f20; border-bottom: 1px solid #2e2f30; z-index: 10; }
        .brand-badge { background: #1a73e8; color: #fff; font-weight: bold; border-radius: 8px; padding: 4px 10px; font-size: 14px; }
        .model-btn { background: #282a2c; border: 1px solid #3c4043; color: #e3e3e3; border-radius: 20px; padding: 6px 14px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .new-btn { background: transparent; border: 1px solid #3c4043; color: #8ab4f8; padding: 5px 12px; border-radius: 16px; font-size: 12px; cursor: pointer; }
        
        /* Modal Dropdown */
        .dropdown-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        .dropdown-box { position: absolute; top: 56px; left: 16px; right: 16px; max-width: 480px; margin: 0 auto; background: #232427; border: 1px solid #3c4043; border-radius: 14px; padding: 12px; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        .search-in { width: 100%; padding: 8px 12px; background: #131314; border: 1px solid #3c4043; border-radius: 8px; color: #fff; margin-bottom: 8px; outline: none; }
        .model-items { max-height: 280px; overflow-y: auto; }
        .m-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 8px; cursor: pointer; }
        .m-row:hover, .m-row.selected { background: #333538; }
        .m-name { font-size: 13px; font-weight: 500; }
        .m-id { font-size: 11px; color: #9aa0a6; }
        .t-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
        .t-badge.high { background: #5c2b29; color: #f28b82; }
        .t-badge.medium { background: #4a3b1a; color: #fdd663; }
        .t-badge.low { background: #1e3a29; color: #81c995; }

        /* Chat Area */
        .chat-history { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .msg-line { display: flex; width: 100%; }
        .msg-line.user { justify-content: flex-end; }
        .msg-line.assistant { justify-content: flex-start; }
        .bubble { max-width: 85%; padding: 12px 16px; border-radius: 18px; font-size: 14.5px; line-height: 1.5; word-wrap: break-word; }
        .bubble.user { background: #2b2c2f; color: #fff; border-bottom-right-radius: 4px; }
        .bubble.assistant { background: #1e1f20; border: 1px solid #333538; color: #e3e3e3; border-bottom-left-radius: 4px; }
        .b-head { display: flex; justify-content: space-between; font-size: 11px; color: #9aa0a6; margin-bottom: 4px; gap: 10px; }
        .b-text { white-space: pre-wrap; }
        .thinking { font-style: italic; color: #8ab4f8; font-size: 13px; }

        /* Action Sheet */
        .sheet-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
        .sheet-body { width: 100%; max-width: 600px; background: #1e1f20; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 16px 20px 24px; max-height: 75vh; overflow-y: auto; }
        .sheet-drag { width: 36px; height: 4px; background: #5f6368; border-radius: 2px; margin: 0 auto 16px; }
        .sheet-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
        .grid-btn { background: #2b2c2f; border: none; border-radius: 12px; padding: 12px 6px; color: #e3e3e3; display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; }
        .grid-icon { font-size: 20px; }
        .feat-list { display: flex; flex-direction: column; gap: 6px; }
        .feat-item { display: flex; align-items: center; gap: 14px; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
        .feat-item:hover { background: #2b2c2f; }
        .feat-icon { font-size: 20px; }
        .f-title { font-size: 14px; font-weight: 500; }
        .f-sub { font-size: 12px; color: #9aa0a6; }

        /* Input Bottom */
        .input-bar { display: flex; align-items: center; padding: 10px 14px; background: #1e1f20; border-top: 1px solid #2e2f30; gap: 10px; }
        .btn-round { width: 40px; height: 40px; border-radius: 50%; border: none; background: #2b2c2f; color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .btn-round.send { background: #1a73e8; font-size: 16px; }
        .btn-round.send:disabled { background: #3c4043; color: #888; cursor: not-allowed; }
        .chat-in { flex: 1; background: #2b2c2f; border: 1px solid #3c4043; border-radius: 20px; padding: 10px 16px; color: #fff; font-size: 14.5px; outline: none; resize: none; max-height: 100px; }
      `}</style>

      {/* Navbar */}
      <nav className="chat-nav">
        <span className="brand-badge">X AWD</span>
        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="model-btn">
          <span>{activeModel.name}</span>
          <span>{isDropdownOpen ? '▴' : '▾'}</span>
        </button>
        <button onClick={() => setMessages([messages[0]])} className="new-btn">
          + Obrolan Baru
        </button>
      </nav>

      {/* Modal Pemilih Model */}
      {isDropdownOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
          <div className="dropdown-box">
            <input
              type="text"
              placeholder="Cari engine (Gemini, Claude, GPT, GLM)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-in"
            />
            <div className="model-items">
              {models
                .filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()))
                .map(m => (
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
                    <span className={`t-badge ${m.tier}`}>{m.tier}</span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Area Chat Berkelanjutan */}
      <div className="chat-history">
        {messages.map(msg => (
          <div key={msg.id} className={`msg-line ${msg.role}`}>
            <div className={`bubble ${msg.role}`}>
              <div className="b-head">
                <span>{msg.role === 'user' ? 'Anda' : (msg.model || 'X AWD')}</span>
                <span>{msg.timestamp}</span>
              </div>
              <div className="b-text">{msg.content}</div>
            </div>
          </div>
        ))}
        {isExecuting && (
          <div className="msg-line assistant">
            <div className="bubble assistant thinking">
              Sedang berpikir...
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Sheet Lampiran Pintas */}
      {isAttachOpen && (
        <div className="sheet-backdrop" onClick={() => setIsAttachOpen(false)}>
          <div className="sheet-body" onClick={e => e.stopPropagation()}>
            <div className="sheet-drag" />
            <div className="sheet-grid">
              {[
                { name: 'Kamera', icon: '📷' },
                { name: 'File', icon: '📎' },
                { name: 'Drive', icon: '📁' },
                { name: 'Foto', icon: '🖼️' }
              ].map(item => (
                <button key={item.name} onClick={() => handleFeaturePick(item.name)} className="grid-btn">
                  <span className="grid-icon">{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
            <div className="feat-list">
              {[
                { name: 'Gambar', sub: 'Buat dan edit gambar', icon: '🎨' },
                { name: 'Video', sub: 'Wujudkan ide kreatif', icon: '🎬' },
                { name: 'Musik', sub: 'Buat trek audio sintetis', icon: '🎵' },
                { name: 'Canvas', sub: 'Buat kode, tulis, atau slide', icon: '📋' },
                { name: 'Deep Research', sub: 'Dapatkan laporan mendalam', icon: '🔍' }
              ].map(feat => (
                <div key={feat.name} onClick={() => handleFeaturePick(feat.name)} className="feat-item">
                  <span className="feat-icon">{feat.icon}</span>
                  <div>
                    <div className="f-title">{feat.name}</div>
                    <div className="f-sub">{feat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setInputPrompt(`[Lampiran: ${e.target.files[0].name}] `);
          }
        }}
      />

      {/* Bar Input Pesan Bawah */}
      <div className="input-bar">
        <button
          type="button"
          onClick={() => setIsAttachOpen(true)}
          className="btn-round"
          title="Lampiran & Fitur"
        >
          +
        </button>
        <textarea
          rows={1}
          placeholder="Ketik pesan untuk X AWD..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="chat-in"
        />
        <button
          onClick={() => handleSend()}
          disabled={isExecuting || !inputPrompt.trim()}
          className="btn-round send"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
