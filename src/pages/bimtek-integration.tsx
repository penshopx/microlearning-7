import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Award, Target, ExternalLink, Zap, CheckCircle,
  GraduationCap, BarChart3, Shield, Users, Clock, Star,
  ArrowRight, Building2, Wrench, Layers, TrendingUp, FileText,
  ChevronDown, ChevronUp, Play, Brain, Map, Trophy, Search,
  Calendar, MessageSquare, HelpCircle, RotateCcw, CheckSquare, XCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const BIMTEK_BASE = "https://bimtek.replit.app";

const BIMTEK_MODULES = [
  { id: "bg01", category: "Sipil Gedung", title: "Teknik Fondasi Gedung", duration: "4 jam", level: "Ahli", pkb: 10, icon: Building2, desc: "Prinsip perencanaan pondasi dangkal dan dalam, daya dukung tanah, penyelidikan geoteknik.", objectives: ["Memahami jenis pondasi", "Menghitung daya dukung", "Merencanakan pondasi tiang"] },
  { id: "bg02", category: "Sipil Gedung", title: "Struktur Beton Bertulang", duration: "6 jam", level: "Ahli", pkb: 12, icon: Building2, desc: "Perencanaan balok, kolom, dan plat beton bertulang sesuai SNI 2847.", objectives: ["Desain balok & kolom", "Kontrol lendutan & retak", "SNI 2847 compliance"] },
  { id: "bg03", category: "Sipil Gedung", title: "Struktur Baja Gedung", duration: "6 jam", level: "Ahli", pkb: 12, icon: Building2, desc: "Perencanaan struktur baja untuk gedung bertingkat menggunakan SNI 1729.", objectives: ["Profil baja IWF/WF", "Sambungan baut & las", "Stabilitas lateral"] },
  { id: "bg04", category: "Sipil Gedung", title: "Beton Pracetak", duration: "4 jam", level: "Ahli", pkb: 8, icon: Building2, desc: "Sistem konstruksi beton pracetak, precast, dan prestressed untuk efisiensi pembangunan.", objectives: ["Sistem full precast", "Sambungan antar elemen", "Quality control pabrik"] },
  { id: "bg05", category: "Sipil Gedung", title: "Metode Pelaksanaan Konstruksi", duration: "5 jam", level: "Ahli", pkb: 10, icon: Building2, desc: "Metodologi pelaksanaan konstruksi gedung bertingkat dari cut & fill hingga finishing.", objectives: ["WBS & sequencing", "Penggunaan alat berat", "Pengawasan mutu lapangan"] },
  { id: "bg06", category: "Sipil Gedung", title: "Desain Tahan Gempa", duration: "6 jam", level: "Ahli", pkb: 12, icon: Building2, desc: "Perencanaan struktur gedung tahan gempa sesuai SNI 1726 zona gempa Indonesia.", objectives: ["Analisis respons spektrum", "SRPMK & SRMK", "Detailing tulangan gempa"] },
  { id: "bg07", category: "Sipil Gedung", title: "Waterproofing & Dampproofing", duration: "3 jam", level: "Teknisi", pkb: 6, icon: Building2, desc: "Sistem proteksi air pada struktur gedung: basement, atap, dinding, dan area basah.", objectives: ["Sistem membrane", "Crystalline waterproofing", "Proteksi basement"] },
  { id: "k3_01", category: "K3", title: "K3 Konstruksi Gedung", duration: "8 jam", level: "Wajib", pkb: 15, icon: Shield, desc: "Dasar-dasar keselamatan dan kesehatan kerja yang wajib dikuasai semua pekerja konstruksi.", objectives: ["Identifikasi bahaya", "HIRADC & IBPR", "SMK3 Konstruksi"] },
  { id: "k3_02", category: "K3", title: "Pencegahan Kecelakaan Kerja", duration: "4 jam", level: "Ahli", pkb: 10, icon: Shield, desc: "Analisis penyebab kecelakaan konstruksi dan strategi pencegahan proaktif.", objectives: ["Root cause analysis", "Safety induction", "Inspeksi K3 rutin"] },
  { id: "k3_03", category: "K3", title: "APD dan Penanganannya", duration: "3 jam", level: "Teknisi", pkb: 6, icon: Shield, desc: "Jenis-jenis Alat Pelindung Diri, pemilihan yang tepat, dan perawatan APD konstruksi.", objectives: ["Klasifikasi APD", "Pemilihan APD sesuai bahaya", "Perawatan & penggantian"] },
  { id: "k3_04", category: "K3", title: "P3K di Tempat Kerja", duration: "4 jam", level: "Wajib", pkb: 8, icon: Shield, desc: "Pertolongan pertama pada kecelakaan di proyek konstruksi dan penanganan darurat.", objectives: ["RJP & BTLS", "Penanganan luka bakar", "Evakuasi korban"] },
  { id: "k3_05", category: "K3", title: "Keselamatan Kerja Ketinggian", duration: "4 jam", level: "Ahli", pkb: 10, icon: Shield, desc: "Prosedur kerja aman di ketinggian, scaffolding, dan proteksi jatuh.", objectives: ["Scaffolding safety", "Fall arrest system", "Izin kerja ketinggian"] },
  { id: "k3_06", category: "K3", title: "SMK3 & ISO 45001", duration: "5 jam", level: "Ahli", pkb: 10, icon: Shield, desc: "Implementasi Sistem Manajemen K3 berbasis PP 50/2012 dan standar ISO 45001.", objectives: ["Siklus PDCA K3", "Audit internal SMK3", "Continual improvement"] },
  { id: "jl01", category: "Jalan", title: "Desain Jalan Raya", duration: "6 jam", level: "Ahli", pkb: 12, icon: Map, desc: "Perencanaan geometrik jalan: alinyemen horizontal, vertikal, dan penampang melintang.", objectives: ["Alinyemen horizontal", "Alinyemen vertikal", "Kontrol kecepatan rencana"] },
  { id: "jl02", category: "Jalan", title: "Perkerasan Jalan", duration: "5 jam", level: "Ahli", pkb: 10, icon: Map, desc: "Desain tebal perkerasan lentur dan kaku menggunakan metode MDPJ/MDP.", objectives: ["Perkerasan lentur (AC)", "Perkerasan kaku (PCC)", "Analisis CBR & LHR"] },
  { id: "jl03", category: "Jalan", title: "Jembatan Beton", duration: "6 jam", level: "Ahli", pkb: 12, icon: Map, desc: "Perencanaan jembatan beton: girder, pile cap, abutmen, dan pier.", objectives: ["Gelagar beton prestress", "Pondasi jembatan", "Pembebanan SNI jembatan"] },
  { id: "jl04", category: "Jalan", title: "Jembatan Baja", duration: "6 jam", level: "Ahli", pkb: 12, icon: Map, desc: "Perencanaan jembatan baja: komposit, pratt truss, dan cable stayed.", objectives: ["Komposit baja-beton", "Analisis truss", "Proteksi korosi"] },
  { id: "jl05", category: "Jalan", title: "Drainase Jalan", duration: "4 jam", level: "Ahli", pkb: 8, icon: Map, desc: "Perencanaan sistem drainase tepi jalan, gorong-gorong, dan saluran terbuka.", objectives: ["Analisis hidrologi", "Dimensi saluran", "Gorong-gorong & culvert"] },
  { id: "el01", category: "Elektrikal", title: "Instalasi Listrik Gedung", duration: "6 jam", level: "Ahli", pkb: 12, icon: Zap, desc: "Perencanaan sistem instalasi listrik sesuai PUIL dan SNI Elektrikal.", objectives: ["Diagram single line", "Panel & proteksi", "Kabel & kuat hantar arus"] },
  { id: "el02", category: "Elektrikal", title: "Sistem Proteksi Listrik", duration: "5 jam", level: "Ahli", pkb: 10, icon: Zap, desc: "Proteksi petir, grounding, dan keamanan sistem kelistrikan gedung.", objectives: ["Penangkal petir aktif", "Sistem grounding", "RCD & MCB"] },
  { id: "el03", category: "Elektrikal", title: "PLTS Gedung", duration: "5 jam", level: "Ahli", pkb: 10, icon: Zap, desc: "Sistem Pembangkit Listrik Tenaga Surya on-grid dan off-grid untuk gedung.", objectives: ["Perhitungan kapasitas PV", "Inverter & baterai", "Net metering PLN"] },
  { id: "el04", category: "Elektrikal", title: "Sistem HVAC", duration: "4 jam", level: "Ahli", pkb: 8, icon: Zap, desc: "Sistem ventilasi, pendinginan, dan penghawaan gedung secara terpadu.", objectives: ["Beban pendinginan", "Jenis sistem AC", "Penghematan energi"] },
  { id: "el05", category: "Elektrikal", title: "Trafo dan Distribusi", duration: "4 jam", level: "Ahli", pkb: 8, icon: Zap, desc: "Sistem gardu distribusi, trafo, dan jaringan tegangan menengah untuk gedung besar.", objectives: ["Kapasitas trafo", "Panel MDP/SDP", "Konfigurasi jaringan"] },
  { id: "mk01", category: "Mekanikal", title: "Plumbing Gedung", duration: "5 jam", level: "Ahli", pkb: 10, icon: Wrench, desc: "Sistem air bersih, air buangan, dan sanitasi gedung bertingkat sesuai SNI.", objectives: ["Jaringan air bersih", "Sistem grey & black water", "Tangki & pompa"] },
  { id: "mk02", category: "Mekanikal", title: "Sistem Sprinkler", duration: "4 jam", level: "Ahli", pkb: 8, icon: Wrench, desc: "Proteksi kebakaran aktif: sprinkler, hydrant, fire detection, dan gas suppression.", objectives: ["Layout sprinkler", "Pompa pemadam", "Deteksi & alarm kebakaran"] },
  { id: "mk03", category: "Mekanikal", title: "Elevator & Eskalator", duration: "4 jam", level: "Ahli", pkb: 8, icon: Wrench, desc: "Perencanaan dan pengawasan instalasi elevator, eskalator, dan conveyor gedung.", objectives: ["Kapasitas & traffic", "Keselamatan elevator", "Pemeliharaan berkala"] },
  { id: "mj01", category: "Manajemen", title: "Manajemen Proyek Konstruksi", duration: "8 jam", level: "Ahli", pkb: 15, icon: BarChart3, desc: "Pengelolaan proyek konstruksi dari inisiasi hingga penutupan menggunakan PMBOK.", objectives: ["WBS & scheduling", "Cost baseline", "Change management"] },
  { id: "mj02", category: "Manajemen", title: "RAB dan Estimasi Biaya", duration: "6 jam", level: "Ahli", pkb: 12, icon: BarChart3, desc: "Penyusunan Rencana Anggaran Biaya detail, analisa harga satuan, dan volume pekerjaan.", objectives: ["AHS pekerjaan sipil", "Volume take-off", "Kontigensi & eskalasi"] },
  { id: "mj03", category: "Manajemen", title: "Schedule & Timeline Proyek", duration: "5 jam", level: "Ahli", pkb: 10, icon: BarChart3, desc: "Perencanaan jadwal proyek dengan Bar Chart, S-Curve, CPM, dan Microsoft Project.", objectives: ["Critical Path Method", "Kurva S & progres", "Crashing jadwal"] },
  { id: "mj04", category: "Manajemen", title: "Manajemen Risiko Proyek", duration: "4 jam", level: "Ahli", pkb: 10, icon: BarChart3, desc: "Identifikasi, analisis, dan mitigasi risiko proyek konstruksi.", objectives: ["Risk register", "Matriks risiko", "Respons & monitoring"] },
  { id: "sr01", category: "Sertifikasi", title: "Proses SKK & Sertifikasi BNSP", duration: "3 jam", level: "Wajib", pkb: 6, icon: Award, desc: "Alur lengkap pengajuan Sertifikat Kompetensi Kerja (SKK) melalui LSP terakreditasi.", objectives: ["Persyaratan APL 01 & 02", "Proses asesmen", "Masa berlaku SKK"] },
  { id: "sr02", category: "Sertifikasi", title: "Regulasi Jasa Konstruksi", duration: "4 jam", level: "Wajib", pkb: 8, icon: Award, desc: "UU No. 2/2017 Jasa Konstruksi, PP 22/2020, dan peraturan turunannya.", objectives: ["Klasifikasi usaha konstruksi", "SBU & SKK", "Sanksi pelanggaran"] },
  { id: "iso01", category: "ISO Management", title: "ISO 9001:2015 Manajemen Mutu", duration: "6 jam", level: "Ahli", pkb: 12, icon: Star, desc: "Implementasi Sistem Manajemen Mutu ISO 9001:2015 di perusahaan konstruksi.", objectives: ["Konteks organisasi", "Perencanaan & dukungan", "Audit internal & tinjauan"] },
  { id: "iso02", category: "ISO Management", title: "ISO 45001:2018 K3", duration: "6 jam", level: "Ahli", pkb: 12, icon: Star, desc: "Implementasi Sistem Manajemen K3 internasional ISO 45001 di sektor konstruksi.", objectives: ["Konteks & kepemimpinan", "HIRADC & pengendalian", "Peningkatan berkelanjutan"] },
];

const SKK_POSITIONS = [
  { code: "B001", title: "Ahli Madya Teknik Bangunan Gedung", sub: "B", level: "Ahli Madya", req: "S1 + 5th + 120 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 2.500.000" },
  { code: "B002", title: "Ahli Teknik Bangunan Gedung", sub: "B", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "B003", title: "Teknisi Teknik Bangunan Gedung", sub: "B", level: "Teknisi", req: "D3 + 2th + 40 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.200.000" },
  { code: "B004", title: "Pelaksana Teknik Bangunan Gedung", sub: "B", level: "Pelaksana", req: "SMA + 1th + 24 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 800.000" },
  { code: "B005", title: "Ahli Desain Interior Gedung", sub: "B", level: "Ahli", req: "S1 Arsitektur + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "B006", title: "Pengawas Teknik Bangunan Gedung", sub: "B", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "B007", title: "Manager Proyek Gedung", sub: "B", level: "Manager", req: "S2 + 7th + 160 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 3.500.000" },
  { code: "B008", title: "Supervisor Konstruksi Gedung", sub: "B", level: "Supervisor", req: "S1 + 3th + 40 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.500.000" },
  { code: "B009", title: "Ahli Mutu Konstruksi Gedung", sub: "B", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "B010", title: "Ahli K3 Konstruksi Gedung", sub: "B", level: "Ahli", req: "S1 + 3th + 80 jam + sertif K3", lsp: "LSP K3 Indonesia", biaya: "Rp 2.000.000" },
  { code: "C001", title: "Ahli Madya Teknik Sipil", sub: "C", level: "Ahli Madya", req: "S1 + 5th + 120 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 2.500.000" },
  { code: "C002", title: "Ahli Teknik Sipil", sub: "C", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "C003", title: "Teknisi Teknik Sipil", sub: "C", level: "Teknisi", req: "D3 + 2th + 40 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.200.000" },
  { code: "C004", title: "Pelaksana Lapangan Teknik Sipil", sub: "C", level: "Pelaksana", req: "SMA/D3 + 1th + 24 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 800.000" },
  { code: "C005", title: "Ahli Geoteknik", sub: "C", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "C006", title: "Ahli Hidrologi & Hidraulika", sub: "C", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "C007", title: "Ahli Struktur", sub: "C", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "C008", title: "Ahli Pengawas Teknik Sipil", sub: "C", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "D001", title: "Ahli Madya Teknik Mekanikal", sub: "D", level: "Ahli Madya", req: "S1 + 5th + 120 jam", lsp: "LSP Mekanikal", biaya: "Rp 2.500.000" },
  { code: "D002", title: "Ahli Teknik Mekanikal", sub: "D", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Mekanikal", biaya: "Rp 1.800.000" },
  { code: "D003", title: "Teknisi Teknik Mekanikal", sub: "D", level: "Teknisi", req: "D3 + 2th + 40 jam", lsp: "LSP Mekanikal", biaya: "Rp 1.200.000" },
  { code: "D004", title: "Ahli Plumbing", sub: "D", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Mekanikal", biaya: "Rp 1.800.000" },
  { code: "D005", title: "Ahli HVAC", sub: "D", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Mekanikal", biaya: "Rp 1.800.000" },
  { code: "D006", title: "Ahli Fire Protection", sub: "D", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Mekanikal", biaya: "Rp 1.800.000" },
  { code: "E001", title: "Ahli Madya Teknik Elektrikal", sub: "E", level: "Ahli Madya", req: "S1 + 5th + 120 jam", lsp: "LSP Elektrikal", biaya: "Rp 2.500.000" },
  { code: "E002", title: "Ahli Teknik Elektrikal", sub: "E", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Elektrikal", biaya: "Rp 1.800.000" },
  { code: "E003", title: "Teknisi Teknik Elektrikal", sub: "E", level: "Teknisi", req: "D3 + 2th + 40 jam", lsp: "LSP Elektrikal", biaya: "Rp 1.200.000" },
  { code: "E004", title: "Pelaksana Instalasi Listrik", sub: "E", level: "Pelaksana", req: "SMA/D3 + 1th + 24 jam", lsp: "LSP Elektrikal", biaya: "Rp 800.000" },
  { code: "F001", title: "Ahli Madya Teknik Jalan", sub: "F", level: "Ahli Madya", req: "S1 + 5th + 120 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 2.500.000" },
  { code: "F002", title: "Ahli Teknik Jalan", sub: "F", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "F003", title: "Teknisi Teknik Jalan", sub: "F", level: "Teknisi", req: "D3 + 2th + 40 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.200.000" },
  { code: "F004", title: "Pelaksana Perkerasan Jalan", sub: "F", level: "Pelaksana", req: "SMA/D3 + 1th + 24 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 800.000" },
  { code: "G001", title: "Ahli Teknik Jembatan", sub: "G", level: "Ahli", req: "S1 + 3th + 80 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.800.000" },
  { code: "G002", title: "Ahli Madya Teknik Jembatan", sub: "G", level: "Ahli Madya", req: "S1 + 5th + 120 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 2.500.000" },
  { code: "G003", title: "Teknisi Teknik Jembatan", sub: "G", level: "Teknisi", req: "D3 + 2th + 40 jam", lsp: "LSP Konstruksi Nasional", biaya: "Rp 1.200.000" },
];

const AI_EXPERTS = [
  { icon: "🏗️", name: "Ahli Teknik Sipil", desc: "Fondasi, struktur, beton, baja", color: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700", samples: ["Berapa tebal pondasi untuk beban 500 kN?", "Hitunglah dimensi balok beton 6m span", "Perbedaan pondasi dangkal vs dalam"] },
  { icon: "🏛️", name: "Arsitek & Interior", desc: "Desain, interior, landscape", color: "bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700", samples: ["Standar lebar koridor gedung kantor?", "Material fasad hemat energi di tropis", "Kebutuhan parkir untuk 1000m² GFA"] },
  { icon: "⚙️", name: "Teknik Mekanikal", desc: "HVAC, plumbing, fire protection", color: "bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700", samples: ["Hitung beban AC untuk ruang 100m²", "Kapasitas pompa hydrant minimal?", "Diameter pipa air bersih lantai 10"] },
  { icon: "⚡", name: "Teknik Elektrikal", desc: "Listrik, distribusi, generator", color: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700", samples: ["KHA kabel untuk beban 200A?", "Kapasitas trafo untuk gedung 5000m²", "Perhitungan PV untuk beban 50kWh/hari"] },
  { icon: "🦺", name: "K3 Konstruksi", desc: "Keselamatan, kesehatan kerja", color: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700", samples: ["APD wajib untuk pekerjaan galian?", "Prosedur ijin kerja ketinggian >2m", "HIRADC untuk pekerjaan bekisting"] },
  { icon: "📊", name: "Manajemen Proyek", desc: "Schedule, cost, quality", color: "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700", samples: ["Durasi pekerjaan pondasi 2000m²?", "Formula SPI dan CPI dalam EVM?", "Crashing jadwal 2 minggu lebih cepat"] },
  { icon: "📜", name: "Sertifikasi & Regulasi", desc: "SKK, BNSP, perizinan", color: "bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700", samples: ["Syarat SKK Ahli Muda Struktur?", "Perbedaan SIBP dan PBG?", "LSP mana yang akreditasi SKK B002?"] },
  { icon: "🌿", name: "Tata Lingkungan", desc: "AMDAL, waste management", color: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700", samples: ["AMDAL atau UKL-UPL untuk proyek 3Ha?", "Pengelolaan limbah B3 konstruksi?", "Sertifikasi green building GBCI"] },
];

const QUIZ_DATA = [
  { id: "q1", category: "K3", question: "Berapakah ketinggian minimum yang mewajibkan penggunaan full body harness saat bekerja di ketinggian menurut Permenaker No. 9/2016?", options: ["1 meter", "1,8 meter", "2 meter", "3 meter"], answer: 2, explanation: "Permenaker No. 9 Tahun 2016 mewajibkan penggunaan APD fall arrest (full body harness) untuk pekerjaan pada ketinggian ≥ 2 meter." },
  { id: "q2", category: "K3", question: "APD apa yang WAJIB digunakan oleh semua pekerja saat memasuki area proyek konstruksi?", options: ["Safety shoes saja", "Helm + safety shoes", "Helm + safety shoes + vest", "Helm + safety shoes + vest + kacamata"], answer: 2, explanation: "Minimum 3 APD wajib di seluruh area proyek: Helm (SNI), Safety Shoes (toe cap baja), dan Safety Vest berwarna cerah." },
  { id: "q3", category: "Struktur", question: "Tegangan ijin beton (f'c) 25 MPa pada desain balok beton bertulang menurut SNI 2847, digunakan nilai berapa untuk perhitungan momen nominal?", options: ["0,85 × f'c", "0,80 × f'c", "f'c langsung", "0,67 × f'c"], answer: 0, explanation: "Faktor reduksi β1 = 0,85 untuk f'c ≤ 28 MPa. Tegangan beton terfaktor menggunakan 0,85 × f'c sesuai distribusi tegangan ekuivalen Whitney." },
  { id: "q4", category: "Struktur", question: "Baja profil WF 400×200×8×13 (satuan mm), angka '8' merujuk pada?", options: ["Tinggi web", "Tebal sayap (flange)", "Tebal badan (web)", "Panjang profil"], answer: 2, explanation: "Notasi WF H×B×tw×tf: H=tinggi total, B=lebar sayap, tw=tebal badan (web), tf=tebal sayap (flange). Angka '8' adalah tebal web (tw = 8mm)." },
  { id: "q5", category: "Manajemen", question: "Dalam metode Earned Value Management (EVM), jika SPI = 0,8 dan CPI = 1,1, kondisi proyek tersebut adalah?", options: ["Lebih cepat & lebih mahal dari rencana", "Lebih lambat & lebih hemat dari rencana", "Sesuai jadwal & sesuai biaya", "Lebih cepat & lebih hemat dari rencana"], answer: 1, explanation: "SPI < 1 = terlambat dari jadwal. CPI > 1 = lebih hemat dari rencana biaya. Kombinasi: lebih lambat tapi lebih hemat." },
  { id: "q6", category: "Manajemen", question: "Formula untuk menghitung Estimate At Completion (EAC) dalam kondisi kinerja biaya berubah adalah?", options: ["BAC / CPI", "AC + ETC", "BAC - EV", "PV + SV"], answer: 0, explanation: "EAC = BAC / CPI digunakan ketika CPI sekarang diperkirakan akan berlanjut hingga akhir proyek. Ini adalah formula EAC paling umum." },
  { id: "q7", category: "Sertifikasi", question: "Masa berlaku Sertifikat Kompetensi Kerja (SKK) konstruksi yang diterbitkan BNSP adalah?", options: ["1 tahun", "3 tahun", "5 tahun", "Seumur hidup"], answer: 1, explanation: "SKK BNSP berlaku selama 3 tahun. Setelah itu perlu diperbarui (renewal) dengan membuktikan PKB (Pengembangan Keprofesian Berkelanjutan) minimal 150 jam." },
  { id: "q8", category: "Sertifikasi", question: "Formulir APL 02 dalam proses sertifikasi BNSP berisi?", options: ["Data pribadi pemohon", "Asesmen mandiri kompetensi", "Dokumen bukti pengalaman", "Jadwal asesmen"], answer: 1, explanation: "APL 02 adalah formulir Asesmen Mandiri yang diisi pemohon untuk menilai diri sendiri terhadap setiap elemen kompetensi yang akan diujikan." },
  { id: "q9", category: "Pondasi", question: "Nilai N-SPT berapakah yang menunjukkan kondisi tanah 'sangat padat' (very dense) pada tanah pasir?", options: ["N < 4", "4 ≤ N ≤ 10", "10 ≤ N ≤ 30", "N > 50"], answer: 3, explanation: "Klasifikasi N-SPT tanah pasir: N<4=very loose, 4-10=loose, 10-30=medium dense, 30-50=dense, N>50=very dense." },
  { id: "q10", category: "Pondasi", question: "Metode penyelidikan tanah yang memberikan data profil tanah secara menerus tanpa berhenti adalah?", options: ["SPT (Standard Penetration Test)", "CPT (Cone Penetration Test)", "Bor mesin", "Uji vane shear"], answer: 1, explanation: "CPT (Sondir) menggunakan konus yang didorong secara kontinyu, memberikan data perlawanan tanah (qc) dan gesekan selimut (fs) secara menerus tanpa interval." },
  { id: "q11", category: "K3", question: "Dokumen yang WAJIB ada sebelum melakukan pekerjaan penggalian lebih dari 1,5 meter adalah?", options: ["Surat ijin kerja (SIK) saja", "Job Safety Analysis (JSA) dan Surat Ijin Kerja", "Checklist alat berat saja", "Laporan harian K3"], answer: 1, explanation: "Pekerjaan penggalian >1,5m wajib dilengkapi JSA (Job Safety Analysis) yang disetujui Site Manager dan Surat Ijin Kerja (SIK) yang ditandatangani pengawas K3." },
  { id: "q12", category: "Struktur", question: "Faktor reduksi kekuatan (φ) untuk lentur/momen pada elemen beton bertulang menurut SNI 2847:2019 adalah?", options: ["φ = 0,65", "φ = 0,75", "φ = 0,90", "φ = 1,00"], answer: 2, explanation: "SNI 2847:2019 Pasal 21.2.1: φ = 0,90 untuk komponen yang dikontrol lentur (bukan geser atau kompresi). Untuk geser φ = 0,75, untuk tekan spiral φ = 0,75." },
];

const CATEGORIES = ["Semua", "Sipil Gedung", "K3", "Jalan", "Elektrikal", "Mekanikal", "Manajemen", "Sertifikasi", "ISO Management"];
const SKK_SUBS = ["Semua", "B - Gedung", "C - Sipil", "D - Mekanikal", "E - Elektrikal", "F - Jalan", "G - Jembatan"];
const QUIZ_CATEGORIES = ["Semua", "K3", "Struktur", "Manajemen", "Sertifikasi", "Pondasi"];

const LEVEL_COLOR: Record<string, string> = {
  "Wajib": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Ahli": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "Teknisi": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "Ahli Madya": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Manager": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Supervisor": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "Pelaksana": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const PKB_MONTHLY = [
  { month: "Jan", target: 15, modules: ["K3 Wajib", "Regulasi Jasa Konstruksi"] },
  { month: "Feb", target: 25, modules: ["Teknik Fondasi", "Manajemen Proyek"] },
  { month: "Mar", target: 20, modules: ["Struktur Beton", "K3 Ketinggian"] },
  { month: "Apr", target: 18, modules: ["RAB & Estimasi", "Jadwal Proyek"] },
  { month: "Mei", target: 22, modules: ["Desain Jalan", "Perkerasan Jalan"] },
  { month: "Jun", target: 15, modules: ["ISO 9001", "Proses SKK"] },
  { month: "Jul", target: 20, modules: ["Instalasi Listrik", "Sistem HVAC"] },
  { month: "Ags", target: 15, modules: ["Plumbing", "Sprinkler"] },
];

export default function BimtekIntegration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const storageKey = getUserStorageKey(user, "bimtek_pkb");

  const [activeTab, setActiveTab] = useState<"modules" | "skk" | "experts" | "certify" | "quiz" | "planner">("modules");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [skkFilter, setSkkFilter] = useState("Semua");
  const [moduleSearch, setModuleSearch] = useState("");
  const [skkSearch, setSkkSearch] = useState("");
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [expandedSkk, setExpandedSkk] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Quiz state
  const [quizCategory, setQuizCategory] = useState("Semua");
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCompletedModules(new Set(JSON.parse(saved)));
    } catch {}
  }, [storageKey]);

  const toggleModule = (id: string) => {
    const alreadyDone = completedModules.has(id);
    setCompletedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
    toast({ title: alreadyDone ? "Modul ditandai belum selesai" : "✅ Modul selesai!", description: alreadyDone ? "PKB dikurangi." : "PKB Points bertambah!" });
  };

  const filteredModules = BIMTEK_MODULES.filter(m => {
    const matchCat = categoryFilter === "Semua" || m.category === categoryFilter;
    const matchSearch = !moduleSearch || m.title.toLowerCase().includes(moduleSearch.toLowerCase()) || m.desc.toLowerCase().includes(moduleSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredSkk = SKK_POSITIONS.filter(p => {
    const matchSub = skkFilter === "Semua" || p.sub === skkFilter.split(" ")[0];
    const matchSearch = !skkSearch || p.title.toLowerCase().includes(skkSearch.toLowerCase()) || p.code.toLowerCase().includes(skkSearch.toLowerCase());
    return matchSub && matchSearch;
  });

  const filteredQuiz = QUIZ_DATA.filter(q => quizCategory === "Semua" || q.category === quizCategory);
  const currentQuestion = filteredQuiz[quizIndex % Math.max(filteredQuiz.length, 1)];

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    setQuizScore(prev => ({
      correct: prev.correct + (idx === currentQuestion.answer ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizIndex(i => (i + 1) % filteredQuiz.length);
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setQuizIndex(0);
    setQuizScore({ correct: 0, total: 0 });
  };

  const totalPkb = BIMTEK_MODULES.filter(m => completedModules.has(m.id)).reduce((a, m) => a + m.pkb, 0);
  const completedCount = completedModules.size;
  const pkbTarget = 150;
  const pkbPercent = Math.min((totalPkb / pkbTarget) * 100, 100);

  return (
    <>
      <SEO
        title="BimtekKita Integration - Chaesa Live"
        description="Platform terintegrasi Chaesa Live × BimtekKita: BIMTEK konstruksi, SKK/BNSP tracking, PKB Points, Quiz Simulasi, dan AI Expert Konstruksi."
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-orange-950 dark:to-yellow-950">
        <PageHeader title="BimtekKita Integration" icon={Building2} backHref="/" backLabel="Beranda" />

        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(60deg, transparent, transparent 30px, rgba(255,255,255,0.1) 30px, rgba(255,255,255,0.1) 31px)" }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-white/30">Chaesa Live × BimtekKita</Badge>
                  <Badge className="bg-white/20 text-white border-white/30">Konstruksi Indonesia</Badge>
                </div>
                <h1 className="text-2xl font-bold mb-1">Platform Pelatihan Konstruksi Terintegrasi</h1>
                <p className="text-orange-100 text-sm max-w-xl">157 modul BIMTEK, 334 posisi SKK/BNSP, 8 AI Expert, quiz simulasi, PKB planner, dan tools kalkulasi — terhubung langsung dengan Competency Passport Anda.</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <a href={BIMTEK_BASE} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-white text-orange-700 hover:bg-orange-50 font-bold w-full">
                    <ExternalLink className="w-4 h-4 mr-1.5" /> Buka BimtekKita
                  </Button>
                </a>
                <Link href="/competency-passport">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/20 bg-white/10 w-full">
                    <Shield className="w-4 h-4 mr-1.5" /> Competency Passport
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* PKB Progress Panel */}
          <Card className="p-5 border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-orange-500" /> PKB Points Tracker
                  <span className="text-xs font-normal text-gray-500">(Pengembangan Keprofesian Berkelanjutan)</span>
                </h2>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">{totalPkb}</span>
                  <span className="text-gray-400">/ {pkbTarget} PKB</span>
                  <Badge className={`text-xs ${totalPkb >= pkbTarget ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"}`}>
                    {totalPkb >= pkbTarget ? "🏆 Target Tercapai!" : `Sisa ${pkbTarget - totalPkb} PKB`}
                  </Badge>
                </div>
                <Progress value={pkbPercent} className="h-3 mb-1" />
                <p className="text-xs text-gray-500">{completedCount} dari {BIMTEK_MODULES.length} modul selesai • {pkbPercent.toFixed(0)}% dari target tahunan • {quizScore.total > 0 ? `Quiz: ${quizScore.correct}/${quizScore.total} benar` : "Belum mengerjakan quiz"}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 shrink-0">
                {[
                  { label: "Modul Selesai", value: completedCount, color: "text-green-600 dark:text-green-400" },
                  { label: "PKB Diraih", value: totalPkb, color: "text-orange-600 dark:text-orange-400" },
                  { label: "SKK Tersedia", value: SKK_POSITIONS.length, color: "text-blue-600 dark:text-blue-400" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-gray-400 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Modul BIMTEK", value: "157+", icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", href: `${BIMTEK_BASE}/bimtek` },
              { label: "Posisi SKK", value: "334", icon: Award, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", href: `${BIMTEK_BASE}/sertifikasi` },
              { label: "Soal Quiz", value: "65+", icon: Target, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20", href: `${BIMTEK_BASE}/quiz` },
              { label: "AI Experts", value: "8", icon: Brain, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", href: `${BIMTEK_BASE}/chat` },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noopener noreferrer">
                <Card className={`p-4 border border-gray-200 dark:border-gray-700 ${s.bg} hover:shadow-md transition-shadow cursor-pointer`}>
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                  </div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </Card>
              </a>
            ))}
          </div>

          {/* View Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "modules", label: "Modul BIMTEK", icon: BookOpen },
              { id: "skk", label: "Database SKK", icon: Award },
              { id: "experts", label: "AI Experts", icon: Brain },
              { id: "quiz", label: "Quiz Simulasi", icon: HelpCircle },
              { id: "certify", label: "Alur Sertifikasi", icon: CheckCircle },
              { id: "planner", label: "PKB Planner", icon: Calendar },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  activeTab === id
                    ? "bg-orange-600 text-white border-orange-600 shadow"
                    : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-orange-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* BIMTEK Modules Tab */}
          {activeTab === "modules" && (
            <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" /> Modul Pelatihan BIMTEK
                  <span className="text-sm font-normal text-gray-500">({filteredModules.length} ditampilkan)</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <a href={`${BIMTEK_BASE}/bimtek`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-8 text-xs text-orange-600 border-orange-300 hover:bg-orange-50">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Buka di BimtekKita
                    </Button>
                  </a>
                </div>
              </div>
              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari modul (nama, deskripsi)..."
                  value={moduleSearch}
                  onChange={e => setModuleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-orange-400"
                />
              </div>

              {/* Progress bar for modules */}
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700 flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">{completedCount}/{BIMTEK_MODULES.length} modul selesai • {totalPkb} PKB terkumpul</div>
                  <Progress value={(completedCount / BIMTEK_MODULES.length) * 100} className="h-2" />
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredModules.map(m => {
                  const Icon = m.icon;
                  const done = completedModules.has(m.id);
                  const expanded = expandedModule === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border-2 transition-all ${
                        done
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 bg-white dark:bg-gray-800"
                      }`}
                    >
                      <div className="p-4 cursor-pointer" onClick={() => toggleModule(m.id)}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-green-500" : "bg-orange-100 dark:bg-orange-900/30"}`}>
                              {done ? <CheckCircle className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                            </div>
                            <Badge className={`text-[10px] px-1.5 py-0.5 ${LEVEL_COLOR[m.level] || LEVEL_COLOR["Ahli"]}`}>{m.level}</Badge>
                          </div>
                          <span className="font-bold text-orange-600 dark:text-orange-400 text-xs">+{m.pkb} PKB</span>
                        </div>
                        <h3 className={`font-semibold text-sm mb-1 ${done ? "text-green-700 dark:text-green-300 line-through" : "text-gray-900 dark:text-white"}`}>{m.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{m.desc}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">{m.category}</span>
                        </div>
                      </div>
                      {/* Expand/Collapse detail */}
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => setExpandedModule(expanded ? null : m.id)}
                          className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-500 hover:text-orange-600 transition-colors"
                        >
                          <span>Tujuan Pembelajaran</span>
                          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {expanded && (
                          <div className="px-4 pb-3">
                            <ul className="space-y-1">
                              {m.objectives.map((obj, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                  <CheckCircle className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                            <div className="flex gap-2 mt-3">
                              <a href={`${BIMTEK_BASE}/bimtek`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <span className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"><Play className="w-2.5 h-2.5" />Buka Modul di BimtekKita</span>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">Klik kartu modul untuk menandai selesai dan menambah PKB. Modul lengkap tersedia di BimtekKita.</p>
            </Card>
          )}

          {/* SKK Database Tab */}
          {activeTab === "skk" && (
            <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-500" /> Database Posisi SKK Konstruksi
                  <span className="text-sm font-normal text-gray-500">({filteredSkk.length} dari 334 posisi)</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select value={skkFilter} onChange={e => setSkkFilter(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {SKK_SUBS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <a href={`${BIMTEK_BASE}/sertifikasi`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-8 text-xs text-purple-600 border-purple-300 hover:bg-purple-50">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Semua 334 Posisi
                    </Button>
                  </a>
                </div>
              </div>

              {/* Search SKK */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari posisi SKK (nama atau kode)..."
                  value={skkSearch}
                  onChange={e => setSkkSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* SKK Level Requirements Table */}
              <div className="mb-5 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-purple-50 dark:bg-purple-900/20">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-purple-600 border border-gray-200 dark:border-gray-700">Tingkat SKK</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-purple-600 border border-gray-200 dark:border-gray-700">Pendidikan</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-purple-600 border border-gray-200 dark:border-gray-700">Pengalaman</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-purple-600 border border-gray-200 dark:border-gray-700">Pelatihan</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-purple-600 border border-gray-200 dark:border-gray-700">PKB/Tahun</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { lvl: "Tingkat I – Pelaksana", edu: "SMA/SMK", exp: "1 tahun", training: "24 jam", pkb: "80 jam" },
                      { lvl: "Tingkat II – Teknisi", edu: "D3/D4", exp: "2 tahun", training: "40 jam", pkb: "100 jam" },
                      { lvl: "Tingkat III – Ahli", edu: "S1", exp: "3 tahun", training: "80 jam", pkb: "120 jam" },
                      { lvl: "Tingkat IV – Ahli Madya", edu: "S1", exp: "5 tahun", training: "120 jam", pkb: "150 jam" },
                      { lvl: "Tingkat V – Manager", edu: "S2", exp: "7 tahun", training: "160 jam", pkb: "160 jam" },
                    ].map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50 dark:bg-gray-800/50"}>
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs">{r.lvl}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs">{r.edu}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-xs">{r.exp}</td>
                        <td className="px-3 py-2 font-semibold text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 text-xs">{r.training}</td>
                        <td className="px-3 py-2 font-semibold text-orange-600 dark:text-orange-400 border border-gray-200 dark:border-gray-700 text-xs">{r.pkb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                {filteredSkk.map(pos => {
                  const open = expandedSkk === pos.code;
                  return (
                    <div key={pos.code} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSkk(open ? null : pos.code)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{pos.code}</span>
                          <span className="font-semibold text-gray-900 dark:text-white text-sm">{pos.title}</span>
                          <Badge className={`text-[10px] px-1.5 py-0.5 ${LEVEL_COLOR[pos.level] || LEVEL_COLOR["Ahli"]}`}>{pos.level}</Badge>
                        </div>
                        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                      </button>
                      {open && (
                        <div className="px-4 pb-4 pt-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            <div>
                              <span className="text-xs text-gray-400 font-medium block">Subklasifikasi</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{pos.sub} – {pos.sub === "B" ? "Gedung" : pos.sub === "C" ? "Sipil" : pos.sub === "D" ? "Mekanikal" : pos.sub === "E" ? "Elektrikal" : pos.sub === "F" ? "Jalan" : "Jembatan"}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 font-medium block">Persyaratan</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{pos.req}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 font-medium block">LSP Terkait</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{pos.lsp}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 font-medium block">Estimasi Biaya</span>
                              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">{pos.biaya}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <a href={`${BIMTEK_BASE}/sertifikasi`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <ExternalLink className="w-3 h-3 mr-1" /> Detail di BimtekKita
                              </Button>
                            </a>
                            <Link href="/competency-passport">
                              <Button size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white">
                                <Shield className="w-3 h-3 mr-1" /> Tambah ke Passport
                              </Button>
                            </Link>
                            <button
                              onClick={() => setActiveTab("quiz")}
                              className="h-7 px-2 text-xs rounded border border-purple-300 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              <HelpCircle className="w-3 h-3 mr-1 inline" /> Coba Quiz
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredSkk.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Tidak ditemukan posisi SKK yang sesuai. Coba kata kunci lain.</p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">Menampilkan {filteredSkk.length} dari 334 posisi SKK. Lihat database lengkap di BimtekKita.</p>
            </Card>
          )}

          {/* AI Experts Tab */}
          {activeTab === "experts" && (
            <div className="space-y-4">
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h2 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-orange-500" /> 8 AI Expert Konstruksi BimtekKita
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Konsultasikan semua pertanyaan konstruksi Anda dengan 8 AI specialist. Klik contoh pertanyaan untuk langsung memulai.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AI_EXPERTS.map((expert, i) => (
                    <a key={i} href={`${BIMTEK_BASE}/chat`} target="_blank" rel="noopener noreferrer">
                      <div className={`p-4 rounded-xl border-2 ${expert.color} hover:shadow-md transition-all cursor-pointer group`}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-2xl shrink-0">{expert.icon}</div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{expert.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{expert.desc}</p>
                          </div>
                        </div>
                        <div className="space-y-1.5 mb-3">
                          {expert.samples.map((s, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <MessageSquare className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 italic">"{s}"</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium group-hover:gap-2 transition-all">
                          Tanya Expert <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>

              {/* Cross-platform AI section */}
              <Card className="p-5 border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">Chaesa Live AI Studio — Ubah Diskusi Jadi E-Course</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Rekam sesi diskusi dengan AI Expert BimtekKita, lalu gunakan AI Chaesa Live untuk mengubahnya menjadi e-course berstruktur dengan 6 langkah SKKNI secara otomatis.</p>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/ai-studio">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs">
                          <Zap className="w-3.5 h-3.5 mr-1" /> Buka AI Studio Chaesa
                        </Button>
                      </Link>
                      <Link href="/competency-builder">
                        <Button size="sm" variant="outline" className="h-8 text-xs text-purple-600 border-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30">
                          <Target className="w-3.5 h-3.5 mr-1" /> Competency Builder
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Quiz Simulasi Tab */}
          {activeTab === "quiz" && (
            <div className="space-y-4">
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-green-500" /> Quiz Simulasi SKK Konstruksi
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Latihan soal kompetensi konstruksi untuk persiapan asesmen SKK/BNSP</p>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={quizCategory}
                      onChange={e => { setQuizCategory(e.target.value); resetQuiz(); }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {QUIZ_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <Button size="sm" variant="outline" onClick={resetQuiz} className="h-8 text-xs">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                    </Button>
                  </div>
                </div>

                {/* Quiz Score */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Dijawab", value: quizScore.total, color: "text-blue-600" },
                    { label: "Benar", value: quizScore.correct, color: "text-green-600" },
                    { label: "Nilai", value: quizScore.total > 0 ? `${Math.round((quizScore.correct / quizScore.total) * 100)}%` : "—", color: "text-orange-600" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>

                {currentQuestion && (
                  <div>
                    {/* Question header */}
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                        {currentQuestion.category}
                      </Badge>
                      <span className="text-xs text-gray-400">Soal {(quizIndex % filteredQuiz.length) + 1} / {filteredQuiz.length}</span>
                    </div>

                    {/* Question */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-relaxed">{currentQuestion.question}</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      {currentQuestion.options.map((opt, i) => {
                        let cls = "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 bg-white dark:bg-gray-800 cursor-pointer";
                        if (selectedAnswer !== null) {
                          if (i === currentQuestion.answer) cls = "border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600";
                          else if (i === selectedAnswer) cls = "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600";
                          else cls = "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-50";
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${cls}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                                selectedAnswer !== null && i === currentQuestion.answer ? "border-green-500 text-green-600 bg-green-100" :
                                selectedAnswer !== null && i === selectedAnswer ? "border-red-500 text-red-600 bg-red-100" :
                                "border-gray-300 text-gray-500"
                              }`}>
                                {selectedAnswer !== null && i === currentQuestion.answer ? <CheckSquare className="w-3 h-3" /> :
                                 selectedAnswer !== null && i === selectedAnswer ? <XCircle className="w-3 h-3" /> :
                                 String.fromCharCode(65 + i)}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {showExplanation && (
                      <div className={`p-4 rounded-xl border mb-4 ${selectedAnswer === currentQuestion.answer ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"}`}>
                        <div className="flex items-start gap-2">
                          {selectedAnswer === currentQuestion.answer
                            ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          }
                          <div>
                            <p className={`text-xs font-semibold mb-1 ${selectedAnswer === currentQuestion.answer ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                              {selectedAnswer === currentQuestion.answer ? "Benar! 🎉" : "Belum tepat"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{currentQuestion.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-2">
                      {selectedAnswer !== null && (
                        <Button onClick={nextQuestion} className="bg-orange-600 hover:bg-orange-700 text-white flex-1">
                          Soal Berikutnya <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                      <a href={`${BIMTEK_BASE}/quiz`} target="_blank" rel="noopener noreferrer" className={selectedAnswer !== null ? "" : "flex-1"}>
                        <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> 65+ Soal di BimtekKita
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </Card>

              {/* Quiz categories info */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { cat: "K3", count: 15, color: "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20", tc: "text-red-600 dark:text-red-400" },
                  { cat: "Struktur", count: 20, color: "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20", tc: "text-blue-600 dark:text-blue-400" },
                  { cat: "Manajemen Proyek", count: 15, color: "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20", tc: "text-green-600 dark:text-green-400" },
                  { cat: "Regulasi & Hukum", count: 10, color: "border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20", tc: "text-purple-600 dark:text-purple-400" },
                  { cat: "Material & Teknologi", count: 8, color: "border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20", tc: "text-orange-600 dark:text-orange-400" },
                  { cat: "Mekanikal & Elektrikal", count: 7, color: "border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20", tc: "text-yellow-600 dark:text-yellow-400" },
                ].map((c, i) => (
                  <a key={i} href={`${BIMTEK_BASE}/quiz`} target="_blank" rel="noopener noreferrer">
                    <div className={`p-3 rounded-xl border ${c.color} hover:shadow-sm transition-all cursor-pointer`}>
                      <div className={`text-xl font-bold ${c.tc}`}>{c.count}+</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{c.cat}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Certify Tab */}
          {activeTab === "certify" && (
            <div className="space-y-4">
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Alur Sertifikasi Konstruksi (BNSP)
                </h2>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-400 to-green-400 rounded-full" />
                  <div className="space-y-6">
                    {[
                      { step: "1", title: "Pilih Jenjang & Jabatan", desc: "Tentukan jenjang (Ahli/Teknisi/Pelaksana) dan jabatan kerja sesuai kompetensi. Gunakan database SKK di tab sebelumnya.", color: "bg-blue-500", link: `${BIMTEK_BASE}/sertifikasi`, tips: "💡 Pastikan memenuhi syarat pendidikan, pengalaman, dan pelatihan sebelum mendaftar." },
                      { step: "2", title: "Persiapan Dokumen", desc: "Siapkan: ijazah, transkrip, SK pengalaman kerja, sertifikat pelatihan, KTP, foto 4×6, dan portofolio proyek.", color: "bg-purple-500", link: `${BIMTEK_BASE}/certify`, tips: "💡 Scan semua dokumen dalam format PDF ≤2MB. Dokumen bahasa asing harus diterjemahkan tersumpah." },
                      { step: "3", title: "Daftar ke LSP Terakreditasi", desc: "Ajukan ke LSP (Lembaga Sertifikasi Profesi) terakreditasi BNSP. Lengkapi APL 01 (permohonan) dan APL 02 (asesmen mandiri).", color: "bg-orange-500", link: `${BIMTEK_BASE}/certify`, tips: "💡 Biaya asesmen variatif per LSP: Rp 800.000–3.500.000 tergantung tingkat." },
                      { step: "4", title: "Asesmen Kompetensi", desc: "Ikuti uji kompetensi oleh asesor BNSP: observasi lapangan, wawancara, tes tertulis, portofolio, dan simulasi kerja.", color: "bg-red-500", link: `${BIMTEK_BASE}/quiz`, tips: "💡 Latih diri dengan Quiz Simulasi di tab Quiz. 80% peserta yang berlatih quiz lulus di percobaan pertama." },
                      { step: "5", title: "Terima SKK & Daftarkan PKB", desc: "Terima Sertifikat Kompetensi Kerja (SKK) BNSP. Catat di Competency Passport Anda dan rencanakan 150 PKB tahunan untuk perpanjangan.", color: "bg-green-500", link: "/competency-passport", tips: "💡 SKK berlaku 3 tahun. Rencanakan PKB dengan fitur PKB Planner di tab berikutnya." },
                    ].map((s, i) => (
                      <div key={i} className="flex gap-4 pl-2">
                        <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${s.color} text-white text-sm font-bold`}>
                          {s.step}
                        </div>
                        <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <h3 className="font-bold text-gray-900 dark:text-white mb-1">{s.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{s.desc}</p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-1.5 mb-3">{s.tips}</p>
                          {s.link.startsWith("http") ? (
                            <a href={s.link} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600 border-orange-300 hover:bg-orange-50">
                                <ExternalLink className="w-3 h-3 mr-1" /> Buka di BimtekKita
                              </Button>
                            </a>
                          ) : (
                            <Link href={s.link}>
                              <Button size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white">
                                <Shield className="w-3 h-3 mr-1" /> Catat di Passport
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Tools Section */}
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-500" /> Tools Kalkulasi BimtekKita
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { title: "Beam Calculator", desc: "Momen, shear, defleksi balok", href: `${BIMTEK_BASE}/solver`, icon: "📐", tag: "Struktur" },
                    { title: "Column Calculator", desc: "Analisis kolom & beban kombinasi", href: `${BIMTEK_BASE}/solver`, icon: "🏛️", tag: "Struktur" },
                    { title: "Foundation Calculator", desc: "Daya dukung & dimensi pondasi", href: `${BIMTEK_BASE}/solver`, icon: "🏗️", tag: "Geoteknik" },
                    { title: "Concrete Mix Design", desc: "Perbandingan campuran beton K-175–K-500", href: `${BIMTEK_BASE}/solver`, icon: "🧱", tag: "Material" },
                    { title: "Earthwork Volume", desc: "Volume galian, timbunan, & cut-fill", href: `${BIMTEK_BASE}/solver`, icon: "⛏️", tag: "Jalan" },
                    { title: "RAB Calculator", desc: "Rencana Anggaran Biaya otomatis", href: `${BIMTEK_BASE}/tools`, icon: "💰", tag: "Manajemen" },
                    { title: "Rebar Calculator", desc: "Volume & berat tulangan baja", href: `${BIMTEK_BASE}/solver`, icon: "🔩", tag: "Struktur" },
                    { title: "Pavement Design", desc: "Desain tebal perkerasan MDP", href: `${BIMTEK_BASE}/solver`, icon: "🛣️", tag: "Jalan" },
                    { title: "Hydraulic Flow", desc: "Debit & dimensi saluran drainase", href: `${BIMTEK_BASE}/solver`, icon: "💧", tag: "Drainase" },
                  ].map((t, i) => (
                    <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">
                      <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all cursor-pointer h-full">
                        <div className="flex items-start justify-between mb-1">
                          <div className="text-2xl">{t.icon}</div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700">{t.tag}</span>
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{t.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* PKB Planner Tab */}
          {activeTab === "planner" && (
            <div className="space-y-4">
              <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-orange-500" /> Rencana PKB Tahunan
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">Target 150 PKB dalam 12 bulan untuk perpanjangan SKK</p>
                  </div>
                  <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-0">
                    {totalPkb}/150 PKB
                  </Badge>
                </div>

                {/* Annual progress */}
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress PKB Tahunan</span>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{pkbPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={pkbPercent} className="h-4 mb-2" />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0 PKB</span>
                    <span className="text-green-600 font-semibold">Target: 150 PKB</span>
                  </div>
                </div>

                {/* Monthly plan */}
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rekomendasi Rencana Bulanan</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {PKB_MONTHLY.map((m, i) => {
                    const monthDone = m.modules.every(mod =>
                      BIMTEK_MODULES.some(bm => bm.title.toLowerCase().includes(mod.toLowerCase().substring(0, 8)) && completedModules.has(bm.id))
                    );
                    return (
                      <div key={i} className={`p-3 rounded-xl border-2 transition-all ${monthDone ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-gray-900 dark:text-white">{m.month}</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400 text-xs">+{m.target} PKB</span>
                        </div>
                        {m.modules.map((mod, j) => (
                          <div key={j} className="text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-1">
                            <span className="shrink-0">•</span>{mod}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Category breakdown */}
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Distribusi PKB per Kategori</h3>
                <div className="space-y-2">
                  {[
                    { cat: "K3 (Wajib)", target: 49, color: "bg-red-500" },
                    { cat: "Sipil Gedung", target: 64, color: "bg-blue-500" },
                    { cat: "Manajemen Proyek", target: 47, color: "bg-green-500" },
                    { cat: "Jalan & Jembatan", target: 54, color: "bg-amber-500" },
                    { cat: "Elektrikal & Mekanikal", target: 54, color: "bg-purple-500" },
                    { cat: "ISO & Sertifikasi", target: 38, color: "bg-teal-500" },
                  ].map((c, i) => {
                    const earned = BIMTEK_MODULES
                      .filter(m => m.category.toLowerCase().includes(c.cat.split(" ")[0].toLowerCase()) && completedModules.has(m.id))
                      .reduce((a, m) => a + m.pkb, 0);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-28 text-xs text-gray-500 dark:text-gray-400 shrink-0">{c.cat}</div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full ${c.color} rounded-full transition-all`} style={{ width: `${Math.min((earned / c.target) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-16 text-right">{earned}/{c.target} PKB</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Recommendations */}
              <Card className="p-5 border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-green-500" /> Modul Direkomendasikan Berikutnya
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BIMTEK_MODULES.filter(m => !completedModules.has(m.id)).slice(0, 4).map((m, i) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => { setActiveTab("modules"); setCategoryFilter(m.category); }}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-700 hover:border-green-400 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{m.title}</p>
                          <p className="text-[10px] text-gray-400">{m.duration} • +{m.pkb} PKB</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 shrink-0" />
                      </button>
                    );
                  })}
                </div>
                {BIMTEK_MODULES.filter(m => !completedModules.has(m.id)).length === 0 && (
                  <div className="text-center py-4">
                    <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="font-bold text-green-700 dark:text-green-300">Semua modul selesai! 🏆</p>
                    <p className="text-xs text-gray-500 mt-1">Anda telah menyelesaikan seluruh modul BIMTEK</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Ecosystem Footer */}
          <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" /> Ekosistem Terintegrasi: Chaesa Live × BimtekKita
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              {[
                { label: "BIMTEK Modules", href: `${BIMTEK_BASE}/bimtek`, icon: "🎓", external: true },
                { label: "→", href: null },
                { label: "Quiz Simulasi", href: `${BIMTEK_BASE}/quiz`, icon: "✍️", external: true },
                { label: "→", href: null },
                { label: "Competency Builder", href: "/competency-builder", icon: "🎯", external: false },
                { label: "→", href: null },
                { label: "AI Expert", href: `${BIMTEK_BASE}/chat`, icon: "🤖", external: true },
                { label: "→", href: null },
                { label: "SKK/BNSP", href: `${BIMTEK_BASE}/sertifikasi`, icon: "📋", external: true },
                { label: "→", href: null },
                { label: "Competency Passport", href: "/competency-passport", icon: "🛡️", external: false },
              ].map((item, i) =>
                item.href === null ? (
                  <ArrowRight key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                ) : item.external ? (
                  <a key={i} href={item.href!} target="_blank" rel="noopener noreferrer">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 text-xs font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 transition-colors cursor-pointer">
                      {item.icon} {item.label} <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </span>
                  </a>
                ) : (
                  <Link key={i} href={item.href!}>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors cursor-pointer">
                      {item.icon} {item.label}
                    </span>
                  </Link>
                )
              )}
            </div>
            <p className="text-xs text-center text-gray-400">Belajar BIMTEK → Quiz Simulasi → Bangun Kompetensi → Konsultasi AI Expert → Dapatkan SKK → Rekam di Passport Digital</p>
          </Card>

        </div>
      </div>
    </>
  );
}
