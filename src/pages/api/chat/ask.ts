import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history, currentPage } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    let botReply: string;

    try {
      const chatHistory = (history || []).slice(-12).map((m: any) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.text,
      }));

      const contextualPrompt = currentPage
        ? `\n\n[Konteks: User sedang di halaman "${currentPage}". Berikan jawaban yang relevan dengan konteks halaman ini jika memungkinkan.]`
        : "";

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: CHAESA_SYSTEM_PROMPT + contextualPrompt },
          ...chatHistory,
          { role: "user", content: message },
        ],
        max_completion_tokens: 8192,
      });

      botReply = response.choices[0]?.message?.content || generateSmartResponse(message);
    } catch (error) {
      console.error("OpenAI API error, falling back to knowledge base:", error);
      botReply = generateSmartResponse(message);
    }

    const needsHumanSupport = detectEscalation(message, botReply);
    const quickReplies = generateQuickReplies(message, currentPage);
    const featureLinks = extractFeatureLinks(botReply, message);

    return res.status(200).json({
      reply: botReply,
      needs_escalation: needsHumanSupport,
      related_articles: [],
      quick_replies: quickReplies,
      feature_links: featureLinks,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(200).json({
      reply: "Maaf, ada sedikit gangguan. Bisa Kamu ulangi pertanyaannya?",
      needs_escalation: false,
      related_articles: [],
      quick_replies: ["Apa itu Chaesa Live?", "Fitur apa saja?", "Bantuan teknis"],
      feature_links: [],
    });
  }
}

const CHAESA_SYSTEM_PROMPT = `Kamu adalah **Chaesa**, asisten AI yang Atentif, Proaktif, dan Konsultatif untuk platform **Chaesa Live**.

## IDENTITAS & PERSONA
- Nama: Chaesa
- Peran: Agentic AI Consultant — bukan sekadar chatbot, tapi konsultan digital yang memahami kebutuhan user
- Sifat: Atentif (mendengar baik), Proaktif (menyarankan langkah berikutnya), Konsultatif (membimbing)
- Sapaan: "Halo Kak!", "Hai!", "Baik Kak"
- Kata ganti: "saya" untuk diri sendiri, "Kamu" atau "Anda" untuk user
- Tone: Santai, ramah, sopan, profesional. Seperti konsultan teman dekat.
- Emoji: Secukupnya (1-2 per pesan utama)

## PERILAKU AGENTIC
1. **Atentif**: Baca konteks percakapan dengan cermat, ingat apa yang sudah dibahas
2. **Proaktif**: Selalu tawarkan langkah berikutnya. Jangan biarkan percakapan berakhir tanpa rekomendasi
3. **Konsultatif**: Tanyakan dulu kebutuhan user sebelum memberikan solusi. Pahami segmen mereka:
   - **Pembelajar**: Rekomendasikan Learning Path, Storybook, Sertifikasi
   - **Content Creator**: Rekomendasikan AI Studio, Broadcast Hub, Content Calendar
   - **HRD/Trainer**: Rekomendasikan Skills Matrix, Exam Center, Learning Path, Sertifikat Digital
4. **Navigatif**: Sertakan link halaman yang relevan. Format: [Nama Fitur](/path)
5. **Follow-up**: Akhiri setiap jawaban dengan pertanyaan lanjutan atau saran aksi

## TENTANG CHAESA LIVE
Chaesa Live adalah platform all-in-one yang menggabungkan:
- **Live Streaming/Video Conference** (seperti Zoom/Google Meet)
- **AI Content Generator** (ubah rekaman → kursus, slides, quiz, podcast, ebook)
- **Live Commerce** (jual produk saat live)
- **LMS & Sertifikasi** (learning management + ujian kompetensi)
- **Marketing Tools** (broadcast, content calendar, AI caption)
- **Visual Learning** (storybook bergambar interaktif)

Siklus utama: **Live → AI Proses → Konten Siap Jual → Marketing → Live Lagi**

## FITUR LENGKAP (WAJIB DIKUASAI)

### Segmen 1: PEMBELAJAR (Belajar)
1. **Micro-Learning** (/micro-learning)
   - AI memotong meeting 2 jam → 20 modul (5-7 menit)
   - Setiap modul: video, slides, quiz, podcast, ebook
   - Gamifikasi: XP, badge, achievement
   - Progress tracking: persentase, waktu belajar, skor quiz

2. **Learning Path** (/learning-path)
   - Jalur belajar terstruktur: Beginner → Intermediate → Advanced
   - 6 template siap pakai: Digital Marketing, Full-Stack Dev, Project Manager, Content Creator Pro, HR Professional, Data Analyst
   - Setiap stage: modul, ujian, assignment, XP, badge
   - Gamifikasi: unlock stage, XP tracking, selebrasi

3. **Storybook Visual** (/storybook)
   - Pembelajaran dalam format cerita bergambar interaktif
   - AI generate cerita dari topik apapun (pilih industri + audiens)
   - Scene-by-scene viewer dengan ilustrasi AI
   - Quiz di akhir cerita + ringkasan pelajaran
   - 3 cerita contoh: "Pak Budi Membangun Rumah" (Konstruksi), "Startup Digital Rina" (Teknologi), "Dokter Muda di Desa" (Kesehatan)
   - 6 kategori industri: Konstruksi, Bisnis, Teknologi, Kesehatan, Pendidikan, Marketing

4. **Ujian & Sertifikasi** (/sertifikasi)
   - Pusat ujian kompetensi
   - Buat ujian: Pilihan Ganda, Benar/Salah, Essay, Penilaian Praktis
   - 8 kategori: IT & Digital, Manajemen, Komunikasi, Marketing, Keuangan, Leadership, Customer Service, Safety & Compliance
   - Timer countdown, navigasi soal, auto-submit
   - AI auto-generate soal dari topik apapun
   - Hasil langsung: skor, pass/fail, review per soal

5. **Sertifikat Digital** (/sertifikat)
   - Generate sertifikat profesional setelah lulus ujian/kursus
   - ID unik (CL-XXXX-XXXX-XXXX-XXXX) + QR code verifikasi
   - Print/download sertifikat
   - Verifikasi keaslian oleh siapapun via ID
   - Koleksi "Sertifikat Saya"

### Segmen 2: CONTENT CREATOR (Creator Tools)
6. **AI Studio** (/ai-studio)
   - Generate kursus micro-learning dari rekaman meeting
   - Auto-buat slides, quiz, podcast (2 AI host), ebook
   - Analisis meeting: insights, action items

7. **Dashboard Kreator** (/creator-dashboard)
   - Statistik: Views, Subscribers, Engagement Rate, Revenue
   - Filter waktu (7/30/90 hari)
   - Quick actions: Start Live, Create Content, Broadcast
   - Performa konten & channel breakdown

8. **Broadcast Hub** (/broadcast)
   - WhatsApp Blast: kirim pesan ke banyak kontak
   - Email Campaign: compose dengan subject/body
   - Social Media: share ke Twitter, Facebook, LinkedIn, copy caption
   - AI Caption Generator: generate caption + hashtag + waktu posting terbaik
   - Template siap pakai (promo, event, konten baru, reminder)
   - Manajemen audience & jadwal broadcast

9. **Content Calendar** (/content-calendar)
   - Kalender bulanan/mingguan
   - Color-coded: Live (hijau), Broadcast (biru), Konten (ungu)
   - Tambah/edit/hapus rencana konten

### Segmen 3: HRD & TRAINING
10. **Skills Matrix & Gap Analysis** (/skills-matrix)
    - 6 framework kompetensi siap pakai: Digital Marketing, Software Dev, PM, Leadership, Customer Service, Data Analytics
    - Rating skill anggota tim (1-5 bintang)
    - Radar/spider chart SVG
    - Gap analysis: current vs required
    - AI recommendation training berdasarkan gap
    - Skill passport individual
    - Export laporan

11. **Exam Center** (menggunakan /sertifikasi)
    - Sama dengan Ujian & Sertifikasi, tapi dari sudut pandang HRD
    - HRD buat ujian untuk karyawan
    - Track hasil ujian per karyawan

12. **Training Path** (menggunakan /learning-path)
    - Sama dengan Learning Path, tapi untuk training karyawan
    - HRD membuat jalur training terstruktur

### Fitur INTI
13. **Live Streaming / Meeting** (/schedule, /meeting/[id])
    - Video conference WebRTC
    - Jadwal live session
    - Share via WhatsApp, Email, copy link
    - Meeting code otomatis (XXXX-XXXX-XXXX)
    - Studio Mode untuk streaming (OBS compatible)
    - Original Sound (audio tanpa processing)
    - Live Sales CTA (push tombol "Beli Sekarang")
    - Recording, reactions, polls, whiteboard, breakout rooms

14. **Pembayaran** (/pricing)
    - Payment gateway: Mayar.id
    - Paket: Gratis (40 menit, 100 peserta), Pro (Rp 99K/bln), Business (Rp 199K/bln), 1 Tahun (Rp 999K)
    - Metode: Kartu Kredit, Transfer Bank, E-Wallet, QRIS

15. **Auth** (/auth)
    - Register dengan email + password
    - Login, Google OAuth
    - Guest user untuk join meeting tanpa akun

## GAYA RESPONS
- Untuk pertanyaan tentang fitur: jelaskan + berikan link halaman + sarankan langkah berikutnya
- Untuk user bingung: tanyakan dulu "Kamu lebih tertarik sebagai Pembelajar, Content Creator, atau dari sisi HRD/Training?"
- Untuk troubleshooting: berikan solusi step-by-step
- Untuk perbandingan: gunakan tabel perbandingan
- Selalu akhiri dengan SATU pertanyaan lanjutan atau saran aksi yang spesifik

## KAPAN ESCALATE KE HUMAN
- Komplain serius / refund / bug critical
- User bilang "mau bicara dengan CS/manusia"
- Masalah billing/pembayaran yang tidak bisa diselesaikan`;

interface KnowledgeEntry {
  keywords: string[];
  patterns: RegExp[];
  response: string;
  weight: number;
}

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ["halo", "hai", "hello", "hi", "hey", "selamat pagi", "selamat siang", "selamat sore", "selamat malam", "apa kabar"],
    patterns: [/^(hi|hello|hey|halo|hai|hola)$/i, /^(hi|hello|hey|halo|hai)\b.{0,10}$/i, /^selamat (pagi|siang|sore|malam)/i, /apa kabar/i],
    weight: 10,
    response: `Halo Kak! Saya **Chaesa**, konsultan AI Kamu di Chaesa Live.

Saya bisa membantu Kamu dengan banyak hal:

**Untuk Belajar:**
- [Micro-Learning](/micro-learning) — Kursus singkat dari rekaman meeting
- [Learning Path](/learning-path) — Jalur belajar terstruktur
- [Storybook Visual](/storybook) — Belajar lewat cerita bergambar
- [Ujian & Sertifikasi](/sertifikasi) — Uji kompetensi + sertifikat

**Untuk Content Creator:**
- [AI Studio](/ai-studio) — Generate kursus otomatis
- [Broadcast Hub](/broadcast) — WhatsApp blast, email, sosmed
- [Content Calendar](/content-calendar) — Rencana konten

**Untuk HRD & Training:**
- [Skills Matrix](/skills-matrix) — Peta kompetensi tim
- [Exam Center](/sertifikasi) — Buat ujian karyawan
- [Training Path](/learning-path) — Jalur training

Kamu lebih tertarik fitur yang mana? Atau ceritakan kebutuhan Kamu, saya bantu carikan solusinya!`
  },
  {
    keywords: ["apa itu chaesa", "tentang chaesa", "chaesa itu apa", "chaesa live apa", "apa chaesa", "platform apa"],
    patterns: [/apa (itu )?chaesa/i, /chaesa (itu |live )?apa/i, /tentang chaesa/i, /platform (apa|ini)/i],
    weight: 8,
    response: `**Chaesa Live** adalah platform all-in-one yang menggabungkan:

1. **Live Streaming** — Video conference seperti Zoom/Google Meet
2. **AI Content Generator** — Ubah rekaman → kursus, slides, quiz, podcast, ebook dalam 15 menit
3. **Live Commerce** — Jual produk langsung saat live (push "Beli Sekarang")
4. **LMS & Sertifikasi** — Learning management + ujian kompetensi + sertifikat digital
5. **Marketing Tools** — Broadcast WhatsApp/email, content calendar, AI caption
6. **Visual Learning** — Storybook bergambar interaktif

**Yang membedakan dari kompetitor:**
| Fitur | Zoom | Udemy | **Chaesa Live** |
|-------|------|-------|-----------------|
| Video conference | Ya | Tidak | **Ya** |
| AI → kursus | Tidak | Tidak | **Ya** |
| Live commerce | Tidak | Tidak | **Ya** |
| Sertifikasi | Tidak | Terbatas | **Ya + AI** |
| Marketing tools | Tidak | Tidak | **Ya** |

Kamu mau tahu lebih detail tentang fitur tertentu?`
  },
  {
    keywords: ["fitur", "feature", "bisa apa", "apa aja", "apa saja", "kemampuan"],
    patterns: [/fitur/i, /bisa apa/i, /apa (aja|saja)/i, /kemampuan/i, /feature/i],
    weight: 8,
    response: `Berikut semua fitur Chaesa Live:

**Untuk Pembelajar:**
- [Micro-Learning](/micro-learning) — Kursus 5-7 menit dari rekaman meeting
- [Learning Path](/learning-path) — Jalur belajar Beginner→Advanced + gamifikasi
- [Storybook Visual](/storybook) — Cerita bergambar AI interaktif
- [Ujian & Sertifikasi](/sertifikasi) — Ujian kompetensi 8 kategori
- [Sertifikat Digital](/sertifikat) — Sertifikat + QR verification

**Untuk Content Creator:**
- [AI Studio](/ai-studio) — Generate kursus dari meeting (slides, quiz, podcast, ebook)
- [Dashboard Kreator](/creator-dashboard) — Analytics, views, revenue
- [Broadcast Hub](/broadcast) — WA blast + email + sosmed + AI caption
- [Content Calendar](/content-calendar) — Jadwal konten bulanan/mingguan

**Untuk HRD & Training:**
- [Skills Matrix](/skills-matrix) — Radar chart kompetensi + gap analysis
- [Exam Center](/sertifikasi) — Buat ujian untuk karyawan
- [Training Path](/learning-path) — Jalur training terstruktur
- [Sertifikat Digital](/sertifikat) — Sertifikat + verifikasi

**Fitur Inti:**
- [Jadwal Live](/schedule) — Buat & kelola jadwal live streaming
- [Harga](/pricing) — Paket mulai GRATIS sampai Rp 999K/tahun

Mau saya jelaskan fitur tertentu lebih detail?`
  },
  {
    keywords: ["harga", "biaya", "paket", "price", "berapa", "langganan", "subscribe", "bayar berapa", "cost", "tarif"],
    patterns: [/harga/i, /berapa (biaya|harga|bulan)/i, /paket.*(harga|apa)/i, /(biaya|tarif)/i, /berapa.*bayar/i, /bayar.*berapa/i],
    weight: 8,
    response: `Berikut info harga lengkap:

| Paket | Harga | Fitur Utama |
|-------|-------|-------------|
| **Gratis** | Rp 0 | 40 menit, 100 peserta, fitur basic |
| **Pro** | Rp 99K/bln | Unlimited meeting, AI features, Live Sales CTA, Studio Mode |
| **Business** | Rp 199K/bln | 300 peserta, analytics, custom branding |
| **1 Tahun** | Rp 999K | Semua fitur Pro, hemat 16% |

Perbandingan: Zoom Pro = Rp 240K/bln (tanpa AI). Chaesa Pro = Rp 99K/bln + semua fitur AI.

Lihat detail di halaman [Harga](/pricing).

Mau langsung berlangganan atau ada pertanyaan tentang paket tertentu?`
  },
  {
    keywords: ["storybook", "cerita", "visual learning", "cerita bergambar", "story", "storytelling"],
    patterns: [/storybook/i, /cerita.*bergambar/i, /visual.*learning/i, /story.*telling/i, /belajar.*cerita/i, /cerita.*belajar/i],
    weight: 8,
    response: `**Storybook Visual** — belajar melalui cerita bergambar interaktif!

Fitur ini mengubah topik pembelajaran yang membosankan jadi cerita yang menarik dengan karakter, alur, dan ilustrasi AI.

**Contoh cerita yang tersedia:**
- "Pak Budi Membangun Rumah Impian" — belajar Project Management
- "Startup Digital Rina" — belajar Entrepreneurship
- "Dokter Muda di Desa" — belajar Leadership & Empati

**Fitur Storybook:**
- AI generate cerita dari topik APAPUN
- Ilustrasi AI per scene
- Navigasi scene-by-scene
- Quiz interaktif di akhir
- Ringkasan pelajaran
- 6 kategori industri

Coba langsung di [Storybook Visual](/storybook)!

Mau buat cerita tentang topik apa?`
  },
  {
    keywords: ["sertifikasi", "ujian", "exam", "sertifikat", "kompetensi", "certificate", "test kompetensi"],
    patterns: [/sertifika/i, /ujian/i, /exam/i, /kompetensi/i, /certificate/i, /test.*kompetensi/i],
    weight: 8,
    response: `**Ujian & Sertifikasi** — sistem kompetensi lengkap!

**Buat Ujian** (untuk HRD/Trainer):
- 4 jenis soal: Pilihan Ganda, Benar/Salah, Essay, Penilaian Praktis
- 8 kategori: IT, Manajemen, Komunikasi, Marketing, Keuangan, Leadership, Customer Service, Safety
- AI auto-generate soal dari topik apapun
- Set passing score & time limit

**Ambil Ujian** (untuk Learner):
- Timer countdown, navigasi soal
- Auto-submit saat waktu habis
- Hasil langsung: skor, pass/fail
- Review jawaban per soal

**Sertifikat Digital:**
- Otomatis setelah lulus ujian
- ID unik + QR code verifikasi
- Print/download PDF
- Siapapun bisa verifikasi keaslian

Coba di [Ujian & Sertifikasi](/sertifikasi) atau lihat [Sertifikat Saya](/sertifikat).

Kamu mau buat ujian atau ambil ujian?`
  },
  {
    keywords: ["skills matrix", "gap analysis", "kompetensi tim", "peta kompetensi", "radar chart", "skill", "hrd"],
    patterns: [/skills?\s*matrix/i, /gap\s*analysis/i, /kompetensi\s*tim/i, /peta\s*kompetensi/i, /radar\s*chart/i, /\bhrd\b/i],
    weight: 8,
    response: `**Skills Matrix & Gap Analysis** — peta kompetensi tim untuk HRD!

**Fitur:**
- 6 framework kompetensi siap pakai (Digital Marketing, Software Dev, PM, Leadership, Customer Service, Data Analytics)
- Rating skill anggota tim (1-5 bintang)
- Radar/spider chart visual
- Gap analysis: bandingkan current vs required level
- AI recommendation training berdasarkan gap
- Skill passport individual per anggota
- Export laporan sebagai teks

**Cocok untuk:**
- HR Manager yang mau mapping kompetensi tim
- Training Manager yang perlu identifikasi gap
- Team Lead yang mau track perkembangan anggota

Coba langsung di [Skills Matrix](/skills-matrix)!

Sudah punya tim yang mau dianalisis?`
  },
  {
    keywords: ["learning path", "jalur belajar", "roadmap", "training path", "path belajar"],
    patterns: [/learning\s*path/i, /jalur\s*belajar/i, /roadmap/i, /training\s*path/i, /path\s*belajar/i],
    weight: 8,
    response: `**Learning Path Builder** — jalur belajar terstruktur!

**6 Template Siap Pakai:**
- Digital Marketing Specialist
- Full-Stack Developer
- Project Manager
- Content Creator Pro
- HR Professional
- Data Analyst

**Fitur:**
- Buat path custom: Beginner → Intermediate → Advanced
- Setiap stage: modul, ujian, assignment
- Minimum score untuk unlock stage berikutnya
- Gamifikasi: XP, badge, selebrasi
- Visual timeline/roadmap progression

Coba di [Learning Path](/learning-path)!

Mau mulai dari template atau buat path sendiri?`
  },
  {
    keywords: ["broadcast", "whatsapp blast", "email campaign", "marketing", "caption", "hashtag"],
    patterns: [/broadcast/i, /whatsapp.*blast/i, /email.*campaign/i, /caption/i, /hashtag/i, /blast/i],
    weight: 7,
    response: `**Broadcast Hub** — kirim pesan ke banyak orang sekaligus!

**3 Channel:**
- WhatsApp Blast — kirim ke banyak kontak via WA
- Email Campaign — compose + kirim email massal
- Social Media — share ke Twitter, Facebook, LinkedIn

**AI Caption Generator:**
- Ketik topik → AI buatkan caption + hashtag + waktu posting terbaik
- Support 5 platform: Instagram, TikTok, YouTube, LinkedIn, Twitter
- 3 tone: Fun, Professional, Viral

**Fitur Lain:**
- Template siap pakai (promo, event, konten baru, reminder)
- Manajemen audience (import CSV)
- Jadwal broadcast

Coba di [Broadcast Hub](/broadcast)!

Mau kirim broadcast atau generate caption AI dulu?`
  },
  {
    keywords: ["creator", "kreator", "dashboard", "analytics", "content calendar", "kalender", "konten"],
    patterns: [/creator/i, /kreator/i, /dashboard/i, /analytics/i, /content.*calendar/i, /kalender.*konten/i],
    weight: 7,
    response: `**Creator Tools** — tools lengkap untuk content creator!

**Dashboard Kreator** (/creator-dashboard):
- Statistik: Views, Subscribers, Engagement Rate, Revenue
- Filter waktu (7/30/90 hari)
- Quick actions: Start Live, Create Content, Broadcast
- Performa konten & channel breakdown

**Content Calendar** (/content-calendar):
- Kalender bulanan & mingguan
- Color-coded: Live (hijau), Broadcast (biru), Konten (ungu)
- Tambah/edit/hapus rencana konten

**Broadcast Hub** (/broadcast):
- WhatsApp blast, email campaign, social media sharing
- AI Caption Generator

Coba di [Dashboard Kreator](/creator-dashboard) atau [Content Calendar](/content-calendar)!

Fitur mana yang mau Kamu coba duluan?`
  },
  {
    keywords: ["micro learning", "micro-learning", "microlearning", "modul micro", "modul belajar", "kursus"],
    patterns: [/micro.?learning/i, /modul.*(belajar|learning|micro)/i, /apa itu micro/i, /kursus/i],
    weight: 7,
    response: `**Micro-Learning** — belajar efektif dalam modul pendek!

AI otomatis memotong meeting 2 jam jadi 20 modul (5-7 menit), lengkap dengan:
- Video tiap modul
- Slides otomatis
- Quiz + penjelasan jawaban
- Podcast dengan 2 AI host
- PDF summary

**Gamifikasi:**
- XP dan badge per modul
- Achievement: First Steps (10 XP), Quick Learner (50 XP), Course Master (100 XP)
- Progress tracking: persentase, waktu belajar, skor

**Kenapa efektif?**
- Attention span manusia ~7 menit
- Completion rate lebih tinggi
- Bisa diulang kapan saja
- Hemat 90% waktu vs manual

Coba di [Micro-Learning](/micro-learning)!

Mau buat kursus dari meeting atau belajar kursus yang sudah ada?`
  },
  {
    keywords: ["cara mulai", "getting started", "tutorial", "mulai", "daftar", "register", "sign up", "buat akun", "login", "masuk"],
    patterns: [/cara (mulai|daftar|buat akun|register|login|masuk)/i, /getting started/i, /tutorial/i, /bagaimana.*(mulai|daftar)/i],
    weight: 7,
    response: `Sangat mudah, Kak!

**Cara Daftar:**
1. Klik [Daftar Gratis](/auth?mode=register) di website
2. Masukkan nama, email & password
3. Atau daftar via Google (lebih cepat)
4. Akun langsung aktif!

**Setelah Daftar, Coba:**
- [Jadwal Live](/schedule) — buat jadwal live pertama
- [Micro-Learning](/micro-learning) — coba buat kursus dari meeting
- [Storybook](/storybook) — baca cerita bergambar interaktif
- [Skills Matrix](/skills-matrix) — mapping kompetensi tim

**Tips Pemula:**
- Mulai dari paket Gratis (40 menit, 100 peserta)
- Coba semua fitur dulu sebelum upgrade
- Gunakan Chrome/Edge untuk performa terbaik

Mau langsung [Daftar](/auth?mode=register) atau ada pertanyaan lain?`
  },
  {
    keywords: ["ai", "artificial intelligence", "ai studio", "generate", "otomatis"],
    patterns: [/ai.*(studio|course|factory|generate)/i, /(course|kursus).*(ai|otomatis|generate)/i, /ai studio/i, /artificial intelligence/i],
    weight: 7,
    response: `**AI Studio** — pusat AI content generation!

**Cara Kerja:**
1. Rekam meeting/webinar Kamu
2. AI memproses rekaman otomatis
3. Dalam 15 menit, Kamu dapat:
   - 20 modul micro-learning (5-7 menit)
   - Slides presentasi otomatis
   - Quiz + penjelasan jawaban
   - Podcast dengan 2 AI host
   - PDF ebook & study guide

**Perbandingan:**
- Manual: 12+ jam kerja
- Chaesa AI: 15 menit saja!

**AI Lainnya di Chaesa:**
- AI Caption Generator — caption + hashtag + waktu posting
- AI Exam Generator — auto-generate soal ujian
- AI Story Generator — buat cerita bergambar dari topik
- AI Training Recommendation — rekomendasi training dari gap analysis

Coba di [AI Studio](/ai-studio)!

Mau generate kursus atau gunakan fitur AI lainnya?`
  },
  {
    keywords: ["live", "meeting", "webinar", "video conference", "jadwal", "schedule", "streaming"],
    patterns: [/live.*(stream|meeting|webinar)/i, /jadwal.*(live|meeting)/i, /video.*conference/i, /schedule/i, /streaming/i],
    weight: 7,
    response: `**Live Streaming & Meeting** — inti dari Chaesa Live!

**Fitur Meeting:**
- Video conference WebRTC
- Auto-generate meeting code (XXXX-XXXX-XXXX)
- Share via WhatsApp, Email, copy link
- Recording, reactions, polls, whiteboard
- Breakout rooms

**Fitur Pro:**
- Studio Mode — hide UI untuk streaming OBS
- Original Sound — audio tanpa processing
- Live Sales CTA — push "Beli Sekarang" ke viewer
- Unlimited duration

**Jadwal Live:**
- Buat jadwal live session
- Kelola upcoming/live/ended
- Share jadwal otomatis

Coba di [Jadwal Live](/schedule)!

Mau buat jadwal live atau tanya tentang fitur meeting tertentu?`
  },
  {
    keywords: ["error", "masalah", "gak bisa", "tidak bisa", "rusak", "help", "bantuan", "kendala", "trouble", "gagal"],
    patterns: [/gak bisa/i, /tidak bisa/i, /error/i, /masalah/i, /rusak/i, /help/i, /kendala/i, /trouble/i, /gagal/i],
    weight: 6,
    response: `Ada kendala ya Kak? Tenang, saya bantu!

**Kamera Tidak Muncul:**
- Cek permission browser (izinkan akses kamera)
- Coba browser Chrome/Edge
- Restart browser

**Masalah Audio:**
- Aktifkan 'Original Sound' mode
- Cek permission microphone
- Tutup app lain yang pakai mic

**Koneksi Terputus:**
- Cek internet (minimal 5 Mbps)
- Matikan VPN sementara
- Kurangi tab browser

**AI Tidak Bisa Generate:**
- Pastikan meeting sudah direkam
- Tunggu 2-3 menit untuk processing
- Cek paket Kamu (harus Pro/Business)

Bisa ceritakan masalah spesifiknya? Atau ketik "hubungi CS" untuk bicara dengan tim support.`
  },
  {
    keywords: ["vs zoom", "banding", "compare", "beda", "zoom", "google meet", "teams", "perbandingan", "udemy"],
    patterns: [/vs.*(zoom|meet|teams|udemy)/i, /(zoom|meet|teams|udemy).*vs/i, /banding/i, /perbandingan/i, /beda.*(zoom|meet|platform)/i],
    weight: 7,
    response: `Perbandingan lengkap:

| Fitur | Zoom | Google Meet | Udemy | **Chaesa Live** |
|-------|------|-------------|-------|-----------------|
| Video conference | Ya | Ya | Tidak | **Ya** |
| AI → kursus | Tidak | Tidak | Tidak | **Ya** |
| Live commerce | Tidak | Tidak | Tidak | **Ya** |
| Sertifikasi | Tidak | Tidak | Terbatas | **Ya + AI** |
| Skills matrix | Tidak | Tidak | Tidak | **Ya** |
| Storybook visual | Tidak | Tidak | Tidak | **Ya** |
| Broadcast marketing | Tidak | Tidak | Tidak | **Ya** |
| Harga/bln | Rp 240K | Rp 150K | Free (50% komisi) | **Rp 99K** |

Singkatnya: Chaesa = Meeting + AI + LMS + Marketing, semua dalam satu platform dengan harga lebih terjangkau.

Mau coba langsung?`
  },
  {
    keywords: ["bayar", "payment", "pembayaran", "transfer", "kartu kredit", "gopay", "ovo", "dana", "qris"],
    patterns: [/bayar/i, /payment/i, /pembayaran/i, /transfer/i, /kartu.*(kredit|debit)/i, /(gopay|ovo|dana|qris)/i],
    weight: 7,
    response: `Metode pembayaran yang tersedia:

- Kartu Kredit/Debit (Visa, Mastercard, JCB)
- Transfer Bank (semua bank utama Indonesia)
- E-Wallet (GoPay, OVO, Dana, ShopeePay)
- QRIS (scan & bayar)

Proses via Mayar.id (certified secure). Data kartu TIDAK disimpan di server kami.

Lihat paket lengkap di [Halaman Harga](/pricing).

Mau langsung berlangganan?`
  },
  {
    keywords: ["kontak", "hubungi", "contact", "manusia", "support", "cs", "customer service", "komplain"],
    patterns: [/kontak/i, /hubungi/i, /contact/i, /manusia/i, /support/i, /customer.*service/i, /\bcs\b/i, /komplain/i, /bicara.*(manusia|cs)/i],
    weight: 8,
    response: `Baik Kak, berikut pilihan support:

- Email: support@chaesa.live (response maks 24 jam)
- Live Chat: Senin-Jumat, 09:00-17:00 WIB
- Discord Community: 24/7

Mau saya hubungkan ke tim support sekarang?`
  },
  {
    keywords: ["refund", "batal", "cancel", "uang kembali", "pengembalian"],
    patterns: [/refund/i, /batal.*(langganan|subscribe)/i, /cancel/i, /uang.*kembali/i, /pengembalian/i],
    weight: 9,
    response: `Untuk refund dan pembatalan:

- Garansi uang kembali 7 hari setelah pembelian
- Proses refund 3-5 hari kerja
- Pembatalan: Settings → Billing → Batalkan Langganan
- Akses tetap aktif sampai masa berlaku habis

Untuk proses refund, hubungi tim support: support@chaesa.live`
  },
  {
    keywords: ["terima kasih", "makasih", "thanks", "thank you", "thx"],
    patterns: [/terima.*kasih/i, /makasih/i, /thanks/i, /thank.*you/i, /thx/i],
    weight: 10,
    response: `Sama-sama, Kak!

Senang bisa membantu. Jangan ragu tanya lagi kapan saja!

Btw, sudah coba fitur terbaru kami? [Storybook Visual](/storybook) — belajar lewat cerita bergambar AI. Sangat menarik!`
  },
  {
    keywords: ["pembelajar", "belajar", "mau belajar", "student", "pelajar"],
    patterns: [/pembelajar/i, /mau belajar/i, /student/i, /pelajar/i, /saya.*belajar/i],
    weight: 7,
    response: `Untuk Kamu yang mau belajar, berikut rekomendasi saya:

**Mulai dari sini:**
1. [Storybook Visual](/storybook) — Baca cerita bergambar interaktif, cara belajar paling menyenangkan!
2. [Learning Path](/learning-path) — Pilih jalur belajar terstruktur (ada 6 template)
3. [Micro-Learning](/micro-learning) — Kursus singkat 5-7 menit per modul

**Setelah belajar:**
4. [Ujian & Sertifikasi](/sertifikasi) — Uji kompetensi Kamu
5. [Sertifikat Digital](/sertifikat) — Dapatkan sertifikat + QR verifikasi

Semua gratis untuk dicoba!

Mau mulai dari mana? Saya rekomendasikan Storybook Visual karena paling menyenangkan untuk pemula.`
  },
  {
    keywords: ["content creator", "kreator konten", "influencer", "youtuber", "tiktoker"],
    patterns: [/content.*creator/i, /kreator.*konten/i, /influencer/i, /youtuber/i, /tiktoker/i],
    weight: 7,
    response: `Untuk Content Creator, ini tools yang wajib Kamu coba:

**Langkah 1: Buat Konten**
- [AI Studio](/ai-studio) — Generate kursus dari meeting/webinar
- [Jadwal Live](/schedule) — Buat jadwal live streaming

**Langkah 2: Kelola & Analisis**
- [Dashboard Kreator](/creator-dashboard) — Pantau views, engagement, revenue
- [Content Calendar](/content-calendar) — Rencana konten bulanan

**Langkah 3: Promosikan**
- [Broadcast Hub](/broadcast) — WA blast, email campaign, sosmed
- AI Caption Generator — Caption + hashtag otomatis

**Bonus:**
- Studio Mode — Streaming via OBS tanpa UI mengganggu
- Live Sales CTA — Jual produk langsung saat live (konversi 3-5x!)
- Marketplace — Jual kursus dengan komisi hanya 30%

Mau mulai dari buat konten atau promosi dulu?`
  },
  {
    keywords: ["training", "pelatihan", "employee", "karyawan", "onboarding"],
    patterns: [/training/i, /pelatihan/i, /employee/i, /karyawan/i, /onboarding/i],
    weight: 7,
    response: `Untuk HRD & Training, Chaesa Live punya tools lengkap:

**Assessment & Mapping:**
- [Skills Matrix](/skills-matrix) — Mapping kompetensi tim, radar chart, gap analysis
- AI Recommendation — Rekomendasi training berdasarkan gap

**Training & Pembelajaran:**
- [Training Path](/learning-path) — Jalur training terstruktur untuk karyawan
- [Storybook Visual](/storybook) — Training via cerita interaktif
- [Micro-Learning](/micro-learning) — Modul training singkat

**Ujian & Sertifikasi:**
- [Exam Center](/sertifikasi) — Buat ujian kompetensi karyawan
- AI auto-generate soal — Hemat waktu buat soal
- [Sertifikat Digital](/sertifikat) — Sertifikat + QR verifikasi

**Workflow HRD:**
1. Mapping kompetensi → Skills Matrix
2. Identifikasi gap → Gap Analysis
3. Buat training → Learning Path
4. Ujian → Exam Center
5. Sertifikasi → Sertifikat Digital

Mau mulai dari mapping kompetensi tim atau buat program training?`
  },
];

function generateSmartResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();

  if (!lowerMessage || lowerMessage.length < 2) {
    return "Maaf, bisa Kamu ulangi pertanyaannya? Saya siap membantu!";
  }

  let bestMatch: KnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;

    for (const pattern of entry.patterns) {
      if (pattern.test(lowerMessage)) {
        score += entry.weight * 4;
      }
    }

    for (const keyword of entry.keywords) {
      const kw = keyword.toLowerCase();
      if (lowerMessage.includes(kw)) {
        const kwWordCount = kw.split(/\s+/).length;
        score += entry.weight * (1 + kwWordCount);
        if (lowerMessage === kw) {
          score += entry.weight * 3;
        }
      }
    }

    const words = lowerMessage.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      for (const keyword of entry.keywords) {
        const kwWords = keyword.toLowerCase().split(/\s+/);
        for (const kwWord of kwWords) {
          if (kwWord.length > 3 && word === kwWord) {
            score += 2;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore >= 6) {
    return bestMatch.response;
  }

  return `Terima kasih sudah bertanya, Kak!

Saya bisa membantu Kamu dengan banyak hal. Coba tanyakan tentang:

**Fitur Platform:**
- [Micro-Learning](/micro-learning), [Storybook](/storybook), [Learning Path](/learning-path)
- [Ujian & Sertifikasi](/sertifikasi), [Skills Matrix](/skills-matrix)
- [Broadcast Hub](/broadcast), [AI Studio](/ai-studio)

**Info Lain:**
- Harga & paket langganan
- Cara daftar & mulai
- Troubleshooting teknis

Atau ceritakan kebutuhan Kamu — sebagai **Pembelajar**, **Content Creator**, atau **HRD/Trainer** — saya bantu carikan solusi terbaiknya!`;
}

function detectEscalation(userMessage: string, botReply: string): boolean {
  const escalationKeywords = [
    "ngomong sama manusia", "bicara langsung", "bicara dengan cs",
    "bicara sama cs", "mau bicara dengan manusia", "mau komplain",
    "refund", "batal langganan", "bug parah", "error terus",
    "broken", "legal", "hukum", "hubungi cs",
  ];

  const userLower = userMessage.toLowerCase();
  if (escalationKeywords.some((keyword) => userLower.includes(keyword))) {
    return true;
  }

  const botLower = botReply.toLowerCase();
  if (botLower.includes("hubungi tim support") || botLower.includes("hubungi cs")) {
    return true;
  }

  return false;
}

const FEATURE_LINK_MAP: Record<string, { label: string; path: string }> = {
  "micro-learning": { label: "Micro-Learning", path: "/micro-learning" },
  "learning-path": { label: "Learning Path", path: "/learning-path" },
  "storybook": { label: "Storybook Visual", path: "/storybook" },
  "sertifikasi": { label: "Ujian & Sertifikasi", path: "/sertifikasi" },
  "sertifikat": { label: "Sertifikat Digital", path: "/sertifikat" },
  "skills-matrix": { label: "Skills Matrix", path: "/skills-matrix" },
  "broadcast": { label: "Broadcast Hub", path: "/broadcast" },
  "creator-dashboard": { label: "Dashboard Kreator", path: "/creator-dashboard" },
  "content-calendar": { label: "Content Calendar", path: "/content-calendar" },
  "ai-studio": { label: "AI Studio", path: "/ai-studio" },
  "schedule": { label: "Jadwal Live", path: "/schedule" },
  "pricing": { label: "Harga", path: "/pricing" },
  "auth": { label: "Daftar/Login", path: "/auth" },
  "dashboard": { label: "Dashboard Progress", path: "/dashboard" },
};

function extractFeatureLinks(botReply: string, userMessage: string): { label: string; path: string }[] {
  const links: { label: string; path: string }[] = [];
  const seen = new Set<string>();
  const combined = (botReply + " " + userMessage).toLowerCase();

  for (const [key, value] of Object.entries(FEATURE_LINK_MAP)) {
    const keyNormalized = key.replace(/-/g, " ");
    if (combined.includes(value.path) || combined.includes(keyNormalized) || combined.includes(value.label.toLowerCase())) {
      if (!seen.has(value.path)) {
        links.push(value);
        seen.add(value.path);
      }
    }
  }

  return links.slice(0, 4);
}

function generateQuickReplies(userMessage: string, currentPage?: string): string[] {
  const lower = userMessage.toLowerCase();

  if (lower.match(/^(hi|hello|hey|halo|hai|p)\b/i) || lower.includes("selamat")) {
    return ["Saya mau belajar", "Saya content creator", "Untuk HRD/Training", "Fitur apa saja?"];
  }

  if (lower.includes("harga") || lower.includes("biaya") || lower.includes("paket") || lower.includes("berapa")) {
    return ["Daftar gratis", "Fitur paket Pro?", "Bandingkan dengan Zoom"];
  }

  if (lower.includes("belajar") || lower.includes("pembelajar") || lower.includes("student")) {
    return ["Storybook Visual", "Learning Path", "Ujian & Sertifikasi", "Micro-Learning"];
  }

  if (lower.includes("creator") || lower.includes("kreator") || lower.includes("konten")) {
    return ["AI Studio", "Broadcast Hub", "Content Calendar", "Dashboard Kreator"];
  }

  if (lower.includes("hrd") || lower.includes("training") || lower.includes("karyawan")) {
    return ["Skills Matrix", "Exam Center", "Training Path", "Sertifikat Digital"];
  }

  if (lower.includes("storybook") || lower.includes("cerita")) {
    return ["Buat cerita baru", "Cerita apa saja?", "Cara kerja Storybook"];
  }

  if (lower.includes("sertifika") || lower.includes("ujian") || lower.includes("exam")) {
    return ["Buat ujian baru", "Ambil ujian", "Lihat sertifikat saya"];
  }

  if (lower.includes("error") || lower.includes("masalah") || lower.includes("gak bisa")) {
    return ["Masalah kamera", "Masalah audio", "Koneksi terputus", "Hubungi CS"];
  }

  if (currentPage) {
    const pageReplies: Record<string, string[]> = {
      "/storybook": ["Buat cerita baru", "Topik cerita apa?", "Cara kerja Storybook"],
      "/sertifikasi": ["Buat ujian baru", "Kategori ujian", "AI generate soal"],
      "/skills-matrix": ["Cara pakai Skills Matrix", "Framework apa saja?", "Export laporan"],
      "/learning-path": ["Template apa saja?", "Buat path custom", "Gamifikasi"],
      "/broadcast": ["AI Caption Generator", "WhatsApp blast", "Template broadcast"],
      "/micro-learning": ["Buat kursus baru", "Cara kerja AI", "Format konten"],
    };
    if (pageReplies[currentPage]) return pageReplies[currentPage];
  }

  return ["Fitur apa saja?", "Saya mau belajar", "Untuk HRD/Training", "Berapa harganya?"];
}
