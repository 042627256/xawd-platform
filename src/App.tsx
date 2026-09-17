import React, { useState } from 'react';
import staticModelList from './data/models.json';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task: string;
  tier: string;
  isCombine: boolean;
}

export default function App() {
  const [models] = useState<ModelItem[]>(staticModelList as ModelItem[]);
  const [selectedTask, setSelectedTask] = useState('text');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedModel, setSelectedModel] = useState<string>(
    staticModelList.length > 0 ? (staticModelList[0] as any).id : 'ag/gemini-3.8-flash-medium'
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setReply('Sedang memproses respons X AWD...');
    try {
      const res = await fetch('https://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          task: selectedTask
        })
      });
      const data = await res.json();
      if (data.reply) {
        setReply(data.reply);
      } else if (data.error) {
        setReply('Perhatian: ' + data.error);
      } else {
        setReply('Tidak ada respons dari engine.');
      }
    } catch (err: any) {
      setReply('Gagal koneksi: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredModels = models.filter(m => {
    const matchTask = selectedTask === 'text' ? true : m.task === selectedTask;
    const matchTier = selectedTier === 'all' ? true : m.tier === selectedTier;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                        m.id.toLowerCase().includes(search.toLowerCase());
    return matchTask && matchTier && matchSearch;
  });

  const activeModel = models.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel.split('/').pop() || selectedModel,
    tier: 'MEDIUM'
  };

  return (
    <div className="frame-wrapper">
      <nav className="frame-navbar">
        <div className="container nav-content">
          <div className="nav-brand">
            <span className="brand-logo">X</span>
            <span className="brand-name">X AWD <span className="brand-highlight">Engine</span></span>
          </div>
          <span className="badge-pill">Enterprise Cluster</span>
        </div>
      </nav>

      <header className="hero-section">
        <div className="container text-center">
          <span className="badge-pill">Multi-Model Routing</span>
          <h1 className="hero-title">Frame Command Center</h1>
          <p className="hero-desc">Sistem kendali multi-engine otonom X AWD.</p>
        </div>
      </header>

      <main className="container main-content">
        <div className="row">
          {/* Kolom Kiri */}
          <div className="col-lg-5 mb-4">
            <div className="frame-card mb-3">
              <div className="card-header-clean">
                <span className="header-num">01</span>
                <div>
                  <h3 className="card-title">Kategori Tugas</h3>
                  <p className="card-subtitle">Pilih mode pengerjaan</p>
                </div>
              </div>

              <div className="task-selector-grid">
                {[
                  { id: 'text', icon: '✍️', label: 'Text & Story', sub: 'Writing, Copy, Coretax' },
                  { id: 'coding', icon: '💻', label: 'Coding & Dev', sub: 'Syntax, Logic, Refactor' },
                  { id: 'deep_reason', icon: '🧠', label: 'Deep Reason', sub: 'Logic, Thinking' },
                  { id: 'image', icon: '🎨', label: 'Image & Vision', sub: 'Visual Multi-Modal' },
                  { id: 'video', icon: '🎬', label: 'Video & Media', sub: 'Media & Transcribe' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t.id)}
                    className={`task-tile ${selectedTask === t.id ? 'task-tile-active' : ''}`}
                  >
                    <span className="task-tile-icon">{t.icon}</span>
                    <div>
                      <div className="task-tile-title">{t.label}</div>
                      <div className="task-tile-sub">{t.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="tier-wrapper mt-3">
                <label className="tier-title">Tingkatan Model:</label>
                <div className="tier-pills">
                  {['all', 'low', 'medium', 'high'].map(tr => (
                    <button
                      key={tr}
                      onClick={() => setSelectedTier(tr)}
                      className={`tier-pill ${selectedTier === tr ? 'tier-pill-active' : ''}`}
                    >
                      {tr.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Model Selector Card */}
            <div className="frame-card model-dropdown-card">
              <div className="card-header-clean">
                <span className="header-num">02</span>
                <div className="w-100 d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="card-title">Model Selector</h3>
                    <p className="card-subtitle">{models.length} Model Aktif Terdeteksi</p>
                  </div>
                  <span className="badge-count">{filteredModels.length} Tersedia</span>
                </div>
              </div>

              <div className="dropdown-container">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="model-select-btn"
                >
                  <div>
                    <div className="model-select-name">{activeModel.name}</div>
                    <div className="model-select-id">{selectedModel}</div>
                  </div>
                  <span>{isDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {isDropdownOpen && (
                  <div className="model-menu-popover">
                    <input
                      type="text"
                      placeholder="Cari engine..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="search-field"
                    />
                    <div className="popover-scrollable">
                      {filteredModels.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(m.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`model-item-row ${selectedModel === m.id ? 'model-item-selected' : ''}`}
                        >
                          <div>
                            <div className="model-item-title">{m.name}</div>
                            <div className="model-item-sub">{m.id}</div>
                          </div>
                          <span className={`tier-tag tag-${m.tier}`}>{m.tier}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan */}
          <div className="col-lg-7">
            <div className="frame-card console-card">
              <div className="card-header-clean border-bottom pb-3 mb-3">
                <span className="header-num">03</span>
                <div className="w-100 d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="card-title">Playground Output Console</h3>
                    <p className="card-subtitle">Active Engine: <strong className="text-primary">{selectedModel}</strong></p>
                  </div>
                  <span className="badge-mode-pill">{selectedTask.toUpperCase()}</span>
                </div>
              </div>

              <div className="prompt-wrapper">
                <textarea
                  rows={4}
                  placeholder="Ketik instruksi atau pertanyaan untuk X AWD..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="frame-textarea"
                />
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !prompt.trim()}
                  className="btn-execute-primary"
                >
                  {isExecuting ? 'Mengeksekusi...' : 'Jalankan Prompt →'}
                </button>
              </div>

              <div className="response-container mt-3">
                <div className="response-header">
                  <span>HASIL EKSEKUSI</span>
                  {reply && <span className="text-success">● Status OK</span>}
                </div>
                <div className="response-screen">
                  {reply ? (
                    <div className="response-text">{reply}</div>
                  ) : (
                    <div className="response-placeholder">
                      Hasil respons dari engine X AWD akan tampil rapi di sini...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
