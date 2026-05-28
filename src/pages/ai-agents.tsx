/* Chaesa Multi-Agent AI — Event-Driven Architecture
   Inspired by: Event-Driven Design for Agents, Confluent 2025
   Patterns implemented:
   - Orchestrator-Worker: Auto-Route selects best specialist
   - Blackboard Pattern: "Kolaborasi" mode, 2 agents + synthesis
   - Agent Memory: Long-term localStorage-backed project context
   - Tool Interface: Visual tool-call stream per agent
   - Event Stream: Live visualization of agent reasoning steps */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send, Zap, ChevronRight, RotateCcw, Copy, Check,
  Bot, User, Menu, X, Info, Sparkles, Brain,
  Download, AtSign, Lightbulb, Users2, Hash,
  Database, Trash2, Plus, ChevronDown, ChevronUp,
  GitMerge, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { ChaesaLogo } from "@/components/ChaesaLogo";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { AGENTS } from "@/lib/agents-data";
import type { AgentId } from "@/lib/agents-data";
import {
  loadMemory, saveMemory, clearMemory, deleteFact,
  extractFacts, mergeMemory, memoryToContext,
} from "@/lib/agent-memory";
import type { MemoryFact } from "@/lib/agent-memory";
import { extractCitations, TYPE_CONFIG } from "@/lib/standards-data";
import type { Citation } from "@/lib/standards-data";

/* ── Types ──────────────────────────────────────────── */
interface HistoryItem { role: "user" | "assistant"; content: string; }
interface AgentInfo { id: string; name: string; title: string; icon: string; color: string; bg: string; accent: string; }
interface Contribution { agent: AgentInfo & { routing: { agentId: string; confidence: number; reason: string } }; response: string; }

interface AgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent?: AgentInfo;
  followups?: string[];
  routing?: { reason: string; confidence: number; manual: boolean };
  collab?: { contributions: Contribution[]; synthesis: string };
  timestamp: Date;
}

/* ── Event stream steps per agent ───────────────────── */
const ORCHESTRATOR_EVENTS = [
  "🔍 Orchestrator menganalisis pertanyaan...",
  "🧠 Mengevaluasi 8 ahli konstruksi tersedia...",
  "🎯 Memilih spesialis yang paling relevan...",
  "📡 Menghubungi spesialis...",
];

const AGENT_EVENTS: Record<string, string[]> = {
  struktur:  ["📐 Menganalisis geometri penampang...", "📋 Mereferensikan SNI 2847:2019...", "🔢 Menghitung momen dan gaya geser...", "✅ Memverifikasi rasio tulangan min-maks..."],
  k3:        ["⛑️ Mengidentifikasi potensi bahaya...", "📋 Mereferensikan PP 50/2012 & ISO 45001...", "📝 Menyusun prosedur JSA/HIRARC...", "✅ Memverifikasi hierarki pengendalian risiko..."],
  mep:       ["⚡ Menganalisis beban mekanikal/elektrikal...", "📋 Mereferensikan PUIL 2011 & ASHRAE...", "🔢 Menghitung kapasitas dan sizing...", "✅ Memverifikasi compliance standar MEP..."],
  geoteknik: ["⛏️ Menginterpretasikan data soil investigation...", "📋 Mereferensikan SNI 8460:2017...", "🔢 Menghitung daya dukung & penurunan...", "✅ Memeriksa safety factor & deformasi..."],
  kontrak:   ["⚖️ Menganalisis klausul kontrak...", "📋 Mereferensikan FIDIC & Perpres 16/2018...", "📝 Menyusun posisi hukum dan argumen...", "✅ Memverifikasi prosedur dan tenggat..."],
  pm:        ["📊 Menganalisis jadwal dan resource...", "📋 Mereferensikan PMBOK & baseline proyek...", "🔢 Menghitung EVM dan jalur kritis...", "✅ Menyusun action plan terstruktur..."],
  rab:       ["💰 Menganalisis volume pekerjaan...", "📋 Mereferensikan HSPK & SNI Analisa Harga...", "🔢 Menyusun breakdown harga satuan...", "✅ Memverifikasi overhead, pajak & profit..."],
  bim:       ["🖥️ Menganalisis workflow digital...", "📋 Mereferensikan LOD, ISO 19650 & BEP...", "🔧 Menyiapkan koordinasi antar disiplin...", "✅ Memverifikasi clash detection & deliverables..."],
};

const COLLAB_EVENTS = [
  "🔍 Orchestrator menganalisis pertanyaan multi-domain...",
  "🤝 Blackboard: Memilih 2 ahli terbaik...",
  "📡 Mengirim ke Papan Kolaborasi...",
  "⚡ Kedua ahli menyusun jawaban secara paralel...",
  "🔄 Synthesizer mengintegrasikan perspektif...",
  "✅ Jawaban kolaboratif siap...",
];

/* ── Quick-starts ───────────────────────────────────── */
const QUICK_STARTS = [
  { agentId: "struktur"  as AgentId, prompt: "Hitung kapasitas balok beton 30x60 cm, tulangan 4D19, fc'=25 MPa" },
  { agentId: "k3"        as AgentId, prompt: "Buat JSA untuk pekerjaan bekisting di ketinggian 10 m" },
  { agentId: "mep"       as AgentId, prompt: "Hitung kapasitas AC ruang kantor 10x15 m untuk 20 orang" },
  { agentId: "geoteknik" as AgentId, prompt: "Interpretasikan SPT N-value 15 untuk fondasi gedung 5 lantai" },
  { agentId: "kontrak"   as AgentId, prompt: "Klaim keterlambatan force majeure di kontrak FIDIC?" },
  { agentId: "pm"        as AgentId, prompt: "Template WBS proyek gedung perkantoran 5 lantai" },
  { agentId: "rab"       as AgentId, prompt: "Anggaran kasar ruko 3 lantai di Jakarta 2025?" },
  { agentId: "bim"       as AgentId, prompt: "Clash detection struktur vs MEP di Navisworks?" },
];

const SAMPLE_PROMPTS: Record<AgentId, string[]> = {
  struktur:  ["Hitung kapasitas balok beton 30x60 cm, tulangan 4D19, fc'=25 MPa", "Berapa kebutuhan tulangan kolom 50x50 cm, beban aksial 800 kN?", "Perbedaan metode ASD dan LRFD dalam desain struktur baja"],
  k3:        ["Buat JSA pemasangan bekisting di ketinggian 10 m", "APD wajib untuk pekerjaan di ruang terbatas?", "Prosedur lockout/tagout yang benar untuk pekerjaan elektrikal"],
  mep:       ["Hitung kapasitas AC ruang kantor 10x15 m, 20 orang", "Ukuran kabel untuk beban 50 kW, tegangan 380V 3 fase?", "Sistem grounding yang benar untuk gedung 10 lantai"],
  geoteknik: ["Interpretasikan SPT N-value 15 untuk fondasi gedung 5 lantai", "Fondasi tepat untuk tanah lempung daya dukung rendah?", "Cara menghitung settlement fondasi tiang pancang"],
  kontrak:   ["Klaim keterlambatan force majeure di FIDIC?", "Liquidated Damages dan cara menghitungnya di SPK?", "Draft surat teguran subkontraktor terlambat"],
  pm:        ["Template WBS proyek gedung perkantoran 5 lantai", "Proyek terlambat 3 minggu, bagaimana recovery plan?", "Cara membaca dan menganalisa S-Curve proyek"],
  rab:       ["Volume beton lantai 10x15 m tebal 12 cm + wiremesh", "Anggaran kasar ruko 3 lantai di Jakarta 2025?", "Komponen analisa harga satuan pasangan bata merah/m²"],
  bim:       ["Clash detection struktur vs MEP di Navisworks?", "LOD yang tepat untuk model BIM tahap DD?", "Workflow model 3D Revit ke 4D scheduling Navisworks"],
};

/* ── Markdown renderer ──────────────────────────────── */
function inlineFormat(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-gray-900 dark:text-white">{part.slice(2,-2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1,-1)}</em>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[11px] font-mono text-purple-600 dark:text-purple-400 mx-0.5">{part.slice(1,-1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { codeLines.push(lines[i]); i++; }
      elements.push(<pre key={`c${i}`} className="bg-gray-900 dark:bg-black text-green-300 rounded-xl p-4 my-3 overflow-x-auto text-xs font-mono leading-relaxed border border-gray-700"><code>{codeLines.join("\n")}</code></pre>);
      i++; continue;
    }
    if (line.startsWith("### ")) { elements.push(<h3 key={`h3${i}`} className="font-bold text-sm mt-4 mb-1.5 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-1">{inlineFormat(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith("## "))  { elements.push(<h2 key={`h2${i}`} className="font-bold text-base mt-5 mb-2 text-gray-900 dark:text-white">{inlineFormat(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith("# "))   { elements.push(<h1 key={`h1${i}`} className="font-extrabold text-lg mt-5 mb-2">{inlineFormat(line.slice(2))}</h1>); i++; continue; }
    if (line.startsWith("> ")) {
      elements.push(<div key={`bq${i}`} className="border-l-4 border-purple-400 pl-3 my-2 bg-purple-50 dark:bg-purple-900/20 py-2 rounded-r-lg"><p className="text-sm text-purple-700 dark:text-purple-300 italic">{inlineFormat(line.slice(2))}</p></div>);
      i++; continue;
    }
    if (line.match(/^[-•*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-•*] /)) { items.push(lines[i].slice(2)); i++; }
      elements.push(<ul key={`ul${i}`} className="my-2 space-y-1.5 pl-1">{items.map((item,j) => <li key={j} className="flex items-start gap-2 text-sm"><span className="text-purple-400 mt-1.5 shrink-0 text-xs">▸</span><span className="leading-relaxed">{inlineFormat(item)}</span></li>)}</ul>);
      continue;
    }
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, "")); i++; }
      elements.push(<ol key={`ol${i}`} className="my-2 space-y-1.5 pl-1">{items.map((item,j) => <li key={j} className="flex items-start gap-2.5 text-sm"><span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{j+1}</span><span className="leading-relaxed flex-1">{inlineFormat(item)}</span></li>)}</ol>);
      continue;
    }
    if (line.match(/^[-]{3,}$/)) { elements.push(<hr key={`hr${i}`} className="my-3 border-gray-200 dark:border-gray-700" />); i++; continue; }
    if (line.trim() === "") { elements.push(<div key={`br${i}`} className="h-1.5" />); i++; continue; }
    elements.push(<p key={`p${i}`} className="text-sm leading-relaxed">{inlineFormat(line)}</p>);
    i++;
  }
  return <div className="space-y-0.5 text-gray-700 dark:text-gray-300">{elements}</div>;
}

/* ── Citation components (inspired by scite.ai) ────── */
function CitationPanel({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Referensi Dikutip</span>
          <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{citations.length}</span>
        </div>
        <button
          onClick={() => { setExpanded(!expanded); setActiveIdx(null); }}
          className="text-[10px] text-purple-500 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
        >
          {expanded ? "Tutup ▲" : "Lihat detail ▼"}
        </button>
      </div>

      {/* Citation chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {citations.map((c, i) => {
          const cfg = TYPE_CONFIG[c.standard.type];
          return (
            <button
              key={i}
              onClick={() => { setExpanded(true); setActiveIdx(activeIdx === i ? null : i); }}
              className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-full border font-semibold transition-all hover:shadow-sm ${cfg.color} ${activeIdx === i ? "ring-2 ring-offset-1 ring-current shadow-md scale-105" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
              {c.standard.code}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-2">
        {(["wajib","disarankan","referensi"] as const).map(t => {
          const cfg = TYPE_CONFIG[t];
          const count = citations.filter(c => c.standard.type === t).length;
          if (count === 0) return null;
          return (
            <div key={t} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-[10px] text-gray-400">{cfg.label} ({count})</span>
            </div>
          );
        })}
      </div>

      {/* Expanded detail cards */}
      {expanded && (
        <div className="mt-2 space-y-2">
          {citations.map((c, i) => {
            const cfg = TYPE_CONFIG[c.standard.type];
            const isActive = activeIdx === i;
            return (
              <div
                key={i}
                className={`rounded-xl border p-3 transition-all cursor-pointer ${isActive ? "border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20" : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700"}`}
                onClick={() => setActiveIdx(isActive ? null : i)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold shrink-0 mt-0.5 ${cfg.color}`}>{cfg.label}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{c.standard.code}</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug mt-0.5">{c.standard.name}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] text-gray-400">{c.standard.year}</p>
                    <p className="text-[10px] text-gray-400">{c.standard.body}</p>
                  </div>
                </div>
                {isActive && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      <strong className="text-gray-700 dark:text-gray-300">Cakupan: </strong>
                      {c.standard.scope}
                    </p>
                    {c.standard.nameEn && (
                      <p className="text-[10px] text-gray-400 italic mt-1">{c.standard.nameEn}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Collab message (Blackboard pattern output) ─────── */
function CollabMessage({ collab, followups, onFollowup }: {
  collab: { contributions: Contribution[]; synthesis: string };
  followups?: string[];
  onFollowup: (q: string) => void;
}) {
  const [tab, setTab] = useState<"synth" | "0" | "1">("synth");
  const tabs = [
    { id: "synth", label: "🔄 Sintesis", short: "Sintesis" },
    { id: "0",    label: `${collab.contributions[0]?.agent?.icon} ${collab.contributions[0]?.agent?.name}`, short: collab.contributions[0]?.agent?.name },
    { id: "1",    label: `${collab.contributions[1]?.agent?.icon} ${collab.contributions[1]?.agent?.name}`, short: collab.contributions[1]?.agent?.name },
  ];

  const activeContent = tab === "synth"
    ? collab.synthesis
    : collab.contributions[parseInt(tab)]?.response;

  const activeAgent = tab !== "synth" ? collab.contributions[parseInt(tab)]?.agent : null;

  return (
    <div className="w-full">
      {/* Collab header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 font-semibold">
          <GitMerge className="w-3 h-3" /> Kolaborasi Blackboard
        </div>
        {collab.contributions.map((c, i) => (
          <div key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.agent?.bg} ${c.agent?.accent}`}>
            {c.agent?.icon} {c.agent?.name}
            <span className="opacity-50 ml-1">·</span>
            <span className="opacity-70 ml-0.5">{Math.round(c.agent?.routing?.confidence * 100)}%</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 text-[11px] font-semibold px-2 py-2 rounded-lg transition-all truncate ${
              tab === t.id
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.short}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 shadow-sm min-h-[100px]">
        {tab !== "synth" && activeAgent && (
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-lg">{activeAgent.icon}</span>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{activeAgent.name}</p>
              <p className="text-[10px] text-gray-400">{activeAgent.title}</p>
            </div>
            {collab.contributions[parseInt(tab)]?.agent?.routing && (
              <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-purple-400" />
                {Math.round(collab.contributions[parseInt(tab)].agent.routing.confidence * 100)}% match
              </span>
            )}
          </div>
        )}
        {tab === "synth" && (
          <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
            <GitMerge className="w-3.5 h-3.5 text-purple-500" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Sintesis Multi-Perspektif</p>
          </div>
        )}
        <MarkdownContent text={activeContent || ""} />
        <CitationPanel citations={extractCitations(activeContent || "")} />
      </div>

      {/* Follow-ups */}
      {followups && followups.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] text-gray-400 mb-1.5 ml-0.5">Pertanyaan lanjutan:</p>
          <div className="flex flex-wrap gap-2">
            {followups.map((fq, i) => (
              <button key={i} onClick={() => onFollowup(fq)}
                className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center gap-1">
                <ChevronRight className="w-2.5 h-2.5" /> {fq}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Event stream display ───────────────────────────── */
function EventStream({ events, currentIdx }: { events: string[]; currentIdx: number }) {
  return (
    <div className="bg-gray-950 rounded-xl p-3 my-2 font-mono text-xs border border-gray-800 w-full max-w-md">
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-800">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-400 text-[10px] uppercase tracking-wider">Event Stream</span>
      </div>
      {events.slice(0, currentIdx + 1).map((e, i) => (
        <div key={i} className={`flex items-start gap-2 py-0.5 transition-all ${i === currentIdx ? "text-green-300" : "text-gray-500"}`}>
          <span className="shrink-0 mt-0.5">{i < currentIdx ? "✓" : "›"}</span>
          <span>{e}</span>
        </div>
      ))}
      <div className="flex gap-1 mt-2">
        {[0, 150, 300].map(d => (
          <span key={d} className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </div>
  );
}

/* ── Memory panel ───────────────────────────────────── */
function MemoryPanel({ facts, onDelete, onClear }: {
  facts: MemoryFact[];
  onDelete: (key: string) => void;
  onClear: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 pb-2 px-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between w-full mb-2 group"
      >
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-purple-400" />
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Memori Proyek</p>
          {facts.length > 0 && (
            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold">{facts.length}</span>
          )}
        </div>
        {collapsed ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronUp className="w-3 h-3 text-gray-400" />}
      </button>

      {!collapsed && (
        <>
          {facts.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic px-0.5 leading-relaxed">
              Belum ada konteks. AI akan otomatis mengingat fakta proyek dari percakapan Anda.
            </p>
          ) : (
            <div className="space-y-1.5">
              {facts.map(f => (
                <div key={f.key} className="flex items-center gap-2 group/fact">
                  <span className="text-sm">{f.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400">{f.label}</p>
                    <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">{f.value}</p>
                  </div>
                  <button
                    onClick={() => onDelete(f.key)}
                    className="opacity-0 group-hover/fact:opacity-100 p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 rounded transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-600 mt-2 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Hapus semua memori
              </button>
            </div>
          )}
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/40">
            <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
              💡 Memori ini disimpan di browser Anda dan digunakan untuk memberikan jawaban yang lebih relevan dengan konteks proyek.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Utility ────────────────────────────────────────── */
function formatTime(d: Date) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
function genId() { return Math.random().toString(36).slice(2, 10); }

function parseAtMention(text: string): { agentId: AgentId | null; cleanText: string } {
  const match = text.match(/^@(\w+)\s?(.*)/s);
  if (!match) return { agentId: null, cleanText: text };
  const id = match[1].toLowerCase();
  if (id in AGENTS) return { agentId: id as AgentId, cleanText: match[2].trim() || text };
  return { agentId: null, cleanText: text };
}

/* ── Main page ──────────────────────────────────────── */
export default function AIAgentsPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | "auto">("auto");
  const [collabMode, setCollabMode] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentInfo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionId] = useState(() => genId());
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [sessionAgents, setSessionAgents] = useState<Map<AgentId, number>>(new Map());

  // Memory system
  const [memory, setMemory] = useState<MemoryFact[]>([]);
  const [memoryLoaded, setMemoryLoaded] = useState(false);

  // Event stream
  const [eventStreamEvents, setEventStreamEvents] = useState<string[]>([]);
  const [eventStreamIdx, setEventStreamIdx] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const eventTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load memory from localStorage on mount
  useEffect(() => {
    setMemory(loadMemory());
    setMemoryLoaded(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, eventStreamIdx]);

  const historyForApi: HistoryItem[] = useMemo(() =>
    messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-10)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    [messages]
  );

  const mentionMatches = useMemo(() => {
    if (!mentionQuery) return Object.values(AGENTS);
    const q = mentionQuery.toLowerCase();
    return Object.values(AGENTS).filter(a =>
      a.id.includes(q) || a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
    );
  }, [mentionQuery]);

  /* ── Start event stream animation ── */
  const startEventStream = useCallback((agentId?: string) => {
    const events = collabMode
      ? COLLAB_EVENTS
      : [...ORCHESTRATOR_EVENTS, ...(agentId && AGENT_EVENTS[agentId] ? AGENT_EVENTS[agentId] : ["💭 Menyusun jawaban teknis...", "✅ Jawaban siap..."])];

    setEventStreamEvents(events);
    setEventStreamIdx(0);

    let idx = 0;
    const advance = () => {
      idx++;
      if (idx < events.length) {
        setEventStreamIdx(idx);
        eventTimerRef.current = setTimeout(advance, 900);
      }
    };
    eventTimerRef.current = setTimeout(advance, 800);
  }, [collabMode]);

  const stopEventStream = useCallback(() => {
    if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
    setEventStreamEvents([]);
    setEventStreamIdx(0);
  }, []);

  /* ── @mention handling ── */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) { setMentionQuery(atMatch[1]); setShowMentionDropdown(true); }
    else { setShowMentionDropdown(false); setMentionQuery(""); }
  };

  const applyMention = (agentId: AgentId) => {
    setInput(input.replace(/@\w*$/, `@${agentId} `));
    setShowMentionDropdown(false);
    inputRef.current?.focus();
  };

  /* ── Send message ── */
  const sendMessage = useCallback(async (text?: string) => {
    const raw = (text || input).trim();
    if (!raw || loading) return;

    const { agentId: mentionedAgent, cleanText } = parseAtMention(raw);
    const effectiveAgent = mentionedAgent || (selectedAgent === "auto" ? undefined : selectedAgent);
    const content = cleanText || raw;

    // Extract and merge memory facts
    const newFacts = extractFacts(raw);
    let currentMemory = memory;
    if (newFacts.length > 0) {
      const merged = mergeMemory(memory, newFacts);
      setMemory(merged);
      saveMemory(merged);
      currentMemory = merged;
    }
    const memCtx = memoryToContext(currentMemory);

    setInput("");
    setLoading(true);
    setShowMentionDropdown(false);
    setSidebarOpen(false);

    const userMsg: AgentMessage = { id: genId(), role: "user", content: raw, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Start event stream — pick agent events based on mode/selection
    startEventStream(effectiveAgent || undefined);

    try {
      if (collabMode) {
        /* Blackboard Pattern */
        const res = await fetch("/api/ai/multi-agent-collab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history: historyForApi, sessionId, memoryContext: memCtx }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mendapat respons kolaborasi");

        stopEventStream();

        // Track agents used
        setSessionAgents(prev => {
          const next = new Map(prev);
          for (const c of (data.contributions || [])) {
            const id = c.agent?.id as AgentId;
            if (id) next.set(id, (next.get(id) || 0) + 1);
          }
          return next;
        });

        const collabMsg: AgentMessage = {
          id: genId(), role: "assistant",
          content: data.synthesis || "",
          collab: { contributions: data.contributions, synthesis: data.synthesis },
          followups: data.followups,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, collabMsg]);

      } else {
        /* Orchestrator-Worker Pattern */
        const res = await fetch("/api/ai/multi-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, history: historyForApi, preferredAgent: effectiveAgent, sessionId, memoryContext: memCtx }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal mendapat respons");

        stopEventStream();
        setActiveAgent(data.agent);
        setSessionAgents(prev => {
          const next = new Map(prev);
          next.set(data.agent.id as AgentId, (next.get(data.agent.id as AgentId) || 0) + 1);
          return next;
        });

        const assistantMsg: AgentMessage = {
          id: genId(), role: "assistant",
          content: data.response, agent: data.agent,
          followups: data.followups, routing: data.routing,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      stopEventStream();
      setMessages(prev => [...prev, {
        id: genId(), role: "assistant",
        content: `⚠️ **Terjadi Kesalahan**\n\n${err instanceof Error ? err.message : "Unknown error"}\n\nSilakan coba lagi.`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, selectedAgent, collabMode, historyForApi, sessionId, memory, startEventStream, stopEventStream]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown && e.key === "Escape") { setShowMentionDropdown(false); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setActiveAgent(null);
    setSessionAgents(new Map());
    stopEventStream();
  };

  const exportChat = () => {
    const lines = ["# Chaesa Multi-Agent AI — Riwayat Percakapan", `Tanggal: ${new Date().toLocaleString("id-ID")}`, "---", ""];
    messages.forEach(m => {
      if (m.role === "user") lines.push(`**Pengguna:** ${m.content}`, "");
      if (m.role === "assistant") {
        if (m.collab) {
          lines.push("**[KOLABORASI]**", `Sintesis: ${m.collab.synthesis}`, "");
          m.collab.contributions.forEach(c => lines.push(`${c.agent.name}: ${c.response}`, ""));
        } else if (m.agent) {
          lines.push(`**${m.agent.name} (${m.agent.title}):** ${m.content}`, "");
        }
      }
    });
    if (memory.length > 0) {
      lines.push("---", "## Konteks Proyek", ...memory.map(f => `- ${f.label}: ${f.value}`));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `chaesa-ai-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFact = (key: string) => {
    const updated = deleteFact(memory, key);
    setMemory(updated);
    saveMemory(updated);
  };

  const handleClearMemory = () => {
    setMemory([]);
    clearMemory();
  };

  const agentList = Object.values(AGENTS);
  const hasConversation = messages.some(m => m.role === "user");
  const userMessageCount = messages.filter(m => m.role === "user").length;

  return (
    <>
      <SEO
        title="Chaesa Multi-Agent AI — 8 Ahli Konstruksi Indonesia"
        description="Konsultasikan proyek konstruksi dengan 8 AI Expert. Auto-Route, Blackboard Collaboration, Agent Memory, dan Event Stream — powered by Chaesa."
      />
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">

        {/* ── Top bar ── */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0 z-30">
          <div className="flex items-center gap-3 px-4 h-14">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/"><div className="flex items-center gap-2 cursor-pointer"><ChaesaLogo size={28} /><span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent hidden sm:block">Chaesa</span></div></Link>
            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-gray-800 dark:text-white">Multi-Agent AI</span>
              <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] hidden sm:flex border-0">8 Experts</Badge>
            </div>

            {/* Mode badge */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ml-1 transition-all ${collabMode ? "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"}`}>
              {collabMode ? <><GitMerge className="w-3 h-3" /> Blackboard Kolaborasi</> : <><Zap className="w-3 h-3" /> Orchestrator-Worker</>}
            </div>

            {/* Active agent */}
            {!collabMode && activeAgent && (
              <div className="hidden lg:flex items-center gap-2 ml-1 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>{activeAgent.icon} {activeAgent.name}</span>
              </div>
            )}

            {/* Session stats */}
            {userMessageCount > 0 && (
              <div className="hidden md:flex items-center gap-3 ml-auto mr-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{userMessageCount}</span>
                <span className="flex items-center gap-1"><Users2 className="w-3 h-3" />{sessionAgents.size} ahli</span>
                {memory.length > 0 && <span className="flex items-center gap-1"><Database className="w-3 h-3 text-purple-400" />{memory.length} fakta</span>}
              </div>
            )}

            <div className={`flex items-center gap-1 ${userMessageCount > 0 ? "" : "ml-auto"}`}>
              {messages.length > 0 && (
                <button onClick={exportChat} title="Unduh percakapan" className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button onClick={clearChat} title="Mulai baru" className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <RotateCcw className="w-4 h-4" />
              </button>
              <ThemeSwitch />
              <Link href="/tools"><Button variant="outline" size="sm" className="text-xs hidden sm:flex gap-1 ml-1 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">🔧 AI Tools</Button></Link>
              <Link href="/"><Button variant="outline" size="sm" className="text-xs hidden sm:flex gap-1 ml-1"><ArrowLeft className="w-3 h-3" /> Beranda</Button></Link>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* ── Sidebar ── */}
          <aside className={`w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-col shrink-0 overflow-y-auto lg:flex ${sidebarOpen ? "flex fixed inset-y-0 left-0 z-30 pt-14" : "hidden"}`}>

            {/* Pattern selector */}
            <div className="p-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Pola Arsitektur</p>
              <div className="space-y-2 mb-5">
                <button
                  onClick={() => setCollabMode(false)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${!collabMode ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                >
                  <Zap className={`w-4 h-4 mt-0.5 shrink-0 ${!collabMode ? "text-purple-500" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-xs font-bold ${!collabMode ? "text-purple-700 dark:text-purple-300" : "text-gray-600 dark:text-gray-400"}`}>Orchestrator-Worker</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">AI pilihkan 1 ahli terbaik. Cepat & presisi.</p>
                  </div>
                </button>
                <button
                  onClick={() => setCollabMode(true)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${collabMode ? "border-pink-500 bg-pink-50 dark:bg-pink-900/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                >
                  <GitMerge className={`w-4 h-4 mt-0.5 shrink-0 ${collabMode ? "text-pink-500" : "text-gray-400"}`} />
                  <div>
                    <p className={`text-xs font-bold ${collabMode ? "text-pink-700 dark:text-pink-300" : "text-gray-600 dark:text-gray-400"}`}>Blackboard Kolaborasi</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">2 ahli menjawab paralel + sintesis. Untuk pertanyaan lintas disiplin.</p>
                  </div>
                </button>
              </div>

              {/* @mention tip */}
              {!collabMode && (
                <>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Routing Mode</p>
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <button onClick={() => setSelectedAgent("auto")} className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${selectedAgent === "auto" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                      <Zap className={`w-4 h-4 ${selectedAgent === "auto" ? "text-purple-500" : "text-gray-400"}`} />
                      Auto-Route
                      <span className="text-[9px] font-normal opacity-70">AI memilih</span>
                    </button>
                    <button onClick={() => selectedAgent === "auto" && setSelectedAgent("struktur")} className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${selectedAgent !== "auto" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                      <Bot className={`w-4 h-4 ${selectedAgent !== "auto" ? "text-blue-500" : "text-gray-400"}`} />
                      Manual
                      <span className="text-[9px] font-normal opacity-70">pilih sendiri</span>
                    </button>
                  </div>
                </>
              )}

              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-2.5 mb-4">
                <AtSign className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  Ketik <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">@struktur</code>, <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">@k3</code> dll. di pesan untuk langsung ke ahli pilihan
                </p>
              </div>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">8 AI Experts</p>
            </div>

            {/* Agent list */}
            <div className="px-3 pb-2 space-y-1">
              {agentList.map(agent => {
                const isSelected = selectedAgent === agent.id && !collabMode;
                const useCount = sessionAgents.get(agent.id as AgentId) || 0;
                const isActive = activeAgent?.id === agent.id;
                return (
                  <button key={agent.id} onClick={() => { if (!collabMode) { setSelectedAgent(agent.id as AgentId); setSidebarOpen(false); } }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all group ${isSelected ? "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "border-transparent bg-gray-50 dark:bg-gray-800/60 hover:border-gray-200 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300"} ${collabMode ? "opacity-60 cursor-default" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform ${isSelected ? "bg-white/20 dark:bg-black/20" : "bg-white dark:bg-gray-700"}`}>{agent.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate">{agent.name}</p>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
                        </div>
                        <p className={`text-[10px] truncate ${isSelected ? "opacity-60" : "text-gray-400"}`}>{agent.title}</p>
                      </div>
                      {useCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${isSelected ? "bg-white/20 dark:bg-black/20" : "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300"}`}>{useCount}×</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sample prompts */}
            {!collabMode && selectedAgent !== "auto" && AGENTS[selectedAgent as AgentId] && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Contoh Pertanyaan</p>
                <div className="space-y-1.5">
                  {SAMPLE_PROMPTS[selectedAgent as AgentId].map((p, i) => (
                    <button key={i} onClick={() => { setInput(p); inputRef.current?.focus(); setSidebarOpen(false); }}
                      className="w-full text-left text-[11px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-start gap-1.5 group">
                      <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-gray-300 group-hover:text-purple-400 transition-colors" />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Session activity */}
            {sessionAgents.size > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Aktivitas Sesi</p>
                <div className="space-y-1.5">
                  {Array.from(sessionAgents.entries()).sort((a, b) => b[1] - a[1]).map(([id, count]) => {
                    const ag = AGENTS[id];
                    const pct = Math.round((count / Math.max(userMessageCount, 1)) * 100);
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{ag.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{ag.name}</span>
                            <span className="text-[10px] text-gray-400 ml-1">{count}×</span>
                          </div>
                          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Memory panel */}
            {memoryLoaded && (
              <MemoryPanel
                facts={memory}
                onDelete={handleDeleteFact}
                onClear={handleClearMemory}
              />
            )}
          </aside>

          {/* ── Chat area ── */}
          <main className="flex-1 flex flex-col overflow-hidden">

            {/* Empty state */}
            {!hasConversation && (
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-10">
                  <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">🤖</div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">8 Ahli Konstruksi Siap Berkolaborasi</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
                      Arsitektur multi-agent dengan <strong>Orchestrator-Worker</strong> dan <strong>Blackboard Pattern</strong>. AI mengingat konteks proyek Anda dan memvisualisasikan proses berpikirnya.
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                      <span className="text-[11px] px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">⚡ Orchestrator-Worker</span>
                      <span className="text-[11px] px-3 py-1.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-medium">🤝 Blackboard Pattern</span>
                      <span className="text-[11px] px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">💾 Agent Memory</span>
                      <span className="text-[11px] px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">📡 Event Stream</span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {QUICK_STARTS.map((qs, i) => {
                      const ag = AGENTS[qs.agentId];
                      return (
                        <button key={i} onClick={() => sendMessage(qs.prompt)}
                          className="text-left p-4 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-700 hover:shadow-md transition-all group">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">{ag.icon}</div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{ag.name}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug font-medium">{qs.prompt}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl p-4 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Tips Penggunaan</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        Ketik <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">@struktur</code>, <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">@k3</code>, <code className="bg-amber-100 dark:bg-amber-900/60 px-1 rounded font-mono">@pm</code> untuk langsung ke ahli tertentu. Aktifkan <strong>Blackboard Kolaborasi</strong> di sidebar untuk mendapat 2 perspektif sekaligus + sintesis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {hasConversation && (
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
                {messages.map(msg => {
                  if (msg.role === "user") {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[78%]">
                          <div className="flex items-end gap-2 flex-row-reverse">
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" /></div>
                            <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">{msg.content}</div>
                          </div>
                          <p className="text-[10px] text-gray-400 text-right mt-1 mr-9">{formatTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    );
                  }

                  // Collab message
                  if (msg.collab) {
                    return (
                      <div key={msg.id} className="flex justify-start w-full">
                        <div className="w-full max-w-[92%]">
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0 bg-gradient-to-br from-purple-400 to-pink-400">🤝</div>
                            <div className="flex-1 min-w-0">
                              <CollabMessage
                                collab={msg.collab}
                                followups={msg.followups}
                                onFollowup={sendMessage}
                              />
                              <div className="flex items-center gap-3 mt-1.5 ml-0.5">
                                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                                <button onClick={() => copyText(msg.id, msg.collab?.synthesis || "")} className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors">
                                  {copiedId === msg.id ? <><Check className="w-3 h-3 text-green-500" /> Disalin</> : <><Copy className="w-3 h-3" /> Salin sintesis</>}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Regular agent message
                  const ag = msg.agent;
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[88%] w-full">
                        {ag && (
                          <div className="flex items-center gap-2 mb-2 ml-9">
                            <div className={`text-[10px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${ag.bg} ${ag.accent}`}>
                              <span>{ag.icon}</span><span className="font-bold">{ag.name}</span>
                              <span className="opacity-50">·</span><span className="opacity-70 hidden sm:block">{ag.title}</span>
                            </div>
                            {msg.routing && !msg.routing.manual && (
                              <span title={msg.routing.reason} className="flex items-center gap-1 text-[10px] text-gray-400 cursor-help">
                                <Zap className="w-2.5 h-2.5 text-purple-400" />{Math.round(msg.routing.confidence * 100)}% match
                              </span>
                            )}
                            {msg.routing?.manual && <span className="text-[10px] text-blue-500 flex items-center gap-1"><Bot className="w-2.5 h-2.5" /> Manual</span>}
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-base shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">{ag?.icon || "🤖"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm">
                              <MarkdownContent text={msg.content} />
                              <CitationPanel citations={extractCitations(msg.content)} />
                            </div>
                            {msg.followups && msg.followups.length > 0 && (
                              <div className="mt-2.5">
                                <p className="text-[10px] text-gray-400 mb-1.5 ml-0.5">Pertanyaan lanjutan:</p>
                                <div className="flex flex-wrap gap-2">
                                  {msg.followups.map((fq, i) => (
                                    <button key={i} onClick={() => sendMessage(fq)}
                                      className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex items-center gap-1">
                                      <ChevronRight className="w-2.5 h-2.5" /> {fq}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {msg.routing?.reason && !msg.routing.manual && (
                              <div className="flex items-center gap-1.5 mt-1.5 ml-0.5">
                                <Info className="w-3 h-3 text-gray-300" />
                                <p className="text-[10px] text-gray-400 italic">{msg.routing.reason}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-1.5 ml-0.5">
                              <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                              <button onClick={() => copyText(msg.id, msg.content)} className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1 transition-colors">
                                {copiedId === msg.id ? <><Check className="w-3 h-3 text-green-500" /> Disalin</> : <><Copy className="w-3 h-3" /> Salin</>}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Loading with event stream */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
                      </div>
                      <div>
                        {eventStreamEvents.length > 0 && (
                          <EventStream events={eventStreamEvents} currentIdx={eventStreamIdx} />
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex gap-1">{[0,150,300].map(d => <span key={d} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
                          <span className="text-xs text-gray-400">
                            {collabMode ? "Blackboard: 2 ahli menyusun jawaban paralel..." : selectedAgent === "auto" ? "Auto-routing ke ahli terbaik..." : `${AGENTS[selectedAgent as AgentId]?.name} sedang menjawab...`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* ── Input ── */}
            <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-3 pb-4 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                {collabMode ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-pink-600 dark:text-pink-400 font-medium">
                    <GitMerge className="w-3.5 h-3.5" /> Blackboard Kolaborasi — 2 ahli akan menjawab
                  </div>
                ) : selectedAgent === "auto" ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    <Zap className="w-3.5 h-3.5" /> Auto-Route aktif
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="text-sm">{AGENTS[selectedAgent as AgentId]?.icon}</span>
                    <span className="font-medium">{AGENTS[selectedAgent as AgentId]?.name}</span>
                    <button onClick={() => setSelectedAgent("auto")} className="text-purple-500 hover:underline ml-0.5">→ Auto</button>
                  </div>
                )}
                <div className="ml-auto text-[10px] text-gray-400 hidden sm:block">Enter = kirim · Shift+Enter = baris baru</div>
              </div>

              {/* @mention dropdown */}
              {showMentionDropdown && mentionMatches.length > 0 && (
                <div className="mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                  <p className="text-[10px] text-gray-400 px-3 pt-2 pb-1 font-semibold uppercase tracking-wider">Pilih Ahli @mention</p>
                  {mentionMatches.map(ag => (
                    <button key={ag.id} onClick={() => applyMention(ag.id as AgentId)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                      <span className="text-base">{ag.icon}</span>
                      <div><p className="text-xs font-semibold text-gray-800 dark:text-white">@{ag.id}</p><p className="text-[10px] text-gray-400">{ag.name} · {ag.title}</p></div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-end">
                <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                  placeholder={collabMode ? "Tanya lintas disiplin... (2 ahli akan berkolaborasi)" : selectedAgent === "auto" ? "Tanya apa saja... atau ketik @k3, @struktur, @pm" : `Tanya ${AGENTS[selectedAgent as AgentId]?.name || "ahli"}...`}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors leading-relaxed"
                  disabled={loading}
                />
                <Button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className={`h-12 w-12 rounded-xl shrink-0 p-0 flex items-center justify-center disabled:opacity-40 transition-all ${collabMode ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white hover:opacity-90" : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"}`}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">Chaesa AI dapat membuat kesalahan. Verifikasi kalkulasi teknis dengan insinyur berlisensi.</p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
