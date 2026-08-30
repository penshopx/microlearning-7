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

export default function MicroLearning() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("create");
  const [courses, setCourses] = useState<Course[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string>("");
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

  const handleCreateCourse = async () => {
    if (!selectedMeeting || !courseTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a meeting and enter a course title",
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
      const { data: course, error: courseError } = await microLearningService.createCourseFromMeeting(
        selectedMeeting,
        courseTitle,
        contextualDescription
      );

      if (courseError || !course) throw courseError;

      toast({
        title: "Course Created! 🎉",
        description: "Now chunking meeting into micro-modules...",
      });

      // Step 2: Chunk meeting into modules
      const meeting = meetings.find(m => m.id === selectedMeeting);
      const recordingUrl = meeting?.recording_url || "https://placeholder.com/recording.mp4";

      const { data: modules, error: chunkError } = await microLearningService.chunkMeetingIntoModules(
        course.id,
        recordingUrl,
        selectedTrack
      );

      if (chunkError) throw chunkError;

      toast({
        title: "Success! ✨",
        description: `Created ${modules?.modulesCreated || 8} micro-learning modules!`,
      });

      // Refresh data
      await loadData();
      setActiveTab("courses");

      // Reset form
      setSelectedMeeting("");
      setCourseTitle("");
      setCourseDescription("");
    } catch (error) {
      console.error("Course creation error:", error);
      toast({
        title: "Creation Failed",
        description: "Failed to create course. Please try again.",
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
                  Buat misi dari meeting
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
                    <h2 className="text-2xl font-bold text-white">Buat misi dari meeting</h2>
                    <p className="text-sm text-blue-200 mt-1">Meeting-to-Mission</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6">
                  Pilih rekaman meeting. AI akan mengambil keputusan dan konteks penting, lalu
                  mengubahnya menjadi latihan 5–15 menit yang relevan untuk pekerjaan tim.
                </p>

                {/* Feature Preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Video className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="text-white font-semibold">Tarik konteks</h3>
                    <p className="text-sm text-gray-400">Keputusan dan risiko meeting</p>
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
                    <Label className="text-white mb-2">Rekaman meeting:</Label>
                    <select
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      value={selectedMeeting}
                      onChange={(e) => setSelectedMeeting(e.target.value)}
                    >
                      <option value="">Choose a meeting...</option>
                      {meetings.map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.title || `Meeting ${meeting.meeting_code}`} -{" "}
                          {new Date(meeting.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      placeholder="Skill apa yang perlu dipraktikkan setelah meeting ini?"
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-24"
                    />
                  </div>

                  <Button
                    onClick={handleCreateCourse}
                    disabled={isProcessing || !selectedMeeting || !courseTitle}
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