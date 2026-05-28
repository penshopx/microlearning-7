import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import {
  Video, ArrowLeft, Plus, X, Trash2, Edit2, Play, Clock,
  CheckCircle, Award, BookOpen, FileText, Eye, ChevronLeft,
  ChevronRight, AlertTriangle, Search, Filter, Trophy, Target,
  BarChart3, Users, Star, Save, Copy
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";

type QuestionType = "mcq" | "truefalse" | "essay" | "practical";
type Difficulty = "beginner" | "intermediate" | "advanced";

interface ExamQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer?: string;
  difficulty: Difficulty;
  competencyTags: string[];
  points: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  category: string;
  passingScore: number;
  timeLimit: number;
  questions: ExamQuestion[];
  createdAt: string;
  published: boolean;
  attempts: number;
}

interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  answers: Record<string, string>;
  completedAt: string;
  timeTaken: number;
}

const CATEGORIES = [
  "IT & Digital",
  "Manajemen",
  "Komunikasi",
  "Marketing",
  "Keuangan",
  "Leadership",
  "Customer Service",
  "Safety & Compliance",
];

const COMPETENCY_TAGS = [
  "Problem Solving", "Communication", "Technical", "Analytical",
  "Leadership", "Teamwork", "Creativity", "Critical Thinking",
  "Project Management", "Data Analysis", "Digital Literacy",
  "Customer Focus", "Strategic Planning", "Risk Management",
];

const SAMPLE_EXAMS: Exam[] = [
  {
    id: "sample-1",
    title: "Digital Marketing Fundamentals",
    description: "Uji pemahaman Anda tentang dasar-dasar pemasaran digital termasuk SEO, SEM, social media marketing, dan content marketing.",
    category: "Marketing",
    passingScore: 70,
    timeLimit: 30,
    published: true,
    attempts: 0,
    createdAt: new Date().toISOString(),
    questions: [
      { id: "q1", type: "mcq", text: "Apa kepanjangan dari SEO?", options: ["Search Engine Optimization", "Social Engine Optimization", "Search Email Optimization", "Site Engine Operation"], correctAnswer: "Search Engine Optimization", difficulty: "beginner", competencyTags: ["Digital Literacy"], points: 10 },
      { id: "q2", type: "mcq", text: "Platform mana yang termasuk social media marketing?", options: ["Microsoft Word", "Instagram", "Notepad", "Calculator"], correctAnswer: "Instagram", difficulty: "beginner", competencyTags: ["Digital Literacy"], points: 10 },
      { id: "q3", type: "truefalse", text: "Google Ads adalah contoh dari paid advertising.", options: ["Benar", "Salah"], correctAnswer: "Benar", difficulty: "beginner", competencyTags: ["Digital Literacy"], points: 10 },
      { id: "q4", type: "mcq", text: "Metrik apa yang mengukur persentase pengunjung yang meninggalkan website setelah melihat satu halaman?", options: ["Click-through Rate", "Bounce Rate", "Conversion Rate", "Impression Rate"], correctAnswer: "Bounce Rate", difficulty: "intermediate", competencyTags: ["Analytical"], points: 15 },
      { id: "q5", type: "mcq", text: "Apa tujuan utama dari content marketing?", options: ["Menjual produk langsung", "Membangun brand awareness dan engagement", "Mengirim spam email", "Membuat iklan TV"], correctAnswer: "Membangun brand awareness dan engagement", difficulty: "intermediate", competencyTags: ["Communication", "Strategic Planning"], points: 15 },
    ],
  },
  {
    id: "sample-2",
    title: "Dasar-Dasar Kepemimpinan",
    description: "Evaluasi kemampuan kepemimpinan Anda mencakup gaya kepemimpinan, pengambilan keputusan, dan manajemen tim.",
    category: "Leadership",
    passingScore: 75,
    timeLimit: 25,
    published: true,
    attempts: 0,
    createdAt: new Date().toISOString(),
    questions: [
      { id: "q1", type: "mcq", text: "Gaya kepemimpinan yang melibatkan tim dalam pengambilan keputusan disebut?", options: ["Otoriter", "Demokratis", "Laissez-faire", "Transaksional"], correctAnswer: "Demokratis", difficulty: "beginner", competencyTags: ["Leadership"], points: 10 },
      { id: "q2", type: "truefalse", text: "Delegasi adalah salah satu keterampilan penting dalam kepemimpinan.", options: ["Benar", "Salah"], correctAnswer: "Benar", difficulty: "beginner", competencyTags: ["Leadership"], points: 10 },
      { id: "q3", type: "mcq", text: "Apa yang dimaksud dengan emotional intelligence dalam kepemimpinan?", options: ["Kemampuan menghafal", "Kemampuan mengenali dan mengelola emosi", "Kemampuan berhitung", "Kemampuan menulis"], correctAnswer: "Kemampuan mengenali dan mengelola emosi", difficulty: "intermediate", competencyTags: ["Leadership", "Communication"], points: 15 },
      { id: "q4", type: "mcq", text: "Dalam situasi konflik tim, langkah pertama yang harus dilakukan pemimpin adalah?", options: ["Mengabaikan konflik", "Mendengarkan semua pihak", "Memecat anggota tim", "Memindahkan masalah ke atasan"], correctAnswer: "Mendengarkan semua pihak", difficulty: "intermediate", competencyTags: ["Leadership", "Problem Solving"], points: 15 },
    ],
  },
  {
    id: "sample-3",
    title: "Keselamatan Kerja (K3)",
    description: "Tes pengetahuan tentang keselamatan dan kesehatan kerja, prosedur darurat, dan standar kepatuhan.",
    category: "Safety & Compliance",
    passingScore: 80,
    timeLimit: 20,
    published: true,
    attempts: 0,
    createdAt: new Date().toISOString(),
    questions: [
      { id: "q1", type: "mcq", text: "APD adalah singkatan dari?", options: ["Alat Pelindung Diri", "Alat Pengaman Digital", "Alat Pemadam Darurat", "Alat Pengukur Daya"], correctAnswer: "Alat Pelindung Diri", difficulty: "beginner", competencyTags: ["Risk Management"], points: 10 },
      { id: "q2", type: "truefalse", text: "Setiap kecelakaan kerja wajib dilaporkan kepada atasan.", options: ["Benar", "Salah"], correctAnswer: "Benar", difficulty: "beginner", competencyTags: ["Risk Management"], points: 10 },
      { id: "q3", type: "mcq", text: "Warna helm keselamatan untuk pengawas lapangan umumnya adalah?", options: ["Putih", "Kuning", "Biru", "Merah"], correctAnswer: "Biru", difficulty: "intermediate", competencyTags: ["Risk Management"], points: 15 },
    ],
  },
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

type PageView = "catalog" | "builder" | "preview" | "take-exam" | "results" | "my-results";

export default function SertifikasiPage() {
  const { user, isLoggedIn, isLoading: authLoading, userName, userId } = useAuth();
  const [view, setView] = useState<PageView>("catalog");
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("catalog");

  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    passingScore: 70,
    timeLimit: 30,
  });
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [currentResult, setCurrentResult] = useState<ExamResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const storedExams = localStorage.getItem(getUserStorageKey(userId, "certification_exams"));
    const storedResults = localStorage.getItem(getUserStorageKey(userId, "certification_results"));
    if (storedExams) {
      try {
        setExams(JSON.parse(storedExams));
      } catch {}
    } else {
      setExams(SAMPLE_EXAMS);
      localStorage.setItem(getUserStorageKey(userId, "certification_exams"), JSON.stringify(SAMPLE_EXAMS));
    }
    if (storedResults) {
      try {
        setResults(JSON.parse(storedResults));
      } catch {}
    }
  }, [userId, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (exams.length > 0) {
      localStorage.setItem(getUserStorageKey(userId, "certification_exams"), JSON.stringify(exams));
    }
  }, [exams, userId, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    localStorage.setItem(getUserStorageKey(userId, "certification_results"), JSON.stringify(results));
  }, [results, userId, authLoading]);

  useEffect(() => {
    if (view === "take-exam" && timeRemaining > 0 && !examSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [view, timeRemaining, examSubmitted]);

  const saveExam = () => {
    if (!examForm.title.trim()) {
      toast({ title: "Error", description: "Judul ujian wajib diisi", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Error", description: "Tambahkan minimal 1 soal", variant: "destructive" });
      return;
    }

    if (editingExam) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === editingExam.id
            ? { ...e, ...examForm, questions, published: e.published }
            : e
        )
      );
      toast({ title: "Ujian diperbarui!" });
    } else {
      const newExam: Exam = {
        id: generateId(),
        ...examForm,
        questions,
        createdAt: new Date().toISOString(),
        published: false,
        attempts: 0,
      };
      setExams((prev) => [newExam, ...prev]);
      toast({ title: "Ujian dibuat!", description: `"${newExam.title}" berhasil dibuat` });
    }

    resetBuilder();
    setView("catalog");
    setActiveTab("my-exams");
  };

  const resetBuilder = () => {
    setExamForm({ title: "", description: "", category: CATEGORIES[0], passingScore: 70, timeLimit: 30 });
    setQuestions([]);
    setEditingExam(null);
  };

  const addQuestion = (type: QuestionType) => {
    const newQ: ExamQuestion = {
      id: generateId(),
      type,
      text: "",
      options: type === "mcq" ? ["", "", "", ""] : type === "truefalse" ? ["Benar", "Salah"] : undefined,
      correctAnswer: type === "truefalse" ? "Benar" : "",
      difficulty: "beginner",
      competencyTags: [],
      points: 10,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<ExamQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === questionId && q.options) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const togglePublish = (examId: string) => {
    setExams((prev) =>
      prev.map((e) => (e.id === examId ? { ...e, published: !e.published } : e))
    );
  };

  const deleteExam = (examId: string) => {
    setExams((prev) => {
      const updated = prev.filter((e) => e.id !== examId);
      if (updated.length === 0) {
        localStorage.removeItem(getUserStorageKey(userId, "certification_exams"));
      }
      return updated;
    });
    toast({ title: "Ujian dihapus" });
  };

  const startExam = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(exam.timeLimit * 60);
    setExamStartTime(Date.now());
    setExamSubmitted(false);
    setCurrentResult(null);
    setView("take-exam");
  };

  const handleSubmitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!selectedExam) return;

    setExamSubmitted(true);

    const scorableQuestions = selectedExam.questions.filter(
      (q) => q.type === "mcq" || q.type === "truefalse"
    );
    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    scorableQuestions.forEach((q) => {
      totalPoints += q.points;
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
        earnedPoints += q.points;
      }
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= selectedExam.passingScore;
    const timeTaken = Math.round((Date.now() - examStartTime) / 1000);

    const result: ExamResult = {
      id: generateId(),
      examId: selectedExam.id,
      examTitle: selectedExam.title,
      score,
      passed,
      totalQuestions: selectedExam.questions.length,
      correctAnswers: correctCount,
      answers: { ...answers },
      completedAt: new Date().toISOString(),
      timeTaken,
    };

    setCurrentResult(result);
    setResults((prev) => [result, ...prev]);
    setExams((prev) =>
      prev.map((e) => (e.id === selectedExam.id ? { ...e, attempts: e.attempts + 1 } : e))
    );
    setView("results");
  }, [selectedExam, answers, examStartTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const filteredExams = exams.filter((e) => {
    if (!e.published && activeTab === "catalog") return false;
    const matchSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || e.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const myExams = exams.filter(
    (e) => !e.id.startsWith("sample")
  );

  const openBuilder = (exam?: Exam) => {
    if (exam) {
      setEditingExam(exam);
      setExamForm({
        title: exam.title,
        description: exam.description,
        category: exam.category,
        passingScore: exam.passingScore,
        timeLimit: exam.timeLimit,
      });
      setQuestions([...exam.questions]);
    } else {
      resetBuilder();
    }
    setView("builder");
  };

  const openPreview = (exam: Exam) => {
    setSelectedExam(exam);
    setView("preview");
  };

  if (view === "builder") {
    return (
      <>
        <SEO title="Buat Ujian - Sertifikasi | Chaesa Live" description="Buat ujian sertifikasi untuk tim Anda" />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { resetBuilder(); setView("catalog"); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-sm">Kembali</span>
                </button>
                <span className="text-gray-400">|</span>
                <h1 className="font-semibold text-gray-900 dark:text-white">
                  {editingExam ? "Edit Ujian" : "Buat Ujian Baru"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
                <Button onClick={saveExam} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" /> Simpan
                </Button>
              </div>
            </div>
          </nav>

          <main className="max-w-5xl mx-auto px-4 py-8">
            <Card className="p-6 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detail Ujian</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Judul Ujian *</label>
                  <Input value={examForm.title} onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))} placeholder="Contoh: Ujian Sertifikasi Digital Marketing" className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Deskripsi</label>
                  <textarea value={examForm.description} onChange={(e) => setExamForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsikan ujian ini..." className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Kategori</label>
                    <select value={examForm.category} onChange={(e) => setExamForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm">
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Nilai Minimum Lulus (%)</label>
                    <Input type="number" min={1} max={100} value={examForm.passingScore} onChange={(e) => setExamForm((p) => ({ ...p, passingScore: parseInt(e.target.value) || 70 }))} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Batas Waktu (menit)</label>
                    <Input type="number" min={5} max={180} value={examForm.timeLimit} onChange={(e) => setExamForm((p) => ({ ...p, timeLimit: parseInt(e.target.value) || 30 }))} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Soal ({questions.length})
              </h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => addQuestion("mcq")} className="border-gray-300 dark:border-gray-700">
                  <Plus className="w-4 h-4 mr-1" /> Pilihan Ganda
                </Button>
                <Button size="sm" variant="outline" onClick={() => addQuestion("truefalse")} className="border-gray-300 dark:border-gray-700">
                  <Plus className="w-4 h-4 mr-1" /> Benar/Salah
                </Button>
                <Button size="sm" variant="outline" onClick={() => addQuestion("essay")} className="border-gray-300 dark:border-gray-700">
                  <Plus className="w-4 h-4 mr-1" /> Esai
                </Button>
                <Button size="sm" variant="outline" onClick={() => addQuestion("practical")} className="border-gray-300 dark:border-gray-700">
                  <Plus className="w-4 h-4 mr-1" /> Praktik
                </Button>
              </div>
            </div>

            {questions.length === 0 && (
              <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Belum ada soal. Klik tombol di atas untuk menambahkan.</p>
              </Card>
            )}

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <Card key={q.id} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">#{idx + 1}</span>
                      <Badge variant="secondary" className="text-xs">
                        {q.type === "mcq" ? "Pilihan Ganda" : q.type === "truefalse" ? "Benar/Salah" : q.type === "essay" ? "Esai" : "Praktik"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {q.points} poin
                      </Badge>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeQuestion(q.id)} className="h-8 w-8 text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <textarea value={q.text} onChange={(e) => updateQuestion(q.id, { text: e.target.value })} placeholder="Tulis pertanyaan di sini..." className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm min-h-[60px] resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />

                    {(q.type === "mcq" || q.type === "truefalse") && q.options && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Opsi Jawaban:</label>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === opt} onChange={() => updateQuestion(q.id, { correctAnswer: opt })} className="w-4 h-4 text-green-600" />
                            {q.type === "mcq" ? (
                              <Input value={opt} onChange={(e) => updateOption(q.id, optIdx, e.target.value)} placeholder={`Opsi ${optIdx + 1}`} className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm" />
                            ) : (
                              <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                            )}
                            {q.correctAnswer === opt && (
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            )}
                          </div>
                        ))}
                        {q.type === "mcq" && (
                          <Button size="sm" variant="ghost" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ""] })} className="text-xs text-gray-500">
                            <Plus className="w-3 h-3 mr-1" /> Tambah Opsi
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Tingkat Kesulitan</label>
                        <select value={q.difficulty} onChange={(e) => updateQuestion(q.id, { difficulty: e.target.value as Difficulty })} className="w-full px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs">
                          <option value="beginner">Pemula</option>
                          <option value="intermediate">Menengah</option>
                          <option value="advanced">Lanjutan</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Poin</label>
                        <Input type="number" min={1} max={100} value={q.points} onChange={(e) => updateQuestion(q.id, { points: parseInt(e.target.value) || 10 })} className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs h-8" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Tag Kompetensi</label>
                        <select onChange={(e) => { if (e.target.value && !q.competencyTags.includes(e.target.value)) { updateQuestion(q.id, { competencyTags: [...q.competencyTags, e.target.value] }); } e.target.value = ""; }} className="w-full px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs">
                          <option value="">Pilih tag...</option>
                          {COMPETENCY_TAGS.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {q.competencyTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {q.competencyTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs cursor-pointer" onClick={() => updateQuestion(q.id, { competencyTags: q.competencyTags.filter((t) => t !== tag) })}>
                            {tag} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </>
    );
  }

  if (view === "preview" && selectedExam) {
    return (
      <>
        <SEO title={`Preview: ${selectedExam.title}`} description={selectedExam.description} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <button onClick={() => { setSelectedExam(null); setView("catalog"); }} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Kembali</span>
              </button>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">Preview</Badge>
                <ThemeSwitch />
              </div>
            </div>
          </nav>

          <main className="max-w-4xl mx-auto px-4 py-8">
            <Card className="p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Badge className="mb-2">{selectedExam.category}</Badge>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedExam.title}</h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{selectedExam.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <FileText className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedExam.questions.length}</div>
                  <div className="text-xs text-gray-500">Soal</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <Clock className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedExam.timeLimit}</div>
                  <div className="text-xs text-gray-500">Menit</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedExam.passingScore}%</div>
                  <div className="text-xs text-gray-500">Nilai Lulus</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedExam.attempts}</div>
                  <div className="text-xs text-gray-500">Percobaan</div>
                </div>
              </div>
              <Button onClick={() => startExam(selectedExam)} className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" size="lg">
                <Play className="w-5 h-5 mr-2" /> Mulai Ujian
              </Button>
            </Card>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Soal (Preview)</h3>
            <div className="space-y-3">
              {selectedExam.questions.map((q, idx) => (
                <Card key={q.id} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                    <Badge variant="secondary" className="text-xs">
                      {q.type === "mcq" ? "Pilihan Ganda" : q.type === "truefalse" ? "Benar/Salah" : q.type === "essay" ? "Esai" : "Praktik"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {q.difficulty === "beginner" ? "Pemula" : q.difficulty === "intermediate" ? "Menengah" : "Lanjutan"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{q.points} poin</Badge>
                  </div>
                  <p className="text-gray-900 dark:text-white text-sm">{q.text}</p>
                  {q.options && (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={`text-xs px-3 py-1.5 rounded ${opt === q.correctAnswer ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                          {opt} {opt === q.correctAnswer && "✓"}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </main>
        </div>
      </>
    );
  }

  if (view === "take-exam" && selectedExam) {
    const currentQ = selectedExam.questions[currentQuestionIndex];
    const answeredCount = Object.keys(answers).length;
    const progressPercent = (answeredCount / selectedExam.questions.length) * 100;
    const isLowTime = timeRemaining <= 60;

    return (
      <>
        <SEO title={`Ujian: ${selectedExam.title}`} description="Sedang mengerjakan ujian" />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[200px]">{selectedExam.title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${isLowTime ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                  <Clock className="w-4 h-4" />
                  {formatTime(timeRemaining)}
                </div>
                <Button size="sm" variant="destructive" onClick={handleSubmitExam}>
                  Selesai
                </Button>
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 pb-2">
              <Progress value={progressPercent} className="h-1.5" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{answeredCount}/{selectedExam.questions.length} dijawab</span>
                <span>Soal {currentQuestionIndex + 1}/{selectedExam.questions.length}</span>
              </div>
            </div>
          </nav>

          <main className="max-w-4xl mx-auto px-4 py-8">
            <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-bold text-gray-400">Soal {currentQuestionIndex + 1}</span>
                <Badge variant="secondary" className="text-xs">
                  {currentQ.type === "mcq" ? "Pilihan Ganda" : currentQ.type === "truefalse" ? "Benar/Salah" : currentQ.type === "essay" ? "Esai" : "Praktik"}
                </Badge>
                <Badge variant="outline" className="text-xs">{currentQ.points} poin</Badge>
              </div>

              <p className="text-lg text-gray-900 dark:text-white mb-6">{currentQ.text}</p>

              {(currentQ.type === "mcq" || currentQ.type === "truefalse") && currentQ.options && (
                <div className="space-y-2">
                  {currentQ.options.map((opt, oi) => (
                    <button key={oi} onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }))} className={`w-full text-left p-4 rounded-lg border transition-colors text-sm ${answers[currentQ.id] === opt ? "bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400 font-medium" : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[currentQ.id] === opt ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"}`}>
                          {answers[currentQ.id] === opt && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        {opt}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {(currentQ.type === "essay" || currentQ.type === "practical") && (
                <textarea value={answers[currentQ.id] || ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))} placeholder={currentQ.type === "essay" ? "Tulis jawaban esai Anda di sini..." : "Jelaskan langkah-langkah praktik Anda..."} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm min-h-[150px] resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              )}
            </Card>

            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="border-gray-300 dark:border-gray-700">
                <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
              </Button>
              {currentQuestionIndex < selectedExam.questions.length - 1 ? (
                <Button onClick={() => setCurrentQuestionIndex((p) => p + 1)} className="bg-green-600 hover:bg-green-700">
                  Selanjutnya <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmitExam} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  Selesaikan Ujian
                </Button>
              )}
            </div>

            <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Navigasi Soal</h4>
              <div className="flex flex-wrap gap-2">
                {selectedExam.questions.map((q, idx) => (
                  <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${idx === currentQuestionIndex ? "bg-green-600 text-white" : answers[q.id] ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"}`}>
                    {idx + 1}
                  </button>
                ))}
              </div>
            </Card>
          </main>
        </div>
      </>
    );
  }

  if (view === "results" && currentResult && selectedExam) {
    return (
      <>
        <SEO title="Hasil Ujian - Sertifikasi | Chaesa Live" description="Lihat hasil ujian Anda" />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <h1 className="font-semibold text-gray-900 dark:text-white">Hasil Ujian</h1>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
                <Button variant="outline" onClick={() => { setView("catalog"); setSelectedExam(null); setCurrentResult(null); }} className="border-gray-300 dark:border-gray-700">
                  Kembali ke Katalog
                </Button>
              </div>
            </div>
          </nav>

          <main className="max-w-4xl mx-auto px-4 py-8">
            <Card className={`p-8 mb-6 border-2 ${currentResult.passed ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700" : "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700"}`}>
              <div className="text-center">
                {currentResult.passed ? (
                  <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
                ) : (
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                )}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentResult.passed ? "Selamat! Anda Lulus! 🎉" : "Belum Lulus"}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedExam.title}</p>

                <div className="text-5xl font-bold mb-2" style={{ color: currentResult.passed ? "#22c55e" : "#ef4444" }}>
                  {currentResult.score}%
                </div>
                <p className="text-sm text-gray-500">Nilai minimum: {selectedExam.passingScore}%</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg text-center border border-gray-200 dark:border-gray-800">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{currentResult.correctAnswers}/{currentResult.totalQuestions}</div>
                  <div className="text-xs text-gray-500">Jawaban Benar</div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg text-center border border-gray-200 dark:border-gray-800">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{formatTime(currentResult.timeTaken)}</div>
                  <div className="text-xs text-gray-500">Waktu</div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded-lg text-center border border-gray-200 dark:border-gray-800">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedExam.questions.reduce((a, q) => a + q.points, 0)}</div>
                  <div className="text-xs text-gray-500">Total Poin</div>
                </div>
              </div>
            </Card>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Review Soal</h3>
            <div className="space-y-3">
              {selectedExam.questions.map((q, idx) => {
                const userAnswer = currentResult.answers[q.id];
                const isCorrect = (q.type === "mcq" || q.type === "truefalse") && userAnswer === q.correctAnswer;
                const isWrong = (q.type === "mcq" || q.type === "truefalse") && userAnswer !== q.correctAnswer;
                const isEssayOrPractical = q.type === "essay" || q.type === "practical";

                return (
                  <Card key={q.id} className={`p-4 border ${isCorrect ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : isWrong ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                      {isCorrect && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {isWrong && <X className="w-4 h-4 text-red-500" />}
                      {isEssayOrPractical && <FileText className="w-4 h-4 text-blue-500" />}
                      <Badge variant="outline" className="text-xs">{q.points} poin</Badge>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white mb-2">{q.text}</p>
                    {q.options && (
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`text-xs px-3 py-1.5 rounded ${opt === q.correctAnswer ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium" : opt === userAnswer && opt !== q.correctAnswer ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through" : "text-gray-500 dark:text-gray-400"}`}>
                            {opt} {opt === q.correctAnswer && "✓"} {opt === userAnswer && opt !== q.correctAnswer && "(jawaban Anda)"}
                          </div>
                        ))}
                      </div>
                    )}
                    {isEssayOrPractical && userAnswer && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Jawaban Anda:</span> {userAnswer}
                      </div>
                    )}
                    {isEssayOrPractical && (
                      <p className="text-xs text-blue-500 mt-1">* Soal esai/praktik dinilai manual oleh penguji</p>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={() => startExam(selectedExam)} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" /> Coba Lagi
              </Button>
              <Button variant="outline" onClick={() => { setView("catalog"); setSelectedExam(null); setCurrentResult(null); }} className="border-gray-300 dark:border-gray-700">
                Kembali ke Katalog
              </Button>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Sertifikasi & Exam Center - Chaesa Live" description="Pusat sertifikasi dan ujian kompetensi untuk profesional" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Ujian & Sertifikasi" icon={Award} />

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-7 h-7 text-orange-500" />
                Pusat Sertifikasi & Ujian
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Buat, kelola, dan ikuti ujian sertifikasi kompetensi</p>
            </div>
            <Button onClick={() => openBuilder()} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Buat Ujian
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <TabsTrigger value="catalog" className="data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20">
                <BookOpen className="w-4 h-4 mr-2" />
                Katalog Ujian
              </TabsTrigger>
              <TabsTrigger value="my-exams" className="data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20">
                <FileText className="w-4 h-4 mr-2" />
                Ujian Saya
              </TabsTrigger>
              <TabsTrigger value="my-results" className="data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20">
                <BarChart3 className="w-4 h-4 mr-2" />
                Hasil ({results.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari ujian..." className="pl-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800" />
              </div>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm">
                <option value="all">Semua Kategori</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <TabsContent value="catalog" className="space-y-4 mt-0">
              {filteredExams.length === 0 ? (
                <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada ujian tersedia</h3>
                  <p className="text-gray-500 dark:text-gray-400">Ujian yang dipublikasikan akan muncul di sini</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExams.map((exam) => (
                    <Card key={exam.id} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 transition-colors cursor-pointer" onClick={() => openPreview(exam)}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="text-xs">{exam.category}</Badge>
                        {exam.published && <Badge className="bg-green-500 text-white text-xs">Aktif</Badge>}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{exam.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{exam.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {exam.questions.length} soal</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.timeLimit} mnt</span>
                        <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" /> {exam.passingScore}%</span>
                      </div>
                      <Button size="sm" className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); startExam(exam); }}>
                        <Play className="w-4 h-4 mr-1" /> Mulai Ujian
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-exams" className="space-y-4 mt-0">
              {exams.length === 0 ? (
                <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada ujian</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Buat ujian pertama Anda</p>
                  <Button onClick={() => openBuilder()} className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" /> Buat Ujian
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {exams.filter((e) => {
                    const matchSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchCategory = selectedCategory === "all" || e.category === selectedCategory;
                    return matchSearch && matchCategory;
                  }).map((exam) => (
                    <Card key={exam.id} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="text-xs">{exam.category}</Badge>
                            {exam.published ? (
                              <Badge className="bg-green-500 text-white text-xs">Dipublikasikan</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Draft</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{exam.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{exam.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{exam.questions.length} soal</span>
                            <span>{exam.timeLimit} menit</span>
                            <span>Lulus: {exam.passingScore}%</span>
                            <span>{exam.attempts} percobaan</span>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => openPreview(exam)} className="h-8 w-8" title="Preview">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openBuilder(exam)} className="h-8 w-8" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => togglePublish(exam.id)} className={`h-8 w-8 ${exam.published ? "text-orange-500" : "text-green-500"}`} title={exam.published ? "Unpublish" : "Publish"}>
                            {exam.published ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteExam(exam.id)} className="h-8 w-8 text-red-500 hover:text-red-600" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-results" className="space-y-4 mt-0">
              {results.length === 0 ? (
                <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada hasil ujian</h3>
                  <p className="text-gray-500 dark:text-gray-400">Ikuti ujian untuk melihat hasil di sini</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {results.map((result) => (
                    <Card key={result.id} className={`p-5 border ${result.passed ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {result.passed ? (
                              <Badge className="bg-green-500 text-white text-xs">LULUS</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">TIDAK LULUS</Badge>
                            )}
                            <h4 className="font-semibold text-gray-900 dark:text-white">{result.examTitle}</h4>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Skor: {result.score}%</span>
                            <span>Benar: {result.correctAnswers}/{result.totalQuestions}</span>
                            <span>Waktu: {formatTime(result.timeTaken)}</span>
                            <span>{new Date(result.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>
                        <div className="text-3xl font-bold" style={{ color: result.passed ? "#22c55e" : "#ef4444" }}>
                          {result.score}%
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}
