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
    staticModelList.length > 0 ? (staticModelList[0] as any).id : 'ag/gemini-3.8-flash-high'
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
        html, body {
          height: 100%;
          width: 100%;
          background: #131314;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .xawd-root {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          max-width: 850px;
          margin: 0 auto;
          background: #131314;
          color: #e3e3e3;
          position: relative;
          overflow: hidden;
        }
        
        /* Navbar Terkunci Mutlak di Atas */
        .chat-nav {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          background: rgba(30, 31, 32, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #2e2f30;
          z-index: 100;
          flex-shrink: 0;
        }
        .brand-badge {
          background: #1a73e8;
          color: #fff;
          font-weight: 700;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 13.5px;
          letter-spacing: 0.5px;
        }
        .model-btn {
          background: #282a2c;
          border: 1px solid #3c4043;
          color: #e3e3e3;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .new-btn {
          background: transparent;
          border: 1px solid #3c4043;
          color: #8ab4f8;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }

        /* Modal Dialog Pemilih Model */
        .dropdown-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          z-index: 200;
        }
        .dropdown-box {
          position: fixed;
          top: 64px;
          left: 16px;
          right: 16px;
          max-width: 500px;
          margin: 0 auto;
          background: #232427;
          border: 1px solid #3c4043;
          border-radius: 16px;
          padding: 14px;
          z-index: 210;
          box-shadow: 0 12px 32px rgba(0,0,0,0.7);
        }
        .search-in {
          width: 100%;
          padding: 10px 14px;
          background: #131314;
          border: 1px solid #3c4043;
          border-radius: 10px;
          color: #fff;
          margin-bottom: 10px;
          outline: none;
          font-size: 13.5px;
        }
        .model-items {
          max-height: 50vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .m-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
        }
        .m-row:hover, .m-row.selected {
          background: #333538;
        }
        .m-name { font-size: 13.5px; font-weight: 500; }
        .m-id { font-size: 11px; color: #9aa0a6; }
        .t-badge {
          font-size: 10px;
          padding: 3px 7px;
          border-radius: 5px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .t-badge.high { background: #5c2b29; color: #f28b82; }
        .t-badge.medium { background: #4a3b1a; color: #fdd663; }
        .t-badge.low { background: #1e3a29; color: #81c995; }

        /* Wadah Obrolan yang Bebas Bergulir */
        .chat-history {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          scroll-behavior: smooth;
        }
        .msg-line { display: flex; width: 100%; }
        .msg-line.user { justify-content: flex-end; }
        .msg-line.assistant { justify-content: flex-start; }
        .bubble {
          max-width: 88%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14.5px;
          line-height: 1.55;
          word-wrap: break-word;
        }
        .bubble.user {
          background: #2b2c2f;
          color: #fff;
          border-bottom-right-radius: 4px;
        }
        .bubble.assistant {
          background: #1e1f20;
          border: 1px solid #333538;
          color: #e3e3e3;
          border-bottom-left-radius: 4px;
        }
        .b-head {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #9aa0a6;
          margin-bottom: 5px;
          gap: 12px;
        }
        .b-text { white-space: pre-wrap; }
        .thinking { font-style: italic; color: #8ab4f8; font-size: 13.5px; }

        /* Bottom Sheet Lampiran */
        .sheet-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(2px);
          z-index: 250;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .sheet-body {
          width: 100%;
          max-width: 600px;
          background: #1e1f20;
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          padding: 16px 20px 28px;
          max-height: 70vh;
          overflow-y: auto;
          box-shadow: 0 -8px 30px rgba(0,0,0,0.6);
        }
        .sheet-drag {
          width: 40px;
          height: 4px;
          background: #5f6368;
          border-radius: 2px;
          margin: 0 auto 16px;
        }
        .sheet-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .grid-btn {
          background: #2b2c2f;
          border: none;
          border-radius: 14px;
          padding: 12px 6px;
          color: #e3e3e3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .grid-icon { font-size: 20px; }
        .feat-list { display: flex; flex-direction: column; gap: 6px; }
        .feat-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
        }
        .feat-item:hover { background: #2b2c2f; }
        .feat-icon { font-size: 20px; }
        .f-title { font-size: 14px; font-weight: 500; }
        .f-sub { font-size: 12px; color: #9aa0a6; }

        /* Baris Input Terkunci di Bagian Bawah */
        .input-bar {
          position: sticky;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          padding: 10px 14px calc(10px + env(safe-area-inset-bottom));
          background: #1e1f20;
          border-top: 1px solid #2e2f30;
          gap: 10px;
          flex-shrink: 0;
          z-index: 100;
        }
        .btn-round {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: #2b2c2f;
          color: #fff;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .btn-round.send {
          background: #1a73e8;
          font-size: 17px;
        }
        .btn-round.send:disabled {
          background: #3c4043;
          color: #888;
          cursor: not-allowed;
        }
        .chat-in {
          flex: 1;
          background: #2b2c2f;
          border: 1px solid #3c4043;
          border-radius: 22px;
          padding: 10px 16px;
          color: #fff;
          font-size: 14.5px;
          outline: none;
          resize: none;
          max-height: 110px;
        }
      `}</style>

      {/* Header Sticky (Kerapatan Tinggi) */}
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

      {/* Popover Pencarian Model */}
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
              autoFocus
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

      {/* Area Pesan Berkelanjutan */}
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

      {/* Modal Action Sheet Lampiran */}
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

      {/* Sticky Bottom Bar */}
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
