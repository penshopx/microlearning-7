import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import Head from "next/head";
import Link from "next/link";
import { Sun, Moon, Home, Search, Zap, X, ChevronRight, Copy, Download, RotateCcw, Loader2, Star, Sparkles, Lock, CheckCircle2, ArrowLeft, Heart, Clock, BookMarked } from "lucide-react";
import { AI_TOOLS, TOOL_CATEGORIES, type AiTool } from "@/lib/tools-data";

const RECENTS_KEY = "chaesa_recent_tools_v1";
const FAVS_KEY = "chaesa_fav_tools_v1";
const MAX_RECENTS = 6;

/* ── Markdown renderer (reuses chat pattern) ─────── */
function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  const formatInline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={idx}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*")) return <em key={idx}>{p.slice(1, -1)}</em>;
      if (p.startsWith("`") && p.endsWith("`")) return <code key={idx} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono text-rose-600 dark:text-rose-400">{p.slice(1, -1)}</code>;
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("#### ")) { elements.push(<h4 key={i} className="font-bold text-sm mt-3 mb-1 text-gray-800 dark:text-gray-200">{formatInline(line.slice(5))}</h4>); }
    else if (line.startsWith("### ")) { elements.push(<h3 key={i} className="font-bold text-base mt-4 mb-1 text-gray-900 dark:text-gray-100">{formatInline(line.slice(4))}</h3>); }
    else if (line.startsWith("## ")) { elements.push(<h2 key={i} className="font-bold text-lg mt-4 mb-2 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-1">{formatInline(line.slice(3))}</h2>); }
    else if (line.startsWith("# ")) { elements.push(<h1 key={i} className="font-bold text-xl mt-4 mb-2 text-gray-900 dark:text-gray-100">{formatInline(line.slice(2))}</h1>); }
    else if (line.startsWith("---")) { elements.push(<hr key={i} className="border-gray-200 dark:border-gray-700 my-3" />); }
    else if (line.startsWith("| ")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) { tableLines.push(lines[i]); i++; }
      const [header, , ...rows] = tableLines;
      const headers = header.split("|").filter(Boolean).map(h => h.trim());
      elements.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-3 rounded border border-gray-200 dark:border-gray-700">
          <table className="text-xs w-full">
            <thead><tr className="bg-gray-100 dark:bg-gray-800">{headers.map((h, j) => <th key={j} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">{formatInline(h)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => { const cells = r.split("|").filter(Boolean).map(c => c.trim()); return <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-gray-900/50" : "bg-gray-50 dark:bg-gray-800/50"}>{cells.map((c, ci) => <td key={ci} className="px-3 py-1.5 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">{formatInline(c)}</td>)}</tr>; })}</tbody>
          </table>
        </div>
      );
      continue;
    }
    else if (/^[0-9]+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[0-9]+\. /.test(lines[i])) { items.push(lines[i].replace(/^[0-9]+\. /, "")); i++; }
      elements.push(<ol key={`ol-${i}`} className="list-decimal pl-5 my-2 space-y-1">{items.map((it, idx) => <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">{formatInline(it)}</li>)}</ol>);
      continue;
    }
    else if (line.startsWith("- ") || line.startsWith("• ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("• "))) { items.push(lines[i].slice(2)); i++; }
      elements.push(<ul key={`ul-${i}`} className="list-disc pl-5 my-2 space-y-1">{items.map((it, idx) => <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">{formatInline(it)}</li>)}</ul>);
      continue;
    }
    else if (line.trim() === "") { elements.push(<div key={i} className="h-2" />); }
    else { elements.push(<p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{formatInline(line)}</p>); }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

/* ── Tool Card ───────────────────────────────────── */
function ToolCard({
  tool, onClick, isFav, onToggleFav,
}: {
  tool: AiTool;
  onClick: () => void;
  isFav?: boolean;
  onToggleFav?: (e: React.MouseEvent) => void;
}) {
  const categoryDef = TOOL_CATEGORIES.find(c => c.id === tool.category);
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
      className="cursor-pointer text-left group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-green-400 dark:hover:border-green-500 hover:shadow-md transition-all duration-200 relative flex flex-col gap-2 select-none"
    >
      {/* Fav button */}
      {onToggleFav && (
        <button
          onClick={onToggleFav}
          className={`absolute top-2.5 left-2.5 p-1 rounded-md transition-all z-10 ${isFav ? "text-rose-500" : "text-gray-300 dark:text-gray-700 hover:text-rose-400"}`}
          title={isFav ? "Hapus dari favorit" : "Simpan ke favorit"}
        >
          <Heart className="w-3 h-3" fill={isFav ? "currentColor" : "none"} />
        </button>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 absolute top-3 right-3">
        {tool.isNew && <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">BARU</span>}
        {tool.isPopular && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />POPULER</span>}
        {tool.tier === "pro" && <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />PRO</span>}
      </div>

      {/* Icon */}
      <div className="text-3xl leading-none mt-1">{tool.icon}</div>

      {/* Category */}
      <div className="text-[10px] text-gray-400 dark:text-gray-600 font-medium">{categoryDef?.icon} {categoryDef?.label}</div>

      {/* Name */}
      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors pr-8 leading-tight">{tool.name}</div>

      {/* Description */}
      <div className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed line-clamp-2">{tool.description}</div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        {tool.estimatedTime && <span className="text-[10px] text-gray-400 dark:text-gray-600">⏱ {tool.estimatedTime}</span>}
        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium ml-auto group-hover:underline">Gunakan →</span>
      </div>
    </div>
  );
}

/* ── Form Field ──────────────────────────────────── */
function FormField({ field, value, onChange }: {
  field: AiTool["fields"][number];
  value: string;
  onChange: (v: string) => void;
}) {
  const base = "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:border-green-500 dark:focus:border-green-500 transition-colors placeholder-gray-400 dark:placeholder-gray-600";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>
      {field.hint && <p className="text-[10px] text-gray-400 dark:text-gray-600">{field.hint}</p>}
      {field.type === "select" ? (
        <select className={base} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Pilih —</option>
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          className={base + " resize-none"}
          rows={field.rows || 3}
          placeholder={field.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type={field.type}
          className={base}
          placeholder={field.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────── */
export default function ToolsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState<AiTool | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favIds, setFavIds] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  /* Hydrate from localStorage */
  useEffect(() => {
    setMounted(true);
    try {
      const r = localStorage.getItem(RECENTS_KEY);
      if (r) setRecentIds(JSON.parse(r));
      const f = localStorage.getItem(FAVS_KEY);
      if (f) setFavIds(JSON.parse(f));
    } catch {}
  }, []);

  /* Derived lists */
  const recentTools = recentIds.map(id => AI_TOOLS.find(t => t.id === id)).filter(Boolean) as AiTool[];
  const favTools = favIds.map(id => AI_TOOLS.find(t => t.id === id)).filter(Boolean) as AiTool[];

  /* Filter tools */
  const filteredTools = AI_TOOLS.filter(t => {
    if (activeCategory === "recent") return recentIds.includes(t.id);
    if (activeCategory === "favorites") return favIds.includes(t.id);
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function trackRecent(tool: AiTool) {
    setRecentIds(prev => {
      const next = [tool.id, ...prev.filter(id => id !== tool.id)].slice(0, MAX_RECENTS);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function toggleFav(toolId: string) {
    setFavIds(prev => {
      const next = prev.includes(toolId) ? prev.filter(id => id !== toolId) : [toolId, ...prev];
      try { localStorage.setItem(FAVS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function openTool(tool: AiTool) {
    setSelectedTool(tool);
    setFormData({});
    setOutput(null);
    setError(null);
    trackRecent(tool);
  }

  function closeTool() {
    setSelectedTool(null);
    setOutput(null);
    setError(null);
  }

  function setField(id: string, value: string) {
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  function isFormValid() {
    if (!selectedTool) return false;
    return selectedTool.fields
      .filter(f => f.required)
      .every(f => formData[f.id]?.trim());
  }

  async function runTool() {
    if (!selectedTool || !isFormValid()) return;
    setLoading(true);
    setOutput(null);
    setError(null);
    try {
      const res = await fetch("/api/ai/run-tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: selectedTool.id, formData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      setOutput(data.output);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadOutput() {
    if (!output || !selectedTool) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTool.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* Category counts */
  const categoriesWithCount = TOOL_CATEGORIES.map(cat => ({
    ...cat,
    count: cat.id === "all" ? AI_TOOLS.length : AI_TOOLS.filter(t => t.category === cat.id).length,
  }));

  return (
    <>
      <Head>
        <title>AI Tools Hub – Chaesa Construction AI</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-black text-green-600 tracking-tight">Chaesa</Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Tools Hub</span>
            <span className="hidden sm:flex text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">{AI_TOOLS.length}+ Tools</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <Home className="w-3.5 h-3.5" /> Beranda
            </Link>
            <Link href="/ai-agents" className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors ml-2">
              🤖 AI Experts
            </Link>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="ml-2 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {mounted && (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
            </button>
          </div>
        </nav>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Left Sidebar ── */}
          <aside className="hidden lg:flex flex-col w-58 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 gap-1 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto" style={{width:"224px"}}>

            {/* My Tools section */}
            {mounted && (recentTools.length > 0 || favTools.length > 0) && (
              <div className="mb-2">
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1 px-2">My Tools</div>
                {favTools.length > 0 && (
                  <button
                    onClick={() => { setActiveCategory("favorites"); closeTool(); }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      activeCategory === "favorites"
                        ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" fill="currentColor" /> Favorit</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">{favTools.length}</span>
                  </button>
                )}
                {recentTools.length > 0 && (
                  <button
                    onClick={() => { setActiveCategory("recent"); closeTool(); }}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      activeCategory === "recent"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Terakhir Dipakai</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">{recentTools.length}</span>
                  </button>
                )}
              </div>
            )}

            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1 px-2">Kategori</div>
            {categoriesWithCount.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); closeTool(); }}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  activeCategory === cat.id
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                }`}
              >
                <span>{cat.icon} {cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  activeCategory === cat.id
                    ? "bg-green-200 dark:bg-green-800/60 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-600"
                }`}>{cat.count}</span>
              </button>
            ))}
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 flex overflow-hidden">
            {/* Tool Grid */}
            <div className={`flex-1 flex flex-col overflow-y-auto transition-all duration-300 ${selectedTool ? "hidden xl:flex" : "flex"}`}>
              {/* Hero */}
              <div className="bg-gradient-to-br from-gray-950 via-green-950/60 to-emerald-950/40 dark:from-gray-950 dark:via-green-950/60 dark:to-emerald-950/40 border-b border-green-900/30 px-6 py-7 relative overflow-hidden">
                {/* decorative rings */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/5 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full" />
                <div className="max-w-4xl mx-auto relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <Zap className="w-3 h-3" /> AI Tools Hub
                    </span>
                    <span className="text-[10px] text-green-500/70">Tanpa prompting. Langsung jadi.</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">{AI_TOOLS.length}+ Aplikasi AI Konstruksi</h1>
                  <p className="text-sm text-gray-400 mb-5 max-w-xl">Isi form sederhana — AI hasilkan JSA, RAB, Notulen, BEP, dan dokumen teknis profesional langsung siap pakai. Sesuai standar SNI, PP, dan FIDIC.</p>
                  {/* Stats row */}
                  <div className="flex flex-wrap gap-5">
                    {[
                      { v: `${AI_TOOLS.length}+`, l: "AI Tools", color: "text-green-400" },
                      { v: "8", l: "Disiplin", color: "text-emerald-400" },
                      { v: "SNI/PP", l: "Standar Indonesia", color: "text-teal-400" },
                      { v: "Free", l: "Akses Gratis*", color: "text-cyan-400" },
                    ].map(s => (
                      <div key={s.v} className="flex flex-col">
                        <span className={`text-xl font-black ${s.color}`}>{s.v}</span>
                        <span className="text-[10px] text-gray-500">{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Recent Tools Strip ── */}
              {activeCategory === "all" && !search && mounted && recentTools.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 px-4 py-3">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Terakhir Digunakan</span>
                      </div>
                      <button onClick={() => { setActiveCategory("recent"); closeTool(); }} className="text-[10px] text-blue-500 hover:underline">Lihat semua →</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {recentTools.map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => openTool(tool)}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all group"
                        >
                          <span className="text-base leading-none">{tool.icon}</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 whitespace-nowrap max-w-[140px] truncate">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Featured / Popular Strip ── */}
              {activeCategory === "all" && !search && (
                <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Tools Terpopuler</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {AI_TOOLS.filter(t => t.isPopular).slice(0, 8).map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => openTool(tool)}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all group"
                        >
                          <span className="text-lg leading-none">{tool.icon}</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-700 dark:group-hover:text-green-400 whitespace-nowrap">{tool.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── New Tools Strip ── */}
              {activeCategory === "all" && !search && (
                <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Baru Ditambahkan</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {AI_TOOLS.filter(t => t.isNew).slice(0, 8).map(tool => (
                        <button
                          key={tool.id}
                          onClick={() => openTool(tool)}
                          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all group"
                        >
                          <span className="text-lg leading-none">{tool.icon}</span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 whitespace-nowrap">{tool.name}</span>
                          <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">BARU</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Search + Category Tabs (mobile) */}
              <div className="px-4 py-3 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 sticky top-[53px] z-10">
                <div className="max-w-4xl mx-auto flex flex-col gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari tool: JSA, RAB, Klaim, BEP..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-green-500 transition-colors"
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {/* Mobile category scroll */}
                  <div className="flex lg:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categoriesWithCount.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-all ${
                          activeCategory === cat.id
                            ? "bg-green-600 text-white font-semibold"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {cat.icon} {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 px-4 py-4">
                <div className="max-w-4xl mx-auto">
                  {filteredTools.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                      {activeCategory === "favorites" ? (
                        <>
                          <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium mb-1">Belum ada tool favorit</p>
                          <p className="text-xs">Klik ikon ❤ di sudut kartu tool untuk menyimpannya ke sini</p>
                        </>
                      ) : activeCategory === "recent" ? (
                        <>
                          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm font-medium mb-1">Belum ada riwayat penggunaan</p>
                          <p className="text-xs">Tool yang pernah Anda buka akan muncul di sini</p>
                        </>
                      ) : (
                        <>
                          <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Tidak ada tool yang ditemukan untuk "<strong>{search}</strong>"</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-gray-500 dark:text-gray-600 mb-3 flex items-center justify-between">
                        <span>
                          {activeCategory === "favorites" ? `${filteredTools.length} tool favorit` :
                           activeCategory === "recent" ? `${filteredTools.length} terakhir digunakan` :
                           `${filteredTools.length} tools`}
                          {activeCategory !== "all" && activeCategory !== "favorites" && activeCategory !== "recent" && ` · ${categoriesWithCount.find(c => c.id === activeCategory)?.label}`}
                          {search && ` · "${search}"`}
                        </span>
                        {(activeCategory === "favorites" || activeCategory === "recent") && (
                          <button onClick={() => setActiveCategory("all")} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">← Semua tools</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredTools.map(tool => (
                          <ToolCard
                            key={tool.id}
                            tool={tool}
                            onClick={() => openTool(tool)}
                            isFav={favIds.includes(tool.id)}
                            onToggleFav={(e) => { e.stopPropagation(); toggleFav(tool.id); }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center mt-6">*Tools gratis tersedia tanpa batas. Tools PRO memerlukan akun premium Chaesa.</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Tool Panel (form + output) ── */}
            {selectedTool && (
              <div className="flex-1 xl:max-w-2xl xl:w-[640px] xl:border-l xl:border-gray-200 xl:dark:border-gray-800 flex flex-col bg-white dark:bg-gray-950 overflow-y-auto">
                {/* Panel Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
                  <button onClick={closeTool} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="text-2xl">{selectedTool.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{selectedTool.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-600">{selectedTool.description}</div>
                  </div>
                  <button
                    onClick={() => toggleFav(selectedTool.id)}
                    className={`p-1.5 rounded-lg transition-all ${favIds.includes(selectedTool.id) ? "text-rose-500 bg-rose-50 dark:bg-rose-950/30" : "text-gray-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"}`}
                    title={favIds.includes(selectedTool.id) ? "Hapus dari favorit" : "Simpan ke favorit"}
                  >
                    <Heart className="w-4 h-4" fill={favIds.includes(selectedTool.id) ? "currentColor" : "none"} />
                  </button>
                  {selectedTool.tier === "pro" && (
                    <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                </div>

                <div className="flex-1 px-4 py-4 flex flex-col gap-6">
                  {/* Form */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Isi Parameter</span>
                      <span className="text-[10px] text-gray-400">— tidak perlu prompting</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {selectedTool.fields.map(field => (
                        <FormField
                          key={field.id}
                          field={field}
                          value={formData[field.id] || ""}
                          onChange={v => setField(field.id, v)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={runTool}
                    disabled={loading || !isFormValid()}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white shadow-md shadow-green-200 dark:shadow-green-900/30"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sedang memproses...</>
                    ) : (
                      <><Zap className="w-4 h-4" /> Generate {selectedTool.outputLabel}</>
                    )}
                  </button>
                  {!isFormValid() && !loading && (
                    <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 -mt-4">Lengkapi field yang wajib diisi (*) terlebih dahulu</p>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">Gagal memproses</p>
                        <p className="text-xs text-red-600 dark:text-red-500">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Output */}
                  {output && (
                    <div ref={outputRef} className="flex flex-col gap-3">
                      {/* Output header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{selectedTool.outputLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={runTool} title="Generate ulang" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={copyOutput} title="Copy" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={downloadOutput} title="Download" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Output hint */}
                      {selectedTool.outputHint && (
                        <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-lg px-3 py-1.5">
                          💡 {selectedTool.outputHint}
                        </div>
                      )}

                      {/* Output body */}
                      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                        <MarkdownOutput text={output} />
                      </div>

                      {/* Action footer */}
                      <div className="flex gap-2">
                        <button
                          onClick={copyOutput}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Tersalin!</> : <><Copy className="w-3.5 h-3.5" /> Salin Output</>}
                        </button>
                        <button
                          onClick={downloadOutput}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download .txt
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-400 dark:text-gray-700 text-center">Output AI — verifikasi dengan insinyur berlisensi untuk keputusan teknis final</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
