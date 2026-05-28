import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import {
  Shield, Award, Star, CheckCircle, Target, BarChart3,
  Download, Share2, QrCode, Calendar, User, Building2,
  TrendingUp, GraduationCap, Layers, FileText, Eye,
  Plus, ArrowRight, Sparkles, BookOpen, Map, Trophy,
  ChevronRight, RefreshCw, Zap
} from "lucide-react";
import Link from "next/link";

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; ring: string; value: number }> = {
  L1: { label: "L1 - Awareness", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-300 dark:border-blue-700", ring: "ring-blue-400", value: 25 },
  L2: { label: "L2 - Application", color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-300 dark:border-green-700", ring: "ring-green-400", value: 50 },
  L3: { label: "L3 - Mastery", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-300 dark:border-purple-700", ring: "ring-purple-400", value: 75 },
  L4: { label: "L4 - Strategic", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-300 dark:border-orange-700", ring: "ring-orange-400", value: 100 },
};

const SAMPLE_COMPETENCIES = [
  { id: "s1", unit: "M.702090.001.01", title: "Pemasaran Digital Berbasis Data", sector: "Pemasaran & Penjualan", level: "L2", verifiedAt: "2025-11-15", method: "Observasi + Tes Tertulis", score: 82, status: "verified" },
  { id: "s2", unit: "J.620100.001.02", title: "Pengembangan Aplikasi Web", sector: "Teknologi Informasi & Komunikasi", level: "L3", verifiedAt: "2025-12-20", method: "Portfolio + Simulasi", score: 90, status: "verified" },
  { id: "s3", unit: "M.701001.036.01", title: "Manajemen Tim Lintas Fungsi", sector: "Sumber Daya Manusia", level: "L2", verifiedAt: "2026-01-08", method: "Wawancara + Observasi", score: 76, status: "verified" },
];

interface Competency {
  id: string;
  unit: string;
  title: string;
  sector: string;
  level: string;
  verifiedAt: string;
  method: string;
  score: number;
  status: "verified" | "in_progress" | "expired";
  notes?: string;
}

interface PassportData {
  ownerName: string;
  nip: string;
  organization: string;
  position: string;
  createdAt: string;
  competencies: Competency[];
}

const defaultPassport = (): PassportData => ({
  ownerName: "",
  nip: "",
  organization: "",
  position: "",
  createdAt: new Date().toISOString(),
  competencies: [],
});

function CompetencyRadar({ competencies }: { competencies: Competency[] }) {
  const cx = 120, cy = 120, r = 90;
  const levelValues: Record<string, number> = { L1: 0.25, L2: 0.5, L3: 0.75, L4: 1.0 };

  const sectors = Array.from(new Set(competencies.map(c => c.sector))).slice(0, 8);
  if (sectors.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-400">Tambahkan minimal 3 kompetensi dari sektor berbeda untuk melihat profil radar.</p>
      </div>
    );
  }

  const points = sectors.map((s, i) => {
    const angle = (i / sectors.length) * 2 * Math.PI - Math.PI / 2;
    const comps = competencies.filter(c => c.sector === s);
    const maxVal = Math.max(...comps.map(c => levelValues[c.level] || 0));
    return {
      label: s,
      value: maxVal,
      x: cx + r * maxVal * Math.cos(angle),
      y: cy + r * maxVal * Math.sin(angle),
      lx: cx + (r + 18) * Math.cos(angle),
      ly: cy + (r + 18) * Math.sin(angle),
    };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center">
      <svg width={240} height={240} viewBox="0 0 240 240" className="overflow-visible">
        {/* Grid rings */}
        {gridLevels.map((lvl, li) => {
          const gps = sectors.map((_, i) => {
            const angle = (i / sectors.length) * 2 * Math.PI - Math.PI / 2;
            return `${cx + r * lvl * Math.cos(angle)},${cy + r * lvl * Math.sin(angle)}`;
          });
          return <polygon key={li} points={gps.join(" ")} fill="none" stroke="#e5e7eb" className="dark:stroke-gray-700" strokeWidth="1" />;
        })}
        {/* Spokes */}
        {points.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos((i / sectors.length) * 2 * Math.PI - Math.PI / 2)} y2={cy + r * Math.sin((i / sectors.length) * 2 * Math.PI - Math.PI / 2)} stroke="#e5e7eb" className="dark:stroke-gray-700" strokeWidth="1" />
        ))}
        {/* Data polygon */}
        <polygon points={polyPoints} fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />
        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#8b5cf6" stroke="white" strokeWidth="1.5" />
        ))}
        {/* Labels */}
        {points.map((p, i) => {
          const short = p.label.split(" ").slice(0, 2).join(" ");
          return (
            <text key={i} x={p.lx} y={p.ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#6b7280" className="dark:fill-gray-400">
              {short.length > 12 ? short.slice(0, 12) + "…" : short}
            </text>
          );
        })}
        {/* Level labels */}
        {gridLevels.map((lvl, i) => (
          <text key={i} x={cx + 4} y={cy - r * lvl + 2} fontSize="8" fill="#9ca3af" className="dark:fill-gray-500">{["L1","L2","L3","L4"][i]}</text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {Object.entries(LEVEL_CONFIG).map(([l, cfg]) => (
          <span key={l} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function CompetencyPassport() {
  const { toast } = useToast();
  const { user, userName } = useAuth();
  const [passport, setPassport] = useState<PassportData>(defaultPassport());
  const [activeView, setActiveView] = useState<"overview" | "detail" | "add">("overview");
  const [viewMode, setViewMode] = useState<"list" | "timeline" | "radar" | "print">("list");
  const [editingProfile, setEditingProfile] = useState(false);
  const [newComp, setNewComp] = useState<Partial<Competency>>({
    level: "L2", status: "verified", score: 75,
  });
  const [filterSector, setFilterSector] = useState("Semua");
  const [filterLevel, setFilterLevel] = useState("Semua");

  const storageKey = getUserStorageKey(user, "competency_passport");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPassport(JSON.parse(saved));
      } else {
        const initial = { ...defaultPassport(), ownerName: userName || "", competencies: SAMPLE_COMPETENCIES };
        setPassport(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    } catch {}
  }, [storageKey, userName]);

  const save = (data: PassportData) => {
    setPassport(data);
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const saveProfile = () => {
    save(passport);
    setEditingProfile(false);
    toast({ title: "Profil tersimpan!" });
  };

  const addCompetency = () => {
    if (!newComp.title || !newComp.unit) {
      toast({ title: "Lengkapi data kompetensi", variant: "destructive" });
      return;
    }
    const comp: Competency = {
      id: Date.now().toString(),
      unit: newComp.unit || "",
      title: newComp.title || "",
      sector: newComp.sector || "Umum",
      level: newComp.level || "L2",
      verifiedAt: newComp.verifiedAt || new Date().toISOString().split("T")[0],
      method: newComp.method || "Asesmen Internal",
      score: newComp.score || 75,
      status: newComp.status as "verified" | "in_progress" | "expired" || "verified",
      notes: newComp.notes,
    };
    const updated = { ...passport, competencies: [comp, ...passport.competencies] };
    save(updated);
    setNewComp({ level: "L2", status: "verified", score: 75 });
    setActiveView("overview");
    toast({ title: "Kompetensi ditambahkan!", description: `"${comp.title}" berhasil ditambahkan ke passport Anda.` });
  };

  const removeCompetency = (id: string) => {
    save({ ...passport, competencies: passport.competencies.filter(c => c.id !== id) });
    toast({ title: "Kompetensi dihapus" });
  };

  const sectors = ["Semua", ...Array.from(new Set(passport.competencies.map(c => c.sector)))];
  const levels = ["Semua", "L1", "L2", "L3", "L4"];
  const filtered = passport.competencies.filter(c =>
    (filterSector === "Semua" || c.sector === filterSector) &&
    (filterLevel === "Semua" || c.level === filterLevel)
  );

  const stats = {
    total: passport.competencies.length,
    verified: passport.competencies.filter(c => c.status === "verified").length,
    avgScore: passport.competencies.length > 0
      ? Math.round(passport.competencies.reduce((a, c) => a + c.score, 0) / passport.competencies.length)
      : 0,
    byLevel: {
      L1: passport.competencies.filter(c => c.level === "L1").length,
      L2: passport.competencies.filter(c => c.level === "L2").length,
      L3: passport.competencies.filter(c => c.level === "L3").length,
      L4: passport.competencies.filter(c => c.level === "L4").length,
    },
  };

  const passportId = `CP-${(user?.id || "GUEST").slice(0, 6).toUpperCase()}-${new Date().getFullYear()}`;

  return (
    <>
      <SEO
        title="Competency Passport - Chaesa Live"
        description="Portfolio digital kompetensi terverifikasi Anda. Terintegrasi dengan SKKNI, LSP, dan Chaesa Live Learning Platform."
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 dark:from-gray-900 dark:via-green-950 dark:to-blue-950">
        <PageHeader title="Competency Passport" icon={Shield} backHref="/" backLabel="Beranda" />

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* Passport Card */}
          <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)" }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-white/20 text-white border-white/30 text-xs">Chaesa Live</Badge>
                    <Badge className="bg-green-400/30 text-green-100 border-green-400/30 text-xs">SKKNI Standard</Badge>
                  </div>
                  <h1 className="text-2xl font-bold">Competency Passport</h1>
                  {editingProfile ? (
                    <div className="mt-2 space-y-2">
                      <input value={passport.ownerName} onChange={e => setPassport(p => ({ ...p, ownerName: e.target.value }))} placeholder="Nama Lengkap" className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white placeholder-white/60 text-sm w-full max-w-xs" />
                      <input value={passport.nip} onChange={e => setPassport(p => ({ ...p, nip: e.target.value }))} placeholder="NIP / NIK" className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white placeholder-white/60 text-sm w-full max-w-xs" />
                      <input value={passport.organization} onChange={e => setPassport(p => ({ ...p, organization: e.target.value }))} placeholder="Organisasi / Instansi" className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white placeholder-white/60 text-sm w-full max-w-xs" />
                      <input value={passport.position} onChange={e => setPassport(p => ({ ...p, position: e.target.value }))} placeholder="Jabatan / Posisi" className="bg-white/20 border border-white/30 rounded px-3 py-1 text-white placeholder-white/60 text-sm w-full max-w-xs" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveProfile} className="px-4 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-semibold hover:bg-white/90">Simpan</button>
                        <button onClick={() => setEditingProfile(false)} className="px-4 py-1.5 bg-white/20 rounded-lg text-sm hover:bg-white/30">Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-white/90 font-semibold text-lg">{passport.ownerName || userName || "Nama Anda"}</p>
                      {passport.position && <p className="text-white/70 text-sm">{passport.position}{passport.organization ? ` · ${passport.organization}` : ""}</p>}
                      {passport.nip && <p className="text-white/60 text-xs">NIP: {passport.nip}</p>}
                      <button onClick={() => setEditingProfile(true)} className="mt-1 text-white/60 hover:text-white text-xs underline">Edit profil</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="bg-white/20 rounded-xl p-3 border border-white/30">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <QrCode className="w-5 h-5 text-white/80" />
                    <span className="text-xs text-white/60">ID Passport</span>
                  </div>
                  <div className="font-mono font-bold text-sm">{passportId}</div>
                  <div className="text-xs text-white/60 mt-1">Verifikasi: chaesalive.id/verify</div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs transition-colors border border-white/20">
                    <Share2 className="w-3.5 h-3.5" /> Bagikan
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs transition-colors border border-white/20">
                    <Download className="w-3.5 h-3.5" /> Unduh PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Kompetensi", value: stats.total, icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
              { label: "Terverifikasi", value: stats.verified, icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
              { label: "Rata-rata Skor", value: `${stats.avgScore}%`, icon: BarChart3, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
              { label: "Level Tertinggi", value: stats.byLevel.L4 > 0 ? "L4" : stats.byLevel.L3 > 0 ? "L3" : stats.byLevel.L2 > 0 ? "L2" : "L1", icon: Trophy, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
            ].map((s, i) => (
              <Card key={i} className={`p-4 border border-gray-200 dark:border-gray-700 ${s.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Level Distribution */}
          <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" /> Distribusi Level Kompetensi
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
                <div key={lvl} className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg}`}>
                  <div className={`text-2xl font-bold ${cfg.color}`}>{stats.byLevel[lvl as keyof typeof stats.byLevel]}</div>
                  <div className={`text-sm font-semibold ${cfg.color}`}>{lvl}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{cfg.label.split(" - ")[1]}</div>
                  <Progress value={stats.total > 0 ? (stats.byLevel[lvl as keyof typeof stats.byLevel] / stats.total) * 100 : 0} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* View Mode Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "list", label: "Daftar", icon: GraduationCap },
              { id: "timeline", label: "Timeline", icon: Calendar },
              { id: "radar", label: "Profil Kompetensi", icon: BarChart3 },
              { id: "print", label: "Cetak Passport", icon: Download },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as typeof viewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  viewMode === id
                    ? "bg-purple-600 text-white border-purple-600 shadow"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-purple-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Timeline View */}
          {viewMode === "timeline" && (
            <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> Timeline Perjalanan Kompetensi
              </h2>
              {passport.competencies.length === 0 ? (
                <p className="text-gray-400 text-center py-10">Belum ada kompetensi tercatat.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-blue-300 to-green-300 rounded-full" />
                  <div className="space-y-6">
                    {[...passport.competencies]
                      .sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt))
                      .map((comp, i) => {
                        const cfg = LEVEL_CONFIG[comp.level] || LEVEL_CONFIG.L2;
                        const isVerified = comp.status === "verified";
                        return (
                          <div key={comp.id} className="flex gap-4 pl-2">
                            <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 ${cfg.bg} border-2 ${cfg.border}`}>
                              <span className={`text-[10px] font-bold ${cfg.color}`}>{comp.level}</span>
                            </div>
                            <div className={`flex-1 p-4 rounded-xl border ${isVerified ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"}`}>
                              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                                <div>
                                  <span className="font-bold text-gray-900 dark:text-white text-sm">{comp.title}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge className={`text-[10px] px-1.5 py-0.5 ${cfg.bg} ${cfg.color} border-0`}>{comp.level}</Badge>
                                    <span className="text-xs text-gray-400">{comp.sector}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono text-gray-400">{comp.verifiedAt}</div>
                                  <div className={`text-sm font-bold mt-0.5 ${comp.score >= 80 ? "text-green-600" : comp.score >= 70 ? "text-yellow-600" : "text-red-600"}`}>{comp.score}%</div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded mr-2">{comp.unit}</span>
                                {comp.method}
                              </div>
                              <Progress value={comp.score} className="h-1 mt-2" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Radar / Sector Profile View */}
          {viewMode === "radar" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sector Breakdown Chart */}
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" /> Skor per Sektor
                </h2>
                {(() => {
                  const sectorData = Array.from(new Set(passport.competencies.map(c => c.sector))).map(s => {
                    const sc = passport.competencies.filter(c => c.sector === s);
                    const avg = Math.round(sc.reduce((a, c) => a + c.score, 0) / sc.length);
                    const maxLevel = sc.reduce((max, c) => LEVEL_CONFIG[c.level]?.value > LEVEL_CONFIG[max]?.value ? c.level : max, "L1");
                    return { sector: s, avg, count: sc.length, maxLevel };
                  });
                  if (sectorData.length === 0) return <p className="text-gray-400 text-center py-10">Belum ada data.</p>;
                  return (
                    <div className="space-y-3">
                      {sectorData.sort((a, b) => b.avg - a.avg).map((d, i) => {
                        const cfg = LEVEL_CONFIG[d.maxLevel] || LEVEL_CONFIG.L2;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1 text-sm">
                              <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[60%]">{d.sector}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-[10px] ${cfg.bg} ${cfg.color} border-0`}>{d.maxLevel}</Badge>
                                <span className="font-bold text-gray-900 dark:text-white">{d.avg}%</span>
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${d.avg}%`,
                                  background: `linear-gradient(90deg, ${
                                    d.maxLevel === "L4" ? "#f97316, #ea580c" :
                                    d.maxLevel === "L3" ? "#a855f7, #7c3aed" :
                                    d.maxLevel === "L2" ? "#22c55e, #16a34a" :
                                    "#3b82f6, #2563eb"
                                  })`
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{d.count} kompetensi</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>

              {/* Competency Radar / Spider Chart */}
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" /> Profil Level Kompetensi
                </h2>
                <CompetencyRadar competencies={passport.competencies} />
              </Card>

              {/* Score Distribution */}
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:col-span-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" /> Distribusi Skor Asesmen
                </h2>
                <div className="flex items-end gap-1 h-24">
                  {passport.competencies.map((c, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className={`w-full rounded-t transition-all ${c.score >= 80 ? "bg-green-400 dark:bg-green-500" : c.score >= 70 ? "bg-yellow-400 dark:bg-yellow-500" : "bg-red-400 dark:bg-red-500"}`}
                        style={{ height: `${c.score}%` }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        {c.title.slice(0, 20)}... {c.score}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Kompetensi terlama</span>
                  <span>Terbaru</span>
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />≥80% (Sangat Baik)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" />70–79% (Baik)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />&lt;70% (Perlu Peningkatan)</span>
                </div>
              </Card>
            </div>
          )}

          {/* Print View */}
          {viewMode === "print" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Tampilan cetak / export PDF passport kompetensi Anda.</p>
                <Button onClick={() => window.print()} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Download className="w-4 h-4 mr-1.5" /> Cetak / Simpan PDF
                </Button>
              </div>
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl" id="printable-passport">
                {/* Passport Header */}
                <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-teal-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium uppercase tracking-widest">Competency Passport</div>
                        <div className="text-xl font-bold">{passport.ownerName || userName || "Nama Pemilik"}</div>
                        {passport.position && <div className="text-sm text-white/80">{passport.position}{passport.organization ? ` · ${passport.organization}` : ""}</div>}
                        {passport.nip && <div className="text-xs text-white/60">NIP: {passport.nip}</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 border border-white/30 rounded-xl p-3">
                        {/* QR Code visual placeholder */}
                        <div className="w-16 h-16 grid grid-cols-4 gap-0.5">
                          {Array.from({ length: 16 }, (_, i) => (
                            <div key={i} className={`rounded-sm ${[0,1,4,5,2,7,8,11,13,14].includes(i) ? "bg-white" : "bg-white/20"}`} />
                          ))}
                        </div>
                        <div className="text-[9px] text-white/60 mt-1 text-center font-mono">{passportId}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Competency Table */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Daftar Kompetensi Terverifikasi</h3>
                    <div className="text-xs text-gray-500">Diterbitkan: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">#</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">Kode Unit</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">Kompetensi</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">Level</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">Skor</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">Metode</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passport.competencies.filter(c => c.status === "verified").map((comp, i) => {
                        const cfg = LEVEL_CONFIG[comp.level] || LEVEL_CONFIG.L2;
                        return (
                          <tr key={comp.id} className={i % 2 === 0 ? "" : "bg-gray-50 dark:bg-gray-800/50"}>
                            <td className="px-3 py-2 text-gray-400 border border-gray-200 dark:border-gray-700 text-xs">{i + 1}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-500 border border-gray-200 dark:border-gray-700">{comp.unit}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">{comp.title}</td>
                            <td className="px-3 py-2 border border-gray-200 dark:border-gray-700">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{comp.level}</span>
                            </td>
                            <td className={`px-3 py-2 font-bold border border-gray-200 dark:border-gray-700 text-xs ${comp.score >= 80 ? "text-green-600" : comp.score >= 70 ? "text-yellow-600" : "text-red-600"}`}>{comp.score}%</td>
                            <td className="px-3 py-2 text-xs text-gray-500 border border-gray-200 dark:border-gray-700">{comp.method}</td>
                            <td className="px-3 py-2 text-xs text-gray-400 border border-gray-200 dark:border-gray-700">{comp.verifiedAt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                    <span>Dokumen ini diterbitkan oleh Chaesa Live Platform</span>
                    <span>Verifikasi di: chaesalive.id/verify/{passportId}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Competency List */}
          {(viewMode === "list") && (
          <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-500" /> Daftar Kompetensi ({filtered.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {sectors.map(s => <option key={s}>{s}</option>)}
                </select>
                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {levels.map(l => <option key={l}>{l}</option>)}
                </select>
                <Button onClick={() => setActiveView(activeView === "add" ? "overview" : "add")} size="sm" className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                </Button>
              </div>
            </div>

            {/* Add Form */}
            {activeView === "add" && (
              <div className="mb-5 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-3 text-sm">Tambah Kompetensi Baru</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Judul Kompetensi *</label>
                    <input value={newComp.title || ""} onChange={e => setNewComp(p => ({ ...p, title: e.target.value }))} placeholder="cth: Manajemen Proyek Digital" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Kode Unit SKKNI *</label>
                    <input value={newComp.unit || ""} onChange={e => setNewComp(p => ({ ...p, unit: e.target.value }))} placeholder="cth: M.702090.001.01" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Sektor</label>
                    <input value={newComp.sector || ""} onChange={e => setNewComp(p => ({ ...p, sector: e.target.value }))} placeholder="cth: Teknologi Informasi" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Level Kompetensi</label>
                    <select value={newComp.level || "L2"} onChange={e => setNewComp(p => ({ ...p, level: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                      {Object.keys(LEVEL_CONFIG).map(l => <option key={l} value={l}>{LEVEL_CONFIG[l].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Metode Asesmen</label>
                    <input value={newComp.method || ""} onChange={e => setNewComp(p => ({ ...p, method: e.target.value }))} placeholder="cth: Observasi + Portfolio" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Skor Asesmen (%)</label>
                    <input type="number" value={newComp.score || 75} onChange={e => setNewComp(p => ({ ...p, score: parseInt(e.target.value) }))} min="0" max="100" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Tanggal Verifikasi</label>
                    <input type="date" value={newComp.verifiedAt || ""} onChange={e => setNewComp(p => ({ ...p, verifiedAt: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status</label>
                    <select value={newComp.status || "verified"} onChange={e => setNewComp(p => ({ ...p, status: e.target.value as any }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100">
                      <option value="verified">Terverifikasi</option>
                      <option value="in_progress">Dalam Proses</option>
                      <option value="expired">Kadaluarsa</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Catatan (opsional)</label>
                    <input value={newComp.notes || ""} onChange={e => setNewComp(p => ({ ...p, notes: e.target.value }))} placeholder="Catatan tambahan..." className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addCompetency} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Simpan Kompetensi
                  </Button>
                  <Button onClick={() => setActiveView("overview")} size="sm" variant="outline">Batal</Button>
                </div>
              </div>
            )}

            {/* List */}
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Belum ada kompetensi. Tambahkan kompetensi pertama Anda!</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setActiveView("add")} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Plus className="w-4 h-4 mr-1" /> Tambah Manual
                  </Button>
                  <Link href="/competency-builder">
                    <Button size="sm" variant="outline">
                      <Target className="w-4 h-4 mr-1" /> Buat via Builder
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => {
                  const lvl = LEVEL_CONFIG[c.level] || LEVEL_CONFIG.L2;
                  const statusConfig = {
                    verified: { label: "Terverifikasi", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", icon: CheckCircle },
                    in_progress: { label: "Dalam Proses", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300", icon: RefreshCw },
                    expired: { label: "Kadaluarsa", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: Calendar },
                  }[c.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={c.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <div className={`w-12 h-12 rounded-xl ${lvl.bg} ${lvl.border} border flex flex-col items-center justify-center shrink-0`}>
                        <span className={`text-xs font-bold ${lvl.color}`}>{c.level}</span>
                        <span className={`text-[10px] ${lvl.color} opacity-70`}>{Math.round(c.score)}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{c.title}</h3>
                          <Badge className={`text-[10px] px-2 py-0.5 ${statusConfig.color} border-0`}>
                            <StatusIcon className="w-3 h-3 mr-0.5 inline" />{statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{c.unit}</span>
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{c.sector}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{c.method}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.verifiedAt ? new Date(c.verifiedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
                        </div>
                        {c.notes && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{c.notes}</p>}
                        <Progress value={c.score} className="h-1 mt-2 max-w-xs" />
                      </div>
                      <button onClick={() => removeCompetency(c.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity shrink-0 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          )}

          {/* BimtekKita PKB Integration */}
          {viewMode === "list" && (
          <Card className="p-5 border-2 border-orange-200 dark:border-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-3xl shrink-0">🏗️</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">BimtekKita Integration</h3>
                    <Badge className="text-[10px] bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-0">Terintegrasi</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Selesaikan modul BIMTEK konstruksi di BimtekKita dan lacak PKB Points Anda. Catat SKK konstruksi dari 334 posisi tersedia langsung ke passport ini.
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-orange-500" /> 157 Modul BIMTEK</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-orange-500" /> 334 Posisi SKK</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-orange-500" /> PKB Points Tracker</span>
                    <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-orange-500" /> 8 AI Expert Konstruksi</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link href="/bimtek-integration">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white w-full" size="sm">
                    <TrendingUp className="w-4 h-4 mr-1.5" /> Buka BimtekKita
                  </Button>
                </Link>
                <button
                  onClick={() => {
                    const newComp: any = {
                      unit: "B001-K3-001.01", title: "K3 Konstruksi Gedung", sector: "Konstruksi – K3",
                      level: "L2", verifiedAt: new Date().toISOString().split("T")[0],
                      method: "Observasi + Tes Tertulis", score: 80, status: "verified",
                    };
                    save({ ...passport, competencies: [{ id: Date.now().toString(), ...newComp }, ...passport.competencies] });
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors whitespace-nowrap"
                >
                  + Tambah SKK Konstruksi
                </button>
              </div>
            </div>
          </Card>
          )}

          {/* Integration Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/competency-builder">
              <Card className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Competency Builder</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Bangun e-course 6 langkah untuk kompetensi baru</p>
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs font-medium">Mulai Membangun <ArrowRight className="w-3 h-3" /></div>
              </Card>
            </Link>
            <Link href="/sertifikasi">
              <Card className="p-4 border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Exam Center</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ikuti ujian sertifikasi untuk memverifikasi kompetensi</p>
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-medium">Mulai Ujian <ArrowRight className="w-3 h-3" /></div>
              </Card>
            </Link>
            <Link href="/skills-matrix">
              <Card className="p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">Skills Matrix</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Petakan gap dan analisis perkembangan kompetensi tim</p>
                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-medium">Lihat Matrix <ArrowRight className="w-3 h-3" /></div>
              </Card>
            </Link>
          </div>

          {/* BNSP/LSP Info */}
          <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-500" /> Integrasi LSP & BNSP
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: FileText, title: "APL 01 & 02", desc: "Formulir permohonan asesmen kompetensi standar BNSP", color: "text-blue-500" },
                { icon: User, title: "Manajemen Asesor", desc: "Kelola asesor bersertifikat BNSP dengan NRA terverifikasi", color: "text-green-500" },
                { icon: Map, title: "Pemetaan SKKNI", desc: "Petakan setiap kompetensi ke unit SKKNI yang relevan", color: "text-purple-500" },
                { icon: Eye, title: "6 Metode Asesmen", desc: "APL, Observasi, Wawancara, Tes Tertulis, Portfolio, Simulasi", color: "text-orange-500" },
                { icon: QrCode, title: "Verifikasi QR Code", desc: "Verifikasi sertifikat kompetensi secara digital dan real-time", color: "text-teal-500" },
                { icon: TrendingUp, title: "Dashboard Analitik", desc: "Heatmap dan progress tracking kompetensi seluruh tim", color: "text-red-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <item.icon className={`w-5 h-5 ${item.color} shrink-0 mt-0.5`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>
    </>
  );
}
