import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Award, Target, Zap, CheckCircle, Users, Star,
  TrendingUp, Brain, Shield, Building2, Play, ArrowRight,
  GraduationCap, Briefcase, Factory, Mic, Video, BarChart3,
  FileText, Calendar, MessageSquare, Globe, Download, Share2,
  Layers, Trophy, Map, Clock, Sparkles, MonitorPlay, DollarSign,
  ChevronDown, ChevronUp, Lock, Rocket, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { ChaesaLogo } from "@/components/ChaesaLogo";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Footer } from "@/components/Footer";

const SEGMENTS = [
  {
    id: "pelajar",
    emoji: "🎒",
    label: "Pelajar SMA/SMK",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    accent: "text-blue-600 dark:text-blue-400",
    desc: "Belajar lebih cepat, ujian lebih siap, dan punya portfolio digital sejak dini",
    goals: ["Lulus ujian dengan nilai tinggi", "Punya sertifikat tambahan", "Belajar mandiri kapan saja"],
    features: [
      { icon: "✍️", title: "Quiz & Simulasi Ujian", desc: "Latihan soal interaktif per mata pelajaran dengan pembahasan AI" },
      { icon: "📚", title: "Learning Path Terstruktur", desc: "Jalur belajar per jurusan: IPA, IPS, SMK Teknik, SMK Bisnis" },
      { icon: "🎥", title: "Rekam & Rangkum Pelajaran", desc: "Rekam kelas/les privat, AI otomatis buat ringkasan dan catatan" },
      { icon: "📖", title: "Storybook Visual", desc: "Materi belajar dalam format cerita visual yang mudah dipahami" },
      { icon: "🏅", title: "Sertifikat Digital", desc: "Sertifikat kelulusan kursus yang bisa dibagikan ke LinkedIn" },
      { icon: "🤖", title: "AI Tutor 24/7", desc: "Tanya soal apa saja ke AI, dapat penjelasan langkah demi langkah" },
    ],
    cta: { label: "Mulai Belajar Gratis", href: "/micro-learning" },
    stats: [{ n: "500+", l: "Materi Gratis" }, { n: "95%", l: "Puas dengan AI" }, { n: "0 Rp", l: "Untuk Mulai" }],
  },
  {
    id: "mahasiswa",
    emoji: "🎓",
    label: "Mahasiswa",
    color: "from-purple-500 to-violet-600",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    accent: "text-purple-600 dark:text-purple-400",
    desc: "Ubah kuliah jadi konten, bangun portfolio profesional, dan siap kerja sebelum wisuda",
    goals: ["Rekam kuliah jadi materi belajar", "Siap kerja dengan sertifikat", "Bangun portfolio digital"],
    features: [
      { icon: "🎙️", title: "Meeting → Ringkasan Kuliah", desc: "Rekam perkuliahan, AI auto-transkrip dan buat mind map + ringkasan" },
      { icon: "📊", title: "Slide AI dari Rekaman", desc: "Generate presentasi otomatis dari rekaman kuliah atau diskusi" },
      { icon: "🎯", title: "Competency Builder", desc: "Bangun e-course berbasis SKKNI, siapkan portofolio kerja" },
      { icon: "🛡️", title: "Competency Passport", desc: "Portofolio digital terverifikasi untuk melamar kerja" },
      { icon: "📋", title: "Sertifikasi Profesi", desc: "Persiapan SKK/BNSP, ujian kompetensi nasional" },
      { icon: "🗺️", title: "Learning Path Karir", desc: "Jalur belajar menuju karir impian: Tech, Finance, Engineering" },
    ],
    cta: { label: "Mulai Buat Portfolio", href: "/competency-builder" },
    stats: [{ n: "334", l: "Posisi SKK" }, { n: "6", l: "Langkah Kompetensi" }, { n: "4", l: "Level L1-L4" }],
  },
  {
    id: "pekerja",
    emoji: "🦺",
    label: "Pekerja & Teknisi",
    color: "from-orange-500 to-amber-500",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700",
    accent: "text-orange-600 dark:text-orange-400",
    desc: "Penuhi syarat K3, raih SKK konstruksi, dan lacak PKB points untuk perpanjangan sertifikat",
    goals: ["Penuhi kewajiban K3 wajib", "Raih SKK & sertifikat BNSP", "Lacak PKB 150 jam/tahun"],
    features: [
      { icon: "🏗️", title: "157+ Modul BIMTEK", desc: "K3 wajib, sipil gedung, jalan, elektrikal, mekanikal, manajemen" },
      { icon: "🏆", title: "PKB Points Tracker", desc: "Lacak 150 jam PKB tahunan otomatis saat menyelesaikan modul" },
      { icon: "📋", title: "Database 334 SKK", desc: "Cari posisi SKK sesuai bidang, cek syarat & biaya sertifikasi" },
      { icon: "🤖", title: "8 AI Expert Konstruksi", desc: "Konsultasi K3, struktur, MEP, manajemen proyek kapan saja" },
      { icon: "✍️", title: "Quiz Simulasi SKK", desc: "65+ soal latihan untuk persiapan asesmen kompetensi BNSP" },
      { icon: "🛡️", title: "Competency Passport", desc: "Rekam semua SKK dan sertifikat dalam satu passport digital" },
    ],
    cta: { label: "Mulai BIMTEK", href: "/bimtek-integration" },
    stats: [{ n: "157+", l: "Modul BIMTEK" }, { n: "150", l: "Target PKB/Tahun" }, { n: "8", l: "AI Expert" }],
  },
  {
    id: "profesional",
    emoji: "💼",
    label: "Profesional",
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-700",
    accent: "text-indigo-600 dark:text-indigo-400",
    desc: "Tingkatkan kompetensi, validasi keahlian, dan bangun reputasi profesional terverifikasi",
    goals: ["Validasi keahlian dengan sertifikat", "Lacak gap kompetensi", "Naik jabatan lebih cepat"],
    features: [
      { icon: "🎯", title: "Competency E-Course Builder", desc: "Build e-course berbasis SKKNI dengan 6 langkah, AI-powered" },
      { icon: "🕸️", title: "Radar Chart Kompetensi", desc: "Visualisasi radar spider chart seluruh kompetensi Anda" },
      { icon: "📈", title: "Skills Matrix & Gap Analysis", desc: "Identifikasi gap kompetensi vs standar jabatan target" },
      { icon: "📝", title: "Exam Center", desc: "Ujian online terstruktur dengan soal AI, nilai otomatis" },
      { icon: "🗂️", title: "Learning Path Advanced", desc: "Jalur belajar custom menuju posisi target dengan milestone" },
      { icon: "📄", title: "Cetak Competency Passport", desc: "Passport digital ber-QR code, siap dibagikan ke HR & klien" },
    ],
    cta: { label: "Bangun Competency", href: "/competency-builder" },
    stats: [{ n: "6", l: "View Mode Passport" }, { n: "3", l: "Tahun Masa SKK" }, { n: "100%", l: "SKKNI Compliant" }],
  },
  {
    id: "creator",
    emoji: "🎬",
    label: "Content Creator",
    color: "from-pink-500 to-rose-500",
    bg: "bg-pink-50 dark:bg-pink-900/20",
    border: "border-pink-200 dark:border-pink-700",
    accent: "text-pink-600 dark:text-pink-400",
    desc: "Ubah live meeting jadi ratusan konten dalam menit — kursus, podcast, slides, dan caption otomatis",
    goals: ["Monetisasi konten edukasi", "Buat konten lebih cepat", "Multi-platform dari 1 rekaman"],
    features: [
      { icon: "🤖", title: "AI Meeting → E-Course", desc: "1 rekaman 2 jam → 20 modul kursus siap jual dalam 15 menit" },
      { icon: "🎙️", title: "AI Podcast Generator", desc: "Auto-generate naskah & script podcast dari rekaman meeting" },
      { icon: "📱", title: "AI Caption Multi-Platform", desc: "Caption Instagram, TikTok, LinkedIn, Twitter otomatis dari rekaman" },
      { icon: "🖥️", title: "AI Slide Generator", desc: "Generate presentasi profesional dari konten rekaman" },
      { icon: "📅", title: "Content Calendar", desc: "Jadwalkan konten dari satu rekaman untuk publikasi berulang" },
      { icon: "🛒", title: "Live Commerce", desc: "Jual kursus langsung saat live, integrasi Mayar.id" },
    ],
    cta: { label: "Mulai Buat Konten", href: "/ai-studio" },
    stats: [{ n: "15", l: "Menit Per Kursus" }, { n: "5x", l: "Lebih Cepat" }, { n: "6+", l: "Format Output" }],
  },
  {
    id: "corporate",
    emoji: "🏢",
    label: "Corporate & HRD",
    color: "from-teal-500 to-green-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    border: "border-teal-200 dark:border-teal-700",
    accent: "text-teal-600 dark:text-teal-400",
    desc: "Kelola pelatihan tim, validasi kompetensi massal, dan bangun knowledge management perusahaan",
    goals: ["Efisiensi biaya pelatihan 60%", "Pantau kompetensi tim real-time", "Compliance BIMTEK & SKK"],
    features: [
      { icon: "📊", title: "Skills Matrix Tim", desc: "Peta kompetensi seluruh tim vs standar jabatan, gap analysis" },
      { icon: "🏗️", title: "BIMTEK Management", desc: "Kelola wajib BIMTEK K3, pantau PKB setiap karyawan" },
      { icon: "🛡️", title: "Competency Passport Tim", desc: "Repository passport digital seluruh karyawan terpusat" },
      { icon: "📈", title: "Training Dashboard", desc: "Progress pelatihan tim real-time, laporan per departemen" },
      { icon: "🎓", title: "Internal E-Course Builder", desc: "Buat kursus internal dari knowledge tim menggunakan AI" },
      { icon: "📋", title: "Sertifikasi & Kepatuhan", desc: "Track sertifikat SKK/BNSP, alert tanggal kadaluarsa" },
    ],
    cta: { label: "Demo Corporate", href: "/skills-matrix" },
    stats: [{ n: "60%", l: "Hemat Biaya Training" }, { n: "∞", l: "Karyawan" }, { n: "3", l: "Platform Terintegrasi" }],
  },
];

const ALL_FEATURES = [
  {
    app: "Chaesa Live",
    icon: "🤖",
    color: "bg-purple-600",
    textColor: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-700",
    features: [
      { name: "Meeting Recording & Transkrip AI", segments: ["creator", "mahasiswa", "pelajar", "corporate"] },
      { name: "E-Course Builder AI (15 menit)", segments: ["creator", "corporate", "mahasiswa"] },
      { name: "Podcast Script Generator", segments: ["creator"] },
      { name: "Slide & Presentasi AI", segments: ["creator", "mahasiswa", "corporate"] },
      { name: "Caption Multi-Platform (IG, TikTok, LinkedIn)", segments: ["creator"] },
      { name: "Quiz & Ujian AI", segments: ["pelajar", "mahasiswa", "pekerja", "profesional"] },
      { name: "Sertifikat Digital + QR Code", segments: ["pelajar", "mahasiswa", "profesional", "corporate"] },
      { name: "Learning Path Custom", segments: ["pelajar", "mahasiswa", "profesional", "corporate"] },
      { name: "Live Commerce (jual kursus saat live)", segments: ["creator", "corporate"] },
      { name: "Content Calendar Management", segments: ["creator", "corporate"] },
      { name: "Storybook Visual Learning", segments: ["pelajar", "mahasiswa"] },
      { name: "Dashboard Progress Real-time", segments: ["pelajar", "mahasiswa", "profesional", "corporate"] },
    ],
  },
  {
    app: "Competency Builder & Passport",
    icon: "🎯",
    color: "bg-blue-600",
    textColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-700",
    features: [
      { name: "6-Step Course Structure (Orientasi→Refleksi)", segments: ["mahasiswa", "profesional", "corporate"] },
      { name: "SKKNI Mapping L1–L4", segments: ["pekerja", "profesional", "mahasiswa"] },
      { name: "AI Content Generator (gpt-4o-mini)", segments: ["mahasiswa", "profesional", "creator", "corporate"] },
      { name: "Competency Passport Digital (QR Code)", segments: ["mahasiswa", "pekerja", "profesional", "corporate"] },
      { name: "Radar Chart Kompetensi", segments: ["profesional", "corporate"] },
      { name: "Timeline Kompetensi", segments: ["profesional", "mahasiswa"] },
      { name: "Skills Matrix & Gap Analysis", segments: ["profesional", "corporate"] },
      { name: "Cetak PDF Passport", segments: ["profesional", "mahasiswa", "pekerja"] },
      { name: "Exam Center (Ujian Online)", segments: ["pelajar", "mahasiswa", "pekerja", "profesional"] },
    ],
  },
  {
    app: "BimtekKita Integration",
    icon: "🏗️",
    color: "bg-orange-600",
    textColor: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-700",
    features: [
      { name: "157+ Modul BIMTEK Konstruksi", segments: ["pekerja", "profesional", "corporate"] },
      { name: "PKB Points Tracker (150 jam/tahun)", segments: ["pekerja", "profesional"] },
      { name: "Database 334 Posisi SKK/BNSP", segments: ["pekerja", "profesional", "mahasiswa", "corporate"] },
      { name: "8 AI Expert Konstruksi", segments: ["pekerja", "profesional", "corporate"] },
      { name: "Quiz Simulasi SKK (65+ soal)", segments: ["pekerja", "profesional"] },
      { name: "Alur Sertifikasi BNSP Step-by-Step", segments: ["pekerja", "profesional", "mahasiswa"] },
      { name: "9 Tools Kalkulasi Teknik Sipil", segments: ["pekerja", "profesional"] },
      { name: "PKB Monthly Planner", segments: ["pekerja", "profesional", "corporate"] },
    ],
  },
];

const COMPARISON = [
  { feature: "Harga mulai dari", chaesa: "Rp 0 (Gratis)", bimtek: "Terintegrasi", competitor: "Rp 200.000/bln" },
  { feature: "Meeting → Kursus AI", chaesa: "✅ 15 menit", bimtek: "—", competitor: "❌ Manual" },
  { feature: "BIMTEK Konstruksi", chaesa: "✅ via BimtekKita", bimtek: "✅ 157+ modul", competitor: "❌ Tidak ada" },
  { feature: "SKK/BNSP Tracking", chaesa: "✅ Passport Digital", bimtek: "✅ 334 posisi", competitor: "❌ Tidak ada" },
  { feature: "AI Expert Spesialis", chaesa: "✅ 8 AI Expert", bimtek: "✅ Konstruksi", competitor: "⚠️ Chatbot biasa" },
  { feature: "Competency Passport", chaesa: "✅ QR + PDF", bimtek: "✅ Terintegrasi", competitor: "❌ Tidak ada" },
  { feature: "Live Commerce", chaesa: "✅ Mayar.id", bimtek: "—", competitor: "❌ Tidak ada" },
  { feature: "Multi-Segment Support", chaesa: "✅ 6 segmen", bimtek: "✅ Konstruksi", competitor: "⚠️ Umum saja" },
];

const SEGMENT_COLORS: Record<string, string> = {
  pelajar: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  mahasiswa: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  pekerja: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
  profesional: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
  creator: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
  corporate: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
};
const SEGMENT_LABELS: Record<string, string> = {
  pelajar: "Pelajar", mahasiswa: "Mahasiswa", pekerja: "Pekerja", profesional: "Profesional", creator: "Creator", corporate: "Corporate",
};

export default function Platform() {
  const [activeSegment, setActiveSegment] = useState("pelajar");
  const [expandedFeatureApp, setExpandedFeatureApp] = useState<string | null>("Chaesa Live");
  const seg = SEGMENTS.find(s => s.id === activeSegment)!;

  return (
    <>
      <SEO
        title="Platform Overview — Chaesa Live × BimtekKita"
        description="Platform edukasi komprehensif untuk pelajar, mahasiswa, pekerja, profesional, content creator, dan corporate. AI-powered learning, BIMTEK, SKK, dan Competency Passport."
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">

        {/* Simple nav header */}
        <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <ChaesaLogo size={32} />
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Chaesa Live</span>
                <span className="text-gray-300 dark:text-gray-600 mx-1">×</span>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">BimtekKita</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeSwitch />
              <Link href="/"><Button variant="outline" size="sm" className="text-xs">← Beranda</Button></Link>
              <Link href="/auth"><Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700 text-white">Mulai Gratis</Button></Link>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

          {/* Hero */}
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-4 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
              3 Platform · 1 Ekosistem · 6 Segmen Pengguna
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Platform Edukasi
              <span className="block bg-gradient-to-r from-purple-600 via-orange-500 to-teal-500 bg-clip-text text-transparent">
                Paling Komprehensif di Indonesia
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Dari pelajar SMA hingga corporate multinasional — satu ekosistem yang menggabungkan <strong>AI Learning</strong>, <strong>BIMTEK Konstruksi</strong>, <strong>Sertifikasi BNSP</strong>, dan <strong>Competency Management</strong>.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-shadow">
                  <Rocket className="w-5 h-5 mr-2" /> Mulai Gratis Sekarang
                </Button>
              </Link>
              <a href="https://bimtek.replit.app" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="px-8 py-3 rounded-xl text-base border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                  🏗️ Buka BimtekKita <ExternalLink className="w-4 h-4 ml-1.5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { n: "3", l: "Platform Terintegrasi", icon: "🔗", color: "text-purple-600 dark:text-purple-400" },
              { n: "157+", l: "Modul BIMTEK", icon: "🏗️", color: "text-orange-600 dark:text-orange-400" },
              { n: "334", l: "Posisi SKK/BNSP", icon: "📋", color: "text-blue-600 dark:text-blue-400" },
              { n: "6", l: "Segmen Pengguna", icon: "👥", color: "text-teal-600 dark:text-teal-400" },
            ].map((s, i) => (
              <Card key={i} className="p-5 text-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className={`text-3xl font-extrabold ${s.color}`}>{s.n}</div>
                <div className="text-xs text-gray-500 mt-1">{s.l}</div>
              </Card>
            ))}
          </div>

          {/* User Segment Picker */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Cocok untuk Siapa? <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">Semua Orang</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Pilih profil Anda untuk melihat fitur yang relevan</p>
            </div>

            {/* Segment tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {SEGMENTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSegment(s.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all border-2 ${
                    activeSegment === s.id
                      ? `bg-gradient-to-r ${s.color} text-white border-transparent shadow-lg scale-105`
                      : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>

            {/* Segment detail */}
            <div className={`rounded-3xl border-2 ${seg.border} ${seg.bg} p-6 md:p-8`}>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Left: intro */}
                <div className="md:col-span-1">
                  <div className="text-5xl mb-3">{seg.emoji}</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{seg.label}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{seg.desc}</p>
                  <div className="space-y-2 mb-5">
                    {seg.goals.map((g, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle className={`w-4 h-4 ${seg.accent} shrink-0`} /> {g}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {seg.stats.map((s, i) => (
                      <div key={i} className="text-center p-2 bg-white/70 dark:bg-gray-900/70 rounded-xl">
                        <div className={`text-xl font-extrabold ${seg.accent}`}>{s.n}</div>
                        <div className="text-[10px] text-gray-500 leading-tight">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <Link href={seg.cta.href}>
                    <Button className={`w-full bg-gradient-to-r ${seg.color} text-white font-bold shadow-lg`}>
                      {seg.cta.label} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>

                {/* Right: features grid */}
                <div className="md:col-span-2 grid sm:grid-cols-2 gap-3">
                  {seg.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                      <span className="text-2xl shrink-0">{f.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{f.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All Features with segment tags */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Seluruh Fitur <span className="bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">Ketiga Platform</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Lihat fitur mana yang relevan dengan profil Anda</p>
            </div>

            <div className="space-y-4">
              {ALL_FEATURES.map((app) => {
                const isOpen = expandedFeatureApp === app.app;
                return (
                  <Card key={app.app} className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                    <button
                      onClick={() => setExpandedFeatureApp(isOpen ? null : app.app)}
                      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${app.color} flex items-center justify-center text-lg`}>{app.icon}</div>
                        <div className="text-left">
                          <div className="font-bold text-gray-900 dark:text-white">{app.app}</div>
                          <div className="text-xs text-gray-400">{app.features.length} fitur tersedia</div>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
                        <div className="grid sm:grid-cols-2 gap-2 mt-4">
                          {app.features.map((f, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                              <CheckCircle className={`w-4 h-4 ${app.textColor} shrink-0 mt-0.5`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {f.segments.map(sid => (
                                    <span key={sid} className={`text-[10px] px-1.5 py-0.5 rounded-full ${SEGMENT_COLORS[sid]}`}>
                                      {SEGMENT_LABELS[sid]}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Platform Comparison */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Perbandingan <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">Platform</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Mengapa ekosistem Chaesa × BimtekKita unggul dari platform lain</p>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-orange-500 text-white">
                    <th className="text-left px-5 py-4 font-semibold w-1/3">Fitur</th>
                    <th className="text-center px-4 py-4 font-semibold">
                      <div>🤖 Chaesa Live</div>
                      <div className="text-xs font-normal opacity-80">AI Learning Platform</div>
                    </th>
                    <th className="text-center px-4 py-4 font-semibold">
                      <div>🏗️ BimtekKita</div>
                      <div className="text-xs font-normal opacity-80">Konstruksi & BIMTEK</div>
                    </th>
                    <th className="text-center px-4 py-4 font-semibold">
                      <div>⚙️ Platform Lain</div>
                      <div className="text-xs font-normal opacity-80">LMS Umum</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={i} className={`${i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"} border-b border-gray-100 dark:border-gray-800`}>
                      <td className="px-5 py-3.5 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={row.chaesa.startsWith("✅") ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-600 dark:text-gray-400"}>{row.chaesa}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={row.bimtek.startsWith("✅") ? "text-green-600 dark:text-green-400 font-semibold" : "text-gray-400"}>{row.bimtek}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={row.competitor.startsWith("❌") ? "text-red-500 dark:text-red-400" : row.competitor.startsWith("⚠️") ? "text-yellow-600 dark:text-yellow-400" : "text-gray-600 dark:text-gray-400"}>{row.competitor}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Learning Journey Flow */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Perjalanan Belajar <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">End-to-End</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Dari belajar pertama kali hingga sertifikasi nasional</p>
            </div>
            <div className="relative">
              <div className="hidden md:block absolute left-1/2 -translate-x-0.5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-purple-400 via-blue-400 via-orange-400 to-teal-400" />
              <div className="space-y-4 md:space-y-6">
                {[
                  { step: "1", title: "Mulai Belajar", desc: "Pelajar: quiz & learning path • Mahasiswa: rekam kuliah • Creator: rekam meeting • Pekerja: modul BIMTEK K3", color: "bg-purple-500", side: "left", links: [{ l: "Micro-Learning", h: "/micro-learning" }, { l: "BIMTEK", h: "/bimtek-integration" }] },
                  { step: "2", title: "Generate Konten AI", desc: "AI mengubah rekaman jadi e-course, slide, podcast, caption, dan ringkasan dalam hitungan menit", color: "bg-blue-500", side: "right", links: [{ l: "AI Studio", h: "/ai-studio" }, { l: "Creator Dashboard", h: "/creator-dashboard" }] },
                  { step: "3", title: "Bangun Kompetensi", desc: "Ikuti 6 langkah learning: Orientasi → Konteks → Microlearning → Praktik → Asesmen → Refleksi", color: "bg-indigo-500", side: "left", links: [{ l: "Competency Builder", h: "/competency-builder" }, { l: "Learning Path", h: "/learning-path" }] },
                  { step: "4", title: "Ujian & Sertifikasi", desc: "Quiz SKK simulasi → Exam Center → Asesmen LSP → Sertifikat Kompetensi Kerja BNSP", color: "bg-orange-500", side: "right", links: [{ l: "Exam Center", h: "/sertifikasi" }, { l: "Quiz SKK", h: "/bimtek-integration" }] },
                  { step: "5", title: "Raih Passport Digital", desc: "Semua sertifikat, SKK, PKB points, dan kompetensi tercatat dalam Competency Passport ber-QR code", color: "bg-teal-500", side: "left", links: [{ l: "Competency Passport", h: "/competency-passport" }, { l: "Sertifikat Saya", h: "/sertifikat" }] },
                ].map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 ${item.side === "right" ? "md:flex-row-reverse" : ""}`}>
                    <div className={`relative z-10 w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white font-bold text-sm shrink-0 md:mx-auto shadow-lg`}>
                      {item.step}
                    </div>
                    <Card className={`flex-1 p-5 border-2 ${i % 2 === 0 ? "border-purple-100 dark:border-purple-800/50" : "border-orange-100 dark:border-orange-800/50"} bg-white dark:bg-gray-900`}>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.links.map((lnk, j) => (
                          <Link key={j} href={lnk.h}>
                            <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer">
                              {lnk.l} →
                            </span>
                          </Link>
                        ))}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Three App showcase */}
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                3 Platform, <span className="bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">Satu Ekosistem</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  app: "Chaesa Live",
                  icon: "🤖",
                  gradient: "from-purple-600 to-pink-600",
                  desc: "AI micro-learning platform — ubah meeting, kuliah, atau diskusi menjadi kursus, podcast, slide, dan caption otomatis",
                  highlights: ["Meeting → E-Course 15 menit", "AI Podcast & Slide Generator", "Quiz & Sertifikat Digital", "Live Commerce Mayar.id", "Content Calendar", "Dashboard Real-time"],
                  cta: { label: "Mulai di Chaesa", href: "/ai-studio" },
                },
                {
                  app: "BimtekKita Integration",
                  icon: "🏗️",
                  gradient: "from-orange-600 to-amber-500",
                  desc: "Platform pelatihan konstruksi nasional — BIMTEK, SKK/BNSP, AI Expert, quiz simulasi, dan PKB tracker",
                  highlights: ["157+ Modul BIMTEK", "334 Posisi SKK Database", "8 AI Expert Konstruksi", "Quiz Simulasi 65+ Soal", "PKB Planner Tahunan", "9 Tools Kalkulasi Sipil"],
                  cta: { label: "Buka BimtekKita", href: "/bimtek-integration" },
                },
                {
                  app: "Competency System",
                  icon: "🎯",
                  gradient: "from-teal-600 to-blue-600",
                  desc: "Bangun, validasi, dan dokumentasikan kompetensi Anda dengan standar SKKNI/BNSP — passport digital siap dibagikan",
                  highlights: ["6-Step Course Builder", "L1–L4 SKKNI Framework", "Competency Passport QR", "Radar Chart Kompetensi", "Skills Matrix & Gap", "Exam Center Online"],
                  cta: { label: "Bangun Competency", href: "/competency-builder" },
                },
              ].map((item, i) => (
                <div key={i} className="flex flex-col">
                  <div className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-6 text-white mb-4 relative overflow-hidden`}>
                    <div className="absolute -top-4 -right-4 text-6xl opacity-20">{item.icon}</div>
                    <div className="relative z-10">
                      <div className="text-3xl mb-2">{item.icon}</div>
                      <h3 className="text-xl font-bold mb-1">{item.app}</h3>
                      <p className="text-white/80 text-sm">{item.desc}</p>
                    </div>
                  </div>
                  <Card className="flex-1 p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <ul className="space-y-2 mb-5">
                      {item.highlights.map((h, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {h}
                        </li>
                      ))}
                    </ul>
                    <Link href={item.cta.href}>
                      <Button className={`w-full bg-gradient-to-r ${item.gradient} text-white`}>
                        {item.cta.label} <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </Link>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Quick access grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5 text-center">Akses Cepat ke Semua Fitur</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { icon: "🎥", label: "AI Studio", href: "/ai-studio", color: "hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20" },
                { icon: "📚", label: "Micro-Learning", href: "/micro-learning", color: "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" },
                { icon: "🗺️", label: "Learning Path", href: "/learning-path", color: "hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" },
                { icon: "🏗️", label: "BIMTEK", href: "/bimtek-integration", color: "hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20" },
                { icon: "🎯", label: "Competency Builder", href: "/competency-builder", color: "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" },
                { icon: "🛡️", label: "Competency Passport", href: "/competency-passport", color: "hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20" },
                { icon: "📝", label: "Exam Center", href: "/sertifikasi", color: "hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20" },
                { icon: "🏅", label: "Sertifikat Saya", href: "/sertifikat", color: "hover:border-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" },
                { icon: "📊", label: "Skills Matrix", href: "/skills-matrix", color: "hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" },
                { icon: "📅", label: "Jadwal Live", href: "/schedule", color: "hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20" },
                { icon: "📖", label: "Storybook Visual", href: "/storybook", color: "hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20" },
                { icon: "📈", label: "Dashboard", href: "/dashboard", color: "hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20" },
              ].map((item, i) => (
                <Link key={i} href={item.href}>
                  <div className={`p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${item.color} transition-all cursor-pointer group text-center`}>
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 6-Step SKKNI Course Structure */}
          <div>
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                Standar SKKNI/BNSP
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                6-Langkah <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Struktur Kompetensi</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Setiap kursus dibangun mengikuti kerangka SKKNI — dari pengenalan hingga refleksi mendalam, menghasilkan kompetensi terverifikasi
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  step: "01", label: "Orientasi", icon: "🧭", color: "from-violet-500 to-purple-600", light: "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700",
                  desc: "Peserta memahami tujuan, konteks, dan gambaran besar kompetensi yang akan dibangun",
                  bullets: ["Identifikasi tujuan belajar", "Peta kompetensi keseluruhan", "Self-assessment awal", "Ekspektasi hasil akhir"],
                },
                {
                  step: "02", label: "Konteks", icon: "📍", color: "from-blue-500 to-indigo-600", light: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",
                  desc: "Membangun pemahaman konteks industri, regulasi, dan standar yang berlaku di bidang kompetensi",
                  bullets: ["Regulasi industri terkait", "Standar K3 yang berlaku", "Konteks proyek nyata", "Perbandingan praktik internasional"],
                },
                {
                  step: "03", label: "Micro-Learning", icon: "⚡", color: "from-cyan-500 to-teal-500", light: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-700",
                  desc: "Unit-unit belajar kecil (5–15 menit per unit) yang AI-generated dan mudah dicerna kapan saja",
                  bullets: ["5–15 modul per kompetensi", "Video + teks + infografik", "AI-generated content", "Bisa diulang kapan saja"],
                },
                {
                  step: "04", label: "Praktik", icon: "🔧", color: "from-orange-500 to-amber-500", light: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700",
                  desc: "Latihan hands-on, studi kasus, dan simulasi proyek nyata untuk mengaplikasikan teori",
                  bullets: ["Studi kasus proyek real", "Simulasi asesmen lapangan", "Tools kalkulasi teknis", "Diskusi forum dengan AI Expert"],
                },
                {
                  step: "05", label: "Asesmen", icon: "✅", color: "from-green-500 to-emerald-600", light: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",
                  desc: "Ujian kompetensi terstruktur — dari quiz simulasi hingga asesmen formal BNSP dengan skor dan umpan balik AI",
                  bullets: ["Quiz simulasi 65+ soal", "Asesmen portofolio kerja", "Skor real-time + pembahasan", "Siap menghadapi LSP"],
                },
                {
                  step: "06", label: "Refleksi", icon: "💡", color: "from-pink-500 to-rose-500", light: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700",
                  desc: "Merekap perjalanan belajar, mengidentifikasi gap, merencanakan langkah pengembangan lanjutan",
                  bullets: ["Ringkasan perjalanan belajar", "Gap analysis vs standar", "PKB points terisi otomatis", "Rencana pengembangan lanjut"],
                },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl border-2 ${s.light} p-5`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-extrabold text-sm shadow-md`}>{s.step}</div>
                    <div>
                      <div className="text-lg">{s.icon}</div>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-base">{s.label}</div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{s.desc}</p>
                  <ul className="space-y-1">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* SKKNI Level Framework */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-3xl p-8 border border-indigo-200 dark:border-indigo-700">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700">
                Kerangka Kualifikasi Nasional Indonesia
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Level Kompetensi <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">L1 — L4 SKKNI</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Pilih level yang sesuai dengan pengalaman dan target karir Anda</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { level: "L1", label: "Asisten Ahli", icon: "🌱", color: "from-green-400 to-emerald-500", years: "0–2 tahun", eg: "Calon Teknisi, Fresh Graduate", skills: ["Pemahaman dasar K3", "Prosedur standar lapangan", "Penggunaan alat dasar", "Laporan kerja sederhana"] },
                { level: "L2", label: "Teknisi Madya", icon: "⚙️", color: "from-blue-400 to-indigo-500", years: "2–5 tahun", eg: "Teknisi, Pelaksana Lapangan", skills: ["Pengawasan sub-unit", "Analisa masalah teknis", "Koordinasi tim kecil", "Dokumentasi teknis"] },
                { level: "L3", label: "Ahli Muda", icon: "🏗️", color: "from-orange-400 to-amber-500", years: "5–10 tahun", eg: "Site Engineer, Pengawas", skills: ["Manajemen proyek", "Desain & perencanaan", "Evaluasi kualitas", "Mentoring junior"] },
                { level: "L4", label: "Ahli Utama", icon: "🏆", color: "from-purple-500 to-violet-600", years: "10+ tahun", eg: "Project Manager, Direktur Teknik", skills: ["Kepemimpinan strategis", "Manajemen risiko proyek", "Inovasi & R&D", "Kebijakan perusahaan"] },
              ].map((lvl, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className={`bg-gradient-to-r ${lvl.color} p-5 text-white`}>
                    <div className="text-2xl mb-1">{lvl.icon}</div>
                    <div className="text-2xl font-extrabold">{lvl.level}</div>
                    <div className="font-semibold text-sm">{lvl.label}</div>
                    <div className="text-white/70 text-xs mt-1">{lvl.years} pengalaman</div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">Contoh: {lvl.eg}</div>
                    <ul className="space-y-1.5">
                      {lvl.skills.map((sk, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" /> {sk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8 AI Expert Konstruksi */}
          <div>
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                Konsultasi 24/7 — Gratis
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                8 AI Expert <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Konstruksi Spesialis</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                Tanyakan apa saja — dari hitung struktur beton hingga strategi proyek — tersedia 24 jam kapan pun Anda butuh
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "Ir. Arif Struktur", role: "Ahli Struktur & Konstruksi Beton", avatar: "🏛️", color: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10", accent: "text-blue-600 dark:text-blue-400", prompts: ["Hitung kapasitas balok beton 30x50 beban 12 ton/m", "Apa perbedaan tulangan ulir vs polos untuk kolom?", "Syarat sambungan las struktur baja SNI 1729"] },
                { name: "Dr. Hendra K3", role: "Keselamatan & Kesehatan Kerja", avatar: "⛑️", color: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10", accent: "text-red-600 dark:text-red-400", prompts: ["Prosedur K3 pekerjaan di ketinggian >3m", "Daftar APD wajib untuk pekerjaan pengelasan", "Cara mengisi formulir izin kerja berbahaya"] },
                { name: "Eng. Sari MEP", role: "Mekanikal, Elektrikal & Plumbing", avatar: "⚡", color: "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10", accent: "text-yellow-600 dark:text-yellow-400", prompts: ["Spesifikasi kabel listrik untuk beban 50 kVA", "Hitung kapasitas pompa air bersih 10 lantai", "Standar HVAC untuk ruang server 100 m²"] },
                { name: "Pak Budi Proyek", role: "Manajemen Proyek Konstruksi", avatar: "📊", color: "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10", accent: "text-green-600 dark:text-green-400", prompts: ["Template Rencana Mutu Proyek (RMP)", "Cara buat S-Curve progress pekerjaan tanah", "Klaim keterlambatan akibat force majeure"] },
                { name: "Drs. Fuad Sipil", role: "Teknik Sipil & Infrastruktur Jalan", avatar: "🛣️", color: "border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/10", accent: "text-indigo-600 dark:text-indigo-400", prompts: ["Perhitungan tebal perkerasan lentur Bina Marga", "Spesifikasi beton K-350 untuk rigid pavement", "Desain drainase saluran trapesium 200 l/dt"] },
                { name: "Ir. Maya Arsitek", role: "Arsitektur & Desain Bangunan", avatar: "🏠", color: "border-pink-200 dark:border-pink-700 bg-pink-50 dark:bg-pink-900/10", accent: "text-pink-600 dark:text-pink-400", prompts: ["Persyaratan IMB untuk bangunan komersial", "Standar pencahayaan alami SNI ruang kantor", "Cara buat RAB arsitektur dari gambar schematic"] },
                { name: "Dr. Rini Geotek", role: "Geoteknik & Fondasi", avatar: "⛏️", color: "border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10", accent: "text-amber-600 dark:text-amber-400", prompts: ["Tentukan jenis fondasi untuk tanah lunak SPT < 5", "Hitung daya dukung tiang pancang 40x40 cm", "Syarat penyelidikan tanah untuk gedung 20 lantai"] },
                { name: "Pak Eko Legal", role: "Kontrak & Hukum Konstruksi", avatar: "⚖️", color: "border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/10", accent: "text-teal-600 dark:text-teal-400", prompts: ["Klausa force majeure standar kontrak FIDIC", "Syarat wanprestasi dan sanksi dalam SPK", "Cara klaim asuransi CAR (Contractor All Risk)"] },
              ].map((exp, i) => (
                <Card key={i} className={`p-5 border-2 ${exp.color}`}>
                  <div className="text-3xl mb-2">{exp.avatar}</div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{exp.name}</div>
                  <div className={`text-xs ${exp.accent} font-medium mb-3`}>{exp.role}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">Contoh pertanyaan:</div>
                  <ul className="space-y-1.5">
                    {exp.prompts.map((p, j) => (
                      <li key={j} className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 border border-gray-100 dark:border-gray-700 italic">
                        "{p}"
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/bimtek-integration">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-8 rounded-xl shadow-lg">
                  💬 Mulai Konsultasi dengan AI Expert <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                Pertanyaan <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Yang Sering Ditanyakan</span>
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              {[
                { q: "Apakah platform ini benar-benar gratis untuk pelajar?", a: "Ya! Pelajar SMA/SMK dan mahasiswa bisa mengakses ratusan materi micro-learning, quiz, dan learning path secara gratis. Fitur premium seperti AI content generator dan e-course builder membutuhkan langganan, namun ada paket khusus mahasiswa dengan harga terjangkau." },
                { q: "Apa itu PKB dan mengapa penting untuk pekerja konstruksi?", a: "PKB (Pengembangan Keprofesian Berkelanjutan) adalah kewajiban 150 jam/tahun untuk mempertahankan dan memperpanjang Sertifikat Kompetensi Kerja (SKK). Platform ini melacak jam PKB Anda secara otomatis setiap kali menyelesaikan modul BIMTEK, sehingga Anda tidak perlu khawatir saat perpanjangan SKK." },
                { q: "Bagaimana cara kerja fitur Meeting → E-Course untuk content creator?", a: "Cukup rekam meeting/webinar Anda menggunakan Chaesa Live, lalu AI kami akan memproses rekaman tersebut dalam 15 menit: memotong menjadi 15–20 modul belajar, membuat ringkasan + quiz per modul, generate slide presentasi, script podcast, dan caption multi-platform. Semua siap dijual melalui live commerce Mayar.id." },
                { q: "Apakah sertifikat dari platform ini diakui secara nasional?", a: "Sertifikat digital Chaesa Live berlaku sebagai bukti penyelesaian kursus dan bisa dibagikan ke LinkedIn. Untuk pengakuan formal BNSP/LSP, platform menyediakan persiapan SKK lengkap (quiz simulasi, materi BIMTEK) sehingga Anda siap menghadapi asesmen resmi di Lembaga Sertifikasi Profesi terakreditasi." },
                { q: "Apakah ada fitur untuk HRD yang ingin manage training tim?", a: "Ya! Fitur Corporate mencakup: Skills Matrix seluruh tim, dashboard PKB per karyawan, alert sertifikat yang akan kedaluwarsa, repository Competency Passport terpusat, dan kemampuan membuat e-course internal dari knowledge tim menggunakan AI. Hubungi kami untuk demo paket Enterprise." },
                { q: "Berapa lama untuk mendapatkan SKK setelah menggunakan platform ini?", a: "Timeline bervariasi tergantung posisi SKK. Umumnya: 2–4 minggu intensif untuk persiapan materi BIMTEK + quiz simulasi, kemudian mendaftar asesmen ke LSP (biasanya 1–3 bulan antrian). Platform ini membantu Anda siap 100% saat asesmen — tingkat kelulusan peserta yang menggunakan quiz simulasi kami lebih tinggi dari rata-rata." },
                { q: "Bisakah profesional non-konstruksi menggunakan platform ini?", a: "Tentu! Competency Builder mendukung 15+ sektor kompetensi: IT, Kesehatan, Pariwisata, Keuangan, Manufaktur, Agribisnis, dan lainnya — selain Konstruksi. Competency Passport dan Competency Radar berlaku universal untuk semua bidang." },
              ].map((faq, i) => (
                <details key={i} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{faq.q}</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-5 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 rounded-3xl p-10 text-white text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-3xl font-extrabold mb-3">Siap Memulai Perjalanan Belajar Anda?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">Bergabung dengan ribuan pelajar, profesional, dan pekerja yang sudah menggunakan platform ini untuk meningkatkan kompetensi mereka</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth">
                <Button className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-8 py-3 text-base rounded-xl">
                  <Rocket className="w-5 h-5 mr-2" /> Daftar Gratis Sekarang
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/20 px-8 py-3 text-base rounded-xl">
                  ← Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </div>

        </div>

        <Footer />
      </div>
    </>
  );
}
