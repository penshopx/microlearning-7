import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import {
  BookOpen, Plus, ChevronLeft, ChevronRight, Search,
  Play, Star, Clock, Users, Award, ArrowLeft,
  Sparkles, CheckCircle, XCircle, RefreshCw, Eye,
  Trash2, Loader2, BookMarked, GraduationCap, Heart
} from "lucide-react";

interface StoryCharacter {
  name: string;
  role: string;
  description: string;
}

interface StoryScene {
  sceneNumber: number;
  title: string;
  narration: string;
  visualDescription: string;
  imagePrompt: string;
  learningPoint: string;
  emotion: string;
  imageUrl?: string;
}

interface StoryQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Story {
  id: string;
  title: string;
  synopsis: string;
  characters: StoryCharacter[];
  scenes: StoryScene[];
  quiz: StoryQuiz[];
  learningPoints: string[];
  industry: string;
  targetAudience: string;
  coverImage?: string;
  createdAt: string;
  isSample?: boolean;
}

const INDUSTRIES = [
  { value: "construction", label: "Konstruksi & Properti", icon: "🏗️" },
  { value: "business", label: "Bisnis & Entrepreneurship", icon: "💼" },
  { value: "technology", label: "Teknologi & Digital", icon: "💻" },
  { value: "health", label: "Kesehatan & Medis", icon: "🏥" },
  { value: "education", label: "Pendidikan & Pelatihan", icon: "📚" },
  { value: "marketing", label: "Marketing & Komunikasi", icon: "📢" },
];

const AUDIENCES = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

const EMOTION_COLORS: Record<string, string> = {
  hopeful: "from-amber-500/20 to-yellow-500/20",
  determined: "from-blue-500/20 to-indigo-500/20",
  anxious: "from-orange-500/20 to-red-500/20",
  triumphant: "from-green-500/20 to-emerald-500/20",
  reflective: "from-purple-500/20 to-violet-500/20",
  joyful: "from-pink-500/20 to-rose-500/20",
};

const SAMPLE_STORIES: Story[] = [
  {
    id: "sample-rumah",
    title: "Pak Budi Membangun Rumah Impian",
    synopsis: "Kisah Pak Budi yang belajar tentang manajemen proyek, budgeting, dan kepemimpinan melalui perjalanan membangun rumah untuk keluarganya.",
    characters: [
      { name: "Pak Budi", role: "Kepala Keluarga", description: "Seorang ayah yang bertekad membangun rumah impian untuk keluarga" },
      { name: "Pak Harto", role: "Mandor", description: "Mandor berpengalaman yang menjadi mentor Pak Budi" },
      { name: "Bu Siti", role: "Istri", description: "Istri Pak Budi yang mendukung dan membantu perencanaan" },
    ],
    scenes: [
      {
        sceneNumber: 1,
        title: "Mimpi di Atas Tanah Kosong",
        narration: "Pak Budi berdiri di atas tanah kosong miliknya, memandang lahan yang akan menjadi rumah impiannya. Di tangannya, sebuah sketsa sederhana yang ia gambar bersama Bu Siti. 'Dari sini semua dimulai,' bisiknya dengan penuh harap. Meski tabungannya terbatas, tekadnya membara seperti matahari sore yang menyinari lahan itu.",
        visualDescription: "Pak Budi berdiri di tanah kosong dengan blueprints, matahari terbenam, pohon kelapa",
        imagePrompt: "Indonesian man standing on empty land looking at blueprints, sunset, palm trees",
        learningPoint: "Setiap proyek besar dimulai dari visi yang jelas dan perencanaan matang",
        emotion: "hopeful",
        imageUrl: "/storybook/rumah-scene1.png",
      },
      {
        sceneNumber: 2,
        title: "Merakit Tim yang Solid",
        narration: "Pak Budi bertemu Pak Harto, seorang mandor berpengalaman. 'Membangun rumah bukan soal batu bata saja, Pak. Ini soal mengelola orang, waktu, dan uang,' kata Pak Harto sambil menunjukkan rencana kerja. Bersama, mereka menyusun timeline, menghitung RAB, dan merekrut tukang-tukang terbaik. Bu Siti membantu memilih desain yang efisien.",
        visualDescription: "Tim konstruksi berkumpul di meja dengan denah bangunan, Pak Budi memimpin diskusi",
        imagePrompt: "Construction team meeting around table with building plans, leader pointing",
        learningPoint: "Membangun tim yang tepat dan perencanaan detail adalah fondasi keberhasilan proyek",
        emotion: "determined",
        imageUrl: "/storybook/rumah-scene2.png",
      },
      {
        sceneNumber: 3,
        title: "Fondasi yang Kuat",
        narration: "Pembangunan dimulai! Setiap hari Pak Budi datang ke lokasi, mengawasi progress dan mencatat pengeluaran. 'RAB kita harus tetap on track,' katanya pada Pak Harto. Ia belajar bahwa mengawasi kualitas material dan kedisiplinan jadwal sama pentingnya dengan desain yang bagus. Dinding mulai berdiri satu per satu.",
        visualDescription: "Rumah dalam proses pembangunan, pekerja memasang bata, Pak Budi mengawasi dengan clipboard",
        imagePrompt: "House construction in progress, workers laying bricks, supervisor with clipboard",
        learningPoint: "Eksekusi yang konsisten dan monitoring berkala menjaga proyek tetap on track",
        emotion: "determined",
        imageUrl: "/storybook/rumah-scene3.png",
      },
      {
        sceneNumber: 4,
        title: "Badai Menguji Ketangguhan",
        narration: "Hujan deras datang berhari-hari. Pondasi terendam, material terlambat, dan budget mulai membengkak. Para tukang mulai resah. Tapi Pak Budi tidak menyerah. Ia mengumpulkan tim, membuat rencana darurat, dan bernegosiasi ulang dengan supplier. 'Masalah bukan untuk dihindari, tapi untuk diselesaikan,' katanya mantap.",
        visualDescription: "Hari hujan di lokasi konstruksi, pekerja khawatir, Pak Budi memikirkan solusi",
        imagePrompt: "Rainy day at construction site, worried workers, leader thinking of solutions",
        learningPoint: "Setiap proyek pasti menghadapi hambatan — kemampuan problem solving dan adaptasi menentukan keberhasilan",
        emotion: "anxious",
        imageUrl: "/storybook/rumah-scene4.png",
      },
      {
        sceneNumber: 5,
        title: "Rumah Impian Berdiri Tegak",
        narration: "Setelah 6 bulan kerja keras, rumah impian Pak Budi akhirnya selesai. Berdiri kokoh dengan cat putih bersih dan taman kecil di depannya. Keluarganya berkumpul di teras baru, tertawa bahagia. Pak Harto dan para tukang bergabung dalam perayaan kecil. 'Terima kasih semua. Ini bukan hanya rumah, ini bukti bahwa kerja tim bisa mewujudkan mimpi,' kata Pak Budi dengan mata berkaca-kaca.",
        visualDescription: "Rumah baru yang indah, keluarga merayakan, para pekerja bergembira, hari cerah",
        imagePrompt: "Beautiful completed house, family celebrating, happy workers, sunny day",
        learningPoint: "Keberhasilan proyek adalah hasil kerja tim, ketekunan, dan kemampuan mengelola sumber daya dengan bijak",
        emotion: "triumphant",
        imageUrl: "/storybook/rumah-scene5.png",
      },
    ],
    quiz: [
      {
        question: "Apa langkah pertama yang dilakukan Pak Budi sebelum membangun rumah?",
        options: ["Langsung membeli material", "Membuat visi dan perencanaan matang", "Meminjam uang dari bank", "Mencari tukang termurah"],
        correctAnswer: 1,
        explanation: "Pak Budi memulai dengan visi yang jelas dan sketsa perencanaan bersama istrinya, menunjukkan pentingnya perencanaan sebelum eksekusi.",
      },
      {
        question: "Apa yang dilakukan Pak Budi saat menghadapi masalah hujan dan budget membengkak?",
        options: ["Menghentikan proyek", "Membuat rencana darurat dan bernegosiasi ulang", "Menyalahkan mandor", "Mengurangi kualitas material"],
        correctAnswer: 1,
        explanation: "Pak Budi menunjukkan problem solving yang baik dengan membuat rencana darurat dan bernegosiasi ulang dengan supplier.",
      },
      {
        question: "Menurut Pak Harto, membangun rumah bukan hanya soal batu bata, tapi juga soal...",
        options: ["Uang saja", "Mengelola orang, waktu, dan uang", "Keberuntungan", "Cuaca yang bagus"],
        correctAnswer: 1,
        explanation: "Manajemen proyek melibatkan pengelolaan SDM, timeline, dan budget secara bersamaan.",
      },
    ],
    learningPoints: [
      "Setiap proyek besar dimulai dari visi yang jelas dan perencanaan matang",
      "Membangun tim yang tepat dan perencanaan detail adalah fondasi keberhasilan proyek",
      "Eksekusi yang konsisten dan monitoring berkala menjaga proyek tetap on track",
      "Setiap proyek pasti menghadapi hambatan — kemampuan problem solving dan adaptasi menentukan keberhasilan",
      "Keberhasilan proyek adalah hasil kerja tim, ketekunan, dan kemampuan mengelola sumber daya dengan bijak",
    ],
    industry: "construction",
    targetAudience: "beginner",
    coverImage: "/storybook/rumah-scene1.png",
    createdAt: new Date().toISOString(),
    isSample: true,
  },
  {
    id: "sample-startup",
    title: "Startup Digital Rina",
    synopsis: "Rina, seorang fresh graduate, membangun startup teknologi dari nol. Belajar tentang entrepreneurship, team building, dan resilience dalam menghadapi kegagalan.",
    characters: [
      { name: "Rina", role: "Founder", description: "Fresh graduate dengan ide brilian tapi minim pengalaman" },
      { name: "Ardi", role: "Co-Founder/CTO", description: "Programmer berbakat yang bergabung dengan Rina" },
      { name: "Pak Dharma", role: "Investor/Mentor", description: "Angel investor yang percaya pada potensi Rina" },
    ],
    scenes: [
      {
        sceneNumber: 1,
        title: "Ide di Kamar Kos",
        narration: "Rina duduk di kamar kosnya yang sempit, laptop terbuka dengan baris-baris kode. Ide aplikasinya sederhana: menghubungkan petani lokal langsung dengan pembeli di kota. 'Kalau Gojek bisa mengubah transportasi, kenapa aku tidak bisa mengubah distribusi pangan?' pikirnya. Malam itu, ia menulis business plan pertamanya di buku tulis.",
        visualDescription: "Wanita muda di kamar kecil dengan laptop, momen ide bisnis, poster motivasi di dinding",
        imagePrompt: "Young Indonesian woman working on laptop in small room, startup idea moment",
        learningPoint: "Ide bisnis terbaik lahir dari masalah nyata yang kita temui sehari-hari",
        emotion: "hopeful",
        imageUrl: "/storybook/startup-scene1.png",
      },
      {
        sceneNumber: 2,
        title: "Pitching dengan Gemetar",
        narration: "Di depan 5 investor, tangan Rina gemetar memegang remote presentasi. 'Sektor agritech Indonesia bernilai $5 miliar...' suaranya bergetar. Satu per satu investor menolak. Tapi Pak Dharma tertarik. 'Ide-mu mentah, tapi semangatmu matang. Aku beri 3 bulan untuk buktikan konsepmu,' katanya. Rina keluar ruangan dengan mata berkaca-kaca — tapi kali ini karena bahagia.",
        visualDescription: "Wanita muda presentasi di depan investor di ruang meeting modern, gugup tapi tekad bulat",
        imagePrompt: "Young woman pitching startup idea to investors in modern meeting room",
        learningPoint: "Penolakan adalah bagian dari perjalanan — satu 'ya' bisa mengubah segalanya",
        emotion: "anxious",
        imageUrl: "/storybook/startup-scene2.png",
      },
      {
        sceneNumber: 3,
        title: "Membangun dari Nol",
        narration: "Rina dan Ardi bekerja dari coworking space kecil. Tim bertambah jadi 5 orang. Mereka coding sampai larut malam, testing dengan petani di Jawa Barat, dan iterasi tanpa henti. 'Jangan bangun apa yang kamu pikir mereka butuhkan. Bangun apa yang mereka benar-benar butuhkan,' pesan Pak Dharma yang selalu diingat Rina.",
        visualDescription: "Tim kecil bekerja di coworking space, coding dan desain, energi kolaboratif",
        imagePrompt: "Small tech team working in coworking space, coding and designing, collaborative energy",
        learningPoint: "Produk yang sukses dibangun bersama user, bukan di menara gading",
        emotion: "determined",
        imageUrl: "/storybook/startup-scene3.png",
      },
      {
        sceneNumber: 4,
        title: "Kegagalan yang Menyakitkan",
        narration: "Hari peluncuran tiba. Dalam 1 jam pertama, server crash. 500 error di layar. Media sosial dipenuhi keluhan. Rina ingin menangis, tapi ia menarik napas dalam. 'Tim, kita perbaiki ini sekarang. Ardi, cek server. Yang lain, komunikasikan ke user bahwa kita sedang bekerja.' Dalam 6 jam, masalah teratasi. User yang tadinya marah, malah kagum dengan respons cepat tim.",
        visualDescription: "Error di layar, tim stress tapi pemimpin tetap tenang, troubleshooting bersama",
        imagePrompt: "App launch failure, server error on screens, stressed team, calm leader",
        learningPoint: "Cara kita merespons kegagalan lebih penting daripada kegagalan itu sendiri",
        emotion: "anxious",
        imageUrl: "/storybook/startup-scene4.png",
      },
      {
        sceneNumber: 5,
        title: "Tumbuh Bersama",
        narration: "6 bulan kemudian, aplikasi Rina sudah melayani 10.000 petani di 5 provinsi. Grafik pertumbuhan menunjukkan kenaikan 300%. Tim bertambah jadi 20 orang. Di kantor baru mereka, Rina memasang foto tim pertama di dinding. 'Kita mulai dari kamar kos. Sekarang kita mengubah cara Indonesia makan,' katanya bangga. Pak Dharma tersenyum di sudut ruangan.",
        visualDescription: "Perayaan sukses startup, tim sorak-sorai, grafik pertumbuhan di layar, pemimpin bangga",
        imagePrompt: "Startup success celebration, team cheering, growth chart on screen, proud leader",
        learningPoint: "Kesuksesan startup bukan sprint, tapi maraton — konsistensi, tim solid, dan learning from failure",
        emotion: "triumphant",
        imageUrl: "/storybook/startup-scene5.png",
      },
    ],
    quiz: [
      {
        question: "Dari mana Rina mendapatkan ide startup-nya?",
        options: ["Menyalin startup luar negeri", "Dari masalah nyata distribusi pangan", "Dari buku bisnis", "Dari teman kampus"],
        correctAnswer: 1,
        explanation: "Ide terbaik lahir dari mengamati masalah nyata di sekitar kita.",
      },
      {
        question: "Apa yang dilakukan Rina saat server crash di hari peluncuran?",
        options: ["Panik dan menyerah", "Menyalahkan tim", "Tetap tenang dan koordinasikan perbaikan", "Menghapus aplikasi"],
        correctAnswer: 2,
        explanation: "Rina menunjukkan kepemimpinan dengan tetap tenang dan mengkoordinasikan respons cepat.",
      },
    ],
    learningPoints: [
      "Ide bisnis terbaik lahir dari masalah nyata yang kita temui sehari-hari",
      "Penolakan adalah bagian dari perjalanan — satu 'ya' bisa mengubah segalanya",
      "Produk yang sukses dibangun bersama user, bukan di menara gading",
      "Cara kita merespons kegagalan lebih penting daripada kegagalan itu sendiri",
      "Kesuksesan startup bukan sprint, tapi maraton",
    ],
    industry: "technology",
    targetAudience: "beginner",
    coverImage: "/storybook/startup-scene1.png",
    createdAt: new Date().toISOString(),
    isSample: true,
  },
  {
    id: "sample-dokter",
    title: "Dokter Muda di Desa Terpencil",
    synopsis: "Dr. Anisa, lulusan kedokteran terbaik, memilih mengabdi di desa terpencil. Belajar tentang empati, kepemimpinan pelayanan, dan dampak nyata seorang profesional.",
    characters: [
      { name: "Dr. Anisa", role: "Dokter Muda", description: "Lulusan kedokteran idealis yang memilih mengabdi di desa" },
      { name: "Mbah Karyo", role: "Tetua Desa", description: "Tokoh desa yang bijaksana dan menjembatani dokter dengan warga" },
      { name: "Ibu Lastri", role: "Bidan Desa", description: "Bidan yang sudah 20 tahun melayani desa dengan keterbatasan" },
    ],
    scenes: [
      {
        sceneNumber: 1,
        title: "Tiba di Ujung Dunia",
        narration: "Dr. Anisa turun dari ojek yang melewati jalan berlumpur. Di depannya, klinik desa dengan cat yang mengelupas dan atap bocor. 'Ini tempat saya akan bertugas?' pikirnya. Tapi senyum hangat Ibu Lastri dan warga yang sudah menunggu membuatnya tersadar — mereka sudah menunggu kehadiran dokter selama 2 tahun.",
        visualDescription: "Dokter muda tiba di klinik desa terpencil, bangunan sederhana, warga menyambut hangat",
        imagePrompt: "Young Indonesian doctor arriving at remote village clinic, simple building, curious villagers",
        learningPoint: "Profesionalisme sejati bukan soal fasilitas mewah, tapi soal dampak yang kita berikan",
        emotion: "reflective",
        imageUrl: "/storybook/dokter-scene1.png",
      },
      {
        sceneNumber: 2,
        title: "Mendengar Sebelum Mengobati",
        narration: "Pasien pertama Dr. Anisa adalah Mbah Karyo yang batuk berbulan-bulan tapi takut ke dokter. 'Mbah, ceritakan dulu bagaimana sehari-hari Mbah,' kata Anisa lembut. Ia menemukan bahwa Mbah Karyo masih menggunakan tungku kayu di ruangan tertutup. Masalahnya bukan hanya medis — tapi lingkungan. Anisa belajar: mengobati orang bukan hanya soal resep.",
        visualDescription: "Dokter muda memeriksa pasien tua di klinik sederhana, alat medis terbatas, ekspresi peduli",
        imagePrompt: "Young doctor examining elderly patient in simple village clinic, caring expression",
        learningPoint: "Mendengarkan dan memahami konteks lebih penting daripada langsung memberi solusi",
        emotion: "reflective",
        imageUrl: "/storybook/dokter-scene2.png",
      },
      {
        sceneNumber: 3,
        title: "Mengajar dengan Hati",
        narration: "Dr. Anisa mulai mengadakan kelas kesehatan di bawah pohon beringin desa. Ibu-ibu belajar tentang gizi anak, kebersihan air, dan pertolongan pertama. Ia menggunakan boneka dan gambar sederhana, bukan istilah medis yang rumit. 'Kalau saya bicara pakai bahasa mereka, mereka mengerti. Kalau pakai bahasa dokter, mereka diam,' tulisnya di jurnal.",
        visualDescription: "Dokter mengajar ibu-ibu desa tentang kesehatan di bawah pohon besar, alat peraga sederhana",
        imagePrompt: "Doctor teaching village mothers about hygiene, outdoor class under big tree",
        learningPoint: "Kepemimpinan yang efektif adalah mengedukasi dengan bahasa yang dimengerti audiens",
        emotion: "joyful",
        imageUrl: "/storybook/dokter-scene3.png",
      },
      {
        sceneNumber: 4,
        title: "Malam yang Menguji",
        narration: "Tengah malam, warga mengetuk pintu Anisa. Seorang anak kejang tinggi. Listrik padam. Dengan senter dan perlengkapan seadanya, Anisa berlari menembus hujan. Di klinik gelap, ia bekerja dengan tenang mengompres anak dan memberikan obat. 'Tetap tenang, Bu. Anaknya akan baik-baik saja,' katanya meyakinkan sang ibu. Pagi hari, anak itu tersenyum lagi.",
        visualDescription: "Darurat medis malam hari di desa, dokter berlari menembus hujan dengan senter, tekad bulat",
        imagePrompt: "Medical emergency at night in village, doctor rushing through rain with flashlight",
        learningPoint: "Profesional sejati siap kapan pun dibutuhkan — ketenangan dalam krisis menyelamatkan nyawa",
        emotion: "anxious",
        imageUrl: "/storybook/dokter-scene4.png",
      },
      {
        sceneNumber: 5,
        title: "Desa yang Berubah",
        narration: "Setahun berlalu. Klinik desa sudah direnovasi berkat proposal Anisa ke pemerintah daerah. Tingkat diare turun 70%. Ibu-ibu desa sekarang menjadi kader kesehatan. Mbah Karyo sudah sehat dan selalu menyapa, 'Terima kasih sudah datang, Nak Dokter.' Anisa tersenyum — ia datang untuk mengubah desa, tapi desa-lah yang mengubah dirinya.",
        visualDescription: "Klinik desa yang telah direnovasi, warga sehat dan bahagia, dokter dengan pemimpin desa",
        imagePrompt: "Transformed village health clinic, new equipment, happy healthy villagers",
        learningPoint: "Dampak terbesar seorang profesional bukan apa yang ia dapatkan, tapi apa yang ia berikan untuk komunitasnya",
        emotion: "triumphant",
        imageUrl: "/storybook/dokter-scene5.png",
      },
    ],
    quiz: [
      {
        question: "Apa yang Dr. Anisa lakukan berbeda saat memeriksa Mbah Karyo?",
        options: ["Langsung memberi obat", "Mendengarkan dan memahami konteks kehidupan pasien", "Merujuk ke rumah sakit", "Menolak menangani"],
        correctAnswer: 1,
        explanation: "Dr. Anisa memahami bahwa penyebab penyakit bukan hanya medis tapi juga lingkungan, dengan mendengarkan dulu.",
      },
      {
        question: "Mengapa Dr. Anisa menggunakan boneka dan gambar saat mengajar kesehatan?",
        options: ["Karena lebih murah", "Agar mudah dimengerti oleh warga desa", "Karena tidak punya peralatan", "Untuk hiburan saja"],
        correctAnswer: 1,
        explanation: "Komunikasi efektif berarti menyesuaikan cara penyampaian dengan audiens.",
      },
    ],
    learningPoints: [
      "Profesionalisme sejati bukan soal fasilitas mewah, tapi soal dampak",
      "Mendengarkan dan memahami konteks lebih penting daripada langsung memberi solusi",
      "Kepemimpinan efektif adalah mengedukasi dengan bahasa yang dimengerti audiens",
      "Profesional sejati siap kapan pun dibutuhkan",
      "Dampak terbesar seorang profesional bukan apa yang ia dapatkan, tapi apa yang ia berikan",
    ],
    industry: "health",
    targetAudience: "beginner",
    coverImage: "/storybook/dokter-scene1.png",
    createdAt: new Date().toISOString(),
    isSample: true,
  },
];

const STORAGE_KEY = "chaesa_storybooks";

export default function StorybookPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [view, setView] = useState<"gallery" | "create" | "read">("gallery");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("all");

  const [createTopic, setCreateTopic] = useState("");
  const [createIndustry, setCreateIndustry] = useState("business");
  const [createAudience, setCreateAudience] = useState("beginner");
  const [createSceneCount, setCreateSceneCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const { user, isLoggedIn, isLoading: authLoading, userName, userId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    try {
      const saved = localStorage.getItem(getUserStorageKey(userId, "storybooks"));
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = [...SAMPLE_STORIES];
        parsed.forEach((s: Story) => {
          if (!s.isSample) merged.push(s);
        });
        setStories(merged);
      } else {
        setStories(SAMPLE_STORIES);
      }
    } catch {
      setStories(SAMPLE_STORIES);
    }
  }, [userId, authLoading]);

  const saveStories = useCallback((updated: Story[]) => {
    setStories(updated);
    try {
      localStorage.setItem(getUserStorageKey(userId, "storybooks"), JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [userId]);

  const handleGenerateStory = async () => {
    if (!createTopic.trim()) {
      toast({ title: "Masukkan topik cerita", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    try {
      const res = await fetch("/api/ai/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: createTopic,
          industry: createIndustry,
          targetAudience: createAudience,
          sceneCount: createSceneCount,
        }),
      });

      const data = await res.json();

      const newStory: Story = {
        id: `story-${Date.now()}`,
        ...data,
        coverImage: undefined,
        createdAt: new Date().toISOString(),
        isSample: false,
      };

      const updated = [...stories, newStory];
      saveStories(updated);

      toast({ title: "Cerita berhasil dibuat!", description: newStory.title });
      setSelectedStory(newStory);
      setCurrentScene(0);
      setShowQuiz(false);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setShowSummary(false);
      setView("read");
      setCreateTopic("");
    } catch (error) {
      toast({ title: "Gagal membuat cerita", description: "Coba lagi nanti", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const openStory = (story: Story) => {
    setSelectedStory(story);
    setCurrentScene(0);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowSummary(false);
    setView("read");
  };

  const deleteStory = (id: string) => {
    const updated = stories.filter((s) => s.id !== id);
    saveStories(updated);
    toast({ title: "Cerita dihapus" });
  };

  const nextScene = () => {
    if (!selectedStory) return;
    if (currentScene < selectedStory.scenes.length - 1) {
      setCurrentScene((p) => p + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const prevScene = () => {
    if (showSummary) {
      setShowSummary(false);
      setShowQuiz(true);
      return;
    }
    if (showQuiz) {
      setShowQuiz(false);
      return;
    }
    if (currentScene > 0) setCurrentScene((p) => p - 1);
  };

  const handleQuizAnswer = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
  };

  const quizScore = selectedStory
    ? selectedStory.quiz.reduce(
        (acc, q, i) => acc + (quizAnswers[i] === q.correctAnswer ? 1 : 0),
        0
      )
    : 0;

  const filteredStories = stories.filter((s) => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.synopsis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchIndustry = filterIndustry === "all" || s.industry === filterIndustry;
    return matchSearch && matchIndustry;
  });

  const getIndustryLabel = (value: string) => {
    return INDUSTRIES.find((i) => i.value === value)?.label || value;
  };

  const getIndustryIcon = (value: string) => {
    return INDUSTRIES.find((i) => i.value === value)?.icon || "📖";
  };

  const renderSceneImage = (scene: StoryScene) => {
    if (scene.imageUrl) {
      return (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
          <img
            src={scene.imageUrl}
            alt={scene.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      );
    }

    const emotionGrad = EMOTION_COLORS[scene.emotion] || "from-blue-500/20 to-purple-500/20";
    return (
      <div className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${emotionGrad} border border-white/10 dark:border-white/10 flex items-center justify-center`}>
        <div className="text-center p-8">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 opacity-50" />
          <p className="text-sm text-gray-500 dark:text-gray-400 italic max-w-md">{scene.visualDescription}</p>
        </div>
      </div>
    );
  };

  if (view === "read" && selectedStory) {
    const scene = selectedStory.scenes[currentScene];
    const progress = showSummary
      ? 100
      : showQuiz
      ? ((selectedStory.scenes.length) / (selectedStory.scenes.length + 1)) * 100
      : ((currentScene + 1) / (selectedStory.scenes.length + 1)) * 100;

    return (
      <>
        <SEO title={`${selectedStory.title} - Storybook`} description={selectedStory.synopsis} />
        <Head><link rel="canonical" href="https://chaesa.live/storybook" /></Head>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setView("gallery")}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Kembali
              </Button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{selectedStory.title}</span>
              <span className="text-sm text-gray-500">
                {showSummary ? "Ringkasan" : showQuiz ? "Quiz" : `${currentScene + 1}/${selectedStory.scenes.length}`}
              </span>
            </div>
            <div className="h-1 bg-gray-200 dark:bg-gray-800">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="pt-20 pb-32">
            {!showQuiz && !showSummary && scene && (
              <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-6">
                  {renderSceneImage(scene)}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">
                      Scene {scene.sceneNumber}
                    </Badge>
                    <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-0 capitalize">
                      {scene.emotion}
                    </Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {scene.title}
                  </h2>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    {scene.narration}
                  </p>
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/30">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Pelajaran dari Scene Ini</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">{scene.learningPoint}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStory.characters.length > 0 && currentScene === 0 && (
                  <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" /> Karakter
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedStory.characters.map((c, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                          <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">{c.role}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showQuiz && !showSummary && (
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-800">
                  <div className="text-center mb-8">
                    <Award className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Cerita</h2>
                    <p className="text-gray-500 dark:text-gray-400">Uji pemahamanmu tentang cerita yang baru kamu baca</p>
                  </div>

                  <div className="space-y-6">
                    {selectedStory.quiz.map((q, qIdx) => (
                      <div key={qIdx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
                        <p className="font-semibold text-gray-900 dark:text-white mb-3">{qIdx + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = quizAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctAnswer === oIdx;
                            let optClass = "border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500";
                            if (quizSubmitted) {
                              if (isCorrect) optClass = "border-green-500 bg-green-50 dark:bg-green-900/20";
                              else if (isSelected && !isCorrect) optClass = "border-red-500 bg-red-50 dark:bg-red-900/20";
                            } else if (isSelected) {
                              optClass = "border-purple-500 bg-purple-50 dark:bg-purple-900/20";
                            }
                            return (
                              <button
                                key={oIdx}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${optClass}`}
                                onClick={() => handleQuizAnswer(qIdx, oIdx)}
                                disabled={quizSubmitted}
                              >
                                <div className="flex items-center gap-3">
                                  {quizSubmitted && isCorrect && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                                  {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                                  {!quizSubmitted && <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${isSelected ? "border-purple-500 bg-purple-500" : "border-gray-400"}`} />}
                                  <span className="text-gray-800 dark:text-gray-200">{opt}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && (
                          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 p-3 rounded-lg">
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {!quizSubmitted ? (
                    <Button
                      className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      size="lg"
                      onClick={submitQuiz}
                      disabled={Object.keys(quizAnswers).length < selectedStory.quiz.length}
                    >
                      Kirim Jawaban
                    </Button>
                  ) : (
                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl px-6 py-3 mb-4">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          Skor: {quizScore}/{selectedStory.quiz.length}
                        </span>
                      </div>
                      <br />
                      <Button
                        className="mt-3 bg-gradient-to-r from-green-600 to-emerald-600"
                        onClick={() => setShowSummary(true)}
                      >
                        Lihat Ringkasan Pembelajaran <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showSummary && (
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 dark:border-gray-800">
                  <div className="text-center mb-8">
                    <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pelajaran dari Cerita Ini</h2>
                    <p className="text-gray-500 dark:text-gray-400">{selectedStory.title}</p>
                  </div>

                  <div className="space-y-4">
                    {selectedStory.learningPoints.map((point, i) => (
                      <div key={i} className="flex items-start gap-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          {i + 1}
                        </div>
                        <p className="text-gray-800 dark:text-gray-200">{point}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 text-center border border-amber-200 dark:border-amber-800/30">
                    <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-lg font-semibold text-amber-800 dark:text-amber-300">Selamat! Kamu telah menyelesaikan cerita ini.</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      Skor quiz: {quizScore}/{selectedStory.quiz.length} benar
                    </p>
                  </div>

                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600"
                    size="lg"
                    onClick={() => setView("gallery")}
                  >
                    Kembali ke Perpustakaan
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!showSummary && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50">
              <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-4xl">
                <Button
                  variant="outline"
                  onClick={prevScene}
                  disabled={currentScene === 0 && !showQuiz && !showSummary}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
                </Button>
                <div className="flex gap-1.5">
                  {selectedStory.scenes.map((_, i) => (
                    <button
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i === currentScene && !showQuiz && !showSummary
                          ? "bg-purple-500"
                          : i < currentScene
                          ? "bg-purple-300 dark:bg-purple-700"
                          : "bg-gray-300 dark:bg-gray-700"
                      }`}
                      onClick={() => {
                        setCurrentScene(i);
                        setShowQuiz(false);
                        setShowSummary(false);
                      }}
                    />
                  ))}
                  <button
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${showQuiz || showSummary ? "bg-purple-500" : "bg-gray-300 dark:bg-gray-700"}`}
                  />
                </div>
                {!showQuiz ? (
                  <Button onClick={nextScene}>
                    {currentScene === selectedStory.scenes.length - 1 ? "Quiz" : "Selanjutnya"} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <div className="w-[120px]" />
                )}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Storybook - Visual Learning" description="Belajar melalui cerita visual interaktif yang mendidik dan menghibur" />
      <Head><link rel="canonical" href="https://chaesa.live/storybook" /></Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Storybook Visual" icon={BookMarked} />

        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BookMarked className="w-9 h-9 text-purple-500" />
                Storybook Visual
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Belajar melalui cerita bergambar yang mendidik dan interaktif</p>
            </div>
            <Button
              onClick={() => setView(view === "create" ? "gallery" : "create")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {view === "create" ? (
                <><BookOpen className="w-4 h-4 mr-2" /> Lihat Perpustakaan</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Buat Cerita Baru</>
              )}
            </Button>
          </div>

          {view === "create" && (
            <Card className="p-6 md:p-8 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" /> Buat Cerita dengan AI
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Topik Pembelajaran</Label>
                  <Input
                    value={createTopic}
                    onChange={(e) => setCreateTopic(e.target.value)}
                    placeholder="Contoh: Cara mengelola proyek konstruksi rumah"
                    className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                  <p className="text-sm text-gray-500 mt-1">AI akan mengubah topik ini menjadi cerita visual yang menarik</p>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Industri</Label>
                  <select
                    value={createIndustry}
                    onChange={(e) => setCreateIndustry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.value} value={ind.value}>{ind.icon} {ind.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Target Audiens</Label>
                  <select
                    value={createAudience}
                    onChange={(e) => setCreateAudience(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Jumlah Scene</Label>
                  <select
                    value={createSceneCount}
                    onChange={(e) => setCreateSceneCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2"
                  >
                    {[3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n} scene</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleGenerateStory}
                    disabled={isGenerating || !createTopic.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sedang Membuat Cerita...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Generate Cerita</>
                    )}
                  </Button>
                </div>
              </div>

              {isGenerating && (
                <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-2" />
                  <p className="text-purple-700 dark:text-purple-300 font-medium">AI sedang menulis cerita...</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Membuat karakter, alur cerita, dan quiz interaktif</p>
                </div>
              )}
            </Card>
          )}

          {view === "gallery" && (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari cerita..."
                    className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
                  />
                </div>
                <select
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                >
                  <option value="all">Semua Kategori</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.icon} {ind.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStories.map((story) => (
                  <Card
                    key={story.id}
                    className="overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow group cursor-pointer"
                    onClick={() => openStory(story)}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      {story.coverImage ? (
                        <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-purple-400" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-black/60 text-white border-0 text-xs">
                          {getIndustryIcon(story.industry)} {getIndustryLabel(story.industry)}
                        </Badge>
                      </div>
                      {story.isSample && (
                        <Badge className="absolute top-3 right-3 bg-purple-500 text-white border-0 text-xs">
                          Contoh
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{story.synopsis}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {story.scenes.length} scene</span>
                          <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {story.quiz.length} quiz</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {!story.isSample && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={(e) => { e.stopPropagation(); deleteStory(story.id); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-purple-500"
                            onClick={(e) => { e.stopPropagation(); openStory(story); }}
                          >
                            <Play className="w-3.5 h-3.5 mr-1" /> Baca
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {filteredStories.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Belum ada cerita</h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">Buat cerita pertamamu dengan AI</p>
                  <Button onClick={() => setView("create")} className="bg-gradient-to-r from-purple-600 to-pink-600">
                    <Plus className="w-4 h-4 mr-2" /> Buat Cerita Baru
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
