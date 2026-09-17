import React, { useState, useEffect } from 'react';

interface ModelItem {
  id: string;
  name: string;
  provider: string;
  task: 'text' | 'coding' | 'image' | 'video' | 'deep_reason';
  tier: 'low' | 'medium' | 'high';
  isCombine: boolean;
}

export default function App() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<'text' | 'coding' | 'image' | 'video' | 'deep_reason'>('text');
  const [selectedTier, setSelectedTier] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [selectedModel, setSelectedModel] = useState<string>('Oc-full/glm/glm-5.3');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [customKey, setCustomKey] = useState(localStorage.getItem('x_key') || 'comku');
  const [customBase, setCustomBase] = useState(localStorage.getItem('x_base') || 'https://9rxawd.up.railway.app/v1');

  const [prompt, setPrompt] = useState('');
  const [reply, setReply] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/models', {
        headers: {
          'x-custom-key': customKey,
          'x-custom-base': customBase
        }
      });
      const data = await res.json();
      if (data.success && data.models?.length > 0) {
        setModels(data.models);
        const def = data.models.find((m: ModelItem) => m.id.includes('glm-5.3')) || data.models[0];
        if (def) setSelectedModel(def.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const saveSettings = () => {
    localStorage.setItem('x_key', customKey);
    localStorage.setItem('x_base', customBase);
    fetchModels();
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setReply('');
    try {
      const res = await fetch('/api/playground/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt,
          task: selectedTask,
          customKey,
          customBase
        })
      });
      const data = await res.json();
      setReply(data.reply || data.error || 'Tidak ada respons.');
    } catch (err: any) {
      setReply('Koneksi Error: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredModels = models.filter(m => {
    const matchTask = selectedTask === 'text' ? true : m.task === selectedTask;
    const matchTier = selectedTier === 'all' ? true : m.tier === selectedTier;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.id.toLowerCase().includes(search.toLowerCase()) || m.provider.toLowerCase().includes(search.toLowerCase());
    return matchTask && matchTier && matchSearch;
  });

  const activeModelDetails = models.find(m => m.id === selectedModel);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 selection:bg-emerald-500 selection:text-black">
      <header className="max-w-6xl mx-auto mb-8 p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-black shadow-lg shadow-emerald-500/20">
            X
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              X AWD Command Center
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">Universal Multi-Task Autonomous Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="password"
            placeholder="API Key..."
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900/90 border border-white/10 rounded-xl focus:border-emerald-400 focus:outline-none w-32 font-mono text-emerald-300"
          />
          <button
            onClick={saveSettings}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-black hover:opacity-90 transition-all cursor-pointer"
          >
            Sync Keys
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              1. Kategori Tugas (Task Mode)
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'text', label: '✍️ Text & Story', desc: 'Writing, Copy, Chat' },
                { id: 'coding', label: '💻 Coding & Dev', desc: 'Syntax, Logic, Refactor' },
                { id: 'deep_reason', label: '🧠 Deep Reason', desc: 'Thinking, Step-by-Step' },
                { id: 'image', label: '🎨 Image & Vision', desc: 'Visual, OCR, Multimodal' },
                { id: 'video', label: '🎬 Video & Media', desc: 'Omni, Transcribe, Audio' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTask(t.id as any)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedTask === t.id
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{t.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <div className="text-[11px] font-mono text-slate-400 mb-2">Tingkatan Performa (Tier):</div>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'low', label: '🟢 Low' },
                  { id: 'medium', label: '🟡 Mid' },
                  { id: 'high', label: '🟣 High' }
                ].map(tr => (
                  <button
                    key={tr.id}
                    onClick={() => setSelectedTier(tr.id as any)}
                    className={`px-3 py-1 text-[10px] rounded-lg border font-mono transition-all cursor-pointer ${
                      selectedTier === tr.id
                        ? 'bg-white text-black font-bold border-white'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {tr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4 relative">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                2. Model Engine Selector
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {models.length} Terdeteksi
              </span>
            </h3>

            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-emerald-500/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="text-left truncate pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">
                    {activeModelDetails?.name || selectedModel}
                  </span>
                  {activeModelDetails?.isCombine && (
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-400/40 text-emerald-300">
                      COMBINE
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                  {selectedModel} • <span className="text-emerald-400 font-bold uppercase">{activeModelDetails?.tier || 'HIGH'} TIER</span>
                </div>
              </div>
              <div className={`p-1.5 rounded-lg bg-white/5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-50 left-6 right-6 top-32 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-3xl border border-white/20 shadow-2xl space-y-2">
                <input
                  type="text"
                  placeholder="Cari nama model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                />

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {filteredModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedModel(m.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                        selectedModel === m.id
                          ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                          : 'hover:bg-white/5 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{m.name}</span>
                          {m.isCombine && (
                            <span className="px-1.5 py-0.2 text-[8px] font-bold rounded bg-slate-800 border border-slate-700 text-cyan-300">
                              COMBINE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{m.id}</div>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold shrink-0 ${
                        m.tier === 'high' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        m.tier === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {m.tier}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-xl flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚡</span> Playground Output Console
                </h2>
                <div className="text-[10px] text-slate-400 font-mono">
                  Engine: <span className="text-emerald-400 font-bold">{selectedModel}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                Mode: {selectedTask.toUpperCase()}
              </span>
            </div>

            <div className="relative">
              <textarea
                rows={4}
                placeholder={`Masukkan prompt testing ${selectedTask}...`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-950/70 border border-white/10 focus:border-emerald-400/60 focus:outline-none text-xs text-white placeholder-slate-500 font-mono resize-none"
              />
              <button
                onClick={handleExecute}
                disabled={isExecuting || !prompt.trim()}
                className="absolute bottom-3 right-3 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isExecuting ? 'Memproses...' : 'Uji Sekarang →'}
              </button>
            </div>

            <div className="flex-1 min-h-[280px] p-5 rounded-2xl bg-slate-950/90 border border-white/10 overflow-y-auto custom-scrollbar font-mono text-xs">
              {reply ? (
                <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {reply}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs italic">
                  Hasil respon dari engine akan muncul di sini...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
