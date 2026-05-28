import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import {
  Target, BookOpen, Video, Wrench, ClipboardCheck, Lightbulb,
  ChevronRight, ChevronLeft, Plus, Trash2, Sparkles, Brain,
  Award, Star, GraduationCap, BarChart3, CheckCircle, Circle,
  FileText, Users, Zap, TrendingUp, Save, Eye, Download, Lock,
  Map, Shield, Layers, ArrowRight, RefreshCw
} from "lucide-react";
import Link from "next/link";

const COMPETENCY_LEVELS = [
  { id: "L1", label: "L1 - Awareness", desc: "Mengetahui dan memahami konsep dasar", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", border: "border-blue-300 dark:border-blue-700" },
  { id: "L2", label: "L2 - Application", desc: "Mampu menerapkan dengan bimbingan", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", border: "border-green-300 dark:border-green-700" },
  { id: "L3", label: "L3 - Mastery", desc: "Menguasai dan mandiri dalam penerapan", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", border: "border-purple-300 dark:border-purple-700" },
  { id: "L4", label: "L4 - Strategic", desc: "Mampu mengajarkan dan mengembangkan", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", border: "border-orange-300 dark:border-orange-700" },
];

const SKKNI_SECTORS = [
  "Teknologi Informasi & Komunikasi",
  "Manajemen & Bisnis",
  "Keuangan & Perbankan",
  "Pemasaran & Penjualan",
  "Sumber Daya Manusia",
  "Produksi & Manufaktur",
  "Pendidikan & Pelatihan",
  "Kesehatan & Keselamatan Kerja",
  "Logistik & Supply Chain",
  "Pariwisata & Perhotelan",
  "Konstruksi – Sipil Gedung (BimtekKita)",
  "Konstruksi – K3 Keselamatan Kerja (BimtekKita)",
  "Konstruksi – Jalan & Jembatan (BimtekKita)",
  "Konstruksi – Elektrikal (BimtekKita)",
  "Konstruksi – Mekanikal (BimtekKita)",
  "Konstruksi – Manajemen Proyek (BimtekKita)",
  "Konstruksi – Sertifikasi SKK/BNSP (BimtekKita)",
];

const ASSESSMENT_METHODS = [
  { id: "apl", label: "APL (Asesmen Portofolio Lampiran)", icon: FileText },
  { id: "observasi", label: "Observasi Langsung", icon: Eye },
  { id: "wawancara", label: "Wawancara Kompetensi", icon: Users },
  { id: "tes_tertulis", label: "Tes Tertulis", icon: ClipboardCheck },
  { id: "portfolio", label: "Portfolio & Karya", icon: BookOpen },
  { id: "simulasi", label: "Simulasi / Role-Play", icon: Layers },
];

const STEPS = [
  { id: 0, label: "Orientasi", icon: Target, desc: "Standar & indikator kompetensi", color: "from-blue-500 to-blue-600" },
  { id: 1, label: "Konteks", icon: Map, desc: "Studi kasus & situasi nyata", color: "from-teal-500 to-teal-600" },
  { id: 2, label: "Microlearning", icon: Video, desc: "Video, artikel & konten AI", color: "from-purple-500 to-purple-600" },
  { id: 3, label: "Praktik", icon: Wrench, desc: "Tugas berbasis pekerjaan nyata", color: "from-orange-500 to-orange-600" },
  { id: 4, label: "Asesmen", icon: ClipboardCheck, desc: "Project, observasi & evaluasi", color: "from-red-500 to-red-600" },
  { id: 5, label: "Refleksi", icon: Lightbulb, desc: "Evidensi & portofolio kompetensi", color: "from-green-500 to-green-600" },
];

interface CourseData {
  title: string;
  competencyUnit: string;
  skkniCode: string;
  sector: string;
  level: string;
  orientasi: { standards: string[]; indicators: string[]; objective: string };
  konteks: { caseStudy: string; realScenario: string; relevance: string };
  microlearning: { videoTopics: string[]; articles: string[]; aiSummary: string };
  praktik: { tasks: string[]; workBased: string; duration: string };
  asesmen: { methods: string[]; projectDesc: string; passingScore: string };
  refleksi: { evidenceTypes: string[]; portfolioItems: string[]; selfAssessment: string };
}

const defaultCourse = (): CourseData => ({
  title: "",
  competencyUnit: "",
  skkniCode: "",
  sector: SKKNI_SECTORS[0],
  level: "L2",
  orientasi: { standards: [""], indicators: ["", ""], objective: "" },
  konteks: { caseStudy: "", realScenario: "", relevance: "" },
  microlearning: { videoTopics: [""], articles: [""], aiSummary: "" },
  praktik: { tasks: [""], workBased: "", duration: "2 minggu" },
  asesmen: { methods: ["observasi", "tes_tertulis"], projectDesc: "", passingScore: "70" },
  refleksi: { evidenceTypes: [""], portfolioItems: [""], selfAssessment: "" },
});

const SAMPLE_COURSES = [
  { title: "Pemasaran Digital Berbasis Data", unit: "M.702090.001.01", sector: "Pemasaran & Penjualan", level: "L2" },
  { title: "Manajemen Tim Lintas Fungsi", unit: "M.701001.036.01", sector: "Sumber Daya Manusia", level: "L3" },
  { title: "Pengembangan Aplikasi Web", unit: "J.620100.001.02", sector: "Teknologi Informasi & Komunikasi", level: "L3" },
  { title: "Keselamatan & Kesehatan Kerja", unit: "P.854900.001.01", sector: "Kesehatan & Keselamatan Kerja", level: "L1" },
  { title: "K3 Konstruksi Gedung", unit: "B001-K3-001.01", sector: "Konstruksi – K3 Keselamatan Kerja (BimtekKita)", level: "L2" },
  { title: "Teknik Fondasi & Struktur Bangunan Gedung", unit: "B001-SG-001.01", sector: "Konstruksi – Sipil Gedung (BimtekKita)", level: "L3" },
  { title: "Manajemen Proyek Konstruksi", unit: "B007-MJ-001.01", sector: "Konstruksi – Manajemen Proyek (BimtekKita)", level: "L3" },
  { title: "Desain Jalan Raya & Perkerasan", unit: "F001-JL-001.01", sector: "Konstruksi – Jalan & Jembatan (BimtekKita)", level: "L3" },
  { title: "Instalasi Listrik & Proteksi Gedung", unit: "E002-EL-001.01", sector: "Konstruksi – Elektrikal (BimtekKita)", level: "L2" },
];

export default function CompetencyBuilder() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [course, setCourse] = useState<CourseData>(defaultCourse());
  const [savedCourses, setSavedCourses] = useState<(CourseData & { id: string; createdAt: string; completedSteps: number })[]>([]);
  const [activeTab, setActiveTab] = useState<"builder" | "library" | "preview">("builder");
  const [generating, setGenerating] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);

  const storageKey = getUserStorageKey(user, "competency_courses");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setSavedCourses(JSON.parse(saved));
    } catch {}
  }, [storageKey]);

  const save = (courses: typeof savedCourses) => {
    setSavedCourses(courses);
    localStorage.setItem(storageKey, JSON.stringify(courses));
  };

  const markStepComplete = (step: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const updateCourse = (field: keyof CourseData, value: any) => {
    setCourse(prev => ({ ...prev, [field]: value }));
  };

  const updateNested = (section: keyof CourseData, field: string, value: any) => {
    setCourse(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value }
    }));
  };

  const addItem = (section: keyof CourseData, field: string) => {
    const arr = ((course[section] as any)[field] as string[]);
    updateNested(section, field, [...arr, ""]);
  };

  const removeItem = (section: keyof CourseData, field: string, idx: number) => {
    const arr = ((course[section] as any)[field] as string[]);
    updateNested(section, field, arr.filter((_: any, i: number) => i !== idx));
  };

  const updateItem = (section: keyof CourseData, field: string, idx: number, value: string) => {
    const arr = [...((course[section] as any)[field] as string[])];
    arr[idx] = value;
    updateNested(section, field, arr);
  };

  const saveCourse = () => {
    if (!course.title || !course.competencyUnit) {
      toast({ title: "Lengkapi data dasar", description: "Judul e-course dan unit kompetensi wajib diisi.", variant: "destructive" });
      return;
    }
    const existing = savedCourses.findIndex(c => c.id === (course as any).id);
    const entry = { ...course, id: (course as any).id || Date.now().toString(), createdAt: new Date().toISOString(), completedSteps: completedSteps.size };
    const updated = existing >= 0 ? savedCourses.map((c, i) => i === existing ? entry : c) : [entry, ...savedCourses];
    save(updated);
    toast({ title: "E-Course tersimpan!", description: `"${course.title}" berhasil disimpan ke perpustakaan Anda.` });
  };

  const loadCourse = (c: any) => {
    setCourse(c);
    setActiveTab("builder");
    setCurrentStep(0);
    setCompletedSteps(new Set(Array.from({ length: c.completedSteps }, (_, i) => i)));
    toast({ title: "E-Course dimuat", description: `Melanjutkan "${c.title}"` });
  };

  const deleteCourse = (id: string) => {
    save(savedCourses.filter(c => c.id !== id));
    toast({ title: "Dihapus" });
  };

  const newCourse = () => {
    setCourse(defaultCourse());
    setCurrentStep(0);
    setCompletedSteps(new Set());
  };

  const callAI = async (type: string) => {
    const res = await fetch("/api/ai/generate-competency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        competencyUnit: course.competencyUnit,
        sector: course.sector,
        level: course.level,
        title: course.title,
      }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const json = await res.json();
    return json.data;
  };

  const generateAI = async (type: string) => {
    if (!course.competencyUnit) {
      toast({ title: "Isi unit kompetensi dulu", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setAiError(null);
    try {
      if (type === "indicators") {
        const data = await callAI("indicators");
        if (data.objective) updateNested("orientasi", "objective", data.objective);
        if (data.standards?.length) updateNested("orientasi", "standards", data.standards);
        if (data.indicators?.length) updateNested("orientasi", "indicators", data.indicators);
        markStepComplete(0);
      } else if (type === "caseStudy") {
        const data = await callAI("konteks");
        if (data.caseStudy) updateNested("konteks", "caseStudy", data.caseStudy);
        if (data.realScenario) updateNested("konteks", "realScenario", data.realScenario);
        if (data.relevance) updateNested("konteks", "relevance", data.relevance);
        markStepComplete(1);
      } else if (type === "microlearning") {
        const data = await callAI("microlearning");
        if (data.videoTopics?.length) updateNested("microlearning", "videoTopics", data.videoTopics);
        if (data.articles?.length) updateNested("microlearning", "articles", data.articles);
        if (data.aiSummary) updateNested("microlearning", "aiSummary", data.aiSummary);
        markStepComplete(2);
      } else if (type === "tasks") {
        const data = await callAI("praktik");
        if (data.tasks?.length) updateNested("praktik", "tasks", data.tasks);
        if (data.workBased) updateNested("praktik", "workBased", data.workBased);
        if (data.duration) updateNested("praktik", "duration", data.duration);
        markStepComplete(3);
      } else if (type === "selfAssessment") {
        const data = await callAI("refleksi");
        if (data.selfAssessment) updateNested("refleksi", "selfAssessment", data.selfAssessment);
        if (data.evidenceTypes?.length) updateNested("refleksi", "evidenceTypes", data.evidenceTypes);
        if (data.portfolioItems?.length) updateNested("refleksi", "portfolioItems", data.portfolioItems);
        markStepComplete(5);
      }
      toast({ title: "AI berhasil generate konten!", description: "Konten telah diisi. Silakan review dan sesuaikan." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal generate";
      setAiError(msg);
      toast({ title: "Gagal generate AI", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generateFullCourse = async () => {
    if (!course.competencyUnit || !course.title) {
      toast({ title: "Isi judul & unit kompetensi dulu", variant: "destructive" });
      return;
    }
    setGeneratingAll(true);
    setAiError(null);
    try {
      const data = await callAI("full");
      setCourse(prev => ({
        ...prev,
        orientasi: {
          objective: data.orientasi?.objective || prev.orientasi.objective,
          standards: data.orientasi?.standards || prev.orientasi.standards,
          indicators: data.orientasi?.indicators || prev.orientasi.indicators,
        },
        konteks: {
          caseStudy: data.konteks?.caseStudy || prev.konteks.caseStudy,
          realScenario: data.konteks?.realScenario || prev.konteks.realScenario,
          relevance: data.konteks?.relevance || prev.konteks.relevance,
        },
        microlearning: {
          videoTopics: data.microlearning?.videoTopics || prev.microlearning.videoTopics,
          articles: data.microlearning?.articles || prev.microlearning.articles,
          aiSummary: data.microlearning?.aiSummary || prev.microlearning.aiSummary,
        },
        praktik: {
          tasks: data.praktik?.tasks || prev.praktik.tasks,
          workBased: data.praktik?.workBased || prev.praktik.workBased,
          duration: data.praktik?.duration || prev.praktik.duration,
        },
        refleksi: {
          selfAssessment: data.refleksi?.selfAssessment || prev.refleksi.selfAssessment,
          evidenceTypes: data.refleksi?.evidenceTypes || prev.refleksi.evidenceTypes,
          portfolioItems: data.refleksi?.portfolioItems || prev.refleksi.portfolioItems,
        },
      }));
      setCompletedSteps(new Set([0, 1, 2, 3, 5]));
      toast({ title: "Seluruh e-course berhasil di-generate!", description: "AI telah mengisi semua 6 langkah. Review dan sesuaikan sebelum menyimpan." });
      setActiveTab("preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal generate";
      setAiError(msg);
      toast({ title: "Gagal generate lengkap", description: msg, variant: "destructive" });
    } finally {
      setGeneratingAll(false);
    }
  };

  const progress = Math.round((completedSteps.size / STEPS.length) * 100);
  const selectedLevel = COMPETENCY_LEVELS.find(l => l.id === course.level) || COMPETENCY_LEVELS[1];

  const toggleAssessmentMethod = (id: string) => {
    const methods = course.asesmen.methods.includes(id)
      ? course.asesmen.methods.filter(m => m !== id)
      : [...course.asesmen.methods, id];
    updateNested("asesmen", "methods", methods);
  };

  return (
    <>
      <SEO
        title="Competency E-Course Builder - Chaesa Live"
        description="Bangun e-course berbasis kompetensi dengan struktur 6 langkah, level L1-L4, dan pemetaan SKKNI. Didukung AI Chaesa Live."
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
        <PageHeader title="Competency E-Course Builder" icon={Target} backHref="/" backLabel="Beranda" />

        <div className="max-w-6xl mx-auto px-4 py-6">

          {/* Header Banner */}
          <div className="mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">Powered by Chaesa Live AI</Badge>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">SKKNI Standard</Badge>
                </div>
                <h1 className="text-2xl font-bold mb-1">Competency E-Course Builder</h1>
                <p className="text-blue-100 text-sm">Bangun e-course terstruktur dari unit kompetensi — bukan sekadar materi. 1 unit kompetensi = 1 e-course yang terukur.</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button
                  onClick={generateFullCourse}
                  disabled={generatingAll || !course.title || !course.competencyUnit}
                  size="sm"
                  className="bg-yellow-400 text-gray-900 hover:bg-yellow-300 font-bold"
                >
                  {generatingAll ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
                  {generatingAll ? "Generating..." : "Generate Semua Langkah"}
                </Button>
                <Button onClick={() => setActiveTab("preview")} variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 bg-white/10">
                  <Eye className="w-4 h-4 mr-1.5" /> Preview
                </Button>
                <Button onClick={() => setActiveTab("library")} variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20 bg-white/10">
                  <BookOpen className="w-4 h-4 mr-1.5" /> Perpustakaan ({savedCourses.length})
                </Button>
                <Button onClick={() => { newCourse(); setActiveTab("builder"); }} size="sm" className="bg-white text-purple-700 hover:bg-white/90 font-semibold">
                  <Plus className="w-4 h-4 mr-1.5" /> Buat Baru
                </Button>
              </div>
            </div>
          </div>

          {/* AI Error Banner */}
          {aiError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
              <span>⚠️ {aiError}</span>
              <button onClick={() => setAiError(null)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
            </div>
          )}

          {/* Generating Full Course Banner */}
          {generatingAll && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
                <span className="font-semibold text-yellow-700 dark:text-yellow-300">AI sedang menyusun e-course lengkap Anda...</span>
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">Menganalisis unit kompetensi, menyusun 6 langkah terstruktur sesuai standar SKKNI dan level {course.level}. Mohon tunggu...</p>
              <Progress value={undefined} className="h-1.5 mt-3" />
            </div>
          )}

          {activeTab === "library" ? (
            <LibraryView savedCourses={savedCourses} onLoad={loadCourse} onDelete={deleteCourse} onNew={() => { newCourse(); setActiveTab("builder"); }} />
          ) : activeTab === "preview" ? (
            <CoursePreview course={course} completedSteps={completedSteps} onEdit={() => setActiveTab("builder")} onSave={saveCourse} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

              {/* Sidebar: Steps & Info */}
              <div className="lg:col-span-1 space-y-4">
                {/* Progress */}
                <Card className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress E-Course</span>
                    <span className="text-sm font-bold text-purple-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2 mb-3" />
                  <div className="space-y-1">
                    {STEPS.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isDone = completedSteps.has(idx);
                      const isCurrent = currentStep === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentStep(idx)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                            isCurrent ? "bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700" :
                            "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isDone ? "bg-green-500" : isCurrent ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                            {isDone ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <span className="text-xs text-white font-bold">{idx + 1}</span>}
                          </div>
                          <div className="min-w-0">
                            <div className={`font-medium truncate ${isCurrent ? "text-purple-700 dark:text-purple-300" : "text-gray-700 dark:text-gray-300"}`}>{step.label}</div>
                            <div className="text-xs text-gray-400 truncate">{step.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Level Badge */}
                <Card className={`p-4 border ${selectedLevel.border} bg-white dark:bg-gray-900`}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Level Kompetensi</div>
                  <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-bold mb-2 ${selectedLevel.color}`}>
                    {selectedLevel.label}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLevel.desc}</p>
                </Card>

                {/* Quick Link to Passport */}
                <Link href="/competency-passport">
                  <Card className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">Competency Passport</span>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400">Lihat semua kompetensi yang telah Anda kuasai →</p>
                  </Card>
                </Link>
              </div>

              {/* Main Content: Step Forms */}
              <div className="lg:col-span-3 space-y-4">
                {/* Basic Info (always visible) */}
                <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-500" /> Informasi Dasar E-Course
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-sm font-medium">Judul E-Course *</Label>
                      <Input value={course.title} onChange={e => updateCourse("title", e.target.value)} placeholder="cth: Manajemen Proyek Digital Tingkat Menengah" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Unit Kompetensi (SKKNI) *</Label>
                      <Input value={course.competencyUnit} onChange={e => updateCourse("competencyUnit", e.target.value)} placeholder="cth: M.702090.001.01" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kode SKKNI</Label>
                      <Input value={course.skkniCode} onChange={e => updateCourse("skkniCode", e.target.value)} placeholder="cth: SKKNI 2023-xxx" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sektor / Bidang</Label>
                      <select
                        value={course.sector}
                        onChange={e => updateCourse("sector", e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                      >
                        {SKKNI_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Level Kompetensi</Label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        {COMPETENCY_LEVELS.map(l => (
                          <button
                            key={l.id}
                            onClick={() => updateCourse("level", l.id)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all text-left ${
                              course.level === l.id ? `${l.color} ${l.border} border-2` : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <div className="font-bold">{l.id}</div>
                            <div className="text-xs opacity-75 truncate">{l.label.split(" - ")[1]}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sample templates */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Muat dari template contoh:</div>
                    <div className="flex flex-wrap gap-2">
                      {SAMPLE_COURSES.map((s, idx) => (
                        <button key={idx} onClick={() => {
                          setCourse(prev => ({ ...prev, title: s.title, competencyUnit: s.unit, sector: s.sector, level: s.level }));
                          toast({ title: "Template dimuat", description: s.title });
                        }} className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                          {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* BimtekKita Callout for Konstruksi sectors */}
                {course.sector.includes("BimtekKita") && (
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl shrink-0">🏗️</span>
                      <div>
                        <p className="font-semibold text-orange-700 dark:text-orange-300 text-sm">Sektor Konstruksi — Didukung BimtekKita</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Akses 157 modul BIMTEK, database SKK, dan 8 AI Expert konstruksi yang relevan untuk sektor ini di BimtekKita.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href="/bimtek-integration">
                        <Button size="sm" className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white">
                          Buka BimtekKita
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Step Content */}
                <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${STEPS[currentStep].color} flex items-center justify-center shadow`}>
                        {(() => { const Icon = STEPS[currentStep].icon; return <Icon className="w-5 h-5 text-white" />; })()}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Langkah {currentStep + 1}: {STEPS[currentStep].label}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{STEPS[currentStep].desc}</p>
                      </div>
                    </div>
                    {completedSteps.has(currentStep) && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" /> Selesai
                      </Badge>
                    )}
                  </div>

                  {currentStep === 0 && (
                    <Step0Orientasi course={course} updateNested={updateNested} addItem={addItem} removeItem={removeItem} updateItem={updateItem} generating={generating} onGenerate={() => generateAI("indicators")} />
                  )}
                  {currentStep === 1 && (
                    <Step1Konteks course={course} updateNested={updateNested} generating={generating} onGenerate={() => generateAI("caseStudy")} />
                  )}
                  {currentStep === 2 && (
                    <Step2Microlearning course={course} updateNested={updateNested} addItem={addItem} removeItem={removeItem} updateItem={updateItem} generating={generating} onGenerate={() => generateAI("microlearning")} />
                  )}
                  {currentStep === 3 && (
                    <Step3Praktik course={course} updateNested={updateNested} addItem={addItem} removeItem={removeItem} updateItem={updateItem} generating={generating} onGenerate={() => generateAI("tasks")} />
                  )}
                  {currentStep === 4 && (
                    <Step4Asesmen course={course} updateNested={updateNested} toggleMethod={toggleAssessmentMethod} />
                  )}
                  {currentStep === 5 && (
                    <Step5Refleksi course={course} updateNested={updateNested} addItem={addItem} removeItem={removeItem} updateItem={updateItem} generating={generating} onGenerate={() => generateAI("selfAssessment")} />
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                      disabled={currentStep === 0}
                      size="sm"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={() => { markStepComplete(currentStep); toast({ title: `Langkah ${currentStep + 1} selesai!` }); }} size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20">
                        <CheckCircle className="w-4 h-4 mr-1" /> Tandai Selesai
                      </Button>
                      <Button onClick={saveCourse} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        <Save className="w-4 h-4 mr-1" /> Simpan
                      </Button>
                    </div>
                    <Button
                      onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
                      disabled={currentStep === STEPS.length - 1}
                      size="sm"
                    >
                      Berikutnya <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </Card>

                {/* Bottom quick links */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link href="/micro-learning">
                    <Card className="p-4 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">AI Studio</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Generate konten microlearning dari rekaman meeting Anda</p>
                    </Card>
                  </Link>
                  <Link href="/skills-matrix">
                    <Card className="p-4 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Skills Matrix</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Petakan gap kompetensi tim Anda dengan visualisasi radar</p>
                    </Card>
                  </Link>
                  <Link href="/sertifikasi">
                    <Card className="p-4 border border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Award className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Exam Center</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Buat ujian asesmen kompetensi untuk e-course ini</p>
                    </Card>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Step0Orientasi({ course, updateNested, addItem, removeItem, updateItem, generating, onGenerate }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Tujuan Pembelajaran</Label>
        <Textarea value={course.orientasi.objective} onChange={e => updateNested("orientasi", "objective", e.target.value)} placeholder="Setelah menyelesaikan e-course ini, peserta mampu..." rows={3} className="mt-1" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Standar Kompetensi</Label>
          <Button size="sm" variant="ghost" onClick={() => addItem("orientasi", "standards")} className="h-7 text-xs text-purple-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
        </div>
        {course.orientasi.standards.map((s: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={s} onChange={e => updateItem("orientasi", "standards", i, e.target.value)} placeholder={`Standar ${i + 1}: cth. Mampu menganalisis data pasar...`} />
            {course.orientasi.standards.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("orientasi", "standards", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Indikator Kompetensi</Label>
          <div className="flex gap-2">
            <Button size="sm" onClick={onGenerate} disabled={generating} className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              {generating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Generate AI
            </Button>
            <Button size="sm" variant="ghost" onClick={() => addItem("orientasi", "indicators")} className="h-7 text-xs text-purple-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
          </div>
        </div>
        {course.orientasi.indicators.map((ind: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={ind} onChange={e => updateItem("orientasi", "indicators", i, e.target.value)} placeholder={`Indikator ${i + 1}: cth. Peserta dapat menyusun laporan...`} />
            {course.orientasi.indicators.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("orientasi", "indicators", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Step1Konteks({ course, updateNested, generating, onGenerate }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Studi Kasus Nyata</Label>
        <Button size="sm" onClick={onGenerate} disabled={generating} className="h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white">
          {generating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Generate AI
        </Button>
      </div>
      <Textarea value={course.konteks.caseStudy} onChange={e => updateNested("konteks", "caseStudy", e.target.value)} placeholder="Describe a real-world case study that contextualizes this competency..." rows={4} />
      <div>
        <Label className="text-sm font-medium">Skenario Situasi Nyata</Label>
        <Textarea value={course.konteks.realScenario} onChange={e => updateNested("konteks", "realScenario", e.target.value)} placeholder="Gambarkan situasi kerja nyata dimana kompetensi ini diperlukan..." rows={3} className="mt-1" />
      </div>
      <div>
        <Label className="text-sm font-medium">Relevansi untuk Peserta</Label>
        <Textarea value={course.konteks.relevance} onChange={e => updateNested("konteks", "relevance", e.target.value)} placeholder="Jelaskan mengapa kompetensi ini penting bagi peserta dalam pekerjaan mereka..." rows={3} className="mt-1" />
      </div>
    </div>
  );
}

function Step2Microlearning({ course, updateNested, addItem, removeItem, updateItem, generating, onGenerate }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-sm font-medium mb-1">
          <Sparkles className="w-4 h-4" /> Integrasi dengan AI Studio Chaesa Live
        </div>
        <p className="text-xs text-purple-600 dark:text-purple-400">Upload rekaman meeting Anda ke <Link href="/micro-learning" className="underline font-medium">AI Studio</Link> untuk menghasilkan video microlearning secara otomatis, lalu tambahkan topiknya di sini.</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Topik Video (5-7 menit per video)</Label>
          <div className="flex gap-2">
            <Button size="sm" onClick={onGenerate} disabled={generating} className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              {generating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Generate AI
            </Button>
            <Button size="sm" variant="ghost" onClick={() => addItem("microlearning", "videoTopics")} className="h-7 text-xs text-purple-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
          </div>
        </div>
        {course.microlearning.videoTopics.map((t: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs text-purple-600 font-bold shrink-0">{i + 1}</div>
              <Input value={t} onChange={e => updateItem("microlearning", "videoTopics", i, e.target.value)} placeholder={`Video ${i + 1}: cth. Pengantar konsep dasar...`} />
            </div>
            {course.microlearning.videoTopics.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("microlearning", "videoTopics", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Artikel & Bahan Bacaan</Label>
          <Button size="sm" variant="ghost" onClick={() => addItem("microlearning", "articles")} className="h-7 text-xs text-purple-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
        </div>
        {course.microlearning.articles.map((a: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={a} onChange={e => updateItem("microlearning", "articles", i, e.target.value)} placeholder={`Artikel ${i + 1}: judul atau link...`} />
            {course.microlearning.articles.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("microlearning", "articles", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
      <div>
        <Label className="text-sm font-medium">Ringkasan Modul</Label>
        <Textarea value={course.microlearning.aiSummary} onChange={e => updateNested("microlearning", "aiSummary", e.target.value)} placeholder="Ringkasan keseluruhan modul microlearning ini..." rows={3} className="mt-1" />
      </div>
    </div>
  );
}

function Step3Praktik({ course, updateNested, addItem, removeItem, updateItem, generating, onGenerate }: any) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Tugas Berbasis Pekerjaan Nyata</Label>
          <div className="flex gap-2">
            <Button size="sm" onClick={onGenerate} disabled={generating} className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white">
              {generating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Generate AI
            </Button>
            <Button size="sm" variant="ghost" onClick={() => addItem("praktik", "tasks")} className="h-7 text-xs text-orange-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
          </div>
        </div>
        {course.praktik.tasks.map((t: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <Wrench className="w-4 h-4 text-orange-400 shrink-0" />
              <Input value={t} onChange={e => updateItem("praktik", "tasks", i, e.target.value)} placeholder={`Tugas ${i + 1}: cth. Buat laporan analisis...`} />
            </div>
            {course.praktik.tasks.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("praktik", "tasks", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
      <div>
        <Label className="text-sm font-medium">Deskripsi Praktik Kerja</Label>
        <Textarea value={course.praktik.workBased} onChange={e => updateNested("praktik", "workBased", e.target.value)} placeholder="Jelaskan konteks pekerjaan nyata dimana tugas ini diterapkan..." rows={3} className="mt-1" />
      </div>
      <div>
        <Label className="text-sm font-medium">Durasi Praktik</Label>
        <Input value={course.praktik.duration} onChange={e => updateNested("praktik", "duration", e.target.value)} placeholder="cth: 2 minggu, 10 jam kerja" className="mt-1 max-w-xs" />
      </div>
    </div>
  );
}

function Step4Asesmen({ course, updateNested, toggleMethod }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">Metode Asesmen (pilih yang relevan)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ASSESSMENT_METHODS.map(m => {
            const Icon = m.icon;
            const selected = course.asesmen.methods.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMethod(m.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  selected ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-700" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-red-500" : "bg-gray-100 dark:bg-gray-800"}`}>
                  <Icon className={`w-4 h-4 ${selected ? "text-white" : "text-gray-400"}`} />
                </div>
                <span className={`text-sm font-medium ${selected ? "text-red-700 dark:text-red-300" : "text-gray-700 dark:text-gray-300"}`}>{m.label}</span>
                {selected && <CheckCircle className="w-4 h-4 text-red-500 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label className="text-sm font-medium">Deskripsi Project Asesmen</Label>
        <Textarea value={course.asesmen.projectDesc} onChange={e => updateNested("asesmen", "projectDesc", e.target.value)} placeholder="Jelaskan project atau tugas akhir yang digunakan untuk menilai kompetensi peserta..." rows={4} className="mt-1" />
      </div>
      <div>
        <Label className="text-sm font-medium">Nilai Kelulusan Minimum (%)</Label>
        <Input value={course.asesmen.passingScore} onChange={e => updateNested("asesmen", "passingScore", e.target.value)} placeholder="70" type="number" min="0" max="100" className="mt-1 max-w-xs" />
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">
          <Award className="w-4 h-4" /> Integrasi Exam Center
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400">Buat ujian formal untuk kompetensi ini di <Link href="/sertifikasi" className="underline font-medium">Exam Center</Link> Chaesa Live. Hasil ujian akan secara otomatis direkam di Competency Passport Anda.</p>
      </div>
    </div>
  );
}

function Step5Refleksi({ course, updateNested, addItem, removeItem, updateItem, generating, onGenerate }: any) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Self-Assessment & Refleksi</Label>
          <Button size="sm" onClick={onGenerate} disabled={generating} className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white">
            {generating ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Generate AI
          </Button>
        </div>
        <Textarea value={course.refleksi.selfAssessment} onChange={e => updateNested("refleksi", "selfAssessment", e.target.value)} placeholder="Pertanyaan refleksi untuk peserta setelah menyelesaikan e-course..." rows={4} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Jenis Evidensi yang Dikumpulkan</Label>
          <Button size="sm" variant="ghost" onClick={() => addItem("refleksi", "evidenceTypes")} className="h-7 text-xs text-green-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
        </div>
        {course.refleksi.evidenceTypes.map((e: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={e} onChange={ev => updateItem("refleksi", "evidenceTypes", i, ev.target.value)} placeholder={`Evidensi ${i + 1}: cth. Foto dokumentasi praktik...`} />
            {course.refleksi.evidenceTypes.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("refleksi", "evidenceTypes", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Item Portfolio</Label>
          <Button size="sm" variant="ghost" onClick={() => addItem("refleksi", "portfolioItems")} className="h-7 text-xs text-green-600"><Plus className="w-3 h-3 mr-1" />Tambah</Button>
        </div>
        {course.refleksi.portfolioItems.map((p: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input value={p} onChange={e => updateItem("refleksi", "portfolioItems", i, e.target.value)} placeholder={`Portfolio ${i + 1}: cth. Laporan proyek final...`} />
            {course.refleksi.portfolioItems.length > 1 && <Button size="sm" variant="ghost" onClick={() => removeItem("refleksi", "portfolioItems", i)} className="text-red-500 px-2"><Trash2 className="w-4 h-4" /></Button>}
          </div>
        ))}
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium mb-1">
          <Shield className="w-4 h-4" /> Simpan ke Competency Passport
        </div>
        <p className="text-xs text-green-600 dark:text-green-400">Setelah menyelesaikan semua langkah, kompetensi ini akan tercatat di <Link href="/competency-passport" className="underline font-medium">Competency Passport</Link> Anda sebagai bukti penguasaan yang terverifikasi.</p>
      </div>
    </div>
  );
}

function CoursePreview({ course, completedSteps, onEdit, onSave }: { course: CourseData; completedSteps: Set<number>; onEdit: () => void; onSave: () => void }) {
  const levelConfig: Record<string, { color: string; bg: string }> = {
    L1: { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/30" },
    L2: { color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30" },
    L3: { color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/30" },
    L4: { color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30" },
  };
  const lvl = levelConfig[course.level] || levelConfig.L2;

  const totalVideos = course.microlearning.videoTopics.filter(v => v.trim()).length;
  const totalTasks = course.praktik.tasks.filter(t => t.trim()).length;
  const totalIndicators = course.orientasi.indicators.filter(i => i.trim()).length;
  const totalEvidence = course.refleksi.evidenceTypes.filter(e => e.trim()).length;
  const estimatedHours = totalVideos * 0.12 + totalTasks * 2 + 1;

  const stepData = [
    { step: STEPS[0], icon: Target, content: course.orientasi, filled: !!(course.orientasi.objective || course.orientasi.standards[0]) },
    { step: STEPS[1], icon: Map, content: course.konteks, filled: !!course.konteks.caseStudy },
    { step: STEPS[2], icon: Video, content: course.microlearning, filled: !!course.microlearning.videoTopics[0] },
    { step: STEPS[3], icon: Wrench, content: course.praktik, filled: !!course.praktik.tasks[0] },
    { step: STEPS[4], icon: ClipboardCheck, content: course.asesmen, filled: course.asesmen.methods.length > 0 },
    { step: STEPS[5], icon: Lightbulb, content: course.refleksi, filled: !!course.refleksi.selfAssessment },
  ];

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <Button onClick={onEdit} variant="outline" size="sm">
          <ChevronLeft className="w-4 h-4 mr-1" /> Kembali ke Builder
        </Button>
        <div className="flex gap-2">
          <Button onClick={onSave} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="w-4 h-4 mr-1.5" /> Simpan E-Course
          </Button>
          <Button onClick={() => window.print()} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-1.5" /> Cetak / Export
          </Button>
        </div>
      </div>

      {/* Course Header Card */}
      <Card className="p-6 border-2 border-purple-200 dark:border-purple-700 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={`${lvl.bg} ${lvl.color} border-0 font-bold`}>{course.level} - {COMPETENCY_LEVELS.find(l => l.id === course.level)?.label.split(" - ")[1]}</Badge>
              {course.skkniCode && <Badge variant="outline" className="text-xs">{course.skkniCode}</Badge>}
              <Badge variant="outline" className="text-xs">{course.sector}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{course.title || "Judul E-Course"}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">Unit Kompetensi: {course.competencyUnit}</p>
            {course.orientasi.objective && (
              <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm italic border-l-4 border-purple-300 dark:border-purple-600 pl-3">{course.orientasi.objective}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {[
              { label: "Video", value: totalVideos, icon: Video, color: "text-purple-600" },
              { label: "Indikator", value: totalIndicators, icon: Target, color: "text-blue-600" },
              { label: "Tugas Praktik", value: totalTasks, icon: Wrench, color: "text-orange-600" },
              { label: "Jenis Evidensi", value: totalEvidence, icon: FileText, color: "text-green-600" },
            ].map((s, i) => (
              <div key={i} className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 min-w-[72px]">
                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-0.5`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-green-500" /> Estimasi: ~{estimatedHours.toFixed(0)} jam belajar</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /> {course.asesmen.methods.length} metode asesmen</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-purple-500" /> {completedSteps.size}/6 langkah selesai</span>
          {course.asesmen.passingScore && <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-orange-500" /> Nilai lulus: {course.asesmen.passingScore}%</span>}
        </div>
      </Card>

      {/* 6-Step Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stepData.map(({ step, icon: Icon, content, filled }, idx) => (
          <Card key={idx} className={`p-4 border ${filled ? "border-gray-200 dark:border-gray-700" : "border-dashed border-gray-300 dark:border-gray-600 opacity-70"} bg-white dark:bg-gray-900`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400">LANGKAH {idx + 1}</span>
                  {completedSteps.has(idx) && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  {!filled && <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">Belum diisi</span>}
                </div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">{step.label}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
              {idx === 0 && (
                <>
                  {(content as any).objective && <p className="italic text-gray-500">{(content as any).objective.slice(0, 100)}{(content as any).objective.length > 100 ? "..." : ""}</p>}
                  {(content as any).indicators?.filter((i: string) => i.trim()).slice(0, 3).map((ind: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" /><span>{ind}</span></div>
                  ))}
                </>
              )}
              {idx === 1 && (content as any).caseStudy && <p>{(content as any).caseStudy.slice(0, 140)}{(content as any).caseStudy.length > 140 ? "..." : ""}</p>}
              {idx === 2 && (
                (content as any).videoTopics?.filter((v: string) => v.trim()).slice(0, 4).map((t: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-600 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                    <span>{t}</span>
                  </div>
                ))
              )}
              {idx === 3 && (
                (content as any).tasks?.filter((t: string) => t.trim()).slice(0, 3).map((t: string, i: number) => (
                  <div key={i} className="flex items-start gap-1.5"><Wrench className="w-3 h-3 text-orange-400 shrink-0 mt-0.5" /><span>{t}</span></div>
                ))
              )}
              {idx === 4 && (
                <div className="flex flex-wrap gap-1">
                  {(content as any).methods?.map((m: string) => (
                    <Badge key={m} variant="outline" className="text-[10px] px-2 py-0.5">{ASSESSMENT_METHODS.find(am => am.id === m)?.label.split(" ")[0] || m}</Badge>
                  ))}
                  {(content as any).projectDesc && <p className="mt-1 text-gray-500">{(content as any).projectDesc.slice(0, 80)}...</p>}
                </div>
              )}
              {idx === 5 && (
                <>
                  {(content as any).selfAssessment && <p className="italic text-gray-500">{(content as any).selfAssessment.slice(0, 120)}...</p>}
                  {(content as any).evidenceTypes?.filter((e: string) => e.trim()).slice(0, 3).map((e: string, i: number) => (
                    <div key={i} className="flex items-start gap-1.5"><FileText className="w-3 h-3 text-green-400 shrink-0 mt-0.5" /><span>{e}</span></div>
                  ))}
                </>
              )}
              {!filled && (
                <p className="text-gray-400 italic">— Belum ada konten untuk langkah ini —</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Assessment Methods */}
      {course.asesmen.methods.length > 0 && (
        <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-red-500" /> Metode Asesmen yang Dipilih
          </h2>
          <div className="flex flex-wrap gap-2">
            {course.asesmen.methods.map(m => {
              const method = ASSESSMENT_METHODS.find(am => am.id === m);
              if (!method) return null;
              const Icon = method.icon;
              return (
                <div key={m} className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
                  <Icon className="w-4 h-4" /> {method.label}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Completion Checklist */}
      <Card className="p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" /> Checklist Kelengkapan E-Course
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { label: "Judul e-course diisi", ok: !!course.title },
            { label: "Unit kompetensi SKKNI diisi", ok: !!course.competencyUnit },
            { label: "Level kompetensi dipilih", ok: !!course.level },
            { label: "Tujuan pembelajaran diisi", ok: !!course.orientasi.objective },
            { label: "Min. 2 indikator kompetensi", ok: course.orientasi.indicators.filter(i => i.trim()).length >= 2 },
            { label: "Studi kasus konteks diisi", ok: !!course.konteks.caseStudy },
            { label: "Min. 3 topik video microlearning", ok: course.microlearning.videoTopics.filter(v => v.trim()).length >= 3 },
            { label: "Min. 2 tugas praktik diisi", ok: course.praktik.tasks.filter(t => t.trim()).length >= 2 },
            { label: "Min. 1 metode asesmen dipilih", ok: course.asesmen.methods.length >= 1 },
            { label: "Pertanyaan refleksi diisi", ok: !!course.refleksi.selfAssessment },
            { label: "Min. 2 jenis evidensi", ok: course.refleksi.evidenceTypes.filter(e => e.trim()).length >= 2 },
            { label: "Nilai kelulusan minimum diisi", ok: !!course.asesmen.passingScore },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${item.ok ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-gray-50 dark:bg-gray-800 text-gray-500"}`}>
              {item.ok ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
              {item.label}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-500">Kelengkapan: {[!!course.title, !!course.competencyUnit, !!course.level, !!course.orientasi.objective, course.orientasi.indicators.filter(i=>i.trim()).length>=2, !!course.konteks.caseStudy, course.microlearning.videoTopics.filter(v=>v.trim()).length>=3, course.praktik.tasks.filter(t=>t.trim()).length>=2, course.asesmen.methods.length>=1, !!course.refleksi.selfAssessment, course.refleksi.evidenceTypes.filter(e=>e.trim()).length>=2, !!course.asesmen.passingScore].filter(Boolean).length}/12 item</span>
          <Button onClick={onSave} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="w-4 h-4 mr-1.5" /> Simpan ke Perpustakaan
          </Button>
        </div>
      </Card>
    </div>
  );
}

function LibraryView({ savedCourses, onLoad, onDelete, onNew }: any) {
  const levelColors: Record<string, string> = {
    L1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    L2: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    L3: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    L4: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  if (savedCourses.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Perpustakaan Kosong</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Belum ada e-course yang tersimpan. Mulai bangun e-course pertama Anda!</p>
        <Button onClick={onNew} className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Buat E-Course Pertama
        </Button>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {savedCourses.map((c: any) => (
        <Card key={c.id} className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <Badge className={`text-xs ${levelColors[c.level] || levelColors.L2}`}>{c.level}</Badge>
            <Button size="sm" variant="ghost" onClick={() => onDelete(c.id)} className="text-red-400 hover:text-red-600 p-1 h-auto"><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{c.title || "Tanpa Judul"}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{c.competencyUnit}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{c.sector}</p>
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span><span>{c.completedSteps}/{STEPS.length} langkah</span>
            </div>
            <Progress value={Math.round((c.completedSteps / STEPS.length) * 100)} className="h-1.5" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString("id-ID")}</span>
            <Button size="sm" onClick={() => onLoad(c)} className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              <ArrowRight className="w-3 h-3 mr-1" /> Lanjutkan
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
