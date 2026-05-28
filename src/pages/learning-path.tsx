import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
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
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import {
  Map,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Circle,
  Lock,
  Star,
  Trophy,
  Zap,
  Target,
  BookOpen,
  Users,
  Clock,
  Award,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Play,
  BarChart3,
  Code,
  Megaphone,
  Briefcase,
  Palette,
  UserCheck,
  Database,
} from "lucide-react";

interface LearningModule {
  id: string;
  title: string;
  type: "module" | "exam" | "assignment";
  description: string;
  estimatedMinutes: number;
  completed: boolean;
}

interface PathStage {
  id: string;
  title: string;
  level: string;
  description: string;
  modules: LearningModule[];
  minimumScore: number;
  xpReward: number;
  badge: string;
  unlocked: boolean;
  completed: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  estimatedDuration: string;
  stages: PathStage[];
  createdAt: string;
  totalXP: number;
  earnedXP: number;
  category: string;
  isTemplate: boolean;
}

const TEMPLATES: LearningPath[] = [
  {
    id: "tpl-digital-marketing",
    title: "Digital Marketing Specialist",
    description: "Kuasai strategi pemasaran digital dari dasar hingga mahir. Pelajari SEO, social media, ads, dan analytics.",
    targetAudience: "Marketing professionals & entrepreneurs",
    estimatedDuration: "12 minggu",
    category: "Marketing",
    isTemplate: true,
    createdAt: new Date().toISOString(),
    totalXP: 1500,
    earnedXP: 0,
    stages: [
      {
        id: "s1",
        title: "Foundation",
        level: "Beginner",
        description: "Dasar-dasar digital marketing dan landscape industri",
        minimumScore: 70,
        xpReward: 200,
        badge: "🌱 Marketing Seedling",
        unlocked: true,
        completed: false,
        modules: [
          { id: "m1", title: "Pengantar Digital Marketing", type: "module", description: "Overview ekosistem digital marketing", estimatedMinutes: 30, completed: false },
          { id: "m2", title: "Customer Journey & Funnel", type: "module", description: "Memahami perjalanan pelanggan", estimatedMinutes: 25, completed: false },
          { id: "m3", title: "Quiz: Dasar Marketing", type: "exam", description: "Uji pemahaman dasar", estimatedMinutes: 15, completed: false },
        ],
      },
      {
        id: "s2",
        title: "SEO & Content",
        level: "Intermediate",
        description: "Search Engine Optimization dan content marketing strategy",
        minimumScore: 75,
        xpReward: 350,
        badge: "📊 SEO Explorer",
        unlocked: false,
        completed: false,
        modules: [
          { id: "m4", title: "SEO On-Page & Off-Page", type: "module", description: "Teknik optimasi mesin pencari", estimatedMinutes: 45, completed: false },
          { id: "m5", title: "Content Strategy", type: "module", description: "Membuat strategi konten efektif", estimatedMinutes: 35, completed: false },
          { id: "m6", title: "Praktik: Audit SEO Website", type: "assignment", description: "Lakukan audit SEO pada website pilihan", estimatedMinutes: 60, completed: false },
          { id: "m7", title: "Quiz: SEO & Content", type: "exam", description: "Evaluasi pemahaman SEO", estimatedMinutes: 20, completed: false },
        ],
      },
      {
        id: "s3",
        title: "Social Media & Ads",
        level: "Intermediate",
        description: "Strategi social media marketing dan paid advertising",
        minimumScore: 75,
        xpReward: 400,
        badge: "📱 Social Strategist",
        unlocked: false,
        completed: false,
        modules: [
          { id: "m8", title: "Social Media Strategy", type: "module", description: "Platform selection dan content planning", estimatedMinutes: 40, completed: false },
          { id: "m9", title: "Facebook & Instagram Ads", type: "module", description: "Setup dan optimasi iklan", estimatedMinutes: 50, completed: false },
          { id: "m10", title: "Google Ads Fundamentals", type: "module", description: "Search ads, display ads, YouTube ads", estimatedMinutes: 45, completed: false },
          { id: "m11", title: "Praktik: Buat Campaign", type: "assignment", description: "Buat campaign iklan lengkap", estimatedMinutes: 90, completed: false },
        ],
      },
      {
        id: "s4",
        title: "Analytics & Optimization",
        level: "Advanced",
        description: "Data-driven marketing dan optimasi performa",
        minimumScore: 80,
        xpReward: 550,
        badge: "🏆 Marketing Master",
        unlocked: false,
        completed: false,
        modules: [
          { id: "m12", title: "Google Analytics 4", type: "module", description: "Setup dan interpretasi data", estimatedMinutes: 40, completed: false },
          { id: "m13", title: "A/B Testing & CRO", type: "module", description: "Conversion rate optimization", estimatedMinutes: 35, completed: false },
          { id: "m14", title: "Marketing Attribution", type: "module", description: "Multi-touch attribution models", estimatedMinutes: 30, completed: false },
          { id: "m15", title: "Final Project", type: "assignment", description: "Buat marketing plan komprehensif", estimatedMinutes: 120, completed: false },
          { id: "m16", title: "Ujian Akhir", type: "exam", description: "Sertifikasi Digital Marketing", estimatedMinutes: 45, completed: false },
        ],
      },
    ],
  },
  {
    id: "tpl-fullstack-dev",
    title: "Full-Stack Developer",
    description: "Dari HTML dasar hingga deploy aplikasi full-stack. Kuasai frontend, backend, dan DevOps.",
    targetAudience: "Aspiring developers & career changers",
    estimatedDuration: "16 minggu",
    category: "Technology",
    isTemplate: true,
    createdAt: new Date().toISOString(),
    totalXP: 2000,
    earnedXP: 0,
    stages: [
      {
        id: "s1",
        title: "Web Fundamentals",
        level: "Beginner",
        description: "HTML, CSS, dan JavaScript dasar",
        minimumScore: 70,
        xpReward: 300,
        badge: "🌐 Web Novice",
        unlocked: true,
        completed: false,
        modules: [
          { id: "m1", title: "HTML & Semantic Markup", type: "module", description: "Struktur web modern", estimatedMinutes: 45, completed: false },
          { id: "m2", title: "CSS & Responsive Design", type: "module", description: "Styling dan layout responsif", estimatedMinutes: 60, completed: false },
          { id: "m3", title: "JavaScript Essentials", type: "module", description: "Dasar pemrograman JavaScript", estimatedMinutes: 90, completed: false },
          { id: "m4", title: "Praktik: Landing Page", type: "assignment", description: "Buat landing page responsif", estimatedMinutes: 120, completed: false },
        ],
      },
      {
        id: "s2",
        title: "Frontend Framework",
        level: "Intermediate",
        description: "React.js dan state management",
        minimumScore: 75,
        xpReward: 500,
        badge: "⚛️ React Developer",
        unlocked: false,
        completed: false,
        modules: [
          { id: "m5", title: "React Components & Props", type: "module", description: "Komponen dan properti React", estimatedMinutes: 60, completed: false },
          { id: "m6", title: "State & Hooks", type: "module", description: "useState, useEffect, custom hooks", estimatedMinutes: 75, completed: false },
          { id: "m7", title: "Routing & API Integration", type: "module", description: "React Router dan fetch API", estimatedMinutes: 45, completed: false },
          { id: "m8", title: "Praktik: Todo App", type: "assignment", description: "Buat aplikasi todo lengkap", estimatedMinutes: 150, completed: false },
        ],
      },
      {
        id: "s3",
        title: "Backend Development",
        level: "Intermediate",
        description: "Node.js, Express, dan database",
        minimumScore: 75,
        xpReward: 500,
        badge: "🔧 Backend Builder",
        unlocked: false,
        completed: false,
        modules: [
          { id: "m9", title: "Node.js & Express", type: "module", description: "Server-side JavaScript", estimatedMinutes: 60, completed: false },
          { id: "m10", title: "Database & ORM", type: "module", description: "PostgreSQL dan Prisma", estimatedMinutes: 75, completed: false },
          { id: "m11", title: "Authentication & Security", type: "module", description: "JWT, OAuth, best practices", estimatedMinutes: 45, completed: false },
          { id: "m12", title: "Praktik: REST API", type: "assignment", description: "Buat REST API lengkap", estimatedMinutes: 180, completed: false },
        ],
      },
      {
        id: "s4",
        title: "Full-Stack & Deploy",
        level: "Advanced",
        description: "Integrasi full-stack dan deployment",
        minimumScore: 80,
        xpReward: 700,
        badge: "🚀 Full-Stack Master",
        unlocked: false,
        completed: false,
        modules: [
          { id: "m13", title: "Next.js Full-Stack", type: "module", description: "Server components & API routes", estimatedMinutes: 90, completed: false },
          { id: "m14", title: "Testing & CI/CD", type: "module", description: "Jest, Cypress, GitHub Actions", estimatedMinutes: 60, completed: false },
          { id: "m15", title: "Docker & Deployment", type: "module", description: "Containerization dan cloud deploy", estimatedMinutes: 45, completed: false },
          { id: "m16", title: "Capstone Project", type: "assignment", description: "Buat dan deploy aplikasi full-stack", estimatedMinutes: 300, completed: false },
          { id: "m17", title: "Ujian Sertifikasi", type: "exam", description: "Full-Stack Developer Certification", estimatedMinutes: 60, completed: false },
        ],
      },
    ],
  },
  {
    id: "tpl-project-manager",
    title: "Project Manager",
    description: "Pelajari metodologi project management modern: Agile, Scrum, dan Waterfall.",
    targetAudience: "Team leads & aspiring PMs",
    estimatedDuration: "10 minggu",
    category: "Management",
    isTemplate: true,
    createdAt: new Date().toISOString(),
    totalXP: 1200,
    earnedXP: 0,
    stages: [
      {
        id: "s1", title: "PM Fundamentals", level: "Beginner", description: "Dasar project management", minimumScore: 70, xpReward: 250, badge: "📋 PM Apprentice", unlocked: true, completed: false,
        modules: [
          { id: "m1", title: "Project Management Overview", type: "module", description: "Konsep dasar PM", estimatedMinutes: 30, completed: false },
          { id: "m2", title: "Project Lifecycle", type: "module", description: "Initiation to closing", estimatedMinutes: 35, completed: false },
          { id: "m3", title: "Stakeholder Management", type: "module", description: "Identifikasi dan kelola stakeholder", estimatedMinutes: 25, completed: false },
        ],
      },
      {
        id: "s2", title: "Agile & Scrum", level: "Intermediate", description: "Metodologi Agile dan framework Scrum", minimumScore: 75, xpReward: 400, badge: "🔄 Agile Practitioner", unlocked: false, completed: false,
        modules: [
          { id: "m4", title: "Agile Manifesto & Principles", type: "module", description: "Filosofi Agile", estimatedMinutes: 30, completed: false },
          { id: "m5", title: "Scrum Framework", type: "module", description: "Roles, events, artifacts", estimatedMinutes: 45, completed: false },
          { id: "m6", title: "Sprint Planning & Retrospective", type: "module", description: "Menjalankan sprint efektif", estimatedMinutes: 40, completed: false },
        ],
      },
      {
        id: "s3", title: "Advanced PM", level: "Advanced", description: "Risk management dan leadership", minimumScore: 80, xpReward: 550, badge: "🎯 PM Expert", unlocked: false, completed: false,
        modules: [
          { id: "m7", title: "Risk Management", type: "module", description: "Identifikasi dan mitigasi risiko", estimatedMinutes: 40, completed: false },
          { id: "m8", title: "Budget & Resource Planning", type: "module", description: "Perencanaan anggaran dan sumber daya", estimatedMinutes: 35, completed: false },
          { id: "m9", title: "Final Project", type: "assignment", description: "Buat project plan lengkap", estimatedMinutes: 120, completed: false },
          { id: "m10", title: "Ujian Sertifikasi PM", type: "exam", description: "Project Management Certification", estimatedMinutes: 45, completed: false },
        ],
      },
    ],
  },
  {
    id: "tpl-content-creator",
    title: "Content Creator Pro",
    description: "Bangun brand personal dan monetisasi konten di berbagai platform digital.",
    targetAudience: "Aspiring content creators & influencers",
    estimatedDuration: "8 minggu",
    category: "Creative",
    isTemplate: true,
    createdAt: new Date().toISOString(),
    totalXP: 1000,
    earnedXP: 0,
    stages: [
      {
        id: "s1", title: "Content Basics", level: "Beginner", description: "Dasar pembuatan konten", minimumScore: 70, xpReward: 200, badge: "✏️ Content Starter", unlocked: true, completed: false,
        modules: [
          { id: "m1", title: "Personal Branding", type: "module", description: "Bangun brand personal", estimatedMinutes: 30, completed: false },
          { id: "m2", title: "Content Ideation", type: "module", description: "Teknik mencari ide konten", estimatedMinutes: 25, completed: false },
          { id: "m3", title: "Storytelling Techniques", type: "module", description: "Seni bercerita yang menarik", estimatedMinutes: 35, completed: false },
        ],
      },
      {
        id: "s2", title: "Production", level: "Intermediate", description: "Produksi konten berkualitas", minimumScore: 75, xpReward: 350, badge: "🎬 Content Producer", unlocked: false, completed: false,
        modules: [
          { id: "m4", title: "Video Production", type: "module", description: "Shooting dan editing video", estimatedMinutes: 60, completed: false },
          { id: "m5", title: "Graphic Design Basics", type: "module", description: "Desain visual untuk social media", estimatedMinutes: 45, completed: false },
          { id: "m6", title: "Praktik: Buat Konten Series", type: "assignment", description: "Produksi 5 konten series", estimatedMinutes: 180, completed: false },
        ],
      },
      {
        id: "s3", title: "Monetization", level: "Advanced", description: "Monetisasi dan growth", minimumScore: 80, xpReward: 450, badge: "💰 Content Mogul", unlocked: false, completed: false,
        modules: [
          { id: "m7", title: "Monetization Strategies", type: "module", description: "Ads, sponsorship, products", estimatedMinutes: 40, completed: false },
          { id: "m8", title: "Community Building", type: "module", description: "Bangun komunitas loyal", estimatedMinutes: 35, completed: false },
          { id: "m9", title: "Analytics & Growth", type: "module", description: "Ukur dan tingkatkan performa", estimatedMinutes: 30, completed: false },
        ],
      },
    ],
  },
  {
    id: "tpl-hr-professional",
    title: "HR Professional",
    description: "Kuasai manajemen SDM modern: rekrutmen, pengembangan, dan retensi talenta.",
    targetAudience: "HR staff & people managers",
    estimatedDuration: "10 minggu",
    category: "HR",
    isTemplate: true,
    createdAt: new Date().toISOString(),
    totalXP: 1200,
    earnedXP: 0,
    stages: [
      {
        id: "s1", title: "HR Fundamentals", level: "Beginner", description: "Dasar manajemen SDM", minimumScore: 70, xpReward: 250, badge: "👥 HR Novice", unlocked: true, completed: false,
        modules: [
          { id: "m1", title: "Pengantar MSDM", type: "module", description: "Konsep dasar HR management", estimatedMinutes: 30, completed: false },
          { id: "m2", title: "Rekrutmen & Seleksi", type: "module", description: "Proses hiring efektif", estimatedMinutes: 40, completed: false },
          { id: "m3", title: "Onboarding Best Practices", type: "module", description: "Program orientasi karyawan baru", estimatedMinutes: 25, completed: false },
        ],
      },
      {
        id: "s2", title: "Talent Development", level: "Intermediate", description: "Pengembangan dan pelatihan", minimumScore: 75, xpReward: 400, badge: "🌟 Talent Developer", unlocked: false, completed: false,
        modules: [
          { id: "m4", title: "Training Needs Analysis", type: "module", description: "Identifikasi kebutuhan pelatihan", estimatedMinutes: 35, completed: false },
          { id: "m5", title: "Performance Management", type: "module", description: "Sistem evaluasi kinerja", estimatedMinutes: 40, completed: false },
          { id: "m6", title: "Career Pathing", type: "module", description: "Jalur karir karyawan", estimatedMinutes: 30, completed: false },
        ],
      },
      {
        id: "s3", title: "Strategic HR", level: "Advanced", description: "HR strategis dan analytics", minimumScore: 80, xpReward: 550, badge: "🎯 HR Strategist", unlocked: false, completed: false,
        modules: [
          { id: "m7", title: "HR Analytics", type: "module", description: "Data-driven HR decisions", estimatedMinutes: 45, completed: false },
          { id: "m8", title: "Employee Engagement", type: "module", description: "Strategi retensi talenta", estimatedMinutes: 35, completed: false },
          { id: "m9", title: "HR Transformation", type: "module", description: "Digital transformation di HR", estimatedMinutes: 40, completed: false },
        ],
      },
    ],
  },
  {
    id: "tpl-data-analyst",
    title: "Data Analyst",
    description: "Pelajari analisis data dari pengumpulan hingga visualisasi dan insight bisnis.",
    targetAudience: "Business analysts & data enthusiasts",
    estimatedDuration: "14 minggu",
    category: "Data",
    isTemplate: true,
    createdAt: new Date().toISOString(),
    totalXP: 1800,
    earnedXP: 0,
    stages: [
      {
        id: "s1", title: "Data Basics", level: "Beginner", description: "Dasar analisis data", minimumScore: 70, xpReward: 300, badge: "📊 Data Rookie", unlocked: true, completed: false,
        modules: [
          { id: "m1", title: "Intro to Data Analysis", type: "module", description: "Konsep dasar analisis data", estimatedMinutes: 30, completed: false },
          { id: "m2", title: "Excel & Spreadsheets", type: "module", description: "Data manipulation dengan spreadsheet", estimatedMinutes: 60, completed: false },
          { id: "m3", title: "Statistics Fundamentals", type: "module", description: "Statistik dasar untuk analyst", estimatedMinutes: 45, completed: false },
        ],
      },
      {
        id: "s2", title: "SQL & Databases", level: "Intermediate", description: "Query database dan data extraction", minimumScore: 75, xpReward: 500, badge: "🗄️ SQL Wizard", unlocked: false, completed: false,
        modules: [
          { id: "m4", title: "SQL Fundamentals", type: "module", description: "SELECT, JOIN, GROUP BY", estimatedMinutes: 60, completed: false },
          { id: "m5", title: "Advanced SQL", type: "module", description: "Window functions, CTEs, subqueries", estimatedMinutes: 75, completed: false },
          { id: "m6", title: "Praktik: Data Analysis", type: "assignment", description: "Analisis dataset nyata", estimatedMinutes: 120, completed: false },
        ],
      },
      {
        id: "s3", title: "Visualization & Insight", level: "Advanced", description: "Data visualization dan storytelling", minimumScore: 80, xpReward: 500, badge: "📈 Insight Master", unlocked: false, completed: false,
        modules: [
          { id: "m7", title: "Data Visualization Principles", type: "module", description: "Prinsip visualisasi efektif", estimatedMinutes: 40, completed: false },
          { id: "m8", title: "Dashboard Design", type: "module", description: "Membuat dashboard interaktif", estimatedMinutes: 60, completed: false },
          { id: "m9", title: "Data Storytelling", type: "module", description: "Menyampaikan insight bisnis", estimatedMinutes: 35, completed: false },
          { id: "m10", title: "Capstone: Business Report", type: "assignment", description: "Buat laporan analisis bisnis lengkap", estimatedMinutes: 180, completed: false },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "chaesa_learning_paths";
const PROGRESS_KEY = "chaesa_learning_path_progress";

function generateId() {
  return "lp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Marketing": return <Megaphone className="w-5 h-5" />;
    case "Technology": return <Code className="w-5 h-5" />;
    case "Management": return <Briefcase className="w-5 h-5" />;
    case "Creative": return <Palette className="w-5 h-5" />;
    case "HR": return <UserCheck className="w-5 h-5" />;
    case "Data": return <Database className="w-5 h-5" />;
    default: return <BookOpen className="w-5 h-5" />;
  }
}

function getLevelColor(level: string) {
  switch (level) {
    case "Beginner": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Intermediate": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "Advanced": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export default function LearningPathPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoggedIn, isLoading: authLoading, userName, userId } = useAuth();
  const [activeTab, setActiveTab] = useState("paths");
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});

  const [newPath, setNewPath] = useState({
    title: "",
    description: "",
    targetAudience: "",
    estimatedDuration: "",
    category: "General",
  });
  const [newStages, setNewStages] = useState<PathStage[]>([]);

  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [stageForm, setStageForm] = useState({
    title: "",
    level: "Beginner",
    description: "",
    minimumScore: 70,
    xpReward: 200,
    badge: "",
  });
  const [moduleForm, setModuleForm] = useState({
    title: "",
    type: "module" as "module" | "exam" | "assignment",
    description: "",
    estimatedMinutes: 30,
  });

  useEffect(() => {
    if (authLoading) return;
    loadPaths();
  }, [userId, authLoading]);

  const loadPaths = () => {
    try {
      const stored = localStorage.getItem(getUserStorageKey(userId, "learning_paths"));
      if (stored) {
        setPaths(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load paths:", e);
    }
  };

  const savePaths = useCallback((updatedPaths: LearningPath[]) => {
    localStorage.setItem(getUserStorageKey(userId, "learning_paths"), JSON.stringify(updatedPaths));
    setPaths(updatedPaths);
  }, [userId]);

  const handleUseTemplate = (template: LearningPath) => {
    const newLearningPath: LearningPath = {
      ...JSON.parse(JSON.stringify(template)),
      id: generateId(),
      isTemplate: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...paths, newLearningPath];
    savePaths(updated);
    toast({ title: "Path Created! 🎉", description: `"${template.title}" has been added to your learning paths.` });
    setActiveTab("paths");
  };

  const handleCreatePath = () => {
    if (!newPath.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a path title", variant: "destructive" });
      return;
    }
    if (newStages.length === 0) {
      toast({ title: "No Stages", description: "Add at least one stage to the path", variant: "destructive" });
      return;
    }

    const totalXP = newStages.reduce((acc, s) => acc + s.xpReward, 0);
    const createdPath: LearningPath = {
      id: generateId(),
      title: newPath.title,
      description: newPath.description,
      targetAudience: newPath.targetAudience,
      estimatedDuration: newPath.estimatedDuration,
      category: newPath.category,
      isTemplate: false,
      createdAt: new Date().toISOString(),
      totalXP,
      earnedXP: 0,
      stages: newStages.map((s, i) => ({ ...s, unlocked: i === 0 })),
    };

    const updated = [...paths, createdPath];
    savePaths(updated);
    toast({ title: "Learning Path Created! 🎉", description: `"${createdPath.title}" is ready.` });

    setNewPath({ title: "", description: "", targetAudience: "", estimatedDuration: "", category: "General" });
    setNewStages([]);
    setShowBuilder(false);
    setActiveTab("paths");
  };

  const handleAddStage = () => {
    if (!stageForm.title.trim()) {
      toast({ title: "Missing Title", description: "Enter a stage title", variant: "destructive" });
      return;
    }
    const stage: PathStage = {
      id: generateId(),
      title: stageForm.title,
      level: stageForm.level,
      description: stageForm.description,
      minimumScore: stageForm.minimumScore,
      xpReward: stageForm.xpReward,
      badge: stageForm.badge || `🏅 ${stageForm.title}`,
      unlocked: newStages.length === 0,
      completed: false,
      modules: [],
    };

    if (editingStageIndex !== null) {
      const updated = [...newStages];
      updated[editingStageIndex] = { ...stage, modules: updated[editingStageIndex].modules };
      setNewStages(updated);
      setEditingStageIndex(null);
    } else {
      setNewStages([...newStages, stage]);
    }

    setStageForm({ title: "", level: "Beginner", description: "", minimumScore: 70, xpReward: 200, badge: "" });
  };

  const handleAddModule = (stageIndex: number) => {
    if (!moduleForm.title.trim()) {
      toast({ title: "Missing Title", description: "Enter a module title", variant: "destructive" });
      return;
    }
    const mod: LearningModule = {
      id: generateId(),
      title: moduleForm.title,
      type: moduleForm.type,
      description: moduleForm.description,
      estimatedMinutes: moduleForm.estimatedMinutes,
      completed: false,
    };
    const updated = [...newStages];
    updated[stageIndex].modules.push(mod);
    setNewStages(updated);
    setModuleForm({ title: "", type: "module", description: "", estimatedMinutes: 30 });
  };

  const handleRemoveStage = (index: number) => {
    setNewStages(newStages.filter((_, i) => i !== index));
  };

  const handleRemoveModule = (stageIndex: number, moduleIndex: number) => {
    const updated = [...newStages];
    updated[stageIndex].modules = updated[stageIndex].modules.filter((_, i) => i !== moduleIndex);
    setNewStages(updated);
  };

  const handleDeletePath = (pathId: string) => {
    if (!confirm("Delete this learning path?")) return;
    const updated = paths.filter((p) => p.id !== pathId);
    savePaths(updated);
    if (selectedPath?.id === pathId) setSelectedPath(null);
    toast({ title: "Path Deleted", description: "Learning path has been removed." });
  };

  const handleToggleModule = (pathId: string, stageId: string, moduleId: string) => {
    const updated = paths.map((p) => {
      if (p.id !== pathId) return p;
      const path = { ...p, stages: p.stages.map((s) => ({ ...s, modules: s.modules.map((m) => ({ ...m })) })) };

      for (const stage of path.stages) {
        if (stage.id !== stageId) continue;
        for (const mod of stage.modules) {
          if (mod.id === moduleId) {
            mod.completed = !mod.completed;
          }
        }
        const allCompleted = stage.modules.every((m) => m.completed);
        if (allCompleted && !stage.completed) {
          stage.completed = true;
          const stageIdx = path.stages.indexOf(stage);
          if (stageIdx < path.stages.length - 1) {
            path.stages[stageIdx + 1].unlocked = true;
          }
          path.earnedXP += stage.xpReward;
          toast({ title: `Stage Complete! ${stage.badge}`, description: `+${stage.xpReward} XP earned!` });
        } else if (!allCompleted && stage.completed) {
          stage.completed = false;
        }
      }

      path.earnedXP = path.stages.filter((s) => s.completed).reduce((acc, s) => acc + s.xpReward, 0);
      return path;
    });

    savePaths(updated);
    const updatedSelected = updated.find((p) => p.id === pathId);
    if (updatedSelected) setSelectedPath(updatedSelected);
  };

  const toggleStageExpand = (stageId: string) => {
    setExpandedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const getPathProgress = (path: LearningPath) => {
    const totalModules = path.stages.reduce((acc, s) => acc + s.modules.length, 0);
    const completedModules = path.stages.reduce((acc, s) => acc + s.modules.filter((m) => m.completed).length, 0);
    return totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  };

  return (
    <>
      <SEO
        title="Learning Path Builder - Structured Curriculum | Chaesa Live"
        description="Build and follow structured learning paths with stages, milestones, and gamification. Track your progress from beginner to expert."
      />
      <Head>
        <link rel="canonical" href="https://chaesa.live/learning-path" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-blue-900 dark:via-purple-900 dark:to-pink-900">
        <PageHeader title="Learning Path" icon={Map} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Map className="w-10 h-10 text-emerald-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Learning Path Builder</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Build structured learning journeys with stages, milestones, and gamification
            </p>
          </div>

          {selectedPath ? (
            <PathDetailView
              path={selectedPath}
              onBack={() => setSelectedPath(null)}
              onToggleModule={handleToggleModule}
              expandedStages={expandedStages}
              toggleStageExpand={toggleStageExpand}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-white/10 border border-white/20">
                <TabsTrigger value="paths" className="data-[state=active]:bg-white/20">
                  <Map className="w-4 h-4 mr-2" />
                  My Paths ({paths.length})
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-white/20">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="create" className="data-[state=active]:bg-white/20">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Path
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paths" className="space-y-4">
                {paths.length === 0 ? (
                  <Card className="p-12 bg-white/5 border-white/10 text-center">
                    <Map className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No learning paths yet</h3>
                    <p className="text-gray-400 mb-4">Start from a template or create your own learning path</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setActiveTab("templates")}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Browse Templates
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("create")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Custom
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paths.map((path) => {
                      const progress = getPathProgress(path);
                      return (
                        <Card key={path.id} className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition cursor-pointer" onClick={() => setSelectedPath(path)}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(path.category)}
                              <h3 className="text-xl font-semibold text-white">{path.title}</h3>
                            </div>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={(e) => { e.stopPropagation(); handleDeletePath(path.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{path.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4" />{path.stages.length} stages</div>
                            <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{path.estimatedDuration}</div>
                            <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" />{path.earnedXP}/{path.totalXP} XP</div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex gap-2 mt-4">
                            {path.stages.map((stage) => (
                              <div key={stage.id} className={`flex-1 h-2 rounded-full ${stage.completed ? "bg-green-500" : stage.unlocked ? "bg-yellow-500/50" : "bg-gray-700"}`} />
                            ))}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {TEMPLATES.map((template) => (
                    <Card key={template.id} className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition">
                      <div className="flex items-center gap-2 mb-3">
                        {getCategoryIcon(template.category)}
                        <Badge className={getLevelColor(template.stages[0]?.level || "Beginner")}>{template.category}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">{template.title}</h3>
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1"><Users className="w-4 h-4" />{template.targetAudience}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1"><GraduationCap className="w-4 h-4" />{template.stages.length} stages</div>
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{template.estimatedDuration}</div>
                        <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" />{template.totalXP} XP</div>
                      </div>
                      <div className="space-y-1 mb-4">
                        {template.stages.map((stage, idx) => (
                          <div key={stage.id} className="flex items-center gap-2 text-sm">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-green-500 text-white" : "bg-white/10 text-gray-400"}`}>
                              {idx + 1}
                            </div>
                            <span className="text-gray-300">{stage.title}</span>
                            <Badge variant="outline" className={`text-xs ${getLevelColor(stage.level)}`}>{stage.level}</Badge>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => handleUseTemplate(template)}>
                        <Play className="w-4 h-4 mr-2" />
                        Use This Template
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="create" className="space-y-6">
                <Card className="p-6 bg-white/5 border-white/10 backdrop-blur">
                  <h2 className="text-2xl font-bold text-white mb-6">Create Custom Learning Path</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label className="text-white mb-2">Path Title *</Label>
                      <Input placeholder="e.g., Digital Marketing Mastery" value={newPath.title} onChange={(e) => setNewPath({ ...newPath, title: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white mb-2">Target Audience</Label>
                      <Input placeholder="e.g., Marketing professionals" value={newPath.targetAudience} onChange={(e) => setNewPath({ ...newPath, targetAudience: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white mb-2">Estimated Duration</Label>
                      <Input placeholder="e.g., 12 minggu" value={newPath.estimatedDuration} onChange={(e) => setNewPath({ ...newPath, estimatedDuration: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white mb-2">Category</Label>
                      <select className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white" value={newPath.category} onChange={(e) => setNewPath({ ...newPath, category: e.target.value })}>
                        <option value="General">General</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Technology">Technology</option>
                        <option value="Management">Management</option>
                        <option value="Creative">Creative</option>
                        <option value="HR">HR</option>
                        <option value="Data">Data</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-6">
                    <Label className="text-white mb-2">Description</Label>
                    <textarea placeholder="Describe the learning path..." value={newPath.description} onChange={(e) => setNewPath({ ...newPath, description: e.target.value })} className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-24" />
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-xl font-bold text-white mb-4">Stages / Milestones</h3>

                    {newStages.map((stage, stageIdx) => (
                      <Card key={stage.id} className="p-4 bg-white/5 border-white/10 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                              {stageIdx + 1}
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">{stage.title}</h4>
                              <Badge variant="outline" className={`text-xs ${getLevelColor(stage.level)}`}>{stage.level}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="text-blue-400" onClick={() => { setEditingStageIndex(stageIdx); setStageForm({ title: stage.title, level: stage.level, description: stage.description, minimumScore: stage.minimumScore, xpReward: stage.xpReward, badge: stage.badge }); }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleRemoveStage(stageIdx)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{stage.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mb-3">
                          <span>Min Score: {stage.minimumScore}%</span>
                          <span>XP: {stage.xpReward}</span>
                          <span>Badge: {stage.badge}</span>
                        </div>

                        {stage.modules.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {stage.modules.map((mod, modIdx) => (
                              <div key={mod.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {mod.type === "exam" ? "📝 Exam" : mod.type === "assignment" ? "📋 Assignment" : "📖 Module"}
                                  </Badge>
                                  <span className="text-sm text-gray-300">{mod.title}</span>
                                  <span className="text-xs text-gray-500">{mod.estimatedMinutes}min</span>
                                </div>
                                <Button size="sm" variant="ghost" className="text-red-400 h-6 w-6 p-0" onClick={() => handleRemoveModule(stageIdx, modIdx)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="border-t border-white/10 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <Input placeholder="Module title" value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} className="bg-white/10 border-white/20 text-white text-sm" />
                            <select className="p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm" value={moduleForm.type} onChange={(e) => setModuleForm({ ...moduleForm, type: e.target.value as any })}>
                              <option value="module">Module</option>
                              <option value="exam">Exam</option>
                              <option value="assignment">Assignment</option>
                            </select>
                            <Input type="number" placeholder="Minutes" value={moduleForm.estimatedMinutes} onChange={(e) => setModuleForm({ ...moduleForm, estimatedMinutes: parseInt(e.target.value) || 30 })} className="bg-white/10 border-white/20 text-white text-sm" />
                            <Button size="sm" onClick={() => handleAddModule(stageIdx)} className="bg-emerald-600 hover:bg-emerald-700">
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Card className="p-4 bg-white/5 border-white/10 border-dashed">
                      <h4 className="text-white font-semibold mb-3">
                        {editingStageIndex !== null ? "Edit Stage" : "Add New Stage"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <Input placeholder="Stage title" value={stageForm.title} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                        <select className="p-2 bg-white/10 border border-white/20 rounded-lg text-white" value={stageForm.level} onChange={(e) => setStageForm({ ...stageForm, level: e.target.value })}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                        <Input placeholder="Badge emoji + name" value={stageForm.badge} onChange={(e) => setStageForm({ ...stageForm, badge: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <Input placeholder="Description" value={stageForm.description} onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })} className="bg-white/10 border-white/20 text-white" />
                        <Input type="number" placeholder="Min score %" value={stageForm.minimumScore} onChange={(e) => setStageForm({ ...stageForm, minimumScore: parseInt(e.target.value) || 70 })} className="bg-white/10 border-white/20 text-white" />
                        <Input type="number" placeholder="XP reward" value={stageForm.xpReward} onChange={(e) => setStageForm({ ...stageForm, xpReward: parseInt(e.target.value) || 200 })} className="bg-white/10 border-white/20 text-white" />
                      </div>
                      <Button onClick={handleAddStage} className="bg-gradient-to-r from-emerald-600 to-teal-600">
                        <Plus className="w-4 h-4 mr-2" />
                        {editingStageIndex !== null ? "Update Stage" : "Add Stage"}
                      </Button>
                    </Card>
                  </div>

                  <Button onClick={handleCreatePath} className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" size="lg" disabled={!newPath.title.trim() || newStages.length === 0}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Learning Path
                  </Button>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </>
  );
}

function PathDetailView({
  path,
  onBack,
  onToggleModule,
  expandedStages,
  toggleStageExpand,
}: {
  path: LearningPath;
  onBack: () => void;
  onToggleModule: (pathId: string, stageId: string, moduleId: string) => void;
  expandedStages: Record<string, boolean>;
  toggleStageExpand: (stageId: string) => void;
}) {
  const totalModules = path.stages.reduce((acc, s) => acc + s.modules.length, 0);
  const completedModules = path.stages.reduce((acc, s) => acc + s.modules.filter((m) => m.completed).length, 0);
  const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const completedStages = path.stages.filter((s) => s.completed).length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="text-white hover:bg-white/10">
        ← Back to Paths
      </Button>

      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getCategoryIcon(path.category)}
              <h2 className="text-3xl font-bold text-white">{path.title}</h2>
            </div>
            <p className="text-gray-400">{path.description}</p>
          </div>
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-400">{path.earnedXP}</div>
              <div className="text-xs text-gray-500">XP Earned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{completedStages}/{path.stages.length}</div>
              <div className="text-xs text-gray-500">Stages</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">{progress}%</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1"><Users className="w-4 h-4" />{path.targetAudience}</div>
          <div className="flex items-center gap-1"><Clock className="w-4 h-4" />{path.estimatedDuration}</div>
          <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-400" />{path.totalXP} Total XP</div>
        </div>

        <Progress value={progress} className="h-3" />
      </Card>

      <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2">
        {path.stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${stage.completed ? "bg-green-500/20 text-green-400 border border-green-500/30" : stage.unlocked ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>
              {stage.completed ? <CheckCircle className="w-4 h-4" /> : stage.unlocked ? <Circle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {stage.title}
            </div>
            {idx < path.stages.length - 1 && (
              <ChevronRight className={`w-5 h-5 mx-1 ${stage.completed ? "text-green-500" : "text-gray-600"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {path.stages.map((stage, stageIdx) => {
          const stageModulesCompleted = stage.modules.filter((m) => m.completed).length;
          const stageProgress = stage.modules.length > 0 ? Math.round((stageModulesCompleted / stage.modules.length) * 100) : 0;
          const isExpanded = expandedStages[stage.id] !== false;

          return (
            <Card key={stage.id} className={`border-white/10 overflow-hidden ${!stage.unlocked ? "opacity-50" : ""} ${stage.completed ? "bg-green-500/5" : "bg-white/5"}`}>
              <button className="w-full p-6 text-left" onClick={() => toggleStageExpand(stage.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${stage.completed ? "bg-green-500 text-white" : stage.unlocked ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" : "bg-gray-700 text-gray-500"}`}>
                      {stage.completed ? <CheckCircle className="w-6 h-6" /> : stageIdx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">{stage.title}</h3>
                        <Badge variant="outline" className={`text-xs ${getLevelColor(stage.level)}`}>{stage.level}</Badge>
                        {stage.completed && <Badge className="bg-green-500 text-xs">Completed</Badge>}
                        {!stage.unlocked && <Badge variant="outline" className="text-xs text-gray-500 border-gray-600"><Lock className="w-3 h-3 mr-1" />Locked</Badge>}
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{stage.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <div className="text-sm text-gray-400">{stageModulesCompleted}/{stage.modules.length} items</div>
                      <div className="flex items-center gap-1 text-yellow-400 text-sm"><Zap className="w-3 h-3" />{stage.xpReward} XP</div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
                {stage.unlocked && (
                  <div className="mt-4">
                    <Progress value={stageProgress} className="h-2" />
                  </div>
                )}
              </button>

              {isExpanded && stage.unlocked && (
                <div className="px-6 pb-6 space-y-2">
                  {stage.modules.map((mod) => (
                    <div key={mod.id} className={`flex items-center justify-between p-3 rounded-lg border transition ${mod.completed ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => onToggleModule(path.id, stage.id, mod.id)} className="flex-shrink-0">
                          {mod.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-500 hover:text-emerald-400 transition" />
                          )}
                        </button>
                        <Badge variant="outline" className={`text-xs ${mod.type === "exam" ? "text-red-400 border-red-500/30" : mod.type === "assignment" ? "text-blue-400 border-blue-500/30" : "text-gray-400 border-gray-500/30"}`}>
                          {mod.type === "exam" ? "📝 Exam" : mod.type === "assignment" ? "📋 Assignment" : "📖 Module"}
                        </Badge>
                        <div>
                          <span className={`text-sm ${mod.completed ? "text-gray-400 line-through" : "text-white"}`}>{mod.title}</span>
                          {mod.description && <p className="text-xs text-gray-500">{mod.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {mod.estimatedMinutes} min
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-white/5 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-400">Stage Badge:</span>
                      <span className="text-white">{stage.badge}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Min. Score: {stage.minimumScore}%
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {path.stages.every((s) => s.completed) && (
        <Card className="p-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Path Completed! 🎉</h3>
          <p className="text-gray-300 mb-2">You have completed all stages in "{path.title}"</p>
          <div className="flex items-center justify-center gap-2 text-yellow-400 text-xl font-bold">
            <Zap className="w-6 h-6" />
            {path.totalXP} XP Total Earned
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {path.stages.map((stage) => (
              <Badge key={stage.id} className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-sm py-1 px-3">
                {stage.badge}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}