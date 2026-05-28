import { useState, useMemo } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search, Star, Download, ArrowRight, Rocket, CheckCircle,
  TrendingUp, Zap, Grid3x3, List, Users, Package, Clock, Flame
} from "lucide-react";
import Link from "next/link";
import { ChaesaLogo } from "@/components/ChaesaLogo";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Footer } from "@/components/Footer";

/* ── Types ────────────────────────────────────────────── */
interface Skill {
  cat: string; icon: string; name: string; desc: string;
  author: string; installs: number; rating: number;
  badge: string | null; href: string; tags: string[];
  isNew: boolean; updated: string; weeklyActive: number;
  level: "Pemula" | "Menengah" | "Lanjutan" | "Semua Level";
  duration?: string;
}

/* ── Data ─────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "all",         label: "Semua",                icon: "🔥" },
  { id: "bimtek",      label: "BIMTEK & K3",          icon: "🏗️" },
  { id: "sertifikasi", label: "Sertifikasi BNSP",     icon: "🛡️" },
  { id: "ai-expert",   label: "AI Expert Skills",     icon: "🤖" },
  { id: "creator",     label: "Creator Tools",        icon: "🎬" },
  { id: "akademik",    label: "Akademik",             icon: "🎓" },
  { id: "competency",  label: "Competency Templates", icon: "🎯" },
  { id: "corporate",   label: "Corporate & HRD",      icon: "🏢" },
  { id: "quiz",        label: "Quiz & Asesmen",       icon: "✍️" },
  { id: "analytics",   label: "Analytics & Laporan",  icon: "📊" },
  { id: "integrasi",   label: "Integrasi & Tools",    icon: "🔗" },
  { id: "personal",    label: "Personal Learning",    icon: "👤" },
];

const SORT_OPTIONS = ["Terpopuler", "Terbaru", "Top Rating", "Unggulan"];

const SKILLS: Skill[] = [
  { cat:"creator",     icon:"⚡",  name:"Meeting → E-Course 15 Menit",        desc:"Upload rekaman meeting/webinar → AI potong jadi 15–20 modul, buat quiz per modul, generate slide dan script podcast. Siap dijual via Mayar.id.",                                                               author:"Chaesa AI Team",   installs:12300, rating:4.9, badge:"🔥 Terpopuler", href:"/ai-studio",           tags:["AI","Creator","Kursus"],                isNew:false, updated:"2 hari lalu",   weeklyActive:1840, level:"Semua Level",  duration:"Setup 5 menit" },
  { cat:"bimtek",      icon:"⛑️", name:"K3 Umum Wajib Pack",                 desc:"Paket lengkap 12 modul K3 wajib: HIRARC, P3K, APD, bekerja di ketinggian, ruang terbatas, dan izin kerja berbahaya. Cocok untuk semua pekerja konstruksi.",                                                   author:"Tim BimtekKita",   installs:8420,  rating:4.9, badge:"Unggulan",     href:"/bimtek-integration",  tags:["K3","Wajib","BNSP"],                   isNew:false, updated:"1 minggu lalu", weeklyActive:970,  level:"Pemula",       duration:"12 modul · 8 jam" },
  { cat:"integrasi",   icon:"📱",  name:"Caption Multi-Platform AI",           desc:"Dari satu rekaman, AI generate caption untuk Instagram (carousel), TikTok, LinkedIn, Twitter/X secara bersamaan. Tone, hashtag, dan panjang disesuaikan per platform.",                                         author:"Chaesa AI Team",   installs:9120,  rating:4.8, badge:"🔥 Terpopuler", href:"/ai-studio",           tags:["Caption","Social Media","AI"],          isNew:false, updated:"3 hari lalu",   weeklyActive:1120, level:"Semua Level",  duration:"Otomatis" },
  { cat:"akademik",    icon:"🎙️", name:"Rekaman Kuliah → Ringkasan",          desc:"Rekam perkuliahan atau les privat, AI auto-transkrip dan buat ringkasan + mind map + 10 soal latihan. Tersedia versi bahasa Indonesia.",                                                                         author:"Chaesa AI Team",   installs:9870,  rating:4.8, badge:null,           href:"/micro-learning",      tags:["Mahasiswa","AI","Ringkasan"],           isNew:false, updated:"5 hari lalu",   weeklyActive:1340, level:"Semua Level",  duration:"Otomatis" },
  { cat:"integrasi",   icon:"🧮",  name:"9 Kalkulasi Teknik Sipil",           desc:"Kalkulator teknik sipil: beton, tulangan, baja, campuran aspal, kapasitas tiang, galian tanah, debit air, beban angin, dan pondasi. Output tabel dan formula.",                                               author:"BimtekKita",       installs:6780,  rating:4.9, badge:"Top Rating",   href:"/bimtek-integration",  tags:["Kalkulator","Sipil","Tools"],           isNew:false, updated:"2 minggu lalu", weeklyActive:890,  level:"Menengah",     duration:"9 tools" },
  { cat:"sertifikasi", icon:"🛡️", name:"SKK Simulator Pro",                   desc:"65+ soal latihan asesmen persis seperti ujian LSP BNSP. Analisa kelemahan per unit kompetensi, rencana intensif 3 minggu, dan prediksi kelulusan.",                                                             author:"Chaesa AI Team",   installs:6150,  rating:4.8, badge:"Top Rating",   href:"/bimtek-integration",  tags:["SKK","Quiz","LSP"],                    isNew:false, updated:"4 hari lalu",   weeklyActive:780,  level:"Menengah",     duration:"65+ soal" },
  { cat:"personal",    icon:"🗺️", name:"Jalur Karir Konstruksi Personalised", desc:"Masukkan posisi saat ini dan target jabatan → AI rancangkan jalur belajar + SKK yang diperlukan + timeline realistis dengan estimasi biaya dan waktu.",                                                         author:"Chaesa AI Team",   installs:5670,  rating:4.8, badge:"Unggulan",     href:"/learning-path",       tags:["Karir","Personalisasi","Timeline"],     isNew:false, updated:"1 minggu lalu", weeklyActive:620,  level:"Semua Level",  duration:"Personalised" },
  { cat:"ai-expert",   icon:"🏛️", name:"AI Ahli Struktur Beton",              desc:"Konsultasi perhitungan balok, kolom, pelat, dan fondasi. Berbasis SNI 2847 dan Eurocode. Jawab dalam detik lengkap dengan rumus dan tabel.",                                                                    author:"Ir. Arif (AI)",    installs:5890,  rating:4.9, badge:"Unggulan",     href:"/bimtek-integration",  tags:["Struktur","SNI","Beton"],               isNew:false, updated:"3 hari lalu",   weeklyActive:540,  level:"Lanjutan",     duration:"Konsultasi 24/7" },
  { cat:"quiz",        icon:"🏆",  name:"Simulasi Ujian SMK Teknik",           desc:"Bank soal 200+ untuk SMK Teknik: Bangunan, Elektro, Mekatronika. Dikelompokkan per KD, ada mode latihan dan simulasi ujian nasional dengan timer.",                                                             author:"Chaesa Edu",       installs:7640,  rating:4.7, badge:null,           href:"/sertifikasi",         tags:["SMK","Ujian","Teknik"],                 isNew:false, updated:"1 minggu lalu", weeklyActive:870,  level:"Pemula",       duration:"200+ soal" },
  { cat:"creator",     icon:"🖥️", name:"AI Slide Generator",                  desc:"Generate presentasi profesional dari rekaman kuliah, meeting, atau teks. Output: PowerPoint + PDF, desain clean, cocok untuk webinar, pitch, dan kursus online.",                                               author:"Chaesa AI Team",   installs:8340,  rating:4.7, badge:null,           href:"/ai-studio",           tags:["Slide","Presentasi","PowerPoint"],      isNew:false, updated:"6 hari lalu",   weeklyActive:980,  level:"Semua Level",  duration:"Otomatis" },
  { cat:"analytics",   icon:"📈",  name:"PKB Progress Tracker",                desc:"Lacak 150 jam PKB tahunan otomatis. Setiap modul selesai = jam PKB tercatat. Dashboard visual per kategori, notifikasi 80% target, dan laporan untuk LSP.",                                                     author:"BimtekKita",       installs:6780,  rating:4.8, badge:"Unggulan",     href:"/bimtek-integration",  tags:["PKB","Tracker","BNSP"],                 isNew:false, updated:"2 hari lalu",   weeklyActive:760,  level:"Semua Level",  duration:"Otomatis" },
  { cat:"bimtek",      icon:"🛣️", name:"Modul Jalan & Jembatan Pack",         desc:"18 modul BIMTEK khusus pekerjaan jalan dan jembatan: perkerasan lentur, rigid, drainase, jembatan beton, dan pengujian material. Standar Bina Marga.",                                                         author:"Tim BimtekKita",   installs:4120,  rating:4.7, badge:null,           href:"/bimtek-integration",  tags:["Jalan","Jembatan","Bina Marga"],        isNew:false, updated:"2 minggu lalu", weeklyActive:430,  level:"Menengah",     duration:"18 modul · 12 jam" },
  { cat:"corporate",   icon:"📊",  name:"Skills Matrix Dashboard",             desc:"Peta kompetensi seluruh tim vs standar jabatan. Alert SKK kedaluarsa, gap analysis per departemen, dan laporan PDF bulanan otomatis ke email.",                                                                  author:"Chaesa Team",      installs:2780,  rating:4.8, badge:"Unggulan",     href:"/skills-matrix",       tags:["HRD","Matrix","Dashboard"],             isNew:false, updated:"5 hari lalu",   weeklyActive:310,  level:"Lanjutan",     duration:"Dashboard real-time" },
  { cat:"ai-expert",   icon:"⚡",  name:"AI Expert MEP Spesialis",             desc:"Konsultasi mekanikal, elektrikal, dan plumbing. Hitung kapasitas AC, kabel listrik, pompa air, dan sistem pemadam kebakaran. Berbasis PUIL dan SNI.",                                                           author:"Eng. Sari (AI)",   installs:3650,  rating:4.8, badge:null,           href:"/bimtek-integration",  tags:["MEP","Listrik","HVAC"],                 isNew:false, updated:"1 minggu lalu", weeklyActive:390,  level:"Menengah",     duration:"Konsultasi 24/7" },
  { cat:"competency",  icon:"🎯",  name:"Template SKK Pelaksana Gedung",       desc:"Template e-course 6-langkah SKKNI untuk Pelaksana Lapangan Pekerjaan Gedung (L2). Termasuk 15 unit kompetensi, referensi SNI, dan rubrik asesmen.",                                                             author:"BimtekKita",       installs:3240,  rating:4.7, badge:null,           href:"/competency-builder",  tags:["SKKNI","L2","Gedung"],                  isNew:false, updated:"3 minggu lalu", weeklyActive:280,  level:"Menengah",     duration:"6 langkah · 15 unit" },
  { cat:"competency",  icon:"🕸️", name:"Radar Chart Kompetensi",              desc:"Visualisasi spider chart interaktif seluruh kompetensi Anda vs standar jabatan target. Identifikasi gap, cetak PDF, dan bagikan ke HR atau klien.",                                                             author:"Chaesa Team",      installs:4320,  rating:4.7, badge:null,           href:"/competency-passport", tags:["Radar","Visual","Gap"],                  isNew:false, updated:"1 minggu lalu", weeklyActive:450,  level:"Semua Level",  duration:"Otomatis" },
  { cat:"creator",     icon:"🎙️", name:"AI Podcast Script Generator",         desc:"Dari rekaman meeting atau teks, AI buat naskah podcast siap rekam: intro, 3 segmen, outro, dan show notes. Format 15–30 menit per episode.",                                                                    author:"Chaesa AI Team",   installs:7230,  rating:4.7, badge:null,           href:"/ai-studio",           tags:["Podcast","Script","Audio"],             isNew:false, updated:"4 hari lalu",   weeklyActive:810,  level:"Semua Level",  duration:"Otomatis" },
  { cat:"sertifikasi", icon:"📋",  name:"Panduan Sertifikasi BNSP Step-by-Step",desc:"Alur lengkap sertifikasi: dokumen yang dibutuhkan, cara memilih LSP, biaya per skema, jadwal asesmen, dan tips lolos asesmen portofolio + wawancara.",                                                        author:"BimtekKita",       installs:8930,  rating:4.9, badge:"Top Rating",   href:"/bimtek-integration",  tags:["BNSP","LSP","Panduan"],                 isNew:false, updated:"3 hari lalu",   weeklyActive:940,  level:"Pemula",       duration:"Panduan lengkap" },
  { cat:"quiz",        icon:"✍️",  name:"Quiz Builder K3 Konstruksi",          desc:"Buat quiz K3 kustom dari materi BIMTEK Anda. Pilih jumlah soal (10–50), level kesulitan, dan tipe soal. AI buat soal + kunci jawaban + pembahasan otomatis.",                                                  author:"Chaesa AI Team",   installs:5460,  rating:4.9, badge:"Top Rating",   href:"/sertifikasi",         tags:["Quiz","K3","Custom"],                   isNew:true,  updated:"Kemarin",       weeklyActive:640,  level:"Semua Level",  duration:"Custom" },
  { cat:"bimtek",      icon:"🏗️", name:"K3 Konstruksi Tingkat Lanjut",        desc:"Modul K3 lanjutan untuk supervisor dan manajer: inspeksi keselamatan, investigasi kecelakaan, manajemen K3 proyek, dan audit OHSAS 18001/ISO 45001.",                                                           author:"Tim BimtekKita",   installs:3210,  rating:4.8, badge:null,           href:"/bimtek-integration",  tags:["K3","Supervisor","ISO 45001"],          isNew:false, updated:"2 minggu lalu", weeklyActive:350,  level:"Lanjutan",     duration:"8 modul · 6 jam" },
  { cat:"sertifikasi", icon:"📝",  name:"Portofolio Asesmen Builder",          desc:"Bantu siapkan dokumen portofolio untuk asesmen LSP: format bukti kerja, foto dokumentasi, surat pengalaman kerja, dan log aktivitas sesuai unit kompetensi.",                                                   author:"BimtekKita",       installs:4230,  rating:4.8, badge:null,           href:"/competency-builder",  tags:["Portofolio","LSP","Dokumen"],           isNew:false, updated:"1 minggu lalu", weeklyActive:480,  level:"Menengah",     duration:"Template lengkap" },
  { cat:"corporate",   icon:"🎓",  name:"Internal Training Builder",           desc:"Upload SOP atau prosedur kerja perusahaan → AI buat modul pelatihan internal interaktif + quiz kompetensi awal + sertifikat internal untuk setiap karyawan.",                                                   author:"Chaesa Team",      installs:1980,  rating:4.8, badge:null,           href:"/competency-builder",  tags:["Internal","Onboarding","SOP"],          isNew:true,  updated:"2 hari lalu",   weeklyActive:230,  level:"Lanjutan",     duration:"AI-powered" },
  { cat:"ai-expert",   icon:"⛏️", name:"AI Expert Geoteknik & Fondasi",       desc:"Konsultasi jenis fondasi, daya dukung tiang, penyelidikan tanah, dan perbaikan tanah lunak. Berbasis data SPT, CPT, dan SNI 8460.",                                                                              author:"Dr. Rini (AI)",    installs:2870,  rating:4.8, badge:null,           href:"/bimtek-integration",  tags:["Geoteknik","Fondasi","SPT"],            isNew:false, updated:"5 hari lalu",   weeklyActive:290,  level:"Lanjutan",     duration:"Konsultasi 24/7" },
  { cat:"analytics",   icon:"📊",  name:"Training ROI Calculator",             desc:"Hitung return on investment pelatihan tim: bandingkan biaya training vs peningkatan produktivitas, pengurangan error, dan compliance rate SKK. Laporan Excel otomatis.",                                          author:"Chaesa Team",      installs:1560,  rating:4.6, badge:null,           href:"/skills-matrix",       tags:["ROI","Analytics","HRD"],                isNew:true,  updated:"Kemarin",       weeklyActive:190,  level:"Lanjutan",     duration:"Dashboard + Excel" },
  { cat:"personal",    icon:"⏰",  name:"Morning Briefing Kompetensi",         desc:"Setiap pagi: ringkasan modul hari ini, reminder quiz yang belum selesai, 1 tips dari AI Expert, dan update PKB. Dikirim via notifikasi atau email.",                                                             author:"Chaesa Team",      installs:3890,  rating:4.7, badge:null,           href:"/dashboard",           tags:["Briefing","Reminder","PKB"],            isNew:true,  updated:"3 hari lalu",   weeklyActive:420,  level:"Semua Level",  duration:"Otomatis harian" },
  { cat:"competency",  icon:"💼",  name:"Template SKK Project Manager",        desc:"Template e-course 6-langkah untuk Manajer Proyek Konstruksi (L3). 18 unit kompetensi, tools WBS + S-Curve, simulasi proyek, dan latihan kontrak.",                                                             author:"BimtekKita",       installs:2150,  rating:4.7, badge:null,           href:"/competency-builder",  tags:["PM","SKKNI","L3"],                      isNew:false, updated:"3 minggu lalu", weeklyActive:220,  level:"Lanjutan",     duration:"6 langkah · 18 unit" },
  { cat:"corporate",   icon:"🔔",  name:"Alert SKK Kedaluarsa",                desc:"Monitoring otomatis masa berlaku SKK seluruh karyawan. Alert 3 bulan sebelum kedaluarsa, rekomendasi modul perpanjangan, dan laporan compliance ke manajemen.",                                                  author:"Chaesa Team",      installs:2430,  rating:4.8, badge:null,           href:"/skills-matrix",       tags:["Alert","SKK","Compliance"],             isNew:true,  updated:"Kemarin",       weeklyActive:270,  level:"Semua Level",  duration:"Otomatis" },
  { cat:"ai-expert",   icon:"⚖️",  name:"AI Konsultan Kontrak Konstruksi",     desc:"Analisa klausul kontrak, interpretasi FIDIC/SPK, hitung klaim keterlambatan, dan draft surat teguran. Berbasis hukum konstruksi Indonesia.",                                                                    author:"Pak Eko Legal (AI)",installs:2680, rating:4.7, badge:null,           href:"/bimtek-integration",  tags:["Kontrak","FIDIC","Klaim"],              isNew:false, updated:"1 minggu lalu", weeklyActive:280,  level:"Lanjutan",     duration:"Konsultasi 24/7" },
  { cat:"akademik",    icon:"📖",  name:"Storybook Visual Learning",           desc:"Materi belajar teknik dalam format cerita visual interaktif. Cocok untuk pelajar SMA/SMK: fisika bangunan, mekanika, dan dasar konstruksi dengan ilustrasi.",                                                    author:"Chaesa Edu",       installs:4870,  rating:4.7, badge:null,           href:"/storybook",           tags:["Visual","SMA/SMK","Interaktif"],        isNew:false, updated:"2 minggu lalu", weeklyActive:510,  level:"Pemula",       duration:"Interaktif" },
  { cat:"akademik",    icon:"🎓",  name:"Portfolio Karir dari Skripsi/TA",     desc:"Upload tugas akhir atau skripsi → AI ekstrak kompetensi, buat Competency Passport awal, dan sarankan jalur karir + SKK yang relevan untuk fresh graduate.",                                                      author:"Chaesa AI Team",   installs:2340,  rating:4.7, badge:null,           href:"/competency-builder",  tags:["Fresh Graduate","Portfolio","Karir"],   isNew:true,  updated:"4 hari lalu",   weeklyActive:280,  level:"Pemula",       duration:"AI-powered" },
  { cat:"bimtek",      icon:"⚙️",  name:"Modul MEP Gedung Lengkap",           desc:"22 modul BIMTEK mekanikal, elektrikal, dan plumbing untuk gedung bertingkat. Meliputi instalasi, commissioning, testing, dan maintenance. SNI & PUIL.",                                                          author:"Tim BimtekKita",   installs:3890,  rating:4.6, badge:null,           href:"/bimtek-integration",  tags:["MEP","Gedung","Instalasi"],             isNew:false, updated:"3 minggu lalu", weeklyActive:400,  level:"Menengah",     duration:"22 modul · 15 jam" },
  { cat:"quiz",        icon:"📝",  name:"Asesmen Portofolio AI Reviewer",      desc:"Upload dokumen portofolio kerja Anda, AI review kekuatan & kelemahan vs standar LSP, beri skor, dan rekomendasikan perbaikan sebelum asesmen resmi.",                                                            author:"Chaesa AI Team",   installs:1870,  rating:4.8, badge:null,           href:"/sertifikasi",         tags:["Portofolio","Review","LSP"],            isNew:true,  updated:"Hari ini",      weeklyActive:210,  level:"Menengah",     duration:"Otomatis" },
  { cat:"analytics",   icon:"📉",  name:"Gap Kompetensi Otomatis",             desc:"Bandingkan profil kompetensi Anda vs standar jabatan target. AI identifikasi gap, prioritaskan modul, dan estimasi waktu + biaya untuk menutup gap tersebut.",                                                   author:"Chaesa Team",      installs:3120,  rating:4.7, badge:null,           href:"/competency-passport", tags:["Gap","Analisis","Roadmap"],             isNew:false, updated:"5 hari lalu",   weeklyActive:340,  level:"Semua Level",  duration:"Analisis instan" },
  { cat:"personal",    icon:"🎯",  name:"Daily Micro-Challenge Konstruksi",    desc:"1 soal teknis per hari dikirim ke HP: struktur, K3, jalan, MEP, atau manajemen proyek. Jawab 2 menit, lihat pembahasan AI Expert. Streak tracker + leaderboard.",                                              author:"Chaesa Team",      installs:4560,  rating:4.8, badge:null,           href:"/micro-learning",      tags:["Tantangan","Harian","Gamifikasi"],      isNew:true,  updated:"Hari ini",      weeklyActive:520,  level:"Semua Level",  duration:"2 menit/hari" },
  { cat:"competency",  icon:"🛡️", name:"Competency Passport QR Builder",      desc:"Buat dan cetak Competency Passport digital ber-QR code. Semua SKK, PKB, dan sertifikat dalam satu halaman — siap dibagikan ke HR, klien, atau LinkedIn.",                                                       author:"Chaesa Team",      installs:5230,  rating:4.9, badge:"Top Rating",   href:"/competency-passport", tags:["Passport","QR","Cetak"],                isNew:false, updated:"2 hari lalu",   weeklyActive:590,  level:"Semua Level",  duration:"Generate instan" },
];

const BUNDLES = [
  {
    icon: "🏗️", name: "Starter Pack Pekerja Konstruksi",
    desc: "Paket lengkap untuk pekerja konstruksi baru: K3 wajib, PKB tracker, SKK simulator, dan jalur karir personalised. Hemat waktu setup 3 minggu.",
    gradient: "from-orange-500 to-amber-600",
    skills: ["K3 Umum Wajib Pack", "PKB Progress Tracker", "SKK Simulator Pro", "Jalur Karir Konstruksi Personalised"],
    totalInstalls: 8420, href: "/bimtek-integration",
  },
  {
    icon: "🎬", name: "Creator Pro Bundle",
    desc: "Semua tools yang dibutuhkan content creator: Meeting→Kursus, Podcast Script, Slide Generator, dan Caption Multi-Platform. Dari 1 rekaman jadi 6 konten.",
    gradient: "from-pink-500 to-rose-600",
    skills: ["Meeting → E-Course 15 Menit", "AI Podcast Script Generator", "AI Slide Generator", "Caption Multi-Platform AI"],
    totalInstalls: 12300, href: "/ai-studio",
  },
  {
    icon: "🏢", name: "Corporate Compliance Bundle",
    desc: "Kelola kompetensi dan kepatuhan tim: Skills Matrix, Alert SKK, Internal Training Builder, dan Training ROI Calculator. Untuk HRD proyek 10–500 karyawan.",
    gradient: "from-teal-500 to-green-600",
    skills: ["Skills Matrix Dashboard", "Alert SKK Kedaluarsa", "Internal Training Builder", "Training ROI Calculator"],
    totalInstalls: 2780, href: "/skills-matrix",
  },
  {
    icon: "🎓", name: "Mahasiswa to Professional Pack",
    desc: "Jalur dari kampus ke karir: Rekam kuliah, Portfolio dari TA, Radar Chart Kompetensi, dan Panduan Sertifikasi BNSP. Siap kerja sebelum wisuda.",
    gradient: "from-purple-500 to-indigo-600",
    skills: ["Rekaman Kuliah → Ringkasan", "Portfolio Karir dari Skripsi/TA", "Radar Chart Kompetensi", "Panduan Sertifikasi BNSP Step-by-Step"],
    totalInstalls: 9870, href: "/competency-builder",
  },
];

const BADGE_COLORS: Record<string, string> = {
  "Unggulan":      "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  "Top Rating":    "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  "🔥 Terpopuler": "bg-red-100    dark:bg-red-900/40    text-red-700    dark:text-red-300",
};

const LEVEL_COLORS: Record<string, string> = {
  "Pemula":      "bg-green-100 dark:bg-green-900/30  text-green-700 dark:text-green-300",
  "Menengah":    "bg-blue-100  dark:bg-blue-900/30   text-blue-700  dark:text-blue-300",
  "Lanjutan":    "bg-red-100   dark:bg-red-900/30    text-red-700   dark:text-red-300",
  "Semua Level": "bg-gray-100  dark:bg-gray-800      text-gray-600  dark:text-gray-400",
};

const FEATURED_IDS = ["Meeting → E-Course 15 Menit", "Panduan Sertifikasi BNSP Step-by-Step", "K3 Umum Wajib Pack"];

/* ── Component ────────────────────────────────────────── */
export default function ChaesaHub() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("Terpopuler");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeLevel, setActiveLevel] = useState("Semua");

  const catCounts = useMemo(() => {
    const map: Record<string, number> = { all: SKILLS.length };
    SKILLS.forEach(s => { map[s.cat] = (map[s.cat] || 0) + 1; });
    return map;
  }, []);

  const newSkills = useMemo(() => SKILLS.filter(s => s.isNew), []);
  const featuredSkills = useMemo(() => SKILLS.filter(s => FEATURED_IDS.includes(s.name)), []);

  const filtered = useMemo(() => {
    let result = [...SKILLS];
    if (activeCategory !== "all") result = result.filter(s => s.cat === activeCategory);
    if (activeLevel !== "Semua") result = result.filter(s => s.level === activeLevel || s.level === "Semua Level");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.author.toLowerCase().includes(q)
      );
    }
    if (sortBy === "Terpopuler") result.sort((a, b) => b.installs - a.installs);
    else if (sortBy === "Top Rating") result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "Terbaru") result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    else if (sortBy === "Unggulan") result = [...result.filter(s => s.badge), ...result.filter(s => !s.badge)];
    return result;
  }, [activeCategory, search, sortBy, activeLevel]);

  const totalInstalls = SKILLS.reduce((s, sk) => s + sk.installs, 0);

  return (
    <>
      <SEO
        title="ChaesaHub — Modul & Skill Library | Chaesa Live × BimtekKita"
        description="Temukan 35+ modul BIMTEK, template kompetensi, AI Expert skills, dan tools kreator. Aktifkan dalam satu klik dan tingkatkan kompetensi Anda."
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

        {/* Header */}
        <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <ChaesaLogo size={30} />
                <span className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Chaesa</span>
                <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">Hub</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Beranda</Link>
              <Link href="/platform" className="text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-800">Platform</Link>
              <Link href="/bimtek-integration" className="text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700">BimtekKita</Link>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitch />
              <Link href="/"><Button variant="outline" size="sm" className="text-xs hidden sm:flex">← Beranda</Button></Link>
              <Link href="/auth"><Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-700 text-white">Mulai Gratis</Button></Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 via-purple-950 to-indigo-950 py-14 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/40">
              {SKILLS.length}+ Modul & Skills Tersedia
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Perluas Kemampuan Anda dengan{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Community Skills
              </span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Otomasi alur belajar, tambah integrasi, dan buka kapabilitas baru. Dibangun oleh tim Chaesa &amp; komunitas profesional Indonesia.
            </p>

            {/* Search */}
            <div className="relative max-w-lg mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari skill... (cth: K3, SKK, podcast, onboarding)"
                className="pl-11 pr-4 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-purple-400 rounded-xl text-sm"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs">✕</button>
              )}
            </div>

            {/* Stats ticker */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                { icon: <Package className="w-4 h-4" />, val: `${SKILLS.length}+`, label: "Skills tersedia" },
                { icon: <Download className="w-4 h-4" />, val: `${(totalInstalls/1000).toFixed(0)}K+`, label: "Total aktivasi" },
                { icon: <Users className="w-4 h-4" />, val: "12", label: "Kategori" },
                { icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />, val: "4.8", label: "Rating rata-rata" },
                { icon: <Flame className="w-4 h-4 text-orange-400" />, val: `${newSkills.length}`, label: "Skills baru" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <span className="text-purple-400">{s.icon}</span>
                  <span className="font-bold text-white">{s.val}</span>
                  <span className="text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Featured spotlight */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unggulan Editor</h2>
            <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700 text-[10px]">Editor&apos;s Pick</Badge>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-2">
            {featuredSkills.map((skill, i) => {
              const gradients = ["from-purple-600 to-pink-600", "from-orange-500 to-amber-500", "from-teal-500 to-blue-600"];
              return (
                <div key={i} className={`bg-gradient-to-br ${gradients[i]} rounded-2xl p-5 text-white relative overflow-hidden`}>
                  <div className="absolute -top-3 -right-3 text-6xl opacity-20 select-none">{skill.icon}</div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{skill.icon}</div>
                      {skill.badge && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">{skill.badge}</span>}
                    </div>
                    <h3 className="font-bold text-base mb-1 leading-snug">{skill.name}</h3>
                    <p className="text-white/75 text-xs leading-relaxed mb-3 line-clamp-2">{skill.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />{skill.rating}</span>
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{skill.installs.toLocaleString("id-ID")}</span>
                      </div>
                      <Link href={skill.href}>
                        <button className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-all">
                          Aktifkan →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* New this week strip */}
          <div className="mt-8 mb-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Baru Minggu Ini</h2>
                <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">{newSkills.length} baru</span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {newSkills.map((skill, i) => (
                <div key={i} className="shrink-0 w-64 bg-white dark:bg-gray-900 rounded-xl border-2 border-green-200 dark:border-green-800 p-4 hover:border-green-400 dark:hover:border-green-500 transition-all">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{skill.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full font-semibold">Baru</span>
                        <span className="text-[10px] text-gray-400">{skill.updated}</span>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-xs mt-0.5 leading-snug">{skill.name}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-2.5">{skill.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Users className="w-3 h-3" />{skill.weeklyActive} aktif/minggu
                    </div>
                    <Link href={skill.href}>
                      <button className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-semibold">Coba</button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main layout: sidebar + grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar */}
            <aside className="lg:w-60 shrink-0">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sticky top-20">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Kategori</p>
                <div className="space-y-0.5 mb-5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        activeCategory === cat.id
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="truncate text-xs">{cat.label}</span>
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? "bg-white/20 text-white dark:bg-black/20 dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>
                        {catCounts[cat.id] || 0}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Level</p>
                  {["Semua", "Pemula", "Menengah", "Lanjutan"].map(lv => (
                    <button
                      key={lv}
                      onClick={() => setActiveLevel(lv)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs mb-0.5 transition-all ${activeLevel === lv ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white">{filtered.length}</span> skill ditemukan
                  </span>
                  {(search || activeLevel !== "Semua") && (
                    <button onClick={() => { setSearch(""); setActiveLevel("Semua"); }} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">× reset filter</button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
                    {SORT_OPTIONS.map(s => (
                      <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${sortBy === s ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
                    <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "text-gray-400"}`}><Grid3x3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "text-gray-400"}`}><List className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>

              {/* Cards */}
              {filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Skill tidak ditemukan</p>
                  <p className="text-sm text-gray-400">Coba kata kunci lain atau reset filter</p>
                  <button onClick={() => { setSearch(""); setActiveCategory("all"); setActiveLevel("Semua"); }} className="mt-4 text-sm text-purple-600 dark:text-purple-400 hover:underline">Reset semua filter</button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((skill, i) => <SkillCard key={i} skill={skill} mode="grid" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((skill, i) => <SkillCard key={i} skill={skill} mode="list" />)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skill Bundles */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Skill Bundles</h2>
              <Badge className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-[10px]">Hemat Waktu Setup</Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BUNDLES.map((bundle, i) => (
                <Card key={i} className="overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className={`bg-gradient-to-br ${bundle.gradient} p-5 text-white`}>
                    <div className="text-3xl mb-2">{bundle.icon}</div>
                    <h3 className="font-bold text-sm leading-snug mb-1">{bundle.name}</h3>
                    <p className="text-white/75 text-xs leading-relaxed">{bundle.desc}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Termasuk:</p>
                    <ul className="space-y-1.5 mb-4">
                      {bundle.skills.map((s, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                          <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> {s}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Download className="w-3 h-3" /> {bundle.totalInstalls.toLocaleString("id-ID")} aktivasi
                      </span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">4 skills</span>
                    </div>
                    <Link href={bundle.href}>
                      <Button size="sm" className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs h-8 rounded-xl hover:opacity-90">
                        Aktifkan Bundle <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-16 px-4">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="text-4xl mb-4">🧩</div>
            <h2 className="text-3xl font-extrabold mb-3">Ingin Skill Anda Masuk ChaesaHub?</h2>
            <p className="text-white/80 mb-8">Buat template kompetensi, modul BIMTEK kustom, atau integrasi tools — submit ke ChaesaHub dan bantu komunitas profesional Indonesia naik kompetensi.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/auth">
                <Button className="bg-white text-purple-700 hover:bg-purple-50 font-bold px-8 py-3 text-base rounded-xl">
                  <Rocket className="w-5 h-5 mr-2" /> Mulai Buat Skill
                </Button>
              </Link>
              <Link href="/platform">
                <Button variant="outline" className="border-white/50 text-white hover:bg-white/20 px-8 py-3 text-base rounded-xl">
                  Platform Overview
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

/* ── SkillCard subcomponent ───────────────────────────── */
function SkillCard({ skill, mode }: { skill: Skill; mode: "grid" | "list" }) {
  const catObj = CATEGORIES.find(c => c.id === skill.cat);
  const activityPct = Math.min(100, Math.round((skill.weeklyActive / 2000) * 100));

  if (mode === "list") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all p-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shrink-0">{skill.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{skill.name}</h3>
            {skill.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${BADGE_COLORS[skill.badge] || ""}`}>{skill.badge}</span>}
            {skill.isNew && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">Baru</span>}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{skill.desc}</p>
        </div>
        <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-gray-400">
          <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{skill.rating}</div>
          <div className="flex items-center gap-1"><Download className="w-3 h-3" />{skill.installs.toLocaleString("id-ID")}</div>
          <div className="text-[10px]">{skill.duration}</div>
        </div>
        <Link href={skill.href}>
          <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 text-xs h-8 px-4 rounded-lg shrink-0">Aktifkan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all flex flex-col group overflow-hidden">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">{skill.icon}</div>
          <div className="flex flex-col items-end gap-1">
            {skill.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${BADGE_COLORS[skill.badge] || ""}`}>{skill.badge}</span>}
            {skill.isNew && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-semibold">Baru</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-gray-400">{catObj?.icon} {catObj?.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[skill.level]}`}>{skill.level}</span>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 leading-snug">{skill.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1 mb-3 line-clamp-3">{skill.desc}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {skill.tags.map((t, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t}</span>
          ))}
        </div>

        {/* Activity bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{skill.weeklyActive.toLocaleString("id-ID")} aktif minggu ini</span>
            <span className="text-[10px] text-gray-400">{skill.duration}</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all" style={{ width: `${activityPct}%` }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{skill.rating}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{skill.installs.toLocaleString("id-ID")}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{skill.updated}</span>
        </div>
        <Link href={skill.href}>
          <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 text-xs h-7 px-3 rounded-lg">
            Aktifkan
          </Button>
        </Link>
      </div>
    </div>
  );
}
