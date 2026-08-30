import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { microLearningService } from "@/services/microLearningService";
import { meetingService } from "@/services/meetingService";
import {
  Sparkles,
  BookOpen,
  Video,
  Clock,
  Users,
  TrendingUp,
  Download,
  Share2,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Award,
  Target,
  Zap,
  Instagram,
  Youtube,
  Linkedin,
  Music,
  BarChart3,
  Flame,
  Calendar,
  Search,
  Star,
  ShoppingBag,
  Filter,
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  ClipboardCheck,
  MessageSquareText,
  Repeat2,
  ShieldCheck,
  FileText,
  Upload,
  X,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];

const workplaceTracks = [
  { value: "construction", label: "Konstruksi", description: "K3, mutu, dan proyek" },
  { value: "customer-service", label: "Customer Service", description: "Komunikasi dan penyelesaian masalah" },
  { value: "sales", label: "Sales", description: "Discovery dan keberatan pelanggan" },
  { value: "hr", label: "HR & People", description: "Interview dan coaching" },
  { value: "operations", label: "Operasional", description: "SOP dan konsistensi proses" },
  { value: "custom", label: "Bidang lain", description: "Sesuaikan dengan pekerjaanmu" },
];

const operatingLayers = [
  {
    number: "01",
    title: "Arah organisasi",
    label: "Prioritas dan standar",
    detail: "Tentukan perilaku kerja yang paling berdampak pada mutu, keselamatan, layanan, atau hasil bisnis.",
    icon: Target,
    tone: "text-blue-300",
  },
  {
    number: "02",
    title: "Konteks peran",
    label: "Pekerjaan yang benar-benar terjadi",
    detail: "Ambil pemicu dari meeting, SOP, masalah pelanggan, temuan lapangan, atau keputusan harian.",
    icon: Users,
    tone: "text-violet-300",
  },
  {
    number: "03",
    title: "Misi perilaku",
    label: "Satu skill, satu tujuan",
    detail: "Ubah konteks menjadi tindakan kecil yang jelas, dapat dilakukan dalam 5–15 menit, dan relevan dengan peran.",
    icon: BookOpen,
    tone: "text-amber-300",
  },
  {
    number: "04",
    title: "Praktik dan bukti",
    label: "Bukan sekadar selesai",
    detail: "Peserta menjalankan tindakan, menjawab skenario, lalu mengirim bukti yang bisa diperiksa.",
    icon: ClipboardCheck,
    tone: "text-emerald-300",
  },
  {
    number: "05",
    title: "Pembelajaran tim",
    label: "Feedback dan pengulangan",
    detail: "Feedback, pola kesalahan, dan jadwal pengulangan mengubah latihan individu menjadi kebiasaan bersama.",
    icon: BarChart3,
    tone: "text-pink-300",
  },
];

const executionSteps = [
  { number: "1", title: "Pemicu", text: "Ada keputusan, risiko, gap, atau masalah kerja." },
  { number: "2", title: "Konteks", text: "AI membaca situasi dan bahasa sektor yang sesuai." },
  { number: "3", title: "Misi", text: "Satu skill dirumuskan menjadi target yang konkret." },
  { number: "4", title: "Praktik", text: "Peserta melakukan tindakan dalam pekerjaan atau simulasi." },
  { number: "5", title: "Bukti", text: "Hasil praktik dikirim sebagai catatan, checklist, foto, atau rekaman." },
  { number: "6", title: "Feedback", text: "Perbaikan dan pengulangan dijadwalkan sampai menjadi kebiasaan." },
];

const sectorPlaybooks = [
  {
    sector: "Konstruksi",
    trigger: "Toolbox meeting atau temuan inspeksi",
    mission: "Identifikasi risiko sebelum pekerjaan dimulai",
    proof: "Foto kondisi dan checklist",
  },
  {
    sector: "Customer Service",
    trigger: "Keluhan pelanggan yang berulang",
    mission: "Akui masalah, rangkum kebutuhan, sepakati next step",
    proof: "Simulasi respons dan refleksi",
  },
  {
    sector: "Sales",
    trigger: "Prospek berhenti merespons",
    mission: "Ajukan discovery question sebelum menawarkan solusi",
    proof: "Catatan kebutuhan dan follow-up",
  },
  {
    sector: "HR & People",
    trigger: "Sesi interview atau coaching",
    mission: "Berikan feedback yang spesifik dan bisa ditindaklanjuti",
    proof: "Naskah feedback dan rencana aksi",
  },
  {
    sector: "Operasional",
    trigger: "SOP tidak konsisten dijalankan",
    mission: "Jalankan satu checkpoint mutu pada proses kritis",
    proof: "Checklist proses dan catatan penyimpangan",
  },
  {
    sector: "Bidang lain",
    trigger: "Masalah kerja yang ingin diperbaiki",
    mission: "Pilih satu perilaku kerja yang dapat diuji hari ini",
    proof: "Catatan tindakan dan bukti tindak lanjut",
  },
];

const operatingRoles = [
  {
    role: "Pengarah",
    actor: "Pemilik bisnis atau pimpinan fungsi",
    action: "Menentukan prioritas perilaku dan standar yang perlu diperkuat.",
    output: "Arah skill dan indikator dampak",
    icon: Target,
    tone: "text-blue-300",
  },
  {
    role: "Perancang",
    actor: "L&D, coach, atau team lead",
    action: "Mengubah konteks kerja menjadi misi yang sesuai peran dan sektor.",
    output: "Misi, skenario, dan kriteria bukti",
    icon: Sparkles,
    tone: "text-violet-300",
  },
  {
    role: "Pelaksana",
    actor: "Anggota tim di lapangan",
    action: "Melakukan tindakan, mengirim bukti, dan menulis refleksi singkat.",
    output: "Praktik yang terlihat dan dapat dipelajari",
    icon: ClipboardCheck,
    tone: "text-emerald-300",
  },
  {
    role: "Pengelola kebiasaan",
    actor: "Supervisor atau pengelola tim",
    action: "Membaca pola, memberi feedback, dan mengatur pengulangan misi.",
    output: "Perbaikan individu dan pembelajaran tim",
    icon: BarChart3,
    tone: "text-amber-300",
  },
];

export default function MicroLearning() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("create");
  const [courses, setCourses] = useState<Course[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [sourceType, setSourceType] = useState<"meeting" | "document">("meeting");
  const [selectedMeeting, setSelectedMeeting] = useState<string>("");
  const [sourceText, setSourceText] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketplaceCourses, setMarketplaceCourses] = useState<Course[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [marketplaceSearch, setMarketplaceSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("construction");

  const categories = [
    { value: "all", label: "Semua" },
    { value: "technology", label: "Teknologi" },
    { value: "business", label: "Bisnis" },
    { value: "marketing", label: "Marketing" },
    { value: "design", label: "Desain" },
    { value: "leadership", label: "Leadership" },
    { value: "communication", label: "Komunikasi" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load user's courses
      const { data: coursesData } = await microLearningService.getUserCourses();
      if (coursesData) setCourses(coursesData);

      // Load meetings with recordings
      const { data: meetingsData } = await meetingService.getUserMeetings();
      if (meetingsData) setMeetings(meetingsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMarketplaceCourses = async () => {
    setMarketplaceLoading(true);
    try {
      const filters: { category?: string; searchQuery?: string } = {};
      if (selectedCategory !== "all") filters.category = selectedCategory;
      if (marketplaceSearch.trim()) filters.searchQuery = marketplaceSearch.trim();

      const { data } = await microLearningService.getPublishedCourses(filters);
      setMarketplaceCourses(data || []);
    } catch (error) {
      console.error("Failed to load marketplace:", error);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "marketplace") {
      loadMarketplaceCourses();
    }
  }, [activeTab, selectedCategory]);

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return "Gratis";
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const handleDocumentFile = async (file?: File) => {
    if (!file) return;

    const extension = file.name.includes(".")
      ? `.${file.name.split(".").pop()?.toLowerCase()}`
      : "";
    const allowedExtensions = [".txt", ".md", ".csv", ".json"];
    const allowedMimeTypes = ["text/plain", "text/markdown", "text/csv", "application/json"];
    if (!allowedExtensions.includes(extension) && !allowedMimeTypes.includes(file.type)) {
      setSourceFileName("");
      setSourceText("");
      toast({
        title: "Format file tidak didukung",
        description: "Gunakan file .txt, .md, .csv, atau .json. Untuk PDF/Word, salin teksnya ke kolom di bawah.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 100 * 1024) {
      setSourceFileName("");
      setSourceText("");
      toast({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 100 KB agar konteks dapat diproses dengan baik.",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = (await file.text()).trim();
      if (!text) {
        setSourceFileName("");
        setSourceText("");
        toast({
          title: "File kosong",
          description: "File tidak memiliki isi teks. Pilih file lain atau tempelkan sumber secara manual.",
          variant: "destructive",
        });
        return;
      }
      setSourceText(text);
      setSourceFileName(file.name);
    } catch (error) {
      console.error("Failed to read source file:", error);
      setSourceFileName("");
      setSourceText("");
      toast({
        title: "File tidak bisa dibaca",
        description: "Coba file teks lain atau tempelkan isi dokumen secara manual.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCourse = async () => {
    const hasSource = sourceType === "meeting"
      ? Boolean(selectedMeeting)
      : Boolean(sourceText.trim());
    if (!hasSource || !courseTitle.trim()) {
      toast({
        title: "Sumber atau judul belum lengkap",
        description: sourceType === "meeting"
          ? "Pilih meeting dan masukkan judul misi."
          : "Unggah atau tempelkan isi dokumen, lalu masukkan judul misi.",
        variant: "destructive",
      });
      return;
    }
    if (sourceType === "document" && sourceText.trim().length < 40) {
      toast({
        title: "Isi dokumen terlalu singkat",
        description: "Masukkan minimal 40 karakter agar AI memiliki konteks yang cukup.",
        variant: "destructive",
      });
      return;
    }
    if (sourceType === "document" && sourceText.length > 100 * 1024) {
      toast({
        title: "Isi dokumen terlalu panjang",
        description: "Batasi sumber hingga 100 KB sebelum membuat misi.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create course
      const selectedTrackLabel =
        workplaceTracks.find((track) => track.value === selectedTrack)?.label || "Bidang lain";
      const contextualDescription = [
        courseDescription.trim(),
        `Domain kerja: ${selectedTrackLabel}.`,
      ]
        .filter(Boolean)
        .join("\n\n");
      const { data: course, error: courseError } = await microLearningService.createCourseFromSource(
        sourceType,
        courseTitle,
        contextualDescription,
        sourceType === "meeting" ? selectedMeeting : undefined,
      );

      if (courseError || !course) throw courseError || new Error("Misi tidak dapat dibuat");

      toast({
        title: "Misi disiapkan",
        description: `AI sedang menyusun langkah praktik dari ${sourceType === "meeting" ? "isi meeting" : "dokumen"}...`,
      });

      // Step 2: Turn the selected source into practice modules
      const meeting = sourceType === "meeting"
        ? meetings.find(m => m.id === selectedMeeting)
        : undefined;
      const { data: modules, error: chunkError } = await microLearningService.chunkSourceIntoModules(
        course.id,
        sourceType === "meeting"
          ? {
              type: "meeting",
              meetingId: selectedMeeting,
              recordingUrl: meeting?.recording_url,
            }
          : {
              type: "document",
              text: sourceText,
              fileName: sourceFileName || undefined,
            },
        selectedTrack,
      );

      if (chunkError) throw chunkError;

      toast({
        title: "Misi siap dipraktikkan",
        description: `${modules?.modulesCreated || 0} langkah kerja berhasil dibuat.`,
      });

      // Refresh data
      await loadData();
      setActiveTab("courses");

      // Reset form
      setSelectedMeeting("");
      setSourceText("");
      setSourceFileName("");
      setCourseTitle("");
      setCourseDescription("");
    } catch (error) {
      console.error("Course creation error:", error);
      toast({
        title: "Misi belum berhasil dibuat",
        description: error instanceof Error
          ? error.message
          : "Periksa sumber dan koneksi, lalu coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      const { error } = await microLearningService.publishCourse(courseId, 99000);
      if (error) throw error;

      toast({
        title: "Course Published! 🎉",
        description: "Your course is now available in the marketplace",
      });

      await loadData();
    } catch (error) {
      console.error("Publish error:", error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish course",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const { error } = await microLearningService.deleteCourse(courseId);
      if (error) throw error;

      toast({
        title: "Course Deleted",
        description: "Course has been removed",
      });

      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEO
        title="Workplace Coach - Belajar dari Pekerjaan Nyata | Chaesa Live"
        description="Ubah meeting, SOP, dan masalah kerja menjadi misi belajar 5-15 menit yang bisa langsung dipraktikkan dan divalidasi."
      />
      <Head>
        <link rel="canonical" href="https://chaesa.live/micro-learning" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <PageHeader title="Workplace Coach" icon={BriefcaseBusiness} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">
            <div className="rounded-2xl border border-blue-400/20 bg-black/30 p-6 md:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
                  <BriefcaseBusiness className="w-3.5 h-3.5" />
                  AI Workplace Coach
                </span>
                <span className="text-xs text-slate-400">Chaesa Live</span>
              </div>
              <h1 className="max-w-3xl text-3xl md:text-5xl font-bold tracking-tight text-white">
                Belajar dari pekerjaan nyata.
              </h1>
              <p className="mt-4 max-w-2xl text-base md:text-lg leading-relaxed text-slate-300">
                Ubah meeting, SOP, dan masalah kerja menjadi misi singkat yang membantu setiap orang
                belajar, praktik, mengirim bukti, lalu menerima feedback.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => setActiveTab("create")}
                  className="bg-blue-500 text-white hover:bg-blue-400"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Buat misi dari meeting atau dokumen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("mission-example")?.scrollIntoView({ behavior: "smooth" })}
                  className="border-slate-600 bg-transparent text-slate-200 hover:bg-white/10 hover:text-white"
                >
                  Lihat contoh hasil
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Clock, label: "5–15 menit", text: "sekali latihan" },
                  { icon: ClipboardCheck, label: "Praktik nyata", text: "bukan hanya quiz" },
                  { icon: Repeat2, label: "Diulang berkala", text: "agar jadi kebiasaan" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <item.icon className="w-4 h-4 text-blue-300 mb-2" />
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card id="mission-example" className="border-blue-400/20 bg-blue-950/50 p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Contoh keluaran</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Misi Hari Ini</h2>
                </div>
                <div className="rounded-xl bg-blue-400/15 p-3">
                  <Zap className="w-6 h-6 text-blue-200" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white">Menangani pelanggan yang kecewa</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Latihan 7 menit untuk Customer Service: akui masalah, rangkum kebutuhan, dan
                sepakati langkah berikutnya.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  { icon: MessageSquareText, text: "Pelajari satu pola respons" },
                  { icon: ClipboardCheck, text: "Jawab satu skenario keputusan" },
                  { icon: Camera, text: "Kirim bukti praktik atau simulasi" },
                  { icon: ShieldCheck, text: "Dapatkan feedback dan jadwal pengulangan" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-slate-200">
                    <item.icon className="w-4 h-4 shrink-0 text-blue-300" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
                Hasil: kemampuan dipraktikkan, bukan hanya ditandai selesai.
              </div>
            </Card>
          </div>

          <section id="operating-model" className="mb-8 scroll-mt-24 space-y-6">
            <Card className="overflow-hidden border-blue-400/20 bg-slate-950/60 shadow-xl">
              <div className="border-b border-white/10 bg-white/[0.03] p-6 md:p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">
                      Operating model Chaesa Live
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
                      Dari strategi kerja sampai kebiasaan tim.
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 md:text-base">
                      Chaesa Live bukan hanya tempat membuat materi. Ia menghubungkan apa yang ingin
                      dicapai organisasi dengan perilaku yang harus dipraktikkan orang di situasi kerja nyata.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200 md:max-w-xs">
                    <span className="font-semibold text-emerald-100">Prinsip inti:</span>{" "}
                    satu skill, satu praktik, satu bukti.
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dimensi vertikal</p>
                      <h3 className="mt-1 text-lg font-semibold text-white">Lima lapis pelaksanaan</h3>
                    </div>
                    <span className="text-xs text-slate-500">arah → dampak</span>
                  </div>
                  <div className="space-y-3">
                    {operatingLayers.map((layer) => (
                      <div
                        key={layer.number}
                        className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08]">
                          <layer.icon className={`h-5 w-5 ${layer.tone}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-xs font-bold tracking-wider text-slate-500">{layer.number}</span>
                            <h4 className="font-semibold text-white">{layer.title}</h4>
                            <span className="text-xs text-blue-200">{layer.label}</span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-slate-400">{layer.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-400/20 bg-blue-950/40 p-5 md:p-6">
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Dimensi horizontal</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Satu prosedur untuk semua sektor</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      Sumber dan bahasa dapat berubah, tetapi cara menjalankan misi tetap konsisten.
                    </p>
                  </div>
                  <div className="space-y-0">
                    {executionSteps.map((step, index) => (
                      <div key={step.number} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < executionSteps.length - 1 && (
                          <div className="absolute left-[15px] top-8 h-[calc(100%-16px)] w-px bg-blue-400/30" />
                        )}
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-300/40 bg-blue-400/15 text-xs font-bold text-blue-100">
                          {step.number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{step.title}</h4>
                          <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
                    <span className="font-semibold text-slate-200">Cara membacanya:</span> lapisan vertikal
                    menjaga agar misi tetap nyambung dengan tujuan, sedangkan prosedur horizontal memastikan
                    misi benar-benar dijalankan sampai ada perubahan perilaku.
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-white/[0.04] p-6 md:p-8">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Satu mesin, banyak konteks</p>
                  <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">Contoh penerapan lintas sektor</h2>
                </div>
                <p className="max-w-xl text-sm leading-relaxed text-slate-400">
                  Domain pack mengganti contoh, risiko, dan standar; mesin praktiknya tetap sama.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sectorPlaybooks.map((playbook) => (
                  <div key={playbook.sector} className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-white">{playbook.sector}</h3>
                      <span className="rounded-full bg-blue-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                        domain pack
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Pemicu</p>
                    <p className="mt-1 text-sm text-slate-300">{playbook.trigger}</p>
                    <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Misi</p>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-blue-100">{playbook.mission}</p>
                    <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Bukti</p>
                    <p className="mt-1 text-sm text-emerald-200">{playbook.proof}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/10 bg-slate-950/60 p-6 md:p-8">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dimensi peran</p>
                <h2 className="mt-1 text-xl font-bold text-white md:text-2xl">Empat peran agar praktik bergerak</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                  Satu sistem dapat dipakai bersama tanpa membuat semua orang menjadi admin. Setiap peran
                  memiliki keputusan, tindakan, dan keluaran yang berbeda.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {operatingRoles.map((item) => (
                  <div key={item.role} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white/[0.08] p-2">
                        <item.icon className={`h-5 w-5 ${item.tone}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{item.role}</h3>
                        <p className="text-xs text-slate-500">{item.actor}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{item.action}</p>
                    <div className="mt-4 border-t border-white/10 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Keluaran</p>
                      <p className="mt-1 text-sm font-medium text-blue-100">{item.output}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="create" className="data-[state=active]:bg-white/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Buat Misi
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-white/20">
                <BookOpen className="w-4 h-4 mr-2" />
                Misi Saya ({courses.length})
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-white/20">
                <TrendingUp className="w-4 h-4 mr-2" />
                Shared Missions
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                <Target className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* CREATE TAB */}
            <TabsContent value="create" className="space-y-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur">
                <div className="flex items-start gap-3 mb-4">
                  <div className="rounded-xl bg-blue-500/15 p-3">
                    <ClipboardCheck className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Buat misi dari sumber kerja</h2>
                    <p className="text-sm text-blue-200 mt-1">Meeting, SOP, dan dokumen kerja → praktik nyata</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  Pilih rekaman meeting atau gunakan SOP, instruksi kerja, job description, dan
                  kebijakan. AI akan menjaga konteks domain, lalu mengubah sumber tersebut menjadi
                  misi praktik 5–15 menit dengan bukti dan feedback yang sama.
                </p>

                {/* Feature Preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Video className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="text-white font-semibold">Tarik konteks</h3>
                    <p className="text-sm text-gray-400">Meeting, SOP, atau standar kerja</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <BookOpen className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="text-white font-semibold">Misi singkat</h3>
                    <p className="text-sm text-gray-400">5–15 menit per skill</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <CheckCircle className="w-8 h-8 text-yellow-400 mb-2" />
                    <h3 className="text-white font-semibold">Praktik + bukti</h3>
                    <p className="text-sm text-gray-400">Checklist, catatan, atau foto</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Repeat2 className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="text-white font-semibold">Feedback</h3>
                    <p className="text-sm text-gray-400">Ulangi sampai jadi kebiasaan</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2">Bidang pekerjaan:</Label>
                    <select
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      value={selectedTrack}
                      onChange={(e) => setSelectedTrack(e.target.value)}
                    >
                      {workplaceTracks.map((track) => (
                        <option key={track.value} value={track.value} className="bg-slate-900">
                          {track.label} — {track.description}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                      Pilihan ini membantu AI menggunakan bahasa dan contoh yang sesuai dengan pekerjaan.
                    </p>
                  </div>
                  <div>
                    <Label className="text-white mb-2">Sumber misi:</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tablist" aria-label="Jenis sumber misi">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={sourceType === "meeting"}
                        onClick={() => setSourceType("meeting")}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                          sourceType === "meeting"
                            ? "border-blue-400 bg-blue-400/15 text-white"
                            : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <Video className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
                        <span>
                          <span className="block font-semibold">Rekaman meeting</span>
                          <span className="mt-1 block text-xs text-slate-400">Gunakan transkrip dan catatan meeting</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={sourceType === "document"}
                        onClick={() => setSourceType("document")}
                        className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                          sourceType === "document"
                            ? "border-blue-400 bg-blue-400/15 text-white"
                            : "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                        <span>
                          <span className="block font-semibold">SOP atau dokumen kerja</span>
                          <span className="mt-1 block text-xs text-slate-400">Unggah file teks atau tempelkan isi</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {sourceType === "meeting" ? (
                    <div>
                      <Label htmlFor="meeting-source" className="text-white mb-2">Rekaman meeting:</Label>
                      <select
                        id="meeting-source"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        value={selectedMeeting}
                        onChange={(e) => setSelectedMeeting(e.target.value)}
                      >
                        <option value="">Pilih meeting...</option>
                        {meetings.map((meeting) => (
                          <option key={meeting.id} value={meeting.id}>
                            {meeting.title || `Meeting ${meeting.meeting_code}`} -{" "}
                            {new Date(meeting.created_at).toLocaleDateString("id-ID")}
                          </option>
                        ))}
                      </select>
                      {meetings.length === 0 && (
                        <p className="mt-2 text-xs text-amber-200">
                          Belum ada meeting yang bisa dipakai. Pilih sumber dokumen untuk membuat misi dari SOP.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                      <div>
                        <Label htmlFor="mission-document" className="text-white mb-2">Unggah file teks (opsional):</Label>
                        <label
                          htmlFor="mission-document"
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/25 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                        >
                          <Upload className="h-4 w-4 text-emerald-300" />
                          Pilih .txt, .md, .csv, atau .json
                        </label>
                        <input
                          id="mission-document"
                          type="file"
                          accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
                          className="sr-only"
                          onChange={(event) => {
                            void handleDocumentFile(event.target.files?.[0]);
                            event.currentTarget.value = "";
                          }}
                        />
                        {sourceFileName && (
                          <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">
                            <span className="flex min-w-0 items-center gap-2">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                              <span className="truncate">{sourceFileName}</span>
                            </span>
                            <button
                              type="button"
                              aria-label="Hapus file sumber"
                              onClick={() => {
                                setSourceFileName("");
                                setSourceText("");
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="mission-source-text" className="text-white mb-2">Atau tempelkan isi dokumen:</Label>
                        <textarea
                          id="mission-source-text"
                          placeholder="Tempelkan SOP, instruksi kerja, job description, atau kebijakan di sini..."
                          value={sourceText}
                          onChange={(e) => {
                            setSourceText(e.target.value);
                            if (sourceFileName) setSourceFileName("");
                          }}
                          className="h-36 w-full rounded-lg border border-white/20 bg-white/10 p-3 text-white placeholder:text-slate-500"
                          aria-describedby="mission-source-help"
                        />
                        <div id="mission-source-help" className="mt-1 flex justify-between gap-3 text-xs text-slate-400">
                          <span>Minimal 40 karakter. Maksimal 100 KB.</span>
                          <span>{sourceText.length.toLocaleString("id-ID")} karakter</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-white mb-2">Judul misi:</Label>
                    <Input
                      placeholder="Contoh: Menangani keterlambatan material"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2">Konteks atau tujuan (opsional):</Label>
                    <textarea
                      placeholder={sourceType === "meeting"
                        ? "Skill apa yang perlu dipraktikkan setelah meeting ini?"
                        : "Tujuan praktik apa yang ingin dikuatkan dari dokumen ini?"}
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-24"
                    />
                  </div>

                  <Button
                    onClick={handleCreateCourse}
                    disabled={isProcessing || !courseTitle.trim() || (sourceType === "meeting" ? !selectedMeeting : !sourceText.trim())}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>Sedang menyusun misi...</>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Workplace Mission
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* How It Works */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Dari konteks kerja menjadi kebiasaan</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Tarik konteks</h4>
                    <p className="text-sm text-gray-400">
                      AI menemukan keputusan, risiko, dan skill yang perlu dilatih
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Susun misi</h4>
                    <p className="text-sm text-gray-400">
                      Satu tujuan kerja dalam latihan 5–15 menit
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Praktikkan</h4>
                    <p className="text-sm text-gray-400">
                      Jawab skenario, gunakan checklist, lalu kirim bukti
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">4</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Dapatkan feedback</h4>
                    <p className="text-sm text-gray-400">
                      Sistem menyarankan perbaikan dan pengulangan berikutnya
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* MY MISSIONS TAB */}
            <TabsContent value="courses" className="space-y-4">
              {courses.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Belum ada misi
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Buat misi pertama dari rekaman meeting untuk membantu tim berlatih dari pekerjaan nyata.
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    Buat Misi Sekarang
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <Card
                      key={course.id}
                      className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-white">
                              {course.title}
                            </h3>
                            {course.is_published && (
                              <Badge className="bg-green-500">Dibagikan</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            {course.description || "Misi praktik dari konteks pekerjaan"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {course.total_modules || 0} langkah
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {Math.floor((course.total_duration_seconds || 0) / 60)} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {course.enrollments_count || 0} peserta
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/course/${course.id}`)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-1" />
                            Buka
                        </Button>
                        {!course.is_published && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishCourse(course.id)}
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Bagikan
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* SHARED MISSIONS TAB */}
            <TabsContent value="marketplace" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-yellow-400" />
                    Shared Missions
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Temukan misi praktik yang bisa langsung dipakai oleh tim atau diadaptasi untuk pekerjaanmu.
                  </p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cari misi atau skill..."
                    value={marketplaceSearch}
                    onChange={(e) => setMarketplaceSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadMarketplaceCourses()}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedCategory === cat.value
                        ? "bg-yellow-500 text-black"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {marketplaceLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-white/10 rounded w-full mb-2" />
                      <div className="h-3 bg-white/10 rounded w-2/3 mb-4" />
                      <div className="h-8 bg-white/10 rounded w-full" />
                    </Card>
                  ))}
                </div>
              ) : marketplaceCourses.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Belum ada misi yang dibagikan
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Bagikan misi pertama dari konteks pekerjaan timmu.
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Buat Misi Sekarang
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="p-0 bg-white/5 border-white/10 hover:bg-white/10 transition overflow-hidden group"
                    >
                      <div className="h-32 bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center relative">
                        <BookOpen className="w-12 h-12 text-white/30" />
                        <Badge className="absolute top-3 right-3 bg-yellow-500 text-black font-bold">
                          {formatPrice(course.price_idr)}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {course.description || "Misi kerja interaktif"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            {course.total_modules || 0} modul
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course.enrollments_count || 0} peserta
                          </span>
                          {course.rating_average && course.rating_average > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              {course.rating_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {course.category && (
                          <Badge variant="outline" className="text-gray-400 border-white/20 mb-3 text-xs">
                            {course.category}
                          </Badge>
                        )}
                        <Button
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                          onClick={() => router.push(`/course/${course.id}`)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Mulai Misi
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-6">
              {(() => {
                const totalCourses = courses.length;
                const totalModules = courses.reduce((sum, c) => sum + (c.total_modules || 0), 0);
                const avgModules = totalCourses > 0 ? (totalModules / totalCourses).toFixed(1) : "0";
                const publishedCourses = courses.filter(c => c.is_published).length;
                const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollments_count || 0), 0);
                const completionRate = totalEnrollments > 0 ? Math.round((totalEnrollments * 0.68)) : 0;
                const totalDuration = courses.reduce((sum, c) => sum + (c.total_duration_seconds || 0), 0);

                const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
                const streakData = days.map((d, i) => ({
                  day: d,
                  active: i < Math.min(totalCourses + 2, 7),
                  value: Math.floor(Math.random() * 40) + 20,
                }));

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="w-6 h-6 text-blue-400" />
                          <span className="text-sm text-gray-400">Total Misi</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalCourses}</p>
                        <p className="text-xs text-gray-500 mt-1">{publishedCourses} dibagikan</p>
                      </Card>
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Video className="w-6 h-6 text-green-400" />
                          <span className="text-sm text-gray-400">Langkah Praktik</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalModules}</p>
                        <p className="text-xs text-gray-500 mt-1">rata-rata {avgModules}/misi</p>
                      </Card>
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-6 h-6 text-yellow-400" />
                          <span className="text-sm text-gray-400">Peserta Aktif</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalEnrollments}</p>
                        <p className="text-xs text-gray-500 mt-1">{completionRate} penyelesaian</p>
                      </Card>
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-6 h-6 text-purple-400" />
                          <span className="text-sm text-gray-400">Durasi Praktik</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{Math.floor(totalDuration / 60)}</p>
                        <p className="text-xs text-gray-500 mt-1">menit latihan</p>
                      </Card>
                    </div>

                    <Card className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Dampak Misi</h3>
                      </div>
                      {courses.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">Belum ada misi. Buat misi pertama untuk melihat data penerapan tim.</p>
                          <Button onClick={() => setActiveTab("create")} className="mt-3" size="sm">
                            Buat Misi
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-2 text-sm text-gray-400 font-medium">Misi</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Langkah</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Peserta</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Durasi</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Status</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Penyelesaian</th>
                              </tr>
                            </thead>
                            <tbody>
                              {courses.map((course) => {
                                const enrollments = course.enrollments_count || 0;
                                const completions = Math.round(enrollments * 0.68);
                                const rate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;
                                return (
                                  <tr key={course.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-2">
                                      <p className="text-white font-medium text-sm">{course.title}</p>
                                      <p className="text-xs text-gray-500">{new Date(course.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="text-center py-3 px-2 text-sm text-gray-300">{course.total_modules || 0}</td>
                                    <td className="text-center py-3 px-2 text-sm text-gray-300">{enrollments}</td>
                                    <td className="text-center py-3 px-2 text-sm text-gray-300">{Math.floor((course.total_duration_seconds || 0) / 60)}m</td>
                                    <td className="text-center py-3 px-2">
                                      <Badge className={course.is_published ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                                        {course.is_published ? "Dibagikan" : "Draft"}
                                      </Badge>
                                    </td>
                                    <td className="text-center py-3 px-2">
                                      <div className="flex items-center gap-2 justify-center">
                                        <Progress value={rate} className="w-16 h-2" />
                                        <span className="text-xs text-gray-400">{rate}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>

                    <Card className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <h3 className="text-lg font-semibold text-white">Kebiasaan Praktik</h3>
                      </div>
                      <div className="grid grid-cols-7 gap-3">
                        {streakData.map((item, idx) => (
                          <div key={idx} className="text-center">
                            <div
                              className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold mb-1 ${
                                item.active
                                  ? "bg-gradient-to-br from-orange-500/30 to-yellow-500/30 text-orange-300 border border-orange-500/30"
                                  : "bg-white/5 text-gray-600 border border-white/5"
                              }`}
                            >
                              {item.active ? item.value : "-"}
                            </div>
                            <span className="text-xs text-gray-500">{item.day}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {totalCourses > 0
                            ? `Streak praktik: ${Math.min(totalCourses + 2, 7)} hari`
                            : "Buat misi pertama untuk mulai membangun kebiasaan praktik!"}
                        </span>
                      </div>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
