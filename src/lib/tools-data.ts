/* Chaesa AI Tools — Pre-built Construction AI Apps (No Prompting Needed)
   Inspired by GipsyAI's approach: structured forms → instant professional output
   30+ tools across 8 construction disciplines */

export interface ToolField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "number";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  hint?: string;
  rows?: number;
}

export interface AiTool {
  id: string;
  name: string;
  description: string;
  longDesc?: string;
  category: string;
  categoryIcon: string;
  icon: string;
  tier: "free" | "pro";
  isNew?: boolean;
  isPopular?: boolean;
  fields: ToolField[];
  buildPrompt: (data: Record<string, string>) => string;
  outputLabel: string;
  outputHint?: string;
  agentId: string;
  estimatedTime?: string;
}

/* ── Categories ─────────────────────────────────────── */
export const TOOL_CATEGORIES = [
  { id: "all",       label: "Semua Tools",      icon: "⚡", count: 0 },
  { id: "pm",        label: "Manajemen Proyek",  icon: "📊", count: 0 },
  { id: "k3",        label: "K3 & Keselamatan",  icon: "⛑️", count: 0 },
  { id: "dokumen",   label: "Dokumen & Surat",   icon: "📄", count: 0 },
  { id: "estimasi",  label: "Estimasi & RAB",    icon: "💰", count: 0 },
  { id: "teknis",    label: "Teknis & Sipil",    icon: "🏛️", count: 0 },
  { id: "kontrak",   label: "Kontrak & Legal",   icon: "⚖️", count: 0 },
  { id: "mep",       label: "MEP",               icon: "⚡", count: 0 },
  { id: "bim",       label: "BIM & Digital",     icon: "🖥️", count: 0 },
] as const;

/* ── Tool definitions ───────────────────────────────── */
export const AI_TOOLS: AiTool[] = [

  /* ══ MANAJEMEN PROYEK ══════════════════════════════ */
  {
    id: "wbs-generator",
    name: "Generator WBS Otomatis",
    description: "Buat Work Breakdown Structure lengkap dan terstruktur hanya dari input dasar proyek.",
    longDesc: "Hasilkan WBS dengan Level 1-4 yang komprehensif, mencakup semua lingkup pekerjaan konstruksi sesuai jenis bangunan.",
    category: "pm", categoryIcon: "📊", icon: "🗂️",
    tier: "free", isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Work Breakdown Structure",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Gedung Kantor PT Maju Bersama", required: true },
      { id: "jenisProyek", label: "Jenis Bangunan", type: "select", required: true, options: ["Gedung Perkantoran","Apartemen/Hunian","Ruko/Komersial","Fasilitas Industri","Infrastruktur Jalan","Jembatan","Rumah Sakit","Sekolah/Kampus","Hotel","Mixed-Use"] },
      { id: "jumlahLantai", label: "Jumlah Lantai", type: "number", placeholder: "5", required: true },
      { id: "nilaiKontrak", label: "Estimasi Nilai Proyek", type: "text", placeholder: "Rp 25 miliar" },
      { id: "durasi", label: "Target Durasi (bulan)", type: "number", placeholder: "18" },
    ],
    buildPrompt: (d) => `Kamu adalah Manajer Proyek konstruksi senior berpengalaman. Buat Work Breakdown Structure (WBS) lengkap untuk proyek berikut:

Nama: ${d.namaProyek}
Jenis: ${d.jenisProyek}
Lantai: ${d.jumlahLantai} lantai
Nilai: ${d.nilaiKontrak || "tidak disebutkan"}
Durasi: ${d.durasi || "belum ditentukan"} bulan

Format WBS dengan Level 0 (Proyek), Level 1 (Fase Besar), Level 2 (Paket Pekerjaan), Level 3 (Sub-pekerjaan). Gunakan kode numerik (1.0, 1.1, 1.1.1, dst). Wajib mencakup: Pekerjaan Persiapan, Sipil/Struktur, Arsitektur, MEP, Finishing, dan Commissioning. Bahasa Indonesia profesional.`,
    outputHint: "WBS dapat langsung digunakan di MS Project, Primavera, atau Excel",
  },

  {
    id: "agenda-rapat",
    name: "Template Agenda Rapat Proyek",
    description: "Buat agenda rapat site/koordinasi yang profesional dan terstruktur dalam hitungan detik.",
    category: "pm", categoryIcon: "📊", icon: "📋",
    tier: "free", isNew: true,
    estimatedTime: "~10 detik",
    agentId: "pm", outputLabel: "Agenda Rapat",
    fields: [
      { id: "jenis", label: "Jenis Rapat", type: "select", required: true, options: ["Rapat Koordinasi Mingguan","Rapat Progress Bulanan","Rapat Site (kick-off)","Rapat Teknis","Rapat Klaim/Dispute","Rapat PCM (Pre Construction Meeting)","Rapat PHO/FHO"] },
      { id: "tanggal", label: "Tanggal & Waktu", type: "text", placeholder: "Senin, 15 April 2025 — 09:00 WIB", required: true },
      { id: "lokasi", label: "Lokasi Rapat", type: "text", placeholder: "Direksi Keet Proyek / Zoom" },
      { id: "peserta", label: "Peserta Rapat", type: "textarea", placeholder: "PM, Site Manager, Konsultan MK, Subkontraktor Sipil...", rows: 3, required: true },
      { id: "topikUtama", label: "Topik/Isu Utama", type: "textarea", placeholder: "Review progress pekerjaan bekisting, kendala pengiriman material, dsb.", rows: 3, required: true },
    ],
    buildPrompt: (d) => `Kamu adalah Manajer Proyek konstruksi senior. Buat agenda rapat formal untuk:

Jenis: ${d.jenis}
Tanggal: ${d.tanggal}
Lokasi: ${d.lokasi || "Direksi Keet"}
Peserta: ${d.peserta}
Topik Utama: ${d.topikUtama}

Sertakan: Pembukaan, Review notulen sebelumnya, Agenda per topik dengan estimasi waktu, Penutup/action item. Format profesional dengan kop surat konstruksi. Bahasa Indonesia formal.`,
    outputHint: "Siap dikirim via email atau WhatsApp ke peserta rapat",
  },

  {
    id: "laporan-progress",
    name: "Generator Laporan Progress",
    description: "Susun laporan progress mingguan/bulanan yang formal dari data lapangan sederhana.",
    category: "pm", categoryIcon: "📊", icon: "📈",
    tier: "free", isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "pm", outputLabel: "Laporan Progress",
    fields: [
      { id: "periode", label: "Periode Laporan", type: "text", placeholder: "Minggu ke-12, 7–13 April 2025", required: true },
      { id: "proyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung Kantor 8 Lantai", required: true },
      { id: "progressRencana", label: "Progress Rencana (%)", type: "number", placeholder: "65", required: true },
      { id: "progressAktual", label: "Progress Aktual (%)", type: "number", placeholder: "62", required: true },
      { id: "kegiatanSelesai", label: "Kegiatan yang Diselesaikan", type: "textarea", placeholder: "Pengecoran kolom lantai 4, pasang bekisting balok lt 5...", rows: 3, required: true },
      { id: "kendala", label: "Kendala / Masalah", type: "textarea", placeholder: "Keterlambatan ready mix, hujan 3 hari, dsb.", rows: 3 },
      { id: "rencanaMingguDepan", label: "Rencana Kegiatan Berikutnya", type: "textarea", placeholder: "Pengecoran balok lt 5, pemasangan rebar kolom lt 5...", rows: 3 },
    ],
    buildPrompt: (d) => `Kamu adalah Manajer Proyek konstruksi senior. Buat laporan progress formal dengan data berikut:

Periode: ${d.periode}
Proyek: ${d.proyek}
Progress Rencana: ${d.progressRencana}%
Progress Aktual: ${d.progressAktual}%
Deviasi: ${(Number(d.progressAktual) - Number(d.progressRencana)).toFixed(1)}% (${Number(d.progressAktual) >= Number(d.progressRencana) ? "on track / ahead" : "behind schedule"})

Kegiatan Selesai:
${d.kegiatanSelesai}

Kendala:
${d.kendala || "Tidak ada kendala berarti"}

Rencana Berikutnya:
${d.rencanaMingguDepan || "Akan ditentukan"}

Format laporan resmi: ringkasan eksekutif, tabel progress per WBS, analisa keterlambatan (jika ada) dan recovery plan, rencana kegiatan, tindak lanjut. Bahasa Indonesia formal dan ringkas.`,
    outputHint: "Format siap dilaporkan ke Owner/MK",
  },

  {
    id: "checklist-pho",
    name: "Checklist PHO/FHO",
    description: "Generate checklist serah terima pekerjaan (PHO/FHO) yang komprehensif sesuai kontrak.",
    category: "pm", categoryIcon: "📊", icon: "✅",
    tier: "free", isNew: true,
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Checklist Serah Terima",
    fields: [
      { id: "jenis", label: "Jenis Serah Terima", type: "select", required: true, options: ["PHO (Provisional Hand Over)","FHO (Final Hand Over)","Serah Terima Parsial","Serah Terima Pekerjaan per Zona"] },
      { id: "jenisProyek", label: "Jenis Proyek", type: "select", required: true, options: ["Gedung","Infrastruktur Jalan","Jembatan","Instalasi MEP","Renovasi"] },
      { id: "nilaiKontrak", label: "Nilai Kontrak", type: "text", placeholder: "Rp 15 miliar" },
      { id: "kondisiKhusus", label: "Kondisi / Catatan Khusus", type: "textarea", placeholder: "Ada pekerjaan minor yang belum selesai, dsb.", rows: 3 },
    ],
    buildPrompt: (d) => `Kamu adalah Manajer Proyek dan konsultan MK berpengalaman. Buat checklist ${d.jenis} yang komprehensif untuk:

Jenis Proyek: ${d.jenisProyek}
Nilai Kontrak: ${d.nilaiKontrak || "tidak disebutkan"}
Kondisi Khusus: ${d.kondisiKhusus || "standar"}

Checklist harus mencakup: dokumen teknis, dokumen administrasi, kondisi fisik bangunan/infrastruktur, uji fungsi sistem, as-built drawing, manual operasi, garansi peralatan, dan jaminan pemeliharaan. Format tabel dengan kolom: No, Item, Keterangan, Status (OK/Belum/N/A), Catatan. Bahasa Indonesia profesional.`,
  },

  /* ══ K3 & KESELAMATAN ══════════════════════════════ */
  {
    id: "jsa-generator",
    name: "Generator JSA (Job Safety Analysis)",
    description: "Buat Job Safety Analysis lengkap dengan identifikasi bahaya, penilaian risiko, dan pengendalian.",
    longDesc: "Hasilkan JSA sesuai standar PP 50/2012 dan ISO 45001 dengan hierarki pengendalian risiko yang tepat.",
    category: "k3", categoryIcon: "⛑️", icon: "⛑️",
    tier: "free", isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "k3", outputLabel: "Job Safety Analysis (JSA)",
    fields: [
      { id: "namaPekerjaan", label: "Nama Pekerjaan", type: "text", placeholder: "Pemasangan Bekisting Kolom Lantai 5", required: true },
      { id: "lokasiKerja", label: "Lokasi Kerja", type: "text", placeholder: "Area Grid A1-B3, Lantai 5", required: true },
      { id: "jumlahPekerja", label: "Jumlah Pekerja", type: "number", placeholder: "8" },
      { id: "peralatan", label: "Peralatan & Material", type: "textarea", placeholder: "Tower crane, scaffolding, bekisting baja, palu, dsb.", rows: 3, required: true },
      { id: "bahayaUtama", label: "Potensi Bahaya Utama (opsional)", type: "textarea", placeholder: "Jatuh dari ketinggian, terbentur material, dsb.", rows: 3 },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Manager konstruksi senior, berpengalaman dalam K3 konstruksi Indonesia. Buat JSA (Job Safety Analysis) lengkap sesuai standar PP 50/2012 dan ISO 45001:2018 untuk:

Pekerjaan: ${d.namaPekerjaan}
Lokasi: ${d.lokasiKerja}
Jumlah Pekerja: ${d.jumlahPekerja || "tidak disebutkan"}
Peralatan: ${d.peralatan}
Bahaya Utama: ${d.bahayaUtama || "identifikasi secara komprehensif"}

JSA harus mencakup:
1. Tabel langkah-langkah pekerjaan (minimal 6 langkah)
2. Per langkah: bahaya (fisik, kimia, ergonomi, psikososial), risiko (L×S = Risk Rating), pengendalian (eliminasi→substitusi→rekayasa→administratif→APD)
3. APD wajib lengkap
4. Persyaratan ijin kerja (work permit) jika diperlukan
5. Tanda tangan: Pekerja, Supervisor, HSE Officer

Format tabel profesional. Bahasa Indonesia formal.`,
    outputHint: "Cetak dan tanda tangani sebelum pekerjaan dimulai",
  },

  {
    id: "hirarc-generator",
    name: "Generator Tabel HIRARC",
    description: "Buat Hazard Identification, Risk Assessment & Risk Control (HIRARC) untuk aktivitas konstruksi.",
    category: "k3", categoryIcon: "⛑️", icon: "🔴",
    tier: "free",
    estimatedTime: "~20 detik",
    agentId: "k3", outputLabel: "Tabel HIRARC",
    fields: [
      { id: "aktivitas", label: "Aktivitas/Pekerjaan", type: "text", placeholder: "Pekerjaan Galian Tanah Dalam (>3m)", required: true },
      { id: "lingkupKerja", label: "Lingkup Kerja", type: "textarea", placeholder: "Galian pile cap, dewatering, shoring...", rows: 3, required: true },
      { id: "lokasiKondisi", label: "Kondisi Lingkungan", type: "textarea", placeholder: "Dekat bangunan eksisting, muka air tanah tinggi, dsb.", rows: 2 },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Manager konstruksi. Buat tabel HIRARC (Hazard Identification, Risk Assessment & Risk Control) sesuai ISO 45001:2018 dan PP 50/2012 untuk:

Aktivitas: ${d.aktivitas}
Lingkup: ${d.lingkupKerja}
Kondisi: ${d.lokasiKondisi || "standar"}

Format tabel kolom: No | Aktivitas | Bahaya | Risiko | Likelihood (1-5) | Severity (1-5) | Risk Rating | Level Risiko | Tindakan Pengendalian | PIC | Target Tanggal.

Sertakan risk matrix 5×5 dan klasifikasi level (Low/Medium/High/Extreme). Minimal 8 bahaya berbeda. Bahasa Indonesia.`,
    outputHint: "Sesuai format audit SMK3 PP 50/2012",
  },

  {
    id: "apd-list",
    name: "Daftar APD Wajib per Pekerjaan",
    description: "Dapatkan daftar Alat Pelindung Diri yang wajib, disarankan, dan standar kualitasnya.",
    category: "k3", categoryIcon: "⛑️", icon: "🦺",
    tier: "free",
    estimatedTime: "~10 detik",
    agentId: "k3", outputLabel: "Daftar APD",
    fields: [
      { id: "jenisPekerjaan", label: "Jenis Pekerjaan", type: "select", required: true, options: ["Pekerjaan di Ketinggian (>2m)","Pekerjaan Pengelasan","Pekerjaan Elektrikal","Pekerjaan di Ruang Terbatas (Confined Space)","Pekerjaan Galian/Excavation","Pekerjaan Pengecoran Beton","Pekerjaan Blasting/Spraying","Pekerjaan Rigging & Lifting","Pekerjaan Bongkar Pasang Perancah","Demolisi/Pembongkaran"] },
      { id: "kondisiKhusus", label: "Kondisi Khusus", type: "textarea", placeholder: "Bekerja di malam hari, cuaca ekstrem, dsb.", rows: 2 },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Manager berpengalaman. Buat daftar APD wajib sesuai Permenaker 08/2010 dan ISO 45001:2018 untuk:

Pekerjaan: ${d.jenisPekerjaan}
Kondisi Khusus: ${d.kondisiKhusus || "standar"}

Format tabel: APD | Standar/Sertifikasi | Spesifikasi Minimum | Wajib/Disarankan | Frekuensi Inspeksi. Kelompokkan: Pelindung Kepala, Mata/Wajah, Pernapasan, Tangan, Kaki, Tubuh, Jatuh. Sertakan catatan tentang pemeriksaan kondisi APD sebelum digunakan.`,
  },

  {
    id: "prosedur-darurat",
    name: "Prosedur Tanggap Darurat",
    description: "Buat prosedur tanggap darurat (emergency response) untuk skenario kecelakaan konstruksi.",
    category: "k3", categoryIcon: "⛑️", icon: "🚨",
    tier: "free", isNew: true,
    estimatedTime: "~20 detik",
    agentId: "k3", outputLabel: "Prosedur Tanggap Darurat",
    fields: [
      { id: "jenisInsiden", label: "Jenis Insiden", type: "select", required: true, options: ["Kebakaran di Lokasi Proyek","Pekerja Jatuh dari Ketinggian","Kecelakaan Alat Berat","Ledakan/Explosion","Tumpahan Bahan Kimia/B3","Orang Tenggelam/Jatuh ke Lubang","Gempa Bumi saat Konstruksi","Runtuhnya Struktur Sementara","Pekerja Tersengat Listrik","Kecelakaan Maut (Fatal Accident)"] },
      { id: "lokasiProyek", label: "Lokasi Proyek", type: "text", placeholder: "Jakarta Selatan — dekat RSUD Pasar Minggu", required: true },
      { id: "jumlahPekerja", label: "Total Pekerja di Lokasi", type: "number", placeholder: "150" },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Manager dan Emergency Response Coordinator berpengalaman. Buat prosedur tanggap darurat resmi untuk:

Skenario: ${d.jenisInsiden}
Lokasi: ${d.lokasiProyek}
Total Pekerja: ${d.jumlahPekerja || "tidak disebutkan"}

Prosedur harus mencakup: (1) Deteksi & Pelaporan Awal, (2) Aktivasi Tim Tanggap Darurat, (3) Langkah Penanganan Immediate, (4) Evakuasi (jika diperlukan), (5) Koordinasi dengan Pihak Eksternal (pemadam, ambulans, polisi), (6) Penyelidikan Insiden, (7) Pelaporan ke Disnaker. Sertakan nomor darurat template dan diagram alur (dalam teks). Referensi: UU 1/1970 dan PP 50/2012.`,
  },

  /* ══ DOKUMEN & SURAT ══════════════════════════════ */
  {
    id: "surat-teguran",
    name: "Generator Surat Teguran",
    description: "Buat surat teguran formal kepada subkontraktor, pemasok, atau pihak lain yang tidak memenuhi kewajiban.",
    category: "dokumen", categoryIcon: "📄", icon: "✉️",
    tier: "free", isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "kontrak", outputLabel: "Surat Teguran",
    fields: [
      { id: "jenisPlanggar", label: "Pihak yang Ditegur", type: "select", required: true, options: ["Subkontraktor","Pemasok/Supplier","Konsultan Perencana","Konsultan MK","Mandor/Kepala Tukang","Penyewa (Tenant)"] },
      { id: "namaPenerima", label: "Nama Perusahaan/Pihak", type: "text", placeholder: "PT Jaya Mandiri Konstruksi", required: true },
      { id: "pelanggaran", label: "Jenis Pelanggaran", type: "select", required: true, options: ["Keterlambatan Pekerjaan","Kualitas Pekerjaan di Bawah Standar","Pelanggaran K3","Tidak Menyelesaikan Perbaikan (Defect)","Pengiriman Material Terlambat","Tidak Hadir Rapat Koordinasi","Pelanggaran Kontrak Lainnya"] },
      { id: "detailPelanggaran", label: "Detail Pelanggaran", type: "textarea", placeholder: "Pekerjaan pasangan dinding lantai 3 terlambat 15 hari dari jadwal, target selesai 1 April namun baru 60% per tanggal ini...", rows: 4, required: true },
      { id: "teguranKe", label: "Surat Teguran ke-", type: "select", options: ["1 (Pertama)","2 (Kedua)","3 (Terakhir/Final)"] },
      { id: "deadlineRespons", label: "Batas Waktu Respons", type: "text", placeholder: "7 hari kerja sejak surat ini diterima" },
    ],
    buildPrompt: (d) => `Kamu adalah konsultan hukum konstruksi senior. Buat surat teguran formal dengan ketentuan:

Penerima: ${d.namaPenerima} (${d.jenisPlanggar})
Teguran ke: ${d.teguranKe || "Pertama"}
Jenis Pelanggaran: ${d.pelanggaran}
Detail: ${d.detailPelanggaran}
Batas Respons: ${d.deadlineRespons || "7 hari kerja"}

Format surat resmi lengkap: kop surat, nomor surat, perihal, salam, isi (kronologi, dasar kontrak, tuntutan), konsekuensi jika tidak ditindaklanjuti, tanda tangan. Merujuk klausul kontrak umum FIDIC/SPK terkait default notice. Bahasa Indonesia formal dan tegas.`,
    outputHint: "Simpan salinan untuk dokumentasi klaim di kemudian hari",
  },

  {
    id: "surat-perpanjangan",
    name: "Permohonan Perpanjangan Waktu",
    description: "Susun surat permohonan perpanjangan waktu (time extension claim) yang kuat dan terdokumentasi.",
    category: "dokumen", categoryIcon: "📄", icon: "📅",
    tier: "free",
    estimatedTime: "~20 detik",
    agentId: "kontrak", outputLabel: "Surat Permohonan Perpanjangan Waktu",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung Kantor Bank XYZ", required: true },
      { id: "pihakPemilik", label: "Nama Owner/Pemberi Kerja", type: "text", placeholder: "PT Bank XYZ Tbk", required: true },
      { id: "durasiPerpanjangan", label: "Durasi Perpanjangan (hari kalender)", type: "number", placeholder: "45", required: true },
      { id: "alasanUtama", label: "Alasan Perpanjangan", type: "select", required: true, options: ["Force Majeure (Bencana Alam/Pandemi)","Cuaca Ekstrem di Luar Normal","Perubahan Desain (Change Order)","Keterlambatan Ijin dari Owner","Kelangkaan Material","Pekerjaan Tambah (Variation Order)","Keterlambatan Pembayaran Termin","Kondisi Lapangan Berbeda dari Kontrak"] },
      { id: "kronologi", label: "Kronologi & Bukti Pendukung", type: "textarea", placeholder: "Pada tanggal 10 Maret 2025 terjadi banjir yang menghentikan seluruh pekerjaan selama 12 hari...", rows: 4, required: true },
    ],
    buildPrompt: (d) => `Kamu adalah konsultan kontrak konstruksi berpengalaman. Buat surat permohonan perpanjangan waktu yang kuat dan mengacu FIDIC/Perpres 16/2018:

Proyek: ${d.namaProyek}
Owner: ${d.pihakPemilik}
Durasi Perpanjangan: ${d.durasiPerpanjangan} hari kalender
Alasan: ${d.alasanUtama}
Kronologi: ${d.kronologi}

Surat harus mencakup: dasar hukum klaim (pasal kontrak), kronologi kejadian, analisa dampak pada jadwal (jalur kritis), perhitungan durasi perpanjangan, dokumen pendukung yang dilampirkan, dan permintaan persetujuan. Bahasa Indonesia formal dan meyakinkan.`,
  },

  {
    id: "notulen-rapat",
    name: "Generator Notulen Rapat",
    description: "Ubah poin-poin rapat menjadi notulen resmi yang terstruktur dan siap distribusi.",
    category: "dokumen", categoryIcon: "📄", icon: "📝",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Notulen Rapat",
    fields: [
      { id: "jenisRapat", label: "Jenis Rapat", type: "text", placeholder: "Rapat Koordinasi Mingguan #14", required: true },
      { id: "tanggalWaktu", label: "Tanggal & Waktu", type: "text", placeholder: "Senin, 14 April 2025, 09.00–11.30 WIB", required: true },
      { id: "peserta", label: "Daftar Peserta", type: "textarea", placeholder: "PM (Ir. Hendra), Site Manager (Budi), MK (Pak Andi), Subkon Sipil (PT Jaya)...", rows: 3, required: true },
      { id: "poinPembahasaan", label: "Poin-poin yang Dibahas", type: "textarea", placeholder: "1. Review progress minggu lalu: 62% aktual vs 65% rencana\n2. Kendala material besi: pengiriman terlambat 3 hari\n3. Rencana pengecoran balok lt.5 hari Rabu...", rows: 6, required: true },
      { id: "actionItems", label: "Action Items / Tindak Lanjut", type: "textarea", placeholder: "PM akan koordinasi dengan supplier, MK cek gambar revisi...", rows: 3 },
    ],
    buildPrompt: (d) => `Kamu adalah administrator proyek konstruksi profesional. Buat notulen rapat resmi dari poin-poin berikut:

Rapat: ${d.jenisRapat}
Tanggal: ${d.tanggalWaktu}
Peserta: ${d.peserta}

Pembahasan:
${d.poinPembahasaan}

Action Items:
${d.actionItems || "sesuaikan dari poin pembahasan"}

Format notulen resmi: header (nama proyek, nomor notulen, tanggal, peserta), isi pembahasan per agenda dengan keputusan yang dicapai, tabel action items (aktivitas, PIC, deadline, status), dan kolom tanda tangan. Bahasa Indonesia formal.`,
  },

  {
    id: "rks-generator",
    name: "Generator RKS Teknis",
    description: "Buat Rencana Kerja dan Syarat (RKS/Spesifikasi Teknis) untuk item pekerjaan tertentu.",
    category: "dokumen", categoryIcon: "📄", icon: "📗",
    tier: "pro", isNew: true,
    estimatedTime: "~25 detik",
    agentId: "struktur", outputLabel: "RKS / Spesifikasi Teknis",
    fields: [
      { id: "itemPekerjaan", label: "Item Pekerjaan", type: "select", required: true, options: ["Pekerjaan Beton Bertulang","Pekerjaan Beton Pracetak","Pekerjaan Pasangan Bata","Pekerjaan Plesteran & Acian","Pekerjaan Waterproofing","Pekerjaan Cat Gedung","Pekerjaan Keramik/Granit","Pekerjaan Rangka Atap Baja","Pekerjaan Tiang Pancang","Pekerjaan Fondasi Strauss Pile"] },
      { id: "mutualBeton", label: "Mutu Material Utama", type: "text", placeholder: "fc'=25 MPa, fy=400 MPa, semen PCC" },
      { id: "standar", label: "Standar Acuan", type: "text", placeholder: "SNI 2847:2019, SNI 03-2834" },
    ],
    buildPrompt: (d) => `Kamu adalah engineer konstruksi senior. Buat Spesifikasi Teknis (RKS) untuk:

Item Pekerjaan: ${d.itemPekerjaan}
Mutu Material: ${d.mutualBeton || "standar Indonesia"}
Standar Acuan: ${d.standar || "SNI terkait"}

RKS harus mencakup: (1) Lingkup Pekerjaan, (2) Standar dan Referensi, (3) Persyaratan Material (dengan merk yang diperbolehkan), (4) Persyaratan Pelaksanaan (metode, urutan, toleransi), (5) Quality Control & Testing, (6) Pengukuran & Pembayaran. Format SNI dan bahasa Indonesia formal.`,
  },

  /* ══ ESTIMASI & RAB ════════════════════════════════ */
  {
    id: "rab-kasar",
    name: "Estimasi RAB Kasar (OE)",
    description: "Dapatkan perkiraan biaya konstruksi (Order of Magnitude / OE) dari data minimal proyek.",
    category: "estimasi", categoryIcon: "💰", icon: "💰",
    tier: "free", isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "rab", outputLabel: "Estimasi RAB Kasar",
    fields: [
      { id: "jenisProyek", label: "Jenis Bangunan", type: "select", required: true, options: ["Gedung Perkantoran","Rumah Tinggal Mewah","Rumah Tinggal Tipe Sedang","Ruko Komersial","Gudang/Warehouse","Apartemen","Rumah Sakit","Sekolah/Kampus","Hotel Bintang 3","Hotel Bintang 4-5","Fasilitas Industri"] },
      { id: "lokasiProyek", label: "Lokasi Proyek", type: "select", required: true, options: ["DKI Jakarta","Surabaya","Bandung","Semarang","Medan","Bali/Denpasar","Kota Besar Lainnya","Kota Sedang (Jawa)","Luar Jawa"] },
      { id: "luasTotal", label: "Luas Total Bangunan (m²)", type: "number", placeholder: "2500", required: true },
      { id: "jumlahLantai", label: "Jumlah Lantai", type: "number", placeholder: "5", required: true },
      { id: "spesifikasi", label: "Spesifikasi/Kualitas", type: "select", options: ["Ekonomis","Standar","Menengah","Mewah","Premium"], required: true },
      { id: "tahunAnggaran", label: "Tahun Anggaran", type: "text", placeholder: "2025" },
    ],
    buildPrompt: (d) => `Kamu adalah Quantity Surveyor senior. Buat estimasi biaya konstruksi Order of Magnitude (OE) untuk:

Jenis: ${d.jenisProyek}
Lokasi: ${d.lokasiProyek}
Luas Total: ${d.luasTotal} m²
Lantai: ${d.jumlahLantai} lantai
Kualitas: ${d.spesifikasi}
Tahun: ${d.tahunAnggaran || "2025"}

Sajikan: (1) Harga satuan per m² (range min-max berdasarkan HSPK ${d.lokasiProyek} ${d.tahunAnggaran || "2025"}), (2) Estimasi total per komponen utama (Sipil/Struktur, Arsitektur, MEP, Finishing, Pekerjaan Luar), (3) Total biaya konstruksi (belum termasuk tanah dan desain), (4) Biaya soft cost (desain, perijinan, konsultan) ±15%, (5) Contingency ±10%. Sertakan asumsi dan batasan estimasi. Harga realistis berdasarkan market Indonesia.`,
    outputHint: "Estimasi ini bersifat indikatif; RAB detail perlu survey dan gambar teknis",
  },

  {
    id: "ahs-generator",
    name: "Analisa Harga Satuan Pekerjaan",
    description: "Buat AHS (Analisa Harga Satuan) berdasarkan SNI Analisa / AHSP 2022.",
    category: "estimasi", categoryIcon: "💰", icon: "📊",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "rab", outputLabel: "Analisa Harga Satuan",
    fields: [
      { id: "itemPekerjaan", label: "Item Pekerjaan", type: "select", required: true, options: ["Pekerjaan Beton fc'=25 MPa per m³","Pekerjaan Pasangan Bata Merah per m²","Pekerjaan Plesteran 1:5 per m²","Pekerjaan Keramik 60x60 per m²","Pekerjaan Cat Tembok per m²","Pekerjaan Bekisting Balok per m²","Pekerjaan Pembesian D16 per kg","Pekerjaan Waterproofing per m²","Pekerjaan Tiang Pancang D40 per m'","Pekerjaan Galian Tanah Manual per m³"] },
      { id: "lokasiProyek", label: "Lokasi Proyek", type: "text", placeholder: "Jakarta Selatan", required: true },
      { id: "tahunAnggaran", label: "Tahun Anggaran", type: "text", placeholder: "2025" },
    ],
    buildPrompt: (d) => `Kamu adalah Quantity Surveyor berpengalaman. Buat Analisa Harga Satuan (AHS) sesuai AHSP 2022 / SNI Analisa Harga Satuan untuk:

Item: ${d.itemPekerjaan}
Lokasi: ${d.lokasiProyek}
Tahun: ${d.tahunAnggaran || "2025"}

Format tabel AHS: Kode | Uraian | Satuan | Koefisien | Harga Satuan (Rp) | Jumlah Harga (Rp).
Kelompokkan: Tenaga Kerja, Bahan/Material, Peralatan. Sertakan overhead 10-15% dan profit 10%. Referensikan AHSP 2022 dan HSPK ${d.lokasiProyek}. Harga material dan upah harus realistis tahun ${d.tahunAnggaran || "2025"}.`,
  },

  {
    id: "cashflow-proyek",
    name: "Template Cash Flow Proyek",
    description: "Proyeksikan cash flow proyek konstruksi berdasarkan S-Curve dan jadwal pembayaran termin.",
    category: "estimasi", categoryIcon: "💰", icon: "📉",
    tier: "pro",
    estimatedTime: "~20 detik",
    agentId: "pm", outputLabel: "Proyeksi Cash Flow",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung A", required: true },
      { id: "nilaiKontrak", label: "Nilai Kontrak (Rp)", type: "text", placeholder: "Rp 25.000.000.000", required: true },
      { id: "durasi", label: "Durasi Kontrak (bulan)", type: "number", placeholder: "18", required: true },
      { id: "jadwalTermin", label: "Jadwal Termin Pembayaran", type: "textarea", placeholder: "Uang Muka 20% di awal, Termin per 25% progress, Retensi 5%...", rows: 3, required: true },
      { id: "distribusiPekerjaan", label: "Distribusi Pekerjaan", type: "select", options: ["S-Curve Normal (lambat-cepat-lambat)","Front Loaded (berat di awal)","Back Loaded (berat di akhir)","Linear (merata)"] },
    ],
    buildPrompt: (d) => `Kamu adalah Quantity Surveyor dan PM senior. Buat proyeksi cash flow untuk:

Proyek: ${d.namaProyek}
Nilai: ${d.nilaiKontrak}
Durasi: ${d.durasi} bulan
Termin: ${d.jadwalTermin}
Distribusi: ${d.distribusiPekerjaan || "S-Curve Normal"}

Sajikan: (1) Tabel cash flow per bulan: planned value (PV), pembayaran masuk, cash out (biaya proyek ~75-80% nilai kontrak), net cash flow, dan cumulative. (2) Identifikasi bulan dengan cash flow negatif (kebutuhan modal kerja). (3) Rekomendasi manajemen cash flow. Format tabel lengkap dan analisa ringkas.`,
  },

  {
    id: "volume-beton",
    name: "Kalkulator Volume & Material Beton",
    description: "Hitung volume beton, kebutuhan semen, pasir, kerikil, dan air untuk berbagai elemen struktur.",
    category: "estimasi", categoryIcon: "💰", icon: "🧱",
    tier: "free", isNew: true,
    estimatedTime: "~10 detik",
    agentId: "rab", outputLabel: "Perhitungan Volume & Material",
    fields: [
      { id: "elemenStruktur", label: "Elemen Struktur", type: "select", required: true, options: ["Kolom Beton","Balok Beton","Pelat Lantai","Dinding Beton","Tangga Beton","Fondasi Footplate","Fondasi Cakar Ayam","Pile Cap"] },
      { id: "dimensi", label: "Dimensi Elemen", type: "textarea", placeholder: "Contoh Kolom: 50×50 cm, tinggi 4m, jumlah 24 buah\nContoh Balok: 30×60 cm, panjang total 180m", rows: 3, required: true },
      { id: "mutuBeton", label: "Mutu Beton", type: "select", required: true, options: ["fc'=17 MPa (K-200)","fc'=21 MPa (K-250)","fc'=25 MPa (K-300)","fc'=28 MPa (K-350)","fc'=35 MPa (K-400)"] },
    ],
    buildPrompt: (d) => `Kamu adalah Quantity Surveyor. Hitung volume dan kebutuhan material beton untuk:

Elemen: ${d.elemenStruktur}
Dimensi: ${d.dimensi}
Mutu: ${d.mutuBeton}

Hitung: (1) Volume beton total (m³), (2) Kebutuhan material per m³ sesuai SNI Analisa: semen (zak 50kg), pasir (m³), kerikil (m³), air (liter), (3) Total kebutuhan material, (4) Kebutuhan ready mix (jika dipesan jadi), (5) Estimasi harga material (harga Jakarta 2025). Sertakan waste factor 5% untuk beton. Tabel lengkap dan ringkas.`,
  },

  /* ══ TEKNIS & SIPIL ══════════════════════════════ */
  {
    id: "qc-beton",
    name: "Checklist QC Pekerjaan Beton",
    description: "Dapatkan checklist quality control beton bertulang yang komprehensif sesuai standar SNI.",
    category: "teknis", categoryIcon: "🏛️", icon: "🔍",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "struktur", outputLabel: "Checklist QC Beton",
    fields: [
      { id: "tahapan", label: "Tahapan Pekerjaan", type: "select", required: true, options: ["Pra-Pengecoran (sebelum cor)","Saat Pengecoran","Pasca-Pengecoran & Curing","Pembesian/Tulangan","Bekisting & Perancah","Penerimaan Ready Mix"] },
      { id: "elemenStruktur", label: "Elemen Struktur", type: "select", required: true, options: ["Kolom","Balok","Pelat Lantai","Dinding Geser (Shear Wall)","Fondasi","Tangga","Semua Elemen"] },
      { id: "mutuBeton", label: "Mutu Beton", type: "text", placeholder: "fc'=25 MPa" },
    ],
    buildPrompt: (d) => `Kamu adalah Quality Engineer konstruksi berpengalaman. Buat checklist QC pekerjaan beton bertulang sesuai SNI 2847:2019 untuk:

Tahapan: ${d.tahapan}
Elemen: ${d.elemenStruktur}
Mutu Beton: ${d.mutuBeton || "fc'=25 MPa"}

Checklist harus mencakup semua item kritikal dengan: No | Item Pemeriksaan | Metode Verifikasi | Toleransi (sesuai SNI) | PIC | Status (OK/NG/N/A) | Catatan. Sertakan referensi SNI 2847:2019 pada item relevan. Minimum 20 item pemeriksaan. Format siap cetak.`,
    outputHint: "Sesuai standar SNI 2847:2019 dan audit MK",
  },

  {
    id: "metode-konstruksi",
    name: "Metode Pelaksanaan Pekerjaan",
    description: "Susun metode pelaksanaan (method statement) teknis untuk pekerjaan konstruksi tertentu.",
    category: "teknis", categoryIcon: "🏛️", icon: "📐",
    tier: "pro", isNew: true,
    estimatedTime: "~25 detik",
    agentId: "struktur", outputLabel: "Metode Pelaksanaan",
    fields: [
      { id: "jenisPekerjaan", label: "Jenis Pekerjaan", type: "select", required: true, options: ["Pemancangan Tiang (Hydraulic Jack-In)","Pengecoran Beton Masif (Mass Concrete)","Erection Baja Struktural","Pemasangan Precast Girder","Pekerjaan Galian Dalam (Deep Excavation)","Grouting & Micropile","Instalasi Curtain Wall","Pekerjaan Waterproofing Basement"] },
      { id: "kondisiLapangan", label: "Kondisi Lapangan", type: "textarea", placeholder: "Lahan sempit, dekat bangunan eksisting, muka air tanah tinggi...", rows: 3 },
      { id: "peralatan", label: "Peralatan yang Tersedia", type: "textarea", placeholder: "2 unit hydraulic hammer, 1 crawler crane 50 ton...", rows: 2 },
    ],
    buildPrompt: (d) => `Kamu adalah Site Manager dan Engineer konstruksi senior. Buat Method Statement (Metode Pelaksanaan) untuk:

Pekerjaan: ${d.jenisPekerjaan}
Kondisi: ${d.kondisiLapangan || "standar"}
Peralatan: ${d.peralatan || "sesuai kebutuhan"}

Metode harus mencakup: (1) Ruang Lingkup, (2) Referensi Standar (SNI terkait), (3) Personil & Peralatan, (4) Urutan Pekerjaan Step-by-Step, (5) Quality Control & Testing, (6) Aspek K3 & Mitigasi Risiko, (7) Gambar Skema/Diagram Alur (dalam teks), (8) Dokumentasi yang Diperlukan. Bahasa Indonesia teknis dan komprehensif.`,
  },

  {
    id: "interpretasi-spt",
    name: "Interpretasi Data SPT",
    description: "Analisa data SPT (Standard Penetration Test) dan dapatkan rekomendasi fondasi yang tepat.",
    category: "teknis", categoryIcon: "🏛️", icon: "⛏️",
    tier: "free", isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "geoteknik", outputLabel: "Interpretasi SPT & Rekomendasi Fondasi",
    fields: [
      { id: "dataSPT", label: "Data SPT (N-value per kedalaman)", type: "textarea", placeholder: "1m: N=4\n3m: N=6\n5m: N=8\n7m: N=12\n9m: N=18\n11m: N=28\n13m: N=45\n15m: N=50(refusal)", rows: 6, required: true, hint: "Masukkan data borehole: kedalaman (m): N-value" },
      { id: "jenisProyek", label: "Beban Bangunan", type: "select", required: true, options: ["Rumah Tinggal 1-2 Lantai","Ruko 3-4 Lantai","Gedung 5-8 Lantai","Gedung >8 Lantai","Infrastruktur Jalan/Jembatan","Gudang/Warehouse Besar"] },
      { id: "mukaAirTanah", label: "Kedalaman Muka Air Tanah (m)", type: "number", placeholder: "2.5" },
      { id: "kondisiTanah", label: "Deskripsi Visual Tanah (opsional)", type: "textarea", placeholder: "0-3m lempung lunak abu-abu, 3-10m lanau berpasir, >10m pasir kerikil...", rows: 3 },
    ],
    buildPrompt: (d) => `Kamu adalah Dr. Rini Wulandari, konsultan geoteknik berpengalaman. Analisis data berikut sesuai SNI 8460:2017 dan ASTM D1586:

Data SPT:
${d.dataSPT}

Beban: ${d.jenisProyek}
Muka Air Tanah: ${d.mukaAirTanah ? d.mukaAirTanah + " m" : "tidak diketahui"}
Deskripsi Tanah: ${d.kondisiTanah || "berdasarkan N-value"}

Analisa: (1) Klasifikasi profil tanah per layer berdasarkan N-value (USCS), (2) Identifikasi lapisan pendukung (bearing layer), (3) Perkiraan daya dukung tanah (qa dan qult), (4) Rekomendasi jenis fondasi (dengan justifikasi), (5) Estimasi kedalaman fondasi yang disarankan, (6) Potensi penurunan (settlement) dan rekomendasi mitigasi, (7) Catatan risiko (liquefaction, stability, dll). Bahasa teknis formal.`,
    outputHint: "Untuk desain final, diperlukan analisa geoteknik lengkap oleh insinyur berlisensi",
  },

  /* ══ KONTRAK & LEGAL ══════════════════════════════ */
  {
    id: "klaim-keterlambatan",
    name: "Draft Klaim Keterlambatan",
    description: "Susun klaim keterlambatan (delay claim) yang terstruktur dan mengacu FIDIC / kontrak SPK.",
    category: "kontrak", categoryIcon: "⚖️", icon: "⚖️",
    tier: "free",
    estimatedTime: "~25 detik",
    agentId: "kontrak", outputLabel: "Draft Klaim Keterlambatan",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung Kantor 8 Lantai", required: true },
      { id: "jenisKontrak", label: "Jenis Kontrak", type: "select", required: true, options: ["FIDIC Red Book 1999","FIDIC Silver Book 1999","SPK Pemerintah (Perpres 16/2018)","Kontrak Swasta / Lump Sum","JCT Contract"] },
      { id: "durasiTerlambat", label: "Durasi Keterlambatan (hari)", type: "number", placeholder: "45", required: true },
      { id: "penyebab", label: "Penyebab Keterlambatan", type: "select", required: true, options: ["Force Majeure","Change Order/Variation","Employer Delay (keterlambatan pembayaran)","Late Instruction from Engineer","Site Conditions Differ from Contract","Concurrent Delay","Weather (di luar normal)"] },
      { id: "kronologi", label: "Kronologi & Fakta Pendukung", type: "textarea", placeholder: "15 Jan 2025: Surat pengajuan VO dikirim. 30 Jan: Belum ada respons. 15 Feb: Pekerjaan VO dimulai tanpa persetujuan untuk mencegah proyek berhenti total...", rows: 5, required: true },
      { id: "dokumenPendukung", label: "Dokumen Pendukung yang Ada", type: "textarea", placeholder: "Site diary, daily report, foto lapangan, surat korespondensi...", rows: 2 },
    ],
    buildPrompt: (d) => `Kamu adalah konsultan klaim konstruksi senior. Buat draft klaim keterlambatan berdasarkan:

Proyek: ${d.namaProyek}
Kontrak: ${d.jenisKontrak}
Durasi Terlambat: ${d.durasiTerlambat} hari
Penyebab: ${d.penyebab}
Kronologi: ${d.kronologi}
Dokumen: ${d.dokumenPendukung || "sesuai standar"}

Draft mencakup: (1) Executive Summary klaim, (2) Dasar Kontrak (pasal yang relevan dari ${d.jenisKontrak}), (3) Kronologi Lengkap (timeline events), (4) Analisa Kausalitas (penyebab vs dampak pada jadwal), (5) Perhitungan Extension of Time (EOT) yang diklaim, (6) Daftar Dokumen Pendukung, (7) Permintaan Relief (EOT + potential costs), (8) Tanggal batas notifikasi sesuai kontrak. Bahasa formal dan persuasif.`,
    outputHint: "Konsultasikan dengan pengacara untuk klaim senilai besar",
  },

  {
    id: "checklist-kontrak",
    name: "Review Checklist Kontrak",
    description: "Checklist komprehensif untuk review kontrak konstruksi sebelum ditandatangani.",
    category: "kontrak", categoryIcon: "⚖️", icon: "📋",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "kontrak", outputLabel: "Checklist Review Kontrak",
    fields: [
      { id: "jenisKontrak", label: "Jenis Kontrak", type: "select", required: true, options: ["Kontrak Lump Sum","Kontrak Unit Price","Kontrak Gabungan","Kontrak Terima Jadi (EPC/Turnkey)","Kontrak Jasa Konsultan","Kontrak Subkontraktor"] },
      { id: "posisi", label: "Posisi Anda dalam Kontrak", type: "select", required: true, options: ["Kontraktor (menerima pekerjaan)","Owner/Employer (memberi pekerjaan)","Subkontraktor","Konsultan"] },
      { id: "nilaiKontrak", label: "Nilai Kontrak", type: "text", placeholder: "Rp 15 miliar" },
    ],
    buildPrompt: (d) => `Kamu adalah konsultan hukum konstruksi. Buat checklist review kontrak komprehensif untuk:

Jenis: ${d.jenisKontrak}
Posisi: ${d.posisi}
Nilai: ${d.nilaiKontrak || "tidak disebutkan"}

Checklist harus mencakup: Identifikasi para pihak, Lingkup pekerjaan (kejelasan scope), Harga dan pembayaran (termin, retensi, eskalasi), Jadwal dan milestone, Klaim dan variation order, Force majeure, Pengakhiran kontrak, Penyelesaian sengketa, Jaminan (performance bond, uang muka), Asuransi, Garansi pemeliharaan, Intellectual property, Pajak. Setiap item: Poin yang Diperiksa | Risiko Jika Tidak Ada | Rekomendasi. Perspektif dari posisi ${d.posisi}.`,
  },

  /* ══ MEP ══════════════════════════════════════════ */
  {
    id: "estimasi-daya-listrik",
    name: "Estimasi Kebutuhan Daya Listrik",
    description: "Hitung estimasi kebutuhan daya listrik gedung berdasarkan luas dan fungsi ruang.",
    category: "mep", categoryIcon: "⚡", icon: "⚡",
    tier: "free", isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "mep", outputLabel: "Estimasi Kebutuhan Daya",
    fields: [
      { id: "jenisGedung", label: "Fungsi Gedung", type: "select", required: true, options: ["Perkantoran","Pusat Perbelanjaan/Mall","Hotel","Rumah Sakit","Sekolah/Universitas","Apartemen Hunian","Gudang/Industri Ringan","Fasilitas Olahraga","Data Center","Restoran/F&B"] },
      { id: "luasTotal", label: "Luas Total Bangunan (m²)", type: "number", placeholder: "5000", required: true },
      { id: "jumlahLantai", label: "Jumlah Lantai", type: "number", placeholder: "8", required: true },
      { id: "fasilitasKhusus", label: "Fasilitas Khusus", type: "textarea", placeholder: "Lift 3 unit, chillers, genset backup, UPS, CCTV 64 kamera...", rows: 3 },
    ],
    buildPrompt: (d) => `Kamu adalah MEP Engineer senior. Hitung estimasi kebutuhan daya listrik sesuai PUIL 2011 untuk:

Fungsi: ${d.jenisGedung}
Luas: ${d.luasTotal} m²
Lantai: ${d.jumlahLantai} lantai
Fasilitas Khusus: ${d.fasilitasKhusus || "standar"}

Hitung: (1) Beban instalasi penerangan (watt/m² sesuai SNI), (2) Beban stop kontak dan peralatan, (3) Beban sistem AC/HVAC, (4) Beban lift dan eskalator (jika ada), (5) Beban fasilitas khusus, (6) Total beban terpasang, (7) Demand factor dan kebutuhan daya aktual, (8) Rekomendasi daya PLN yang diminta (kVA) dan ukuran trafo, (9) Kebutuhan genset backup (%). Format tabel per kategori. Referensi PUIL 2011.`,
    outputHint: "Konsultasikan dengan PLN setempat untuk layanan daya",
  },

  {
    id: "spesifikasi-ac",
    name: "Spesifikasi Sistem AC/HVAC",
    description: "Tentukan kapasitas dan spesifikasi sistem pendingin udara berdasarkan parameter ruang.",
    category: "mep", categoryIcon: "⚡", icon: "❄️",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "mep", outputLabel: "Spesifikasi AC/HVAC",
    fields: [
      { id: "fungsiRuang", label: "Fungsi Ruang", type: "select", required: true, options: ["Kantor Open Plan","Ruang Meeting","Server Room/Data Center","Showroom","Restoran","Kamar Hotel","Ruang Kelas","Lobby/Atrium","Rumah Sakit (ICU/OR)"] },
      { id: "luasRuang", label: "Luas Ruang (m²)", type: "number", placeholder: "200", required: true },
      { id: "tinggiRuang", label: "Tinggi Plafon (m)", type: "number", placeholder: "3.2" },
      { id: "jumlahOrang", label: "Jumlah Orang dalam Ruang", type: "number", placeholder: "40" },
      { id: "peralatanPanas", label: "Peralatan yang Mengeluarkan Panas", type: "textarea", placeholder: "20 komputer, 5 server, 2 mesin fotokopi, proyektor...", rows: 2 },
      { id: "orientasi", label: "Orientasi Gedung", type: "select", options: ["Utara-Selatan (sedikit paparan matahari)","Timur-Barat (banyak paparan matahari)","Tidak Diketahui"] },
    ],
    buildPrompt: (d) => `Kamu adalah MEP Engineer HVAC specialist. Hitung cooling load dan tentukan spesifikasi AC sesuai SNI 6572:2001 dan ASHRAE 62.1 untuk:

Fungsi: ${d.fungsiRuang}
Luas: ${d.luasRuang} m²
Tinggi Plafon: ${d.tinggiRuang || "3"} m
Jumlah Orang: ${d.jumlahOrang || "estimasi"}
Peralatan: ${d.peralatanPanas || "standar kantor"}
Orientasi: ${d.orientasi || "tidak diketahui"}

Hitung: (1) Cooling load dari masing-masing sumber (manusia, peralatan, infiltrasi, transmisi atap/dinding, radiasi matahari), (2) Total cooling load (watt dan BTU/h dan TR), (3) Rekomendasi kapasitas AC (dengan safety factor 10%), (4) Jenis sistem AC yang sesuai (split, cassette, AHU, VRV/VRF), (5) Spesifikasi teknis minimum, (6) Jumlah unit yang disarankan, (7) Fresh air requirement (ASHRAE 62.1). Tabel lengkap.`,
  },

  {
    id: "checklist-commissioning",
    name: "Checklist Commissioning MEP",
    description: "Generate checklist testing & commissioning sistem MEP sebelum serah terima ke owner.",
    category: "mep", categoryIcon: "⚡", icon: "🔧",
    tier: "pro", isNew: true,
    estimatedTime: "~20 detik",
    agentId: "mep", outputLabel: "Checklist Commissioning",
    fields: [
      { id: "sistemMEP", label: "Sistem MEP", type: "select", required: true, options: ["Sistem Listrik (MV/LV)","Sistem HVAC/AC Sentral","Sistem Plumbing & Sanitary","Sistem Fire Fighting (Sprinkler & Hidran)","Sistem Fire Alarm","Sistem Lift & Escalator","Sistem CCTV & BMS","Semua Sistem MEP"] },
      { id: "jenisGedung", label: "Jenis & Skala Gedung", type: "text", placeholder: "Gedung perkantoran 12 lantai, 15.000 m²", required: true },
    ],
    buildPrompt: (d) => `Kamu adalah MEP Commissioning Engineer. Buat checklist commissioning ${d.sistemMEP} untuk:

Gedung: ${d.jenisGedung}

Checklist mencakup: Pre-commissioning (visual check, continuity test), Functional test per alat, System integration test, Performance test (capacity, pressure, temperature), Safety test, dan dokumentasi hasil. Format tabel: No | Item Test | Parameter | Standar/Toleransi | Hasil Test | Status | Catatan | Tanggal | Insinyur. Referensikan standar PUIL 2011, SNI, dan NFPA untuk sistem terkait. Minimum 25 item.`,
  },

  /* ══ BIM & DIGITAL ════════════════════════════════ */
  {
    id: "bep-generator",
    name: "Generator BEP (BIM Execution Plan)",
    description: "Buat BIM Execution Plan ringkas dan profesional sesuai standar ISO 19650.",
    category: "bim", categoryIcon: "🖥️", icon: "🖥️",
    tier: "pro", isPopular: true,
    estimatedTime: "~25 detik",
    agentId: "bim", outputLabel: "BIM Execution Plan (BEP)",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Gedung Kantor PT Maju Tbk", required: true },
      { id: "nilaiProyek", label: "Nilai Proyek", type: "text", placeholder: "Rp 80 miliar" },
      { id: "tahapan", label: "Tahap Proyek", type: "select", required: true, options: ["SD/DD (Skematik/Pengembangan Desain)","CD (Construction Document)","Konstruksi (Construction Phase)","O&M (Operasi & Pemeliharaan)","Full BIM (SD hingga O&M)"] },
      { id: "software", label: "Software BIM yang Digunakan", type: "textarea", placeholder: "Revit Architecture, Revit Structure, Revit MEP, Navisworks Manage...", rows: 2, required: true },
      { id: "tim", label: "Tim Proyek", type: "textarea", placeholder: "Arsitek: PT Design X, Struktur: PT Sipil Y, MEP: PT MEP Z, Kontraktor: PT Bangun A...", rows: 2 },
    ],
    buildPrompt: (d) => `Kamu adalah BIM Manager berpengalaman. Buat BIM Execution Plan (BEP) sesuai ISO 19650 untuk:

Proyek: ${d.namaProyek}
Nilai: ${d.nilaiProyek || "tidak disebutkan"}
Tahap: ${d.tahapan}
Software: ${d.software}
Tim: ${d.tim || "multidisiplin"}

BEP mencakup: (1) Project Information, (2) BIM Goals & Uses, (3) Roles & Responsibilities (RACI matrix), (4) LOD Matrix per tahap & disiplin, (5) File Naming Convention, (6) CDE (Common Data Environment) yang digunakan, (7) Model Coordination Process (clash detection schedule), (8) Deliverables & Milestones, (9) Quality Control, (10) IFC & Data Exchange Protocol. Format profesional siap submit ke owner. Bahasa Indonesia formal.`,
    outputHint: "Sesuai Permen PUPR 22/2018 dan ISO 19650",
  },

  {
    id: "lod-matrix",
    name: "LOD Matrix per Disiplin",
    description: "Generate Level of Development (LOD) matrix untuk semua disiplin BIM per tahap desain.",
    category: "bim", categoryIcon: "🖥️", icon: "📊",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "bim", outputLabel: "LOD Matrix",
    fields: [
      { id: "jenisProyek", label: "Jenis Proyek", type: "select", required: true, options: ["Gedung Bertingkat","Infrastruktur (Jalan/Jembatan)","Fasilitas Industri","Mixed-Use Development"] },
      { id: "disiplin", label: "Disiplin BIM", type: "select", required: true, options: ["Arsitektur saja","Struktur saja","MEP saja","Arsitektur + Struktur + MEP (Lengkap)"] },
      { id: "tahapAkhir", label: "Tahap BIM Tertinggi", type: "select", required: true, options: ["SD (Schematic Design)","DD (Design Development)","CD (Construction Documents)","Konstruksi (As-Built)","O&M (Operasi & Pemeliharaan)"] },
    ],
    buildPrompt: (d) => `Kamu adalah BIM Manager. Buat LOD Matrix untuk:

Proyek: ${d.jenisProyek}
Disiplin: ${d.disiplin}
Tahap Akhir: ${d.tahapAkhir}

Buat tabel matrix: Elemen Bangunan | LOD per Tahap (SD/DD/CD/Konstruksi/O&M). Untuk setiap sel LOD sebutkan angka (100/200/300/350/400/500) dan deskripsi singkat isi model. Kelompokkan elemen per sistem (Arsitektur: lantai, dinding, atap, pintu, jendela; Struktur: kolom, balok, pelat, fondasi; MEP: ducting, kabel, pipa, fixture). Referensikan BIMForum LOD Spec 2021 dan ISO 19650.`,
  },

  {
    id: "clash-checklist",
    name: "Checklist Clash Detection",
    description: "Template checklist koordinasi clash detection multi-disiplin BIM yang komprehensif.",
    category: "bim", categoryIcon: "🖥️", icon: "🔧",
    tier: "free",
    estimatedTime: "~15 detik",
    agentId: "bim", outputLabel: "Checklist Clash Detection",
    fields: [
      { id: "disiplinTerlibat", label: "Disiplin yang Terlibat", type: "select", required: true, options: ["Struktur vs MEP","Arsitektur vs Struktur","Arsitektur vs MEP","Semua Disiplin (ARK + STR + MEP)"] },
      { id: "software", label: "Software Clash Detection", type: "select", required: true, options: ["Autodesk Navisworks Manage","BIM 360 / ACC","Solibri Model Checker","Revit Interference Check","Lainnya"] },
      { id: "jenisGedung", label: "Jenis Gedung", type: "text", placeholder: "Gedung perkantoran 10 lantai" },
    ],
    buildPrompt: (d) => `Kamu adalah BIM Coordinator. Buat checklist clash detection komprehensif untuk:

Disiplin: ${d.disiplinTerlibat}
Software: ${d.software}
Gedung: ${d.jenisGedung || "gedung bertingkat"}

Checklist mencakup: (1) Pre-Clash Setup (toleransi jarak, rule set), (2) Tabel prioritas clash per tipe (Hard Clash, Soft Clash, Duplicate Clash), (3) Daftar clash yang paling umum ditemukan per pasangan disiplin, (4) Workflow penyelesaian clash (clash owner, deadline, verifikasi), (5) Format laporan clash report, (6) BCF workflow (jika digunakan). Format tabel siap digunakan di koordinasi BIM meeting. Referensi ISO 19650.`,
  },
  /* ══ NOTIS-INSPIRED: CATATAN → DOKUMEN ══════════════════════════════ */
  {
    id: "notulen-dari-teks",
    name: "Notulen Rapat dari Teks Mentah",
    description: "Paste teks catatan rapat yang tidak terstruktur — AI langsung ekstrak keputusan, action items, PIC, dan deadline.",
    longDesc: "Terinspirasi dari notis.ai: ubah catatan rapat yang berantakan menjadi notulen profesional siap distribusi dalam hitungan detik.",
    category: "dokumen", categoryIcon: "📄", icon: "🎙️",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Notulen Rapat Terstruktur",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Proyek Gedung Kantor PT Maju", required: true },
      { id: "tanggalRapat", label: "Tanggal & Waktu Rapat", type: "text", placeholder: "Senin, 7 April 2025 — 10:00 WIB" },
      { id: "teksRapat", label: "Tempel Catatan Rapat (teks bebas / voice-to-text)", type: "textarea", rows: 10, required: true,
        placeholder: `Contoh (paste teks bebas dari rekaman/catatan):
"jadi progress minggu ini kita udah 62 persen, harusnya 65, ada delay 3 hari di pekerjaan bekisting lt4 karena material kayu telat dateng. pak budi bilang supplier perlu dikonfirmasi ulang. rencananya rabu mau cor balok lt5. terus ada masalah di gambar, arsitek belum kirim revisi shop drawing. hendra minta deadline gambar paling lambat jumat. soal K3 pak slamet lapor ada 2 worker yang gak pake harness kemarin, perlu tindak lanjut..."`,
        hint: "Bisa langsung dari voice-to-text, WhatsApp, atau catatan coret-coretan — AI akan merapikannya" },
      { id: "peserta", label: "Peserta Rapat (opsional)", type: "text", placeholder: "PM, Site Manager, MK, Subkon Sipil" },
      { id: "jenisRapat", label: "Jenis Rapat", type: "select", options: ["Rapat Koordinasi Mingguan","Rapat Progress","Rapat Teknis","Rapat K3","Rapat Keuangan","Rapat Lainnya"] },
    ],
    buildPrompt: (d) => `Kamu adalah sekretaris proyek konstruksi yang ahli. Ubah catatan rapat berantakan berikut menjadi notulen rapat profesional.

Proyek: ${d.namaProyek}
Tanggal: ${d.tanggalRapat || "tidak disebutkan"}
Jenis: ${d.jenisRapat || "Rapat Proyek"}
Peserta: ${d.peserta || "tidak disebutkan"}

CATATAN MENTAH:
${d.teksRapat}

Hasilkan notulen dalam format berikut:

## NOTULEN RAPAT — ${d.namaProyek}
**Tanggal:** [tanggal]  **Jenis:** [jenis]  **Peserta:** [peserta]

### Ringkasan Eksekutif
(2-3 kalimat inti rapat)

### Poin-Poin Pembahasan
(buat daftar terstruktur per topik)

### Keputusan yang Diambil
(bullet list keputusan yang jelas dan konkret)

### Action Items
| No | Aktivitas | PIC | Deadline | Prioritas |
|-----|-----------|-----|----------|-----------|
(ekstrak semua tindak lanjut dengan PIC dan deadline — jika tidak disebutkan beri estimasi wajar)

### Isu & Risiko yang Perlu Diperhatikan
(hal-hal yang perlu dipantau lanjut)

Bahasa Indonesia formal dan ringkas.`,
    outputHint: "Siap dibagikan via email/WhatsApp — pastikan verifikasi nama PIC dan deadline",
  },

  {
    id: "site-diary",
    name: "Site Diary Harian Otomatis",
    description: "Input catatan lapangan cepat — AI format menjadi site diary proyek yang profesional dan terdokumentasi.",
    longDesc: "Catat kondisi lapangan dalam bahasa bebas, AI mengubahnya menjadi site diary resmi lengkap dengan cuaca, pekerjaan, tenaga kerja, dan catatan insiden.",
    category: "dokumen", categoryIcon: "📄", icon: "📔",
    tier: "free", isNew: true,
    estimatedTime: "~12 detik",
    agentId: "pm", outputLabel: "Site Diary Harian",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Gedung Kantor 8 Lantai", required: true },
      { id: "tanggal", label: "Tanggal", type: "text", placeholder: "7 April 2025", required: true },
      { id: "cuaca", label: "Kondisi Cuaca", type: "select", required: true, options: ["Cerah sepanjang hari","Cerah pagi, hujan sore","Hujan sepanjang hari","Mendung (tidak hujan)","Panas terik"] },
      { id: "catatanLapangan", label: "Catatan Lapangan Hari Ini (teks bebas)", type: "textarea", rows: 8, required: true,
        placeholder: `Contoh catatan bebas:
"cor balok lt5 grid A-C selesai jam 2 siang, 48m3 readymix. tenaga kerja tukang bata 24 orang, tukang besi 16, helper 30. ada 1 pekerja kena luka ringan di tangan kena besi, sudah P3K. pengiriman kayu bekisting dari PT Kayu Jaya 15m3 diterima jam 10. mandor slamet bilang besok rencana pasang tulangan kolom lt5 grid D-F. ada tamu dari owner jam 3 sore inspeksi, hasilnya ok.",
`,
        hint: "Tulis bebas seperti WhatsApp — AI akan merapikan menjadi site diary resmi" },
      { id: "jumlahPekerja", label: "Total Pekerja Hari Ini", type: "number", placeholder: "75" },
      { id: "alat", label: "Alat Berat Beroperasi", type: "text", placeholder: "Tower crane 1 unit, concrete pump 1 unit, vibrator 3 unit" },
    ],
    buildPrompt: (d) => `Kamu adalah Site Manager proyek konstruksi. Ubah catatan lapangan berikut menjadi Site Diary resmi.

Proyek: ${d.namaProyek}
Tanggal: ${d.tanggal}
Cuaca: ${d.cuaca}
Total Pekerja: ${d.jumlahPekerja || "lihat dari catatan"} orang
Alat Berat: ${d.alat || "lihat dari catatan"}

CATATAN LAPANGAN:
${d.catatanLapangan}

Format Site Diary resmi:

## SITE DIARY — ${d.namaProyek}
**Tanggal:** ${d.tanggal} | **Cuaca:** ${d.cuaca} | **Halaman:** ___

### Kondisi Umum Lapangan
(ringkasan situasi hari ini)

### Pekerjaan yang Dilaksanakan
| No | Uraian Pekerjaan | Lokasi/Zona | Volume | Satuan | Keterangan |
|----|------------------|-------------|--------|--------|------------|

### Sumber Daya
**Tenaga Kerja:**
| Jabatan | Jumlah |
|---------|--------|

**Peralatan:**
| Alat | Jumlah | Kondisi |
|------|--------|---------|

**Material Diterima:**
| Material | Volume | Supplier |
|----------|--------|---------|

### Insiden & K3
(catat setiap insiden keselamatan, meski minor)

### Kunjungan Tamu / Inspeksi
(catat siapa yang datang dan hasilnya)

### Kendala & Catatan Penting
(masalah yang perlu tindak lanjut)

### Rencana Kegiatan Esok Hari
(berdasarkan catatan)

**Dibuat oleh:** Site Manager | **Tanggal:** ${d.tanggal}

Bahasa Indonesia formal dan presisi. Jika ada informasi tidak disebutkan, beri nilai "-".`,
    outputHint: "Simpan site diary setiap hari — dokumen krusial untuk klaim dan audit",
  },

  {
    id: "daily-report-generator",
    name: "Daily Report Proyek (AI Digest)",
    description: "Masukkan poin-poin progres harian, AI langsung susun daily report eksekutif yang siap kirim ke owner.",
    longDesc: "Seperti daily digest notis.ai — ringkas semua aktivitas, masalah, dan rencana hari ini menjadi laporan eksekutif 1 halaman yang profesional.",
    category: "pm", categoryIcon: "📊", icon: "📨",
    tier: "free", isNew: true,
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Daily Report Eksekutif",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Pembangunan Gedung Kantor PT XYZ", required: true },
      { id: "tanggal", label: "Tanggal Laporan", type: "text", placeholder: "Senin, 7 April 2025", required: true },
      { id: "progressKumulatif", label: "Progress Kumulatif s.d. Hari Ini (%)", type: "number", placeholder: "63" },
      { id: "progressRencana", label: "Progress Rencana s.d. Hari Ini (%)", type: "number", placeholder: "65" },
      { id: "kegiatanHariIni", label: "Kegiatan yang Dikerjakan Hari Ini", type: "textarea", rows: 4, required: true,
        placeholder: "Cor balok lt5 48m3, pasang bekisting kolom lt5 grid A-C, pengiriman besi D19..." },
      { id: "kendalaHariIni", label: "Kendala / Masalah", type: "textarea", rows: 3,
        placeholder: "Ready mix terlambat 2 jam, 1 pekerja sakit, cuaca hujan jam 15.00..." },
      { id: "rencanaBesok", label: "Rencana Kegiatan Besok", type: "textarea", rows: 3,
        placeholder: "Pasang tulangan kolom lt5, lanjut bekisting balok lt5, pengecatan lt2..." },
      { id: "catatanPenting", label: "Catatan Penting / Isu Mendesak", type: "textarea", rows: 2,
        placeholder: "Owner akan inspeksi Rabu, perlu koordinasi clean-up area lt3..." },
    ],
    buildPrompt: (d) => {
      const deviasi = d.progressKumulatif && d.progressRencana
        ? `${(Number(d.progressKumulatif) - Number(d.progressRencana)).toFixed(1)}%`
        : "N/A";
      const status = d.progressKumulatif && d.progressRencana
        ? Number(d.progressKumulatif) >= Number(d.progressRencana) ? "ON TRACK ✅" : "BEHIND SCHEDULE ⚠️"
        : "";
      return `Kamu adalah Manajer Proyek konstruksi senior. Susun Daily Report eksekutif ringkas (1 halaman) untuk dikirim ke owner/direksi.

Proyek: ${d.namaProyek}
Tanggal: ${d.tanggal}
Progress Aktual: ${d.progressKumulatif || "N/A"}% | Rencana: ${d.progressRencana || "N/A"}% | Deviasi: ${deviasi} | Status: ${status}

Kegiatan Hari Ini:
${d.kegiatanHariIni}

Kendala:
${d.kendalaHariIni || "Tidak ada kendala berarti"}

Rencana Besok:
${d.rencanaBesok || "Akan ditentukan"}

Catatan Penting:
${d.catatanPenting || "-"}

Format Daily Report yang ringkas dan profesional:

## DAILY REPORT — ${d.namaProyek}
**Tanggal:** ${d.tanggal}

### Status Progress
(tabel mini: rencana vs aktual vs deviasi, status keseluruhan)

### Kegiatan Hari Ini
(bullet list ringkas per pekerjaan utama)

### Kendala & Tindak Lanjut
(issue + siapa yang bertanggung jawab menyelesaikan + kapan)

### Rencana Besok
(bullet list singkat)

### Isu Penting untuk Perhatian Manajemen
(highlight jika ada hal mendesak yang perlu keputusan owner/direksi)

---
*Laporan disiapkan oleh: Tim Proyek | ${d.tanggal}*

Bahasa Indonesia profesional, ringkas, langsung ke poin. Maksimal 1 halaman A4.`;
    },
    outputHint: "Kirim daily report ke WhatsApp group owner/direksi setiap sore hari",
  },

  {
    id: "voice-to-instruksi",
    name: "Catatan Suara → Instruksi Lapangan",
    description: "Paste voice-to-text atau catatan bebas dari lapangan — AI ubah jadi instruksi kerja tertulis yang jelas.",
    longDesc: "Supervisor lapangan bicara, AI merapikan jadi instruksi kerja tertulis yang tidak ambigu untuk subkontraktor dan mandor.",
    category: "dokumen", categoryIcon: "📄", icon: "🗣️",
    tier: "free", isNew: true,
    estimatedTime: "~10 detik",
    agentId: "pm", outputLabel: "Instruksi Kerja Tertulis",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Proyek Gedung Office Park", required: true },
      { id: "ditujukanKe", label: "Ditujukan Kepada", type: "text", placeholder: "Mandor/Subkontraktor Sipil/Kepala Tukang Besi", required: true },
      { id: "catatanSuara", label: "Paste Teks Catatan / Voice-to-Text", type: "textarea", rows: 8, required: true,
        placeholder: `Paste langsung dari voice-to-text atau WhatsApp, contoh:
"pak tolong besok pagi sebelum jam 7 tim besi nya udah standby di lt6 ya buat pasang tulangan kolom yang kemarin belum selesai. yang grid D sama E dulu karena jumat mau dicor. jangan lupa bawa las dan kawat ikat yang cukup. kalau ada yang butuh material tambahan langsung lapor ke pak hendra jangan nunggu sampai kehabisan. terus perhatiin juga jarak sengkang nya sesuai gambar, kemarin masih ada yang 25cm harusnya 15cm..."`,
        hint: "Langsung paste dari voice-to-text HP, rekaman WhatsApp, atau catatan coret-coretan" },
      { id: "prioritas", label: "Tingkat Prioritas", type: "select", options: ["Segera (hari ini)","Normal (besok)","Perencanaan (minggu ini)"] },
    ],
    buildPrompt: (d) => `Kamu adalah Site Manager konstruksi yang berpengalaman. Ubah catatan suara/teks bebas berikut menjadi instruksi kerja tertulis yang jelas, tidak ambigu, dan langsung bisa dilaksanakan di lapangan.

Proyek: ${d.namaProyek}
Kepada: ${d.ditujukanKe}
Prioritas: ${d.prioritas || "Normal"}

CATATAN ASLI:
${d.catatanSuara}

Format instruksi kerja:

## INSTRUKSI KERJA
**Proyek:** ${d.namaProyek}  
**Kepada:** ${d.ditujukanKe}  
**Prioritas:** ${d.prioritas || "Normal"}  
**Tanggal:** [tanggal hari ini]  

### Instruksi Pekerjaan:
(ubah menjadi poin-poin instruksi yang jelas, terurut, dan spesifik — tanpa ambigu)
1. ...
2. ...

### Spesifikasi & Standar yang Harus Dipatuhi:
(ekstrak standar teknis atau mutu yang disebutkan)

### Batas Waktu:
(ekstrak deadline yang disebutkan, atau beri estimasi wajar)

### Koordinasi & Pelaporan:
(kepada siapa harus melapor dan kapan)

### Catatan Keselamatan:
(K3 yang relevan dengan pekerjaan ini)

---
Bahasa Indonesia formal dan tegas. Gunakan kalimat perintah aktif yang jelas.`,
    outputHint: "Simpan instruksi ini sebagai bukti tertulis — lebih kuat dari instruksi lisan",
  },

  /* ══ QUEENSCORE-INSPIRED: AI SERBA GUNA KONSTRUKSI ══════════════════ */

  /* ── Teknis & Sipil Tambahan ── */
  {
    id: "desain-campuran-beton",
    name: "Mix Design Beton (SNI)",
    description: "Hitung proporsi campuran beton (mix design) sesuai SNI 03-2834 dari mutu yang diinginkan.",
    category: "teknis", categoryIcon: "🏛️", icon: "🧪",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "struktur", outputLabel: "Mix Design Beton",
    fields: [
      { id: "mutuBeton", label: "Mutu Beton Target", type: "select", required: true, options: ["fc'=17 MPa (K-200)","fc'=20 MPa (K-225)","fc'=21 MPa (K-250)","fc'=25 MPa (K-300)","fc'=28 MPa (K-350)","fc'=30 MPa (K-350+)","fc'=35 MPa (K-400)"] },
      { id: "tipeSemen", label: "Tipe Semen", type: "select", required: true, options: ["Semen Portland Tipe I (OPC)","Semen Portland Composite (PCC)","Semen Portland Pozzolan (PPC)","Semen Portland Tipe II","Semen Portland Tipe V (SR)"] },
      { id: "ukuranKerikil", label: "Ukuran Agregat Kasar Maks.", type: "select", required: true, options: ["10 mm","20 mm","25 mm","40 mm"] },
      { id: "slump", label: "Nilai Slump yang Diinginkan (mm)", type: "select", required: true, options: ["25–50 mm (kaku, pondasi masif)","75–100 mm (normal, kolom/balok)","100–150 mm (mudah, plat tipis)","150–200 mm (sangat mudah, pumping)"] },
      { id: "kondisiLingkungan", label: "Kondisi Lingkungan", type: "select", options: ["Normal (interior)","Moderate (terkena hujan)","Severe (tepi laut)","Very Severe (daerah agresif)"] },
    ],
    buildPrompt: (d) => `Kamu adalah ahli material beton dan quality control konstruksi. Hitung mix design beton sesuai metode SNI 03-2834:2000 untuk:

Mutu Target: ${d.mutuBeton}
Tipe Semen: ${d.tipeSemen}
Agregat Kasar Maks: ${d.ukuranKerikil}
Slump: ${d.slump}
Kondisi Lingkungan: ${d.kondisiLingkungan || "Normal"}

Hitung:
1. **Kuat tekan rata-rata perlu (f'cr)** dengan standar deviasi sesuai SNI
2. **Water-Cement Ratio (W/C)** berdasarkan mutu dan kondisi lingkungan
3. **Kebutuhan air (liter/m³)** berdasarkan slump dan ukuran agregat
4. **Kebutuhan semen (kg/m³)**
5. **Kebutuhan agregat kasar dan halus (kg/m³)**
6. **Koreksi kadar air agregat (asumsi kondisi SSD)**
7. **Tabel proporsi campuran per m³ dan per adukan (0.5 m³, 1 zak semen)**
8. **Estimasi biaya material per m³ (harga Jakarta 2025)**
9. **Quality control: syarat pengujian (slump test, cube test umur 7 dan 28 hari)**

Referensi: SNI 03-2834:2000, SNI 2847:2019. Format tabel lengkap dan profesional.`,
    outputHint: "Lakukan trial mix di lapangan sebelum produksi massal",
  },

  {
    id: "kalkulator-tulangan",
    name: "Kalkulator Kebutuhan Tulangan",
    description: "Hitung kebutuhan besi tulangan (berat dan panjang) untuk elemen struktur berdasarkan gambar.",
    category: "teknis", categoryIcon: "🏛️", icon: "🔩",
    tier: "free", isNew: true,
    estimatedTime: "~12 detik",
    agentId: "struktur", outputLabel: "Kebutuhan Tulangan",
    fields: [
      { id: "elemen", label: "Elemen Struktur", type: "select", required: true, options: ["Kolom Persegi","Kolom Bulat","Balok Beton","Pelat Lantai Dua Arah","Pelat Lantai Satu Arah","Dinding Beton","Tangga Beton","Fondasi Footplate"] },
      { id: "dimensi", label: "Dimensi Elemen", type: "textarea", rows: 3, required: true, placeholder: "Contoh Kolom 50x50: utama 8D19, sengkang D10-150, tinggi 4m, jumlah 20 kolom\nContoh Balok 30x60: utama 4D19 bawah + 2D19 atas, sengkang D10-150, panjang total 120m" },
      { id: "mutubesi", label: "Mutu Besi", type: "select", required: true, options: ["BJTP 24 (fy=240 MPa, polos)","BJTD 32 (fy=320 MPa, ulir)","BJTD 40 (fy=400 MPa, ulir)","BJTD 48 (fy=480 MPa, ulir)"] },
    ],
    buildPrompt: (d) => `Kamu adalah Quantity Surveyor struktur berpengalaman. Hitung kebutuhan tulangan berdasarkan data berikut:

Elemen: ${d.elemen}
Data Tulangan: ${d.dimensi}
Mutu Besi: ${d.mutubesi}

Hitung per ukuran diameter:
1. **Tabel berat jenis besi per meter** (D10=0.617 kg/m, D13=1.04, D16=1.58, D19=2.23, D22=3.00, D25=3.85 kg/m)
2. **Total panjang per diameter (m)** termasuk overlap 40d
3. **Total berat per diameter (kg)**
4. **Total berat semua tulangan (kg dan ton)**
5. **Kebutuhan per satuan volume beton (kg/m³)**
6. **Estimasi harga material** (besi ulir D19 ≈ Rp 13.500/kg, D16 ≈ Rp 13.800/kg, sesuaikan 2025)
7. **Waste factor 3%**

Format tabel lengkap: Diameter | Panjang (m) | Berat/m (kg) | Total Berat (kg) | Harga Satuan | Jumlah Harga.`,
    outputHint: "Tambahkan waste 3-5% untuk pemesanan aktual ke supplier",
  },

  /* ── K3 Tambahan ── */
  {
    id: "toolbox-meeting",
    name: "Materi Toolbox Meeting (TBM)",
    description: "Generate materi Toolbox Meeting K3 harian yang relevan, singkat, dan langsung bisa dipresentasikan.",
    category: "k3", categoryIcon: "⛑️", icon: "🛠️",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~12 detik",
    agentId: "k3", outputLabel: "Materi Toolbox Meeting",
    fields: [
      { id: "topikK3", label: "Topik K3 Hari Ini", type: "select", required: true, options: ["Pencegahan Jatuh dari Ketinggian","Keselamatan Penggunaan Scaffolding","APD Wajib dan Cara Memakainya","Prosedur Ijin Kerja (Work Permit)","Keselamatan Pengoperasian Alat Berat","K3 Pekerjaan Pengelasan","K3 Pekerjaan Elektrikal","Tata Cara Pelaporan Kecelakaan Kerja","Bahaya Cuaca Ekstrem di Lokasi Proyek","Kebersihan dan Kerapian Lokasi Kerja (5R)","First Aid / P3K Dasar","Keselamatan Material Handling & Rigging"] },
      { id: "pekerjaan", label: "Pekerjaan Utama Hari Ini", type: "text", placeholder: "Pengecoran balok lantai 5, pemasangan scaffolding area B" },
      { id: "jumlahPekerja", label: "Jumlah Pekerja", type: "number", placeholder: "45" },
      { id: "durasi", label: "Durasi TBM", type: "select", options: ["5 menit (sangat singkat)","10 menit (singkat)","15 menit (standar)"] },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Officer konstruksi berpengalaman. Buat materi Toolbox Meeting (TBM) K3 yang menarik, mudah dipahami pekerja lapangan, dan bisa dipresentasikan langsung oleh supervisor.

Topik: ${d.topikK3}
Pekerjaan Hari Ini: ${d.pekerjaan || "pekerjaan konstruksi umum"}
Jumlah Pekerja: ${d.jumlahPekerja || "tidak disebutkan"} orang
Durasi: ${d.durasi || "10 menit"}

Format Materi TBM:

## 🛠️ TOOLBOX MEETING — ${d.topikK3}
**Tanggal:** ___ | **Lokasi:** ___ | **Presenter:** ___

### 📌 Mengapa Ini Penting? (1-2 menit)
(fakta atau insiden nyata yang relevan — buat dampak emosional)

### ⚠️ Bahaya & Risiko yang Sering Terjadi (2-3 menit)
(list singkat dengan ilustrasi verbal yang mudah dimengerti pekerja lapangan)

### ✅ Yang HARUS Dilakukan (cara aman) (3-4 menit)
(instruksi spesifik yang bisa langsung dilakukan — bahasa sederhana)

### ❌ Yang DILARANG (larangan keras)
(apa yang tidak boleh dilakukan)

### 🎯 Pesan Utama Hari Ini (1 kalimat kuat)

### ❓ Pertanyaan untuk Pekerja (2 pertanyaan diskusi)

---
*Referensi: PP 50/2012, ISO 45001:2018*  
*Tanda tangan peserta: _______________*

Bahasa Indonesia sederhana, mudah dipahami, tidak terlalu teknis. Gunakan analogi praktis.`,
    outputHint: "Cetak dan minta tanda tangan peserta untuk dokumentasi K3",
  },

  {
    id: "investigasi-insiden",
    name: "Laporan Investigasi Insiden K3",
    description: "Susun laporan investigasi kecelakaan/insiden K3 yang sistematis dengan analisa akar masalah (RCA).",
    category: "k3", categoryIcon: "⛑️", icon: "🔍",
    tier: "free",
    estimatedTime: "~20 detik",
    agentId: "k3", outputLabel: "Laporan Investigasi Insiden",
    fields: [
      { id: "tanggalInsiden", label: "Tanggal & Waktu Insiden", type: "text", placeholder: "Senin, 7 April 2025 — 14:30 WIB", required: true },
      { id: "jenisInsiden", label: "Jenis Insiden", type: "select", required: true, options: ["Near Miss (hampir kecelakaan)","First Aid Case (P3K)","Medical Treatment Case","Lost Time Injury (LTI)","Fatality","Property Damage","Environmental Incident"] },
      { id: "kronologi", label: "Kronologi Kejadian", type: "textarea", rows: 5, required: true, placeholder: "Pekerja A sedang memasang bekisting di lantai 5, tiba-tiba scaffolding bergeser dan pekerja kehilangan keseimbangan, jatuh sejauh 1.5m dan mendarat di platform bawah..." },
      { id: "korban", label: "Data Korban / Kerusakan", type: "textarea", rows: 2, placeholder: "Ahmad Sulaiman (32th), tukang kayu, luka di tangan kiri, dibawa ke klinik proyek..." },
      { id: "apd", label: "APD yang Digunakan Saat Insiden", type: "text", placeholder: "Helm, sepatu safety, tidak menggunakan harness" },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Investigator berpengalaman. Susun laporan investigasi insiden K3 yang sistematis menggunakan metode 5-Why dan Fishbone Analysis sesuai PP 50/2012.

Tanggal: ${d.tanggalInsiden}
Jenis: ${d.jenisInsiden}
Kronologi: ${d.kronologi}
Korban/Kerusakan: ${d.korban || "tidak ada korban"}
APD: ${d.apd || "tidak disebutkan"}

Laporan mencakup:

## LAPORAN INVESTIGASI INSIDEN K3
**Nomor Laporan:** ___ | **Tanggal:** ${d.tanggalInsiden} | **Klasifikasi:** ${d.jenisInsiden}

### 1. Data Insiden
(waktu, lokasi spesifik, aktivitas saat kejadian, saksi)

### 2. Kronologi Lengkap
(timeline step-by-step sebelum, saat, dan sesudah insiden)

### 3. Analisa Akar Masalah — 5 Why
(5 pertanyaan "Mengapa" hingga akar masalah sebenarnya)

### 4. Fishbone Analysis
(4 kategori: Manusia, Metode, Material, Lingkungan)

### 5. Faktor Penyebab
(Penyebab Langsung | Penyebab Tidak Langsung | Akar Masalah)

### 6. Tindakan Perbaikan (Corrective Action)
| No | Tindakan | PIC | Deadline | Status |
|----|----------|-----|----------|--------|

### 7. Tindakan Pencegahan (Preventive Action)
(untuk mencegah kejadian serupa di masa depan)

### 8. Rekomendasi kepada Manajemen

Referensi: PP 50/2012, ISO 45001:2018, Permenaker 03/1998.`,
  },

  /* ── Estimasi & RAB Tambahan ── */
  {
    id: "value-engineering",
    name: "Analisa Value Engineering",
    description: "Identifikasi peluang penghematan biaya tanpa mengurangi fungsi dan kualitas pekerjaan.",
    category: "estimasi", categoryIcon: "💰", icon: "💡",
    tier: "free", isNew: true,
    estimatedTime: "~20 detik",
    agentId: "rab", outputLabel: "Analisa Value Engineering",
    fields: [
      { id: "itemPekerjaan", label: "Item Pekerjaan yang Dievaluasi", type: "text", placeholder: "Pekerjaan Struktur Beton Bertulang Gedung 8 Lantai", required: true },
      { id: "spesifikasiAwal", label: "Spesifikasi / Desain Awal", type: "textarea", rows: 4, required: true, placeholder: "Kolom 60x60 fc'=35MPa, Balok 35x70 fc'=35MPa, Pelat 15cm fc'=25MPa, tulangan BJTD40..." },
      { id: "estimasiAwal", label: "Estimasi Biaya Awal", type: "text", placeholder: "Rp 8.500.000.000" },
      { id: "targetPenghematan", label: "Target Penghematan (%)", type: "number", placeholder: "15" },
    ],
    buildPrompt: (d) => `Kamu adalah Quantity Surveyor dan Value Engineer berpengalaman. Lakukan analisa Value Engineering (VE) untuk:

Item: ${d.itemPekerjaan}
Spesifikasi Awal: ${d.spesifikasiAwal}
Estimasi Biaya: ${d.estimasiAwal || "tidak disebutkan"}
Target Penghematan: ${d.targetPenghematan || "10-20"}%

Analisa VE mencakup:
1. **Identifikasi Fungsi Utama** (apa fungsi kritis yang harus dipertahankan)
2. **Tabel Alternatif Penghematan** per komponen:
   | Komponen | Spesifikasi Awal | Alternatif VE | Estimasi Penghematan | Risiko/Catatan |
3. **Alternatif Material** yang setara atau lebih ekonomis
4. **Alternatif Metode Konstruksi** yang lebih efisien
5. **Optimasi Desain** (reduksi dimensi yang masih aman secara struktur)
6. **Prioritas Implementasi** (quick win vs medium term)
7. **Potensi Penghematan Total** (Rp dan %)
8. **Hal yang TIDAK boleh dikompromikan** (aspek keselamatan dan fungsi kritis)

Catatan: semua alternatif harus tetap memenuhi SNI yang berlaku.`,
    outputHint: "Presentasikan ke owner dan konsultan sebelum diputuskan",
  },

  {
    id: "perbandingan-penawaran",
    name: "Analisa Perbandingan Penawaran",
    description: "Bandingkan beberapa penawaran subkontraktor/supplier secara objektif dengan scoring matrix.",
    category: "estimasi", categoryIcon: "💰", icon: "📋",
    tier: "free", isNew: true,
    estimatedTime: "~15 detik",
    agentId: "rab", outputLabel: "Analisa Perbandingan Penawaran",
    fields: [
      { id: "itemPengadaan", label: "Item Pengadaan", type: "text", placeholder: "Subkontraktor Pekerjaan Mekanikal Gedung", required: true },
      { id: "penawar1", label: "Penawar 1 (nama & harga)", type: "text", placeholder: "PT Alpha Mekanikal — Rp 3.250.000.000", required: true },
      { id: "penawar2", label: "Penawar 2 (nama & harga)", type: "text", placeholder: "PT Beta Teknik — Rp 2.980.000.000" },
      { id: "penawar3", label: "Penawar 3 (nama & harga)", type: "text", placeholder: "PT Gamma Jaya — Rp 3.100.000.000" },
      { id: "hpsOwner", label: "HPS / Budget Owner", type: "text", placeholder: "Rp 3.000.000.000" },
      { id: "kualifikasi", label: "Kualifikasi & Catatan Tambahan", type: "textarea", rows: 3, placeholder: "PT Alpha: pengalaman 10 tahun, sudah kerja sama sebelumnya, BUJK grade M\nPT Beta: harga paling murah tapi baru, belum ada track record di gedung\nPT Gamma: sedang mengerjakan proyek lain, kapasitas perlu dicek..." },
    ],
    buildPrompt: (d) => `Kamu adalah Procurement Manager konstruksi berpengalaman. Buat analisa perbandingan penawaran (bid comparison) yang objektif menggunakan scoring matrix untuk:

Item: ${d.itemPengadaan}
HPS/Budget: ${d.hpsOwner || "tidak disebutkan"}

Penawar:
1. ${d.penawar1}
2. ${d.penawar2 || "tidak ada penawar 2"}
3. ${d.penawar3 || "tidak ada penawar 3"}

Kualifikasi: ${d.kualifikasi || "standar"}

Analisa mencakup:
1. **Tabel Perbandingan Harga** (vs HPS, selisih Rp dan %)
2. **Bid Leveling** (pastikan lingkup apples-to-apples)
3. **Scoring Matrix** dengan kriteria:
   | Kriteria | Bobot | Penawar 1 | Penawar 2 | Penawar 3 |
   (Harga 40%, Track Record 25%, Kemampuan Teknis 20%, Waktu Pelaksanaan 15%)
4. **Total Score** dan **Ranking Rekomendasi**
5. **Red Flags** yang perlu diwaspadai per penawar
6. **Rekomendasi Final** dengan justifikasi
7. **Negosiasi Points** untuk penawar terpilih

Bahasa Indonesia formal. Format laporan siap presentasi ke direksi.`,
    outputHint: "Dokumentasikan proses evaluasi ini untuk audit dan compliance",
  },

  /* ── Kontrak & Legal Tambahan ── */
  {
    id: "addendum-kontrak",
    name: "Draft Addendum Kontrak",
    description: "Susun addendum/amandemen kontrak untuk perubahan lingkup, waktu, atau harga pekerjaan.",
    category: "kontrak", categoryIcon: "⚖️", icon: "📜",
    tier: "free", isNew: true,
    estimatedTime: "~20 detik",
    agentId: "kontrak", outputLabel: "Draft Addendum Kontrak",
    fields: [
      { id: "namaProyek", label: "Nama Proyek & Nomor Kontrak", type: "text", placeholder: "Gedung Kantor PT XYZ — Kontrak No. 001/SPK/2024", required: true },
      { id: "jenisPerubahan", label: "Jenis Perubahan", type: "select", required: true, options: ["Perubahan Lingkup Pekerjaan (Variation Order)","Perpanjangan Waktu Pelaksanaan","Penyesuaian Harga (Eskalasi/De-eskalasi)","Perubahan Spesifikasi Teknis","Perubahan Jadwal Pembayaran","Kombinasi (beberapa perubahan)"] },
      { id: "detailPerubahan", label: "Detail Perubahan", type: "textarea", rows: 4, required: true, placeholder: "Penambahan pekerjaan MEP lantai atap yang tidak ada di kontrak awal: instalasi genset 500kVA dan panel LVMDB, estimasi nilai tambah Rp 850.000.000..." },
      { id: "nilaiPerubahan", label: "Nilai Perubahan", type: "text", placeholder: "+Rp 850.000.000 (penambahan)" },
      { id: "dasarPerubahan", label: "Dasar / Justifikasi Perubahan", type: "textarea", rows: 2, placeholder: "Instruksi owner melalui surat No. 045/DIR/2025, persetujuan konsultan MK..." },
    ],
    buildPrompt: (d) => `Kamu adalah konsultan hukum konstruksi senior. Buat draft Addendum/Amandemen Kontrak yang sah secara hukum untuk:

Proyek/Kontrak: ${d.namaProyek}
Jenis Perubahan: ${d.jenisPerubahan}
Detail: ${d.detailPerubahan}
Nilai Perubahan: ${d.nilaiPerubahan || "akan ditentukan"}
Dasar: ${d.dasarPerubahan || "kesepakatan para pihak"}

Format Addendum resmi:

## ADDENDUM KONTRAK NOMOR ___ / ___
**Mengacu kepada:** ${d.namaProyek}

### Pasal 1 — Dasar Pembuatan Addendum
(latar belakang dan justifikasi perubahan)

### Pasal 2 — Perubahan yang Disepakati
(bunyi pasal kontrak asal → perubahan menjadi → bunyi baru)

### Pasal 3 — Dampak terhadap Nilai Kontrak
(rincian perubahan nilai: asal + perubahan = baru)

### Pasal 4 — Dampak terhadap Waktu Pelaksanaan
(perubahan jadwal jika ada)

### Pasal 5 — Ketentuan Lain
(klausul yang tidak berubah tetap berlaku)

### Pasal 6 — Berlakunya Addendum
(tanggal efektif)

**Kolom tanda tangan:** Pihak Pertama | Pihak Kedua | Konsultan MK | Saksi

Bahasa Indonesia hukum yang formal dan presisi. Referensi Perpres 16/2018 untuk kontrak pemerintah.`,
    outputHint: "Addendum harus ditandatangani kedua pihak sebelum perubahan dilaksanakan",
  },

  /* ── PM Tambahan ── */
  {
    id: "recovery-plan",
    name: "Recovery Plan (Rencana Pemulihan Jadwal)",
    description: "Susun rencana pemulihan jadwal (recovery plan) yang realistis saat proyek terlambat dari baseline.",
    category: "pm", categoryIcon: "📊", icon: "🔄",
    tier: "free", isNew: true,
    estimatedTime: "~20 detik",
    agentId: "pm", outputLabel: "Recovery Plan",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Gedung Kantor 10 Lantai", required: true },
      { id: "deviasi", label: "Deviasi Jadwal Saat Ini", type: "text", placeholder: "-8% (aktual 57%, rencana 65%)", required: true },
      { id: "sisaDurasi", label: "Sisa Durasi Kontrak (bulan)", type: "number", placeholder: "6", required: true },
      { id: "pekerjaan", label: "Pekerjaan yang Sedang Berjalan", type: "textarea", rows: 3, required: true, placeholder: "Finishing arsitektur lt3-5, MEP lt1-3, struktur lt6 dalam proses..." },
      { id: "penyebab", label: "Penyebab Keterlambatan", type: "textarea", rows: 3, required: true, placeholder: "Keterlambatan material besi 3 minggu, cuaca buruk 2 minggu, revisi desain lt4..." },
      { id: "sumberDaya", label: "Sumber Daya yang Bisa Ditambah", type: "textarea", rows: 2, placeholder: "Bisa tambah 2 shift kerja, tambah 30 pekerja, sewa concrete pump tambahan..." },
    ],
    buildPrompt: (d) => `Kamu adalah Manajer Proyek konstruksi senior berpengalaman. Susun Recovery Plan yang realistis dan terstruktur untuk:

Proyek: ${d.namaProyek}
Deviasi Saat Ini: ${d.deviasi}
Sisa Durasi: ${d.sisaDurasi} bulan
Pekerjaan Berjalan: ${d.pekerjaan}
Penyebab: ${d.penyebab}
Sumber Daya Tambahan: ${d.sumberDaya || "terbatas"}

Recovery Plan mencakup:

## RECOVERY PLAN — ${d.namaProyek}

### 1. Diagnosa Situasi
(ringkasan kondisi terkini, dampak terhadap milestone, risiko denda keterlambatan)

### 2. Strategi Pemulihan (pilih yang paling relevan)
- Fast-tracking (paralel pekerjaan)
- Crashing (tambah sumber daya)
- Re-sequencing (ubah urutan pekerjaan)
- Scope reduction (jika ada persetujuan owner)

### 3. Rencana Aksi Pemulihan
| Minggu | Pekerjaan Prioritas | Target Progress | Sumber Daya Tambahan | PIC |
|--------|--------------------|-----------------|--------------------|-----|
(isi untuk 4 minggu ke depan minimum)

### 4. Milestone Kritis yang Tidak Boleh Terlewat
(3-5 milestone utama dengan tanggal target)

### 5. Kebutuhan Sumber Daya Tambahan
(personil, alat, material — dengan estimasi biaya)

### 6. Risiko Recovery Plan
(apa yang bisa menghambat recovery dan mitigasinya)

### 7. Proyeksi Penyelesaian
(dengan dan tanpa recovery plan)

Bahasa Indonesia profesional. Realistis dan bisa langsung diimplementasikan.`,
    outputHint: "Presentasikan ke owner dan minta persetujuan sebelum implementasi",
  },

  {
    id: "procurement-plan",
    name: "Rencana Pengadaan Material & Subkon",
    description: "Susun procurement plan terstruktur untuk material dan subkontraktor sepanjang durasi proyek.",
    category: "pm", categoryIcon: "📊", icon: "🛒",
    tier: "free",
    estimatedTime: "~20 detik",
    agentId: "pm", outputLabel: "Procurement Plan",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", placeholder: "Gedung Apartemen 20 Lantai", required: true },
      { id: "jenisProyek", label: "Jenis Proyek", type: "select", required: true, options: ["Gedung Bertingkat","Infrastruktur Jalan","Jembatan","Fasilitas Industri","Renovasi Besar"] },
      { id: "nilaiKontrak", label: "Nilai Kontrak", type: "text", placeholder: "Rp 120 miliar" },
      { id: "durasi", label: "Durasi Proyek (bulan)", type: "number", placeholder: "24", required: true },
      { id: "pekerjaan", label: "Pekerjaan Utama yang Disubkonkan", type: "textarea", rows: 3, placeholder: "Struktur baja, MEP, curtain wall, lift, landscaping..." },
    ],
    buildPrompt: (d) => `Kamu adalah Procurement Manager konstruksi senior. Susun Procurement Plan terstruktur untuk:

Proyek: ${d.namaProyek} (${d.jenisProyek})
Nilai: ${d.nilaiKontrak || "tidak disebutkan"}
Durasi: ${d.durasi} bulan
Subkon Utama: ${d.pekerjaan || "sesuai jenis proyek"}

Procurement Plan mencakup:

## PROCUREMENT PLAN — ${d.namaProyek}

### 1. Strategi Pengadaan
(make or buy, direct procurement vs tender)

### 2. Tabel Paket Pengadaan Utama
| No | Item | Jenis | Estimasi Nilai | Metode | Jadwal Tender | Jadwal Kontrak | Lead Time |
|----|------|-------|----------------|--------|---------------|----------------|-----------|
(list semua material utama dan subkon, urutan prioritas)

### 3. Vendor List Awal
(per paket: maks 3-4 vendor yang direkomendasikan dikualifikasi)

### 4. Jadwal Pengadaan (S-Curve)
(deskripsi timeline per kuartal)

### 5. Critical Procurement Items
(item dengan lead time panjang yang perlu dipesan awal)

### 6. Dokumen Pengadaan yang Diperlukan
(checklist: RFQ, dokumen tender, SPK, dll)

Bahasa Indonesia profesional. Referensi Perpres 16/2018 untuk proyek pemerintah.`,
  },

  /* ── BIM Tambahan ── */
  {
    id: "as-built-checklist",
    name: "Checklist As-Built Drawing",
    description: "Checklist kelengkapan dan keakuratan as-built drawing sebelum serah terima ke owner.",
    category: "bim", categoryIcon: "🖥️", icon: "📐",
    tier: "free", isNew: true,
    estimatedTime: "~12 detik",
    agentId: "bim", outputLabel: "Checklist As-Built Drawing",
    fields: [
      { id: "disiplin", label: "Disiplin Gambar", type: "select", required: true, options: ["Arsitektur","Struktur","MEP (Mekanikal, Elektrikal, Plumbing)","Semua Disiplin (Lengkap)"] },
      { id: "jenisProyek", label: "Jenis & Skala Proyek", type: "text", placeholder: "Gedung perkantoran 8 lantai, luas 12.000 m²", required: true },
      { id: "formatGambar", label: "Format As-Built", type: "select", options: ["CAD (.dwg)","PDF","BIM Model (Revit)","CAD + PDF + BIM (lengkap)"] },
    ],
    buildPrompt: (d) => `Kamu adalah BIM Manager dan Document Controller konstruksi. Buat checklist as-built drawing yang komprehensif untuk:

Disiplin: ${d.disiplin}
Proyek: ${d.jenisProyek}
Format: ${d.formatGambar || "CAD + PDF"}

Checklist mencakup:

## CHECKLIST AS-BUILT DRAWING — ${d.disiplin}

**Format tabel:** No | Item Pemeriksaan | Standar/Referensi | Status (✓/✗/N/A) | Catatan

### A. Kelengkapan Dokumen
(semua lembar gambar yang wajib ada)

### B. Keakuratan Konten
(kesesuaian gambar dengan kondisi as-built aktual di lapangan)

### C. Standar Penggambaran
(title block, skala, layer, simbol, notasi)

### D. Koordinasi Antar Disiplin
(kesesuaian antara ARK, STR, dan MEP)

### E. Revisi dan Markup
(semua perubahan selama konstruksi sudah di-update)

### F. Deliverable Final
(format file, jumlah set, media penyimpanan)

Minimum 30 item pemeriksaan. Referensi: ISO 19650, Permen PUPR 22/2018.`,
    outputHint: "As-built drawing adalah dokumen aset yang sangat penting untuk O&M",
  },

  /* ══════════════════════════════════════════════════════════════════════
     GELOMBANG 3 — SPESIALISASI MENDALAM
  ══════════════════════════════════════════════════════════════════════ */

  /* ── Manajemen Proyek — lebih dalam ── */
  {
    id: "register-risiko",
    name: "Risk Register Proyek",
    description: "Buat risk register lengkap dengan probability-impact matrix, nilai risiko, dan rencana mitigasi terstruktur.",
    category: "pm", categoryIcon: "📊", icon: "🎯",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "pm", outputLabel: "Risk Register",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", required: true, placeholder: "Pembangunan Jembatan Beton Prategang Bentang 60m" },
      { id: "jenisProyek", label: "Jenis Proyek", type: "select", required: true, options: ["Gedung Bertingkat (>5 lantai)","Gedung Rendah (≤5 lantai)","Jembatan","Jalan Raya/Tol","Infrastruktur Air (Dam/Bendungan)","Fasilitas Industri/Pabrik","Renovasi/Retrofit","Proyek Khusus (Terowongan/Reklamasi)"] },
      { id: "nilaiKontrak", label: "Nilai Kontrak (estimasi)", type: "text", placeholder: "Rp 45 miliar" },
      { id: "durasi", label: "Durasi Proyek", type: "text", placeholder: "18 bulan (April 2025 – Oktober 2026)" },
      { id: "risikoSpesifik", label: "Risiko Spesifik yang Sudah Diketahui", type: "textarea", rows: 3, placeholder: "Lokasi di zona gempa tinggi (PGA 0.3g), akses jembatan lama, sungai dengan debit banjir tinggi..." },
    ],
    buildPrompt: (d) => `Kamu adalah Risk Manager konstruksi senior bersertifikasi PMP. Buat Risk Register komprehensif untuk:

Proyek: ${d.namaProyek} (${d.jenisProyek})
Nilai: ${d.nilaiKontrak || "tidak disebutkan"}
Durasi: ${d.durasi || "tidak disebutkan"}
Risiko Diketahui: ${d.risikoSpesifik || "umum sesuai jenis proyek"}

Format Risk Register:

## RISK REGISTER — ${d.namaProyek}

### Skala Penilaian Risiko
**Probability:** 1=Sangat Jarang, 2=Jarang, 3=Mungkin, 4=Sering, 5=Sangat Sering  
**Impact:** 1=Tidak Signifikan, 2=Minor, 3=Moderat, 4=Major, 5=Kritis  
**Risk Score = P × I** | Rendah: 1-6 | Sedang: 7-14 | Tinggi: 15-19 | Kritis: 20-25

### Tabel Risk Register
| ID | Kategori | Deskripsi Risiko | Penyebab | Dampak | P | I | Score | Level | Pemilik Risiko | Strategi | Tindakan Mitigasi | Residual Risk |
|----|----------|-----------------|----------|--------|---|---|-------|-------|----------------|----------|-------------------|--------------|

(Isi minimum 20 risiko spesifik mencakup kategori: Teknis, Keuangan, Schedule, K3, Regulasi, Lingkungan, Force Majeure, Subkontraktor, Desain)

### Risk Heat Map
(deskripsi distribusi risiko dalam matriks 5×5)

### Top 5 Risiko Kritis (prioritas penanganan)

### Risk Monitoring Plan
(jadwal review dan update risk register)

Referensi: PMI PMBOK 7th Ed, ISO 31000:2018, SNI ISO 31000.`,
    outputHint: "Update risk register setiap bulan atau setelah kejadian signifikan",
  },

  {
    id: "ncr-generator",
    name: "Non-Conformance Report (NCR)",
    description: "Susun laporan NCR (ketidaksesuaian mutu) yang formal dan terstruktur untuk pekerjaan tidak memenuhi spesifikasi.",
    category: "pm", categoryIcon: "📊", icon: "🚨",
    tier: "free", isNew: true,
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Non-Conformance Report",
    fields: [
      { id: "nomorNCR", label: "Nomor NCR", type: "text", placeholder: "NCR-2025-047", required: true },
      { id: "tanggal", label: "Tanggal Temuan", type: "text", placeholder: "12 April 2025", required: true },
      { id: "lokasi", label: "Lokasi Temuan", type: "text", placeholder: "Kolom K7 Lantai 3, Grid B-4", required: true },
      { id: "spesifikasiYgDilanggar", label: "Spesifikasi yang Dilanggar", type: "text", placeholder: "RKS Pasal 5.3.2: fc'=25 MPa, hasil core drill hanya 18 MPa", required: true },
      { id: "deskripsiNCR", label: "Deskripsi Ketidaksesuaian", type: "textarea", rows: 4, required: true, placeholder: "Hasil uji tekan silinder beton K7 lantai 3 umur 28 hari menunjukkan kuat tekan rata-rata 18 MPa (72% dari fc'=25 MPa yang disyaratkan). Pengecoran dilakukan tgl 15 Maret 2025 oleh subkon PT XX..." },
      { id: "penyebabDuga", label: "Dugaan Penyebab", type: "textarea", rows: 2, placeholder: "Mix design tidak sesuai, rasio air-semen terlalu tinggi akibat hujan saat pengecoran..." },
    ],
    buildPrompt: (d) => `Kamu adalah QA/QC Manager konstruksi. Susun Non-Conformance Report (NCR) yang formal dan lengkap sesuai standar ISO 9001:2015.

Nomor NCR: ${d.nomorNCR}
Tanggal: ${d.tanggal}
Lokasi: ${d.lokasi}
Spesifikasi: ${d.spesifikasiYgDilanggar}
Deskripsi: ${d.deskripsiNCR}
Dugaan Penyebab: ${d.penyebabDuga || "dalam investigasi"}

## NON-CONFORMANCE REPORT (NCR)
**Nomor:** ${d.nomorNCR} | **Status:** OPEN | **Prioritas:** (tentukan)

### 1. Identifikasi Ketidaksesuaian
- Tanggal Temuan: ${d.tanggal}
- Lokasi: ${d.lokasi}
- Ditemukan Oleh: _____________
- Spesifikasi / Standar yang Dilanggar: ${d.spesifikasiYgDilanggar}

### 2. Deskripsi Ketidaksesuaian
${d.deskripsiNCR}

### 3. Klasifikasi NCR
(Major / Minor — jelaskan alasannya)

### 4. Investigasi Akar Masalah (Root Cause Analysis)
(gunakan 5-Why atau fishbone)

### 5. Tindakan Korektif Segera (Immediate Action)
(apa yang harus dilakukan sekarang: hold, isolasi, dsb)

### 6. Rencana Tindakan Perbaikan (Corrective Action Plan)
| Langkah | Aktivitas | PIC | Target Selesai |
|---------|-----------|-----|----------------|

### 7. Verifikasi Penyelesaian
(kriteria dinyatakan "CLOSE")

### 8. Dokumen Pendukung yang Diperlukan
(list dokumen yang harus dilampirkan)

**Ditandatangani:** QC Inspector | Site Manager | Konsultan MK

Referensi: ISO 9001:2015, SNI ISO 9001.`,
    outputHint: "Kirim NCR ke subkontraktor maksimal 24 jam setelah temuan",
  },

  {
    id: "evm-analisa",
    name: "Analisa Earned Value (EVM)",
    description: "Hitung SPI, CPI, EAC, dan proyeksi akhir proyek menggunakan metode Earned Value Management.",
    category: "pm", categoryIcon: "📊", icon: "📈",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "pm", outputLabel: "Analisa EVM",
    fields: [
      { id: "namaProyek", label: "Nama Proyek", type: "text", required: true, placeholder: "Gedung Kantor XYZ" },
      { id: "bac", label: "BAC — Budget at Completion (Rp)", type: "text", required: true, placeholder: "85.000.000.000" },
      { id: "pv", label: "PV — Planned Value sampai hari ini (Rp)", type: "text", required: true, placeholder: "42.500.000.000 (rencana 50% selesai)" },
      { id: "ev", label: "EV — Earned Value / pekerjaan terlaksana (Rp)", type: "text", required: true, placeholder: "38.250.000.000 (aktual terlaksana 45%)" },
      { id: "ac", label: "AC — Actual Cost yang dikeluarkan (Rp)", type: "text", required: true, placeholder: "41.000.000.000" },
      { id: "tanggalStatus", label: "Tanggal Status", type: "text", placeholder: "30 April 2025" },
      { id: "ead", label: "Estimasi sisa durasi (bulan)", type: "number", placeholder: "10" },
    ],
    buildPrompt: (d) => `Kamu adalah Project Controls Engineer senior. Lakukan analisa Earned Value Management (EVM) lengkap.

Proyek: ${d.namaProyek}
Tanggal Status: ${d.tanggalStatus || "saat ini"}
BAC (Budget at Completion): Rp ${d.bac}
PV (Planned Value): Rp ${d.pv}
EV (Earned Value): Rp ${d.ev}
AC (Actual Cost): Rp ${d.ac}
Estimasi Sisa Durasi: ${d.ead || "tidak disebutkan"} bulan

Hitung dan interpretasikan SEMUA metrik EVM:

## LAPORAN EARNED VALUE MANAGEMENT — ${d.namaProyek}
**Tanggal:** ${d.tanggalStatus || "—"}

### Metrik Varians
| Metrik | Formula | Hasil | Interpretasi |
|--------|---------|-------|-------------|
| CV (Cost Variance) | EV - AC | Rp ___ | (over/under budget) |
| SV (Schedule Variance) | EV - PV | Rp ___ | (ahead/behind schedule) |
| CV% | CV/EV×100 | ___% | |
| SV% | SV/PV×100 | ___% | |

### Indeks Efisiensi
| Indeks | Formula | Nilai | Status | Interpretasi |
|--------|---------|-------|--------|-------------|
| CPI (Cost Performance Index) | EV/AC | ___ | (>1 efisien, <1 boros) | |
| SPI (Schedule Performance Index) | EV/PV | ___ | (>1 cepat, <1 lambat) | |
| TCPI (To Complete Performance Index) | (BAC-EV)/(BAC-AC) | ___ | | |

### Proyeksi Penyelesaian
| Item | Formula | Nilai |
|------|---------|-------|
| EAC (Estimate at Completion) — metode CPI | BAC/CPI | Rp ___ |
| EAC — metode composite | AC + (BAC-EV)/(CPI×SPI) | Rp ___ |
| ETC (Estimate to Complete) | EAC - AC | Rp ___ |
| VAC (Variance at Completion) | BAC - EAC | Rp ___ |
| Projected Final Cost | | Rp ___ |

### Analisis & Rekomendasi
(interpretasi lengkap kondisi proyek — sehat/kritis, tindakan yang harus diambil)

### Proyeksi S-Curve
(deskripsi perkiraan kurva penyelesaian)

Format angka dalam Rupiah dengan pemisah titik. Hitung dengan tepat.`,
    outputHint: "Lakukan EVM update setiap minggu untuk monitoring proyek yang akurat",
  },

  /* ── K3 Mendalam ── */
  {
    id: "audit-smk3",
    name: "Audit SMK3 Internal (PP 50/2012)",
    description: "Generate checklist audit SMK3 internal sesuai 166 kriteria PP 50/2012 untuk tingkat awal, transisi, atau lanjutan.",
    category: "k3", categoryIcon: "⛑️", icon: "🔎",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "k3", outputLabel: "Audit SMK3 PP 50/2012",
    fields: [
      { id: "namaPerusahaan", label: "Nama Perusahaan / Proyek", type: "text", required: true, placeholder: "PT Bangun Jaya Konstruksi — Proyek Gedung ABC" },
      { id: "tingkatSMK3", label: "Tingkat SMK3", type: "select", required: true, options: ["Tingkat Awal (64 kriteria, ≤100 pekerja)","Tingkat Transisi (122 kriteria, 100-500 pekerja)","Tingkat Lanjutan (166 kriteria, >500 pekerja atau sesuai keinginan)"] },
      { id: "elemenFokus", label: "Elemen yang Difokuskan", type: "select", options: ["Semua 12 Elemen","Elemen 1: Pembangunan & Pemeliharaan Komitmen","Elemen 2: Strategi Pendokumentasian","Elemen 3: Peninjauan Desain & Kontrak","Elemen 4: Pengendalian Dokumen","Elemen 5: Pembelian & Pengendalian Produk","Elemen 6: Keamanan Bekerja","Elemen 7: Standar Pemantauan","Elemen 8: Pelaporan & Perbaikan Kekurangan","Elemen 9: Pengelolaan Material & Perpindahan","Elemen 10: Pengumpulan & Penggunaan Data","Elemen 11: Audit Internal SMK3","Elemen 12: Pengembangan Keterampilan & Kemampuan"] },
      { id: "temuanSebelumnya", label: "Temuan Audit Sebelumnya (jika ada)", type: "textarea", rows: 2, placeholder: "Audit terakhir: dokumen HIRARC belum ter-update, P3K kurang lengkap..." },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Auditor bersertifikasi SMK3. Buat checklist audit SMK3 internal sesuai Peraturan Pemerintah No. 50 Tahun 2012.

Perusahaan/Proyek: ${d.namaPerusahaan}
Tingkat Audit: ${d.tingkatSMK3}
Fokus Elemen: ${d.elemenFokus || "Semua 12 Elemen"}
Temuan Sebelumnya: ${d.temuanSebelumnya || "tidak ada catatan"}

## CHECKLIST AUDIT SMK3 INTERNAL
**Organisasi:** ${d.namaPerusahaan}  
**Tingkat:** ${d.tingkatSMK3}  
**Auditor:** _______________ | **Tanggal Audit:** _______________

Format kolom: No | Kriteria Audit | Pertanyaan Audit | Dok/Bukti yang Diperlukan | Pemenuhan (Ya/Tidak/Sebagian/N/A) | Temuan/Catatan | Rekomendasi

Susun checklist per elemen sesuai PP 50/2012 dengan minimum 30 pertanyaan audit yang spesifik, terukur, dan dapat diverifikasi dengan bukti dokumentasi atau observasi lapangan. Setiap pertanyaan harus mencantumkan pasal PP 50/2012 yang relevan.

Setelah checklist:
### Panduan Penilaian
- Tingkat Pencapaian = (jumlah "Ya" / total kriteria) × 100%
- ≥85%: Memuaskan (Gold) | 60-84%: Cukup (Silver) | <60%: Kurang (direkomendasikan perbaikan sebelum audit eksternal)

### Agenda Audit (jadwal kegiatan per hari)

### Dokumen yang Harus Disiapkan Sebelum Audit`,
    outputHint: "Laksanakan audit internal minimal 1x setahun sesuai persyaratan PP 50/2012",
  },

  {
    id: "ijin-kerja-khusus",
    name: "Ijin Kerja Berbahaya (Permit to Work)",
    description: "Susun ijin kerja khusus (Permit to Work) untuk pekerjaan berisiko tinggi: ketinggian, confined space, hot work, listrik.",
    category: "k3", categoryIcon: "⛑️", icon: "🪪",
    tier: "free", isNew: true,
    estimatedTime: "~12 detik",
    agentId: "k3", outputLabel: "Permit to Work",
    fields: [
      { id: "jenisPekerjaan", label: "Jenis Pekerjaan Berbahaya", type: "select", required: true, options: ["Work at Height (Kerja di Ketinggian >1.8m)","Confined Space Entry (Ruang Terbatas)","Hot Work (Las, Cutting, Grinding)","Electrical Work (Listrik Bertegangan)","Excavation (Galian Kedalaman >1.2m)","Lifting Operation (Pengangkatan Berat)","Chemical/Hazardous Material Handling","Night Work (Kerja Malam)"] },
      { id: "lokasiPekerjaan", label: "Lokasi & Deskripsi Pekerjaan", type: "textarea", rows: 3, required: true, placeholder: "Pemasangan tulangan kolom di ketinggian 14m (lantai 5), menggunakan scaffolding fixed, lokasi shaft elevator area C..." },
      { id: "pelaksana", label: "Pelaksana / Mandor", type: "text", placeholder: "Ahmad Basuki — Mandor PT Sukses Makmur", required: true },
      { id: "durasi", label: "Durasi Pekerjaan", type: "text", placeholder: "08:00 – 17:00 WIB, Selasa 15 April 2025" },
    ],
    buildPrompt: (d) => `Kamu adalah HSE Manager konstruksi. Buat dokumen Permit to Work (PTW) untuk:

Jenis: ${d.jenisPekerjaan}
Pekerjaan: ${d.lokasiPekerjaan}
Pelaksana: ${d.pelaksana}
Durasi: ${d.durasi || "sesuai kebutuhan"}

## PERMIT TO WORK (IJIN KERJA BERBAHAYA)
**Nomor:** PTW-___/___ | **Jenis:** ${d.jenisPekerjaan}

### Bagian A — Identifikasi Pekerjaan
(siapa, apa, di mana, kapan — detail lengkap)

### Bagian B — Analisa Bahaya Spesifik
(bahaya spesifik untuk ${d.jenisPekerjaan} — minimum 8 bahaya)

### Bagian C — Persyaratan Keselamatan WAJIB
**Sebelum Mulai Kerja (Pre-work checklist):**
(minimum 15 item yang harus dicek dan dicentang)

**Selama Pekerjaan:**
(persyaratan monitoring dan pengawasan)

**Setelah Selesai Pekerjaan:**
(housekeeping, verifikasi, pelaporan)

### Bagian D — APD Wajib
(daftar APD spesifik beserta standarnya)

### Bagian E — Penanganan Darurat
(prosedur evakuasi, nomor darurat, titik kumpul)

### Bagian F — Persetujuan
| Peran | Nama | Tanda Tangan | Waktu |
|-------|------|-------------|-------|
| Pemohon (Pelaksana) | | | |
| HSE Officer | | | |
| Site Manager | | | |
| Issuing Authority | | | |

**Masa Berlaku:** ${d.durasi || "___"} | Dapat diperpanjang maksimal ___ jam

Referensi: ISO 45001:2018, PP 50/2012, Permenaker 09/2016 (Kerja di Ketinggian).`,
    outputHint: "PTW wajib ditampilkan di lokasi pekerjaan selama aktivitas berlangsung",
  },

  /* ── Teknis & Sipil — Mendalam ── */
  {
    id: "kapasitas-fondasi",
    name: "Kapasitas Daya Dukung Fondasi",
    description: "Hitung daya dukung fondasi dangkal (Terzaghi) dan fondasi dalam (tiang pancang) berdasarkan data tanah.",
    category: "teknis", categoryIcon: "🏛️", icon: "⚓",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~18 detik",
    agentId: "struktur", outputLabel: "Kapasitas Fondasi",
    fields: [
      { id: "tipeFondasi", label: "Tipe Fondasi", type: "select", required: true, options: ["Fondasi Dangkal — Footplate/Setempat","Fondasi Dangkal — Strip/Menerus","Fondasi Dalam — Tiang Pancang Beton Pracetak","Fondasi Dalam — Tiang Bor (Bored Pile)","Fondasi Dalam — Mini Pile","Fondasi Dalam — Sheet Pile"] },
      { id: "dataTanah", label: "Data Tanah / Hasil SPT", type: "textarea", rows: 4, required: true, placeholder: "Lapisan 0-3m: Tanah urugan, SPT=5\nLapisan 3-8m: Lempung lunak, SPT=8, cu=30 kPa\nLapisan 8-15m: Pasir sedang, SPT=25, φ=32°\nLapisan 15-25m: Pasir padat, SPT=48, φ=38°" },
      { id: "beban", label: "Beban Kolom yang Harus Ditopang", type: "text", required: true, placeholder: "P=1800 kN, Mx=120 kNm, My=80 kNm" },
      { id: "dimensiAwal", label: "Dimensi Fondasi yang Direncanakan", type: "text", placeholder: "Footplate 2.0×2.0m kedalaman 2m ATAU tiang bor D=60cm kedalaman 20m (8 tiang)" },
    ],
    buildPrompt: (d) => `Kamu adalah Geoteknik Engineer senior. Hitung kapasitas daya dukung fondasi dan evaluasi kecukupannya:

Tipe: ${d.tipeFondasi}
Data Tanah: ${d.dataTanah}
Beban: ${d.beban}
Dimensi Rencana: ${d.dimensiAwal || "tentukan yang optimal"}

Hitung:
1. **Identifikasi lapisan tanah dan parameter desain** (Su/cu, φ, γ per lapisan)
2. **Kapasitas daya dukung ultimit (qu)** — gunakan metode Terzaghi/Meyerhof/Hansen sesuai tipe fondasi
3. **Kapasitas daya dukung ijin (qa) = qu/SF** (SF=3 untuk fondasi baru)
4. **Kapasitas dari korelasi SPT** (metode Meyerhof untuk tiang)
5. **Verifikasi beban vs kapasitas**: P ≤ qa × A?
6. **Penurunan (settlement)** — immediate dan konsolidasi (jika tanah lempung)
7. **Rekomendasi dimensi optimal** jika dimensi awal tidak mencukupi
8. **Tabel ringkasan**: Kapasitas Ijin | Beban | SF Aktual | Status

Sertakan asumsi yang digunakan. Referensi: SNI 8460:2017, SNI 2847:2019, Bowles Foundation Analysis.`,
    outputHint: "Pastikan data SPT berasal dari uji boring terbaru di lokasi proyek",
  },

  {
    id: "desain-kolom",
    name: "Desain Tulangan Kolom Beton (SNI)",
    description: "Desain tulangan longitudinal dan sengkang kolom beton bertulang berdasarkan gaya aksial dan momen sesuai SNI 2847.",
    category: "teknis", categoryIcon: "🏛️", icon: "🏗️",
    tier: "free", isNew: true,
    estimatedTime: "~20 detik",
    agentId: "struktur", outputLabel: "Desain Kolom",
    fields: [
      { id: "dimensiKolom", label: "Dimensi Kolom", type: "select", required: true, options: ["30×30 cm","40×40 cm","50×50 cm","60×60 cm","70×70 cm","80×80 cm","40×60 cm (persegi panjang)","50×70 cm","60×80 cm","D=50cm (bulat)","D=60cm (bulat)","D=80cm (bulat)"] },
      { id: "mutuBeton", label: "Mutu Beton (fc')", type: "select", required: true, options: ["fc'=25 MPa","fc'=30 MPa","fc'=35 MPa","fc'=40 MPa"] },
      { id: "mutuBaja", label: "Mutu Baja Tulangan", type: "select", required: true, options: ["BJTD 40 (fy=400 MPa, ulir)","BJTD 32 (fy=320 MPa, ulir)"] },
      { id: "gayaDesain", label: "Gaya Desain (dari analisa struktur)", type: "textarea", rows: 3, required: true, placeholder: "Pu = 3500 kN (aksial tekan terfaktor)\nMux = 180 kNm (momen arah x)\nMuy = 120 kNm (momen arah y)" },
      { id: "tinggiKolom", label: "Tinggi Bebas Kolom (m)", type: "number", placeholder: "4.5" },
    ],
    buildPrompt: (d) => `Kamu adalah Structural Engineer berpengalaman. Desain tulangan kolom beton bertulang sesuai SNI 2847:2019 (ACI 318-19).

Dimensi: ${d.dimensiKolom}
fc' = ${d.mutuBeton}
fy = ${d.mutuBaja}
Gaya Desain: ${d.gayaDesain}
Tinggi Bebas: ${d.tinggiKolom || "4"} m

Desain mencakup:

## DESAIN KOLOM — ${d.dimensiKolom}

### 1. Data Material & Geometri
(resume data input, selimut beton, tebal efektif)

### 2. Cek Kelangsingan (Slenderness Check)
- Rasio kelangsingan λ = klu/r (k=1.0 untuk jepit-jepit)
- Kesimpulan: kolom pendek / langsing?

### 3. Tulangan Longitudinal
- Rasio tulangan minimum: ρmin = 1% dan maksimum ρmax = 8%
- Jumlah dan diameter tulangan yang dipilih
- Kontrol: ρ aktual = ___% (harus 1-8%)
- Tabel interaksi P-M: titik beban (Pu, Mux) dalam diagram interaksi

### 4. Sengkang / Confinement (SNI 2847 Pasal 18)
- Zona confinement (Lo): hitung sesuai SNI
- Spasi sengkang di zona confinement vs di luar
- Diameter dan jenis sengkang

### 5. Rekomendasi Gambar
(deskripsi detail tulangan untuk gambar kerja)

### 6. Kontrol Kebutuhan Tulangan Terfaktor
(φPn ≥ Pu? φMnx ≥ Mux? φMny ≥ Muy?)

Hitung numerik. Referensi: SNI 2847:2019 Pasal 22, 18.`,
    outputHint: "Hasil desain ini harus diverifikasi engineer berlisensi sebelum pelaksanaan",
  },

  {
    id: "metode-galian",
    name: "Metode Kerja Galian & Dewatering",
    description: "Susun metode kerja galian tanah dalam proyek gedung: tahapan, proteksi lereng, sistem dewatering, dan keselamatan.",
    category: "teknis", categoryIcon: "🏛️", icon: "⛏️",
    tier: "free", isNew: true,
    estimatedTime: "~18 detik",
    agentId: "geoteknik", outputLabel: "Metode Kerja Galian",
    fields: [
      { id: "kedalaman", label: "Kedalaman Galian", type: "select", required: true, options: ["<2m (galian dangkal)","2-5m (sedang)","5-10m (dalam)","10-15m (sangat dalam)","15-20m (ultra dalam / basement)"] },
      { id: "luasTapak", label: "Luas Tapak / Area Galian", type: "text", placeholder: "60m × 40m = 2400 m²", required: true },
      { id: "dataTanah", label: "Kondisi Tanah", type: "textarea", rows: 3, required: true, placeholder: "Tanah lempung lunak sampai 5m, muka air tanah di -3m dari permukaan, di sekitar ada gedung eksisting 10m dari batas tapak..." },
      { id: "proteksi", label: "Sistem Proteksi Galian", type: "select", required: true, options: ["Open Cut (lereng terbuka + berma)","Sheet Pile Baja","Soldier Pile + Lagging","Bored Pile Dinding (Secant/Contiguous)","Diaphragm Wall","Kombinasi (tentukan)"] },
    ],
    buildPrompt: (d) => `Kamu adalah Geoteknik Engineer dan Pelaksana konstruksi berpengalaman. Susun Metode Kerja Galian yang komprehensif dan aman.

Kedalaman: ${d.kedalaman}
Luas Tapak: ${d.luasTapak}
Kondisi Tanah: ${d.dataTanah}
Sistem Proteksi: ${d.proteksi}

Metode Kerja mencakup:

## METODE KERJA GALIAN — ${d.kedalaman}

### 1. Pendahuluan & Lingkup
(uraian pekerjaan galian)

### 2. Data Geoteknik & Implikasinya
(analisa kondisi tanah terhadap metode galian)

### 3. Urutan / Tahapan Galian
(sequence galian dari atas ke bawah — step by step, zone per zone jika perlu)

### 4. Sistem Proteksi Lereng/Dinding — ${d.proteksi}
(spesifikasi, kapasitas, metode pemasangan)

### 5. Sistem Dewatering
**Metode yang dipilih:**
- Open Pumping (untuk galian dangkal, tanah tidak terlalu permeabel)
- Deep Well / Well Point (untuk galian dalam, pasir)
- Cut-off Wall (untuk tanah sangat permeabel)

(rincian system, lokasi pompa, titik pembuangan, monitoring muka air tanah)

### 6. Monitoring Lapangan
- Inclinometer (deformasi dinding)
- Settlement point (penurunan tanah di sekitar)
- Piezometer (muka air tanah)
- Crack monitoring (bangunan sekitar)

### 7. Peralatan yang Diperlukan
(list alat berat, pompa, alat monitoring)

### 8. K3 Pekerjaan Galian
(checklist K3 spesifik, jalur evakuasi, rambu)

Referensi: SNI 8460:2017, OSHA 1926.652.`,
  },

  /* ── MEP — Lebih Dalam ── */
  {
    id: "sizing-genset",
    name: "Sizing Diesel Generator (Genset)",
    description: "Hitung kapasitas genset diesel yang dibutuhkan berdasarkan beban listrik kritis dan total gedung.",
    category: "mep", categoryIcon: "⚡", icon: "🔋",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~15 detik",
    agentId: "mep", outputLabel: "Spesifikasi Genset",
    fields: [
      { id: "tipeBangunan", label: "Tipe Bangunan", type: "select", required: true, options: ["Gedung Perkantoran","Hotel Bintang 3-5","Rumah Sakit (Critical Load)","Mal / Pusat Perbelanjaan","Gedung Apartemen","Fasilitas Industri / Pabrik","Data Center","Infrastruktur (Pompa Air Bersih)"] },
      { id: "bebanKritis", label: "Beban Kritis (harus tetap nyala saat PLN padam)", type: "textarea", rows: 3, required: true, placeholder: "Lift 3×15kW, pompa kebakaran 30kW, pompa jockey 7.5kW, lampu darurat 10kW, server room 50kW, reception 5kW..." },
      { id: "luasTotal", label: "Luas Bangunan Total (m²)", type: "number", placeholder: "12000" },
      { id: "dayaContracted", label: "Daya PLN yang Dikontrak (kVA)", type: "number", placeholder: "2000" },
    ],
    buildPrompt: (d) => `Kamu adalah Electrical Engineer senior spesialis power system. Hitung kebutuhan diesel generator untuk:

Tipe: ${d.tipeBangunan}
Beban Kritis: ${d.bebanKritis}
Luas Bangunan: ${d.luasTotal || "tidak disebutkan"} m²
Daya PLN: ${d.dayaContracted || "tidak disebutkan"} kVA

Hitung step by step:

## SIZING DIESEL GENERATOR — ${d.tipeBangunan}

### 1. Inventarisasi Beban Kritis
| Peralatan | Qty | Daya/unit (kW) | Faktor Beban | Total (kW) |
|-----------|-----|----------------|-------------|------------|
(list semua beban kritis dari input + tambahan umum sesuai tipe bangunan)
**Total Beban Kritis: ___ kW**

### 2. Perhitungan Daya Genset
- Total Beban Kritis: ___ kW
- Faktor Demand: 0.8 (demand factor)
- Faktor Reserve: 25% (headroom kapasitas)
- Kebutuhan Genset = Total × demand factor × 1.25 = ___ kW = ___ kVA (pf=0.8)

### 3. Rekomendasi Kapasitas Standard
(pilih kapasitas genset standard terdekat di atas kebutuhan: misal 250, 500, 750, 1000 kVA)

### 4. Spesifikasi Teknis Genset
- Kapasitas: ___ kVA / ___ kW (Standby)
- Tegangan output: 380/220V, 3-phase, 50Hz
- Engine: (diesel, rpm 1500)
- Alternator: brushless self-exciting
- ATS (Automatic Transfer Switch): response time ≤10 detik
- Estimasi konsumsi bahan bakar: ___ liter/jam (full load)
- Kapasitas tangki: cukup untuk ___ jam operasi

### 5. Ruang Genset
- Luas minimal yang dibutuhkan: ___ m²
- Sistem ventilasi: CFM minimal
- Fondasi anti-getar
- Akses bahan bakar

### 6. Estimasi Biaya
(genset, panel ATS, instalasi — range harga 2025)

Referensi: PUIL 2011 (SNI 04-0225:2011), NFPA 110.`,
    outputHint: "Lakukan load bank test 100% kapasitas sebelum commissioning",
  },

  {
    id: "sizing-pompa",
    name: "Sizing Pompa Air Bersih & Hidran",
    description: "Hitung spesifikasi pompa air bersih (booster pump) dan pompa pemadam kebakaran (hydrant pump) berdasarkan kebutuhan gedung.",
    category: "mep", categoryIcon: "⚡", icon: "💧",
    tier: "free", isNew: true,
    estimatedTime: "~15 detik",
    agentId: "mep", outputLabel: "Spesifikasi Pompa",
    fields: [
      { id: "tipePompa", label: "Jenis Pompa yang Dihitung", type: "select", required: true, options: ["Pompa Air Bersih (Booster Pump)","Pompa Pemadam Kebakaran / Hidran (Fire Pump)","Keduanya (Air Bersih + Pemadam)","Pompa Sumur Dalam (Deep Well Pump)","Pompa Sewage/Air Kotor"] },
      { id: "jumlahPenghuni", label: "Jumlah Penghuni / Unit", type: "number", placeholder: "500 orang atau 200 unit apartemen", required: true },
      { id: "jumLantai", label: "Jumlah Lantai & Tinggi Gedung", type: "text", required: true, placeholder: "15 lantai, tinggi total 52m dari level pompa ke lantai teratas" },
      { id: "tipeBangunan", label: "Tipe Bangunan", type: "select", options: ["Perkantoran","Apartemen/Hunian","Hotel","Rumah Sakit","Komersial/Mal"] },
    ],
    buildPrompt: (d) => `Kamu adalah Mechanical Engineer senior spesialis plumbing system. Hitung sizing pompa untuk:

Jenis: ${d.tipePompa}
Penghuni/Unit: ${d.jumlahPenghuni}
Gedung: ${d.jumLantai}
Tipe: ${d.tipeBangunan || "gedung umum"}

## SIZING POMPA — ${d.tipePompa}

### A. POMPA AIR BERSIH
**Kebutuhan Air:**
- Kebutuhan per orang: 120 liter/hari (kantor) / 150 (apartemen) / 250 (hotel)
- Total kebutuhan harian: ___ liter/hari = ___ m³/hari
- Kebutuhan jam puncak (peak hour): ___ m³/jam = ___ liter/menit

**Head Pompa:**
| Komponen Head | Nilai |
|---------------|-------|
| Static head (tinggi gedung) | ${d.jumLantai?.match(/\d+m/)?.[0] || "___"} |
| Pressure sisa di outlet atas | 7 m (min) |
| Head loss pipa (estimasi 30%) | ___ m |
| **Total Head** | ___ m |

**Rekomendasi Pompa Air Bersih:**
- Flow rate: ___ m³/jam
- Head: ___ m
- Power motor: ___ kW
- Konfigurasi: ___ pompa working + ___ standby

### B. POMPA PEMADAM KEBAKARAN (sesuai SNI 03-1745)
- Flow rate hidran: 250 lpm per kotak hidran
- Hydrant box yang terlayani secara simultan: 2 (gedung <25m) / 3 (≥25m)
- Total kebutuhan: ___ lpm = ___ m³/jam
- Head pompa kebakaran: ___ m
- Power motor: ___ kW

**Konfigurasi wajib:** Electric Pump + Diesel Pump + Jockey Pump

### Estimasi Biaya (2025)
(range harga per jenis pompa)

Referensi: SNI 03-7065:2005 (Plumbing), SNI 03-1745:2000 (Hidran).`,
    outputHint: "Uji sistem pompa kebakaran setiap 6 bulan sesuai NFPA 25",
  },

  /* ── Kontrak & Legal — Lebih Dalam ── */
  {
    id: "surat-perintah-kerja",
    name: "Surat Perintah Kerja (SPK) Subkontraktor",
    description: "Draft SPK resmi untuk subkontraktor dengan klausul lengkap: lingkup, nilai, jadwal, denda, garansi.",
    category: "kontrak", categoryIcon: "⚖️", icon: "📝",
    tier: "free", isNew: true, isPopular: true,
    estimatedTime: "~20 detik",
    agentId: "kontrak", outputLabel: "Draft SPK",
    fields: [
      { id: "namaProyek", label: "Nama Proyek & Kontraktor Utama", type: "text", required: true, placeholder: "Pembangunan Gedung XYZ — PT Bangun Jaya Konstruksi" },
      { id: "namaSubkon", label: "Nama Subkontraktor", type: "text", required: true, placeholder: "PT Mekanikal Prima Jaya" },
      { id: "lingkupPekerjaan", label: "Lingkup Pekerjaan", type: "textarea", rows: 4, required: true, placeholder: "Pekerjaan Mekanikal Plumbing gedung 10 lantai: instalasi air bersih, air kotor, air hujan, pompa, tangki air, termasuk pemasangan fixture sanitasi lantai 1-10..." },
      { id: "nilaiSPK", label: "Nilai SPK", type: "text", required: true, placeholder: "Rp 2.850.000.000 (dua miliar delapan ratus lima puluh juta rupiah)" },
      { id: "jadwal", label: "Jadwal Pelaksanaan", type: "text", required: true, placeholder: "120 hari kalender, mulai 1 Mei 2025 – 28 Agustus 2025" },
      { id: "retensi", label: "Retensi & Denda", type: "text", placeholder: "Retensi 5%, denda keterlambatan 1‰/hari maks 5%" },
    ],
    buildPrompt: (d) => `Kamu adalah konsultan hukum konstruksi. Draft Surat Perintah Kerja (SPK) yang lengkap dan sah secara hukum.

Proyek/Kontraktor Utama: ${d.namaProyek}
Subkontraktor: ${d.namaSubkon}
Lingkup: ${d.lingkupPekerjaan}
Nilai: ${d.nilaiSPK}
Jadwal: ${d.jadwal}
Retensi/Denda: ${d.retensi || "Retensi 5%, denda 1‰/hari maks 5%"}

## SURAT PERINTAH KERJA (SPK)
**No. SPK:** ___/SPK/___/2025

**Para Pihak:**
- **PIHAK PERTAMA (Kontraktor Utama):** [dari ${d.namaProyek}]
- **PIHAK KEDUA (Subkontraktor):** ${d.namaSubkon}

### Pasal 1 — Lingkup Pekerjaan
${d.lingkupPekerjaan}

### Pasal 2 — Nilai Kontrak & Harga Satuan
- Nilai Lumpsum: ${d.nilaiSPK}
- Pembayaran: (skema termin sesuai progress: DP 20%, termin 1 25%, termin 2 25%, termin 3 20%, retensi 10%)

### Pasal 3 — Jadwal Pelaksanaan
${d.jadwal}

### Pasal 4 — Syarat dan Ketentuan Teknis
(kewajiban mengikuti spesifikasi, RKS, gambar kerja, instruksi MK)

### Pasal 5 — K3 dan HSE
(kewajiban K3, APD, JSA, ijin kerja, asuransi pekerja BPJS)

### Pasal 6 — Pembayaran & Retensi
${d.retensi || "Retensi 5%, denda 1‰/hari maks 5%"}

### Pasal 7 — Denda Keterlambatan
(mekanisme perhitungan dan pemotongan denda)

### Pasal 8 — Garansi Pekerjaan
(masa pemeliharaan 6 bulan / 12 bulan, kewajiban perbaikan)

### Pasal 9 — Penyelesaian Perselisihan
(musyawarah 30 hari → BANI Arbitrase Jakarta)

### Pasal 10 — Keadaan Kahar (Force Majeure)

### Penandatanganan
(tempat, tanggal, kolom tanda tangan bermaterai)

Bahasa Indonesia legal formal.`,
    outputHint: "Pastikan SPK ditandatangani di atas materai Rp 10.000 oleh kedua pihak",
  },

  {
    id: "analisa-keterlambatan",
    name: "Analisa Keterlambatan & Klaim Waktu",
    description: "Susun analisa keterlambatan yang mendalam menggunakan metode SCL Protocol / FIDIC untuk klaim perpanjangan waktu.",
    category: "kontrak", categoryIcon: "⚖️", icon: "⏳",
    tier: "free", isNew: true,
    estimatedTime: "~25 detik",
    agentId: "kontrak", outputLabel: "Analisa Keterlambatan",
    fields: [
      { id: "namaProyek", label: "Proyek & Nomor Kontrak", type: "text", required: true, placeholder: "Jembatan Akses Kawasan Industri — Kontrak 2024/001" },
      { id: "tanggalMulai", label: "Tanggal Mulai & Akhir Kontrak", type: "text", required: true, placeholder: "Mulai: 1 Maret 2024 | Akhir Kontrak: 28 Februari 2025" },
      { id: "statusSekarang", label: "Status Saat Ini", type: "text", required: true, placeholder: "Progress 78%, prediksi selesai 30 April 2025 (terlambat 60 hari)" },
      { id: "penyebabKeterlambatan", label: "Daftar Penyebab Keterlambatan", type: "textarea", rows: 5, required: true, placeholder: "1. Banjir 15-25 Juni 2024 (10 hari) — cuaca ekstrem\n2. Perubahan desain pile cap oleh owner (20 hari) — surat no 45/DIR/2024\n3. Keterlambatan pengiriman material baja dari produsen (25 hari) — force majeure baja\n4. Tambahan pekerjaan abutmen baru (15 hari) — VO No.3" },
      { id: "metodePenjadwalan", label: "Metode Jadwal yang Digunakan", type: "select", options: ["CPM (Critical Path Method)","Precedence Diagram Method (PDM)","Bar Chart / Gantt Chart","Program Komputer (Primavera/MS Project)"] },
    ],
    buildPrompt: (d) => `Kamu adalah Delay Analyst dan Klaim Advisor konstruksi berpengalaman. Susun analisa keterlambatan sesuai SCL Protocol 2017 (Society of Construction Law) dan FIDIC 2017.

Proyek: ${d.namaProyek}
Kontrak: ${d.tanggalMulai}
Status: ${d.statusSekarang}
Penyebab: ${d.penyebabKeterlambatan}
Jadwal: ${d.metodePenjadwalan || "CPM"}

## LAPORAN ANALISA KETERLAMBATAN
**Ref:** Delay Analysis Report — ${d.namaProyek}

### 1. Ringkasan Eksekutif
(overview keterlambatan dan klaim)

### 2. Kontrak dan Jadwal Baseline
(durasi kontrak, milestone kritis, metode analisa yang digunakan)

### 3. Klasifikasi Keterlambatan
| Event | Tanggal | Durasi Delay | Penyebab | Klasifikasi | Pihak Bertanggung Jawab | Klaim EOT? |
|-------|---------|-------------|----------|-------------|------------------------|------------|
(Employer Risk / Contractor Risk / Neutral/Force Majeure)

### 4. Analisa Concurrent Delay
(identifikasi apakah ada keterlambatan bersamaan dari dua pihak)

### 5. Dampak ke Critical Path
(apakah setiap event mempengaruhi jalur kritis? berapa float yang tersisa?)

### 6. Extension of Time (EOT) yang Diklaim
| Event EOT | Durasi | Dasar Klaim | Referensi FIDIC/Kontrak |
|-----------|--------|-------------|------------------------|
**Total EOT yang Diklaim: ___ hari kalender**

### 7. Biaya Keterlambatan (Delay Damages) — jika berlaku
(prolongation cost: overhead, peralatan, sumber daya yang menganggur)

### 8. Prosedur Klaim yang Harus Dilakukan
(notice requirement per FIDIC Sub-Clause 20.2, dokumen pendukung)

Referensi: FIDIC 2017 Sub-Clause 8.5, 8.6, 20.2; SCL Protocol 2017; Perpres 16/2018.`,
    outputHint: "Kirim notice of delay ke owner dalam 28 hari sesuai FIDIC — jangan lewat batas waktu",
  },

  /* ── Dokumen — Lebih Dalam ── */
  {
    id: "berita-acara-generator",
    name: "Generator Berita Acara",
    description: "Generate berbagai jenis Berita Acara (BA) konstruksi yang formal: PHO, serah terima material, kemajuan pekerjaan, dll.",
    category: "dokumen", categoryIcon: "📄", icon: "📃",
    tier: "free", isNew: true,
    estimatedTime: "~12 detik",
    agentId: "pm", outputLabel: "Berita Acara",
    fields: [
      { id: "jenisBA", label: "Jenis Berita Acara", type: "select", required: true, options: ["BA Serah Terima Pekerjaan (PHO/FHO)","BA Kemajuan Pekerjaan / Progress Payment","BA Pemeriksaan Pekerjaan Tersembunyi","BA Serah Terima Material ke Lapangan","BA Opname Pekerjaan","BA Revisi / Perubahan Gambar","BA Penetapan Pemenang Tender","BA Hasil Pengujian / Test Material","BA Pembongkaran Pekerjaan NCR","BA Penghentian Pekerjaan Sementara"] },
      { id: "namaProyek", label: "Nama Proyek", type: "text", required: true, placeholder: "Gedung Perkantoran PT ABC" },
      { id: "tanggal", label: "Tanggal Berita Acara", type: "text", required: true, placeholder: "Senin, 28 April 2025" },
      { id: "detail", label: "Detail Isi Berita Acara", type: "textarea", rows: 4, required: true, placeholder: "BA Kemajuan Pekerjaan: progress fisik bulan April 2025 = 65.5% (rencana 70%), nilai tagihan Rp 12.500.000.000, pekerjaan yang tercapai: kolom lt4 100%, balok lt4 80%, pelat lt4 60%..." },
      { id: "peserta", label: "Pihak yang Menandatangani", type: "textarea", rows: 2, placeholder: "1. Direktur PT ABC (Owner) — Bapak Hendra Wijaya\n2. Project Manager PT Bangun Jaya — Bapak Rizki Pratama\n3. Konsultan MK — Bapak Ir. Suharto, MT" },
    ],
    buildPrompt: (d) => `Kamu adalah Document Controller konstruksi senior. Buat ${d.jenisBA} yang resmi dan formal.

Proyek: ${d.namaProyek}
Tanggal: ${d.tanggal}
Isi: ${d.detail}
Penanda Tangan: ${d.peserta || "pihak-pihak yang relevan"}

## ${d.jenisBA.toUpperCase()}
**NOMOR:** ___ / BA / ___ / 2025

**Pada hari ini,** ${d.tanggal}, bertempat di lokasi proyek ${d.namaProyek}, kami yang bertanda tangan di bawah ini:

**PIHAK-PIHAK:**
${d.peserta || "(isi pihak yang hadir)"}

**Telah melakukan** ${d.jenisBA} dengan keterangan sebagai berikut:

### I. DASAR
(surat perjanjian/kontrak yang menjadi acuan)

### II. HASIL PEMERIKSAAN / KESEPAKATAN
(isi detail yang rapi dan terstruktur berdasarkan: ${d.detail})

### III. LAMPIRAN
(dokumen yang dilampirkan: foto, tabel, laporan)

### IV. KESIMPULAN
(pernyataan resmi hasil Berita Acara)

**Demikian Berita Acara ini dibuat dalam rangkap ___**, masing-masing bermaterai cukup dan mempunyai kekuatan hukum yang sama.

| Pihak | Jabatan | Nama | Tanda Tangan | Tanggal |
|-------|---------|------|-------------|---------|

Format formal dokumen Indonesia. Bahasa baku. Jelas dan tidak ambigu.`,
    outputHint: "Distribusikan salinan BA kepada semua pihak yang menandatangani dalam 3 hari kerja",
  },

  {
    id: "evaluasi-subkon",
    name: "Form Evaluasi Kinerja Subkontraktor",
    description: "Generate form evaluasi kinerja subkontraktor yang objektif berdasarkan KPI kuantitatif proyek konstruksi.",
    category: "dokumen", categoryIcon: "📄", icon: "📊",
    tier: "free", isNew: true,
    estimatedTime: "~12 detik",
    agentId: "pm", outputLabel: "Evaluasi Subkontraktor",
    fields: [
      { id: "namaSubkon", label: "Nama Subkontraktor", type: "text", required: true, placeholder: "PT Mekanikal Prima Jaya" },
      { id: "jenisPackage", label: "Paket Pekerjaan", type: "text", required: true, placeholder: "Pekerjaan MEP Gedung ABC — nilai Rp 4.5 miliar" },
      { id: "periodeEvaluasi", label: "Periode Evaluasi", type: "text", required: true, placeholder: "Januari – Maret 2025 (Q1 2025)" },
      { id: "dataPencapaian", label: "Data Pencapaian Aktual", type: "textarea", rows: 4, placeholder: "Progress: plan 40%, actual 35% (deviasi -5%)\nDenda keterlambatan: Rp 15.000.000\nInsiden K3: 1x near miss\nNCR diterima: 2 NCR (sudah closed)\nKehadiran PM: 80%..." },
    ],
    buildPrompt: (d) => `Kamu adalah Project Manager konstruksi. Buat Form Evaluasi Kinerja Subkontraktor yang komprehensif dan objektif.

Subkontraktor: ${d.namaSubkon}
Paket: ${d.jenisPackage}
Periode: ${d.periodeEvaluasi}
Data Aktual: ${d.dataPencapaian || "sesuai standar umum"}

## FORM EVALUASI KINERJA SUBKONTRAKTOR
**Subkon:** ${d.namaSubkon} | **Periode:** ${d.periodeEvaluasi}

### Tabel Penilaian KPI
| No | Kriteria Penilaian | Bobot | Target | Realisasi | Skor (0-100) | Nilai Tertimbang | Keterangan |
|----|-------------------|-------|--------|-----------|-------------|-----------------|-----------|
| 1 | Schedule Performance (progress vs rencana) | 25% | | | | | |
| 2 | Quality (NCR, rework, rejection rate) | 20% | | | | | |
| 3 | K3 & HSE (insiden, near miss, APD compliance) | 20% | | | | | |
| 4 | Cost Performance (change order, klaim) | 15% | | | | | |
| 5 | Sumber Daya (tenaga kerja, alat) | 10% | | | | | |
| 6 | Komunikasi & Responsif | 5% | | | | | |
| 7 | Administrasi & Dokumentasi | 5% | | | | | |
| **TOTAL** | | **100%** | | | | | |

**Skala:** 85-100=Sangat Baik (A) | 70-84=Baik (B) | 55-69=Cukup (C) | <55=Kurang (D)

Isi nilai berdasarkan data: ${d.dataPencapaian || "estimasi standar"}

### Ringkasan Temuan
- Kekuatan:
- Area Perbaikan:
- Tindakan yang Disepakati:

### Klasifikasi Subkon
(Preferred / Approved / Conditional / Blacklist)

### Rekomendasi untuk Proyek Berikutnya`,
    outputHint: "Bagikan hasil evaluasi ke subkon dan minta tanda tangan sebagai bukti penerimaan",
  },
];

/* Compute category counts */
const countMap: Record<string, number> = {};
for (const t of AI_TOOLS) {
  countMap[t.category] = (countMap[t.category] || 0) + 1;
}
for (const cat of TOOL_CATEGORIES) {
  if (cat.id === "all") (cat as any).count = AI_TOOLS.length;
  else (cat as any).count = countMap[cat.id] || 0;
}
