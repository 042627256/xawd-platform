import React, { useState, useEffect } from 'react';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task: string;
  tier: string;
  isCombine: boolean;
}

export default function App() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedTask, setSelectedTask] = useState('text');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedModel, setSelectedModel] = useState('Oc-full/glm/glm-5.3');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await fetch('https://api.xawd.my.id/api/models');
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setSelectedModel(data.models[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setReply('Sedang memproses...');
    try {
      const res = await fetch('https://api.xawd.my.id/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel || 'Oc-full/glm/glm-5.3',
          prompt: prompt,
          task: selectedTask
        })
      });
      const data = await res.json();
      setReply(data.reply || data.error || 'Tidak ada balasan.');
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

  const activeModel = models.find(m => m.id === selectedModel);

  return (
    <div className="frame-wrapper">
      <nav className="frame-navbar">
        <div className="container nav-content">
          <div className="nav-brand">
            <span className="brand-logo">X</span>
            <span className="brand-name">X AWD <span className="brand-highlight">Engine</span></span>
          </div>
          <span className="badge-pill">Autonomous Intelligence</span>
        </div>
      </nav>

      <main className="container main-content mt-4">
        <div className="row">
          {/* Kolom Kiri: Navigasi Tugas & Model */}
          <div className="col-lg-5 mb-3">
            <div className="frame-card mb-3">
              <h3 className="card-title mb-2">1. Kategori Tugas</h3>
              <div className="task-selector-grid">
                {[
                  { id: 'text', icon: '✍️', label: 'Text & Story' },
                  { id: 'coding', icon: '💻', label: 'Coding & Dev' },
                  { id: 'deep_reason', icon: '🧠', label: 'Deep Reason' },
                  { id: 'image', icon: '🎨', label: 'Image & Vision' },
                  { id: 'video', icon: '🎬', label: 'Video & Media' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t.id)}
                    className={`task-tile ${selectedTask === t.id ? 'task-tile-active' : ''}`}
                  >
                    <span>{t.icon}</span>
                    <span className="task-tile-title">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="tier-pills mt-3">
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

            <div className="frame-card model-dropdown-card">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="card-title">2. Model Engine</h3>
                <span className="badge-count">{models.length} Terdeteksi</span>
              </div>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="model-select-btn"
              >
                <div>
                  <div className="model-select-name">{activeModel?.name || selectedModel}</div>
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
                        <span className="model-item-title">{m.name}</span>
                        <span className={`tier-tag tag-${m.tier}`}>{m.tier}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Playground Console */}
          <div className="col-lg-7">
            <div className="frame-card console-card">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <h3 className="card-title">Console Output</h3>
                <span className="badge-pill">{selectedTask.toUpperCase()}</span>
              </div>

              <textarea
                rows={4}
                placeholder="Ketik pertanyaan untuk X AWD..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="frame-textarea mb-2"
              />

              <button
                onClick={handleExecute}
                disabled={isExecuting || !prompt.trim()}
                className="btn-execute-primary mb-3"
              >
                {isExecuting ? 'Memproses...' : 'Kirim Perintah →'}
              </button>

              <div className="response-screen">
                {reply ? reply : 'Hasil jawaban akan muncul di sini...'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
