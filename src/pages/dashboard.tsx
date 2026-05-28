import { useState, useEffect } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import {
  Trophy, BookOpen, Award, Target, Star, TrendingUp,
  GraduationCap, Layers, Users, Clock, ChevronRight,
  Sparkles, Zap, Shield, Brain, Rocket, Medal, Crown,
  BarChart3, CheckCircle2, Play,
  FileText, Map
} from "lucide-react";

interface DashboardStats {
  totalXP: number;
  certificatesEarned: number;
  examsCompleted: number;
  examsPassed: number;
  storiesRead: number;
  learningPathsActive: number;
  learningPathsCompleted: number;
  skillFrameworksUsed: number;
  totalSkillsRated: number;
}

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: "learning" | "exam" | "creator" | "milestone";
}

interface RecentActivity {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  link: string;
  color: string;
}

function computeStats(userId: string | null): DashboardStats {
  const stats: DashboardStats = {
    totalXP: 0,
    certificatesEarned: 0,
    examsCompleted: 0,
    examsPassed: 0,
    storiesRead: 0,
    learningPathsActive: 0,
    learningPathsCompleted: 0,
    skillFrameworksUsed: 0,
    totalSkillsRated: 0,
  };

  try {
    const certs = localStorage.getItem(getUserStorageKey(userId, "certificates"));
    if (certs) {
      const parsed = JSON.parse(certs);
      stats.certificatesEarned = parsed.length;
      stats.totalXP += parsed.length * 100;
    }
  } catch {}

  try {
    const results = localStorage.getItem(getUserStorageKey(userId, "certification_results"));
    if (results) {
      const parsed = JSON.parse(results);
      stats.examsCompleted = parsed.length;
      stats.examsPassed = parsed.filter((r: any) => r.passed).length;
      stats.totalXP += stats.examsPassed * 50;
      stats.totalXP += stats.examsCompleted * 20;
    }
  } catch {}

  try {
    const stories = localStorage.getItem(getUserStorageKey(userId, "storybooks"));
    if (stories) {
      const parsed = JSON.parse(stories);
      stats.storiesRead = parsed.filter((s: any) => !s.isSample).length;
      stats.totalXP += stats.storiesRead * 30;
    }
  } catch {}

  try {
    const paths = localStorage.getItem(getUserStorageKey(userId, "learning_paths"));
    if (paths) {
      const parsed = JSON.parse(paths);
      stats.learningPathsActive = parsed.filter((p: any) => !p.isTemplate).length;
      stats.learningPathsCompleted = parsed.filter((p: any) =>
        !p.isTemplate && p.stages?.every((s: any) => s.completed)
      ).length;
      parsed.forEach((p: any) => {
        if (!p.isTemplate) {
          stats.totalXP += (p.earnedXP || 0);
        }
      });
    }
  } catch {}

  try {
    const matrix = localStorage.getItem(getUserStorageKey(userId, "skills-matrix"));
    if (matrix) {
      const parsed = JSON.parse(matrix);
      stats.skillFrameworksUsed = (parsed.categories || []).length > 0 ? 1 : 0;
      let totalRated = 0;
      (parsed.teamMembers || []).forEach((m: any) => {
        totalRated += Object.keys(m.skills || {}).length;
      });
      stats.totalSkillsRated = totalRated;
      stats.totalXP += stats.skillFrameworksUsed * 25;
    }
  } catch {}

  return stats;
}

function getAchievements(stats: DashboardStats): Achievement[] {
  return [
    {
      id: "first-step",
      icon: <Rocket className="w-6 h-6" />,
      title: "Langkah Pertama",
      description: "Mulai menggunakan Chaesa Live",
      unlocked: true,
      category: "milestone",
    },
    {
      id: "bookworm",
      icon: <BookOpen className="w-6 h-6" />,
      title: "Kutu Buku",
      description: "Buat 1 cerita di Storybook",
      unlocked: stats.storiesRead >= 1,
      category: "learning",
    },
    {
      id: "storyteller",
      icon: <Sparkles className="w-6 h-6" />,
      title: "Pendongeng",
      description: "Buat 3 cerita di Storybook",
      unlocked: stats.storiesRead >= 3,
      category: "learning",
    },
    {
      id: "test-taker",
      icon: <FileText className="w-6 h-6" />,
      title: "Peserta Ujian",
      description: "Selesaikan 1 ujian",
      unlocked: stats.examsCompleted >= 1,
      category: "exam",
    },
    {
      id: "exam-ace",
      icon: <Trophy className="w-6 h-6" />,
      title: "Juara Ujian",
      description: "Lulus 3 ujian",
      unlocked: stats.examsPassed >= 3,
      category: "exam",
    },
    {
      id: "certified",
      icon: <Award className="w-6 h-6" />,
      title: "Bersertifikat",
      description: "Raih 1 sertifikat digital",
      unlocked: stats.certificatesEarned >= 1,
      category: "exam",
    },
    {
      id: "collector",
      icon: <Medal className="w-6 h-6" />,
      title: "Kolektor",
      description: "Raih 5 sertifikat digital",
      unlocked: stats.certificatesEarned >= 5,
      category: "exam",
    },
    {
      id: "pathfinder",
      icon: <Map className="w-6 h-6" />,
      title: "Pathfinder",
      description: "Mulai 1 learning path",
      unlocked: stats.learningPathsActive >= 1,
      category: "learning",
    },
    {
      id: "graduate",
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Wisudawan",
      description: "Selesaikan 1 learning path",
      unlocked: stats.learningPathsCompleted >= 1,
      category: "learning",
    },
    {
      id: "skill-mapper",
      icon: <Target className="w-6 h-6" />,
      title: "Skill Mapper",
      description: "Gunakan Skills Matrix",
      unlocked: stats.skillFrameworksUsed >= 1,
      category: "creator",
    },
    {
      id: "xp-100",
      icon: <Zap className="w-6 h-6" />,
      title: "XP Hunter",
      description: "Kumpulkan 100 XP",
      unlocked: stats.totalXP >= 100,
      category: "milestone",
    },
    {
      id: "xp-500",
      icon: <Crown className="w-6 h-6" />,
      title: "XP Master",
      description: "Kumpulkan 500 XP",
      unlocked: stats.totalXP >= 500,
      category: "milestone",
    },
  ];
}

function getRecentActivities(stats: DashboardStats): RecentActivity[] {
  const activities: RecentActivity[] = [];

  if (stats.certificatesEarned > 0) {
    activities.push({
      id: "cert",
      icon: <Award className="w-4 h-4" />,
      title: "Sertifikat Digital",
      description: `${stats.certificatesEarned} sertifikat diraih`,
      time: "Terbaru",
      link: "/sertifikat",
      color: "text-yellow-500",
    });
  }
  if (stats.examsCompleted > 0) {
    activities.push({
      id: "exam",
      icon: <FileText className="w-4 h-4" />,
      title: "Ujian & Sertifikasi",
      description: `${stats.examsCompleted} ujian selesai, ${stats.examsPassed} lulus`,
      time: "Terbaru",
      link: "/sertifikasi",
      color: "text-green-500",
    });
  }
  if (stats.learningPathsActive > 0) {
    activities.push({
      id: "path",
      icon: <Map className="w-4 h-4" />,
      title: "Learning Path",
      description: `${stats.learningPathsActive} path aktif`,
      time: "Terbaru",
      link: "/learning-path",
      color: "text-purple-500",
    });
  }
  if (stats.storiesRead > 0) {
    activities.push({
      id: "story",
      icon: <BookOpen className="w-4 h-4" />,
      title: "Storybook Visual",
      description: `${stats.storiesRead} cerita dibuat`,
      time: "Terbaru",
      link: "/storybook",
      color: "text-blue-500",
    });
  }
  if (stats.skillFrameworksUsed > 0) {
    activities.push({
      id: "skills",
      icon: <Target className="w-4 h-4" />,
      title: "Skills Matrix",
      description: `${stats.totalSkillsRated} skill dirating`,
      time: "Terbaru",
      link: "/skills-matrix",
      color: "text-orange-500",
    });
  }

  if (activities.length === 0) {
    activities.push({
      id: "welcome",
      icon: <Sparkles className="w-4 h-4" />,
      title: "Selamat Datang!",
      description: "Mulai eksplorasi fitur-fitur Chaesa Live",
      time: "Sekarang",
      link: "/storybook",
      color: "text-green-500",
    });
  }

  return activities;
}

function StatCard({ icon, label, value, subtext, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
  color: string;
}) {
  return (
    <Card className="p-4 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          {subtext && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function XPProgressRing({ xp, maxXP }: { xp: number; maxXP: number }) {
  const percentage = Math.min((xp / maxXP) * 100, 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const level = Math.floor(xp / 100) + 1;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-700"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="50" cy="50" r="45"
            stroke="url(#xp-gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="xp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{xp}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">XP</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
          Level {level}
        </Badge>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading: authLoading, userName, userId } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [achievementFilter, setAchievementFilter] = useState<string>("all");

  useEffect(() => {
    if (authLoading) return;
    const computed = computeStats(userId);
    setStats(computed);
    setAchievements(getAchievements(computed));
    setActivities(getRecentActivities(computed));
  }, [userId, authLoading]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalAchievements = achievements.length;
  const filteredAchievements = achievementFilter === "all"
    ? achievements
    : achievements.filter(a => a.category === achievementFilter);

  return (
    <>
      <SEO
        title="Dashboard — Chaesa Live"
        description="Lihat progress belajar, XP, sertifikat, dan pencapaian Kamu di Chaesa Live"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-green-950/20">
        <PageHeader title="Dashboard" icon={BarChart3} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-green-600" />
              Dashboard Progress
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isLoggedIn ? `Selamat datang kembali, ${userName}!` : "Pantau progress belajar dan pencapaian Kamu"}
            </p>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                <Card className="lg:col-span-1 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50 flex flex-col items-center justify-center">
                  <XPProgressRing xp={stats.totalXP} maxXP={Math.max(stats.totalXP + 100, 500)} />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                    {stats.totalXP < 100 ? "Mulai belajar untuk kumpulkan XP!" :
                     stats.totalXP < 500 ? "Terus semangat! XP Kamu bertambah!" :
                     "Luar biasa! Kamu learner sejati!"}
                  </p>
                </Card>

                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard
                    icon={<Award className="w-5 h-5 text-yellow-600" />}
                    label="Sertifikat"
                    value={stats.certificatesEarned}
                    color="bg-yellow-50 dark:bg-yellow-900/20"
                  />
                  <StatCard
                    icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                    label="Ujian Lulus"
                    value={stats.examsPassed}
                    subtext={`dari ${stats.examsCompleted} ujian`}
                    color="bg-green-50 dark:bg-green-900/20"
                  />
                  <StatCard
                    icon={<BookOpen className="w-5 h-5 text-blue-600" />}
                    label="Cerita Dibuat"
                    value={stats.storiesRead}
                    color="bg-blue-50 dark:bg-blue-900/20"
                  />
                  <StatCard
                    icon={<Map className="w-5 h-5 text-purple-600" />}
                    label="Learning Path"
                    value={stats.learningPathsActive}
                    subtext={stats.learningPathsCompleted > 0 ? `${stats.learningPathsCompleted} selesai` : undefined}
                    color="bg-purple-50 dark:bg-purple-900/20"
                  />
                  <StatCard
                    icon={<Target className="w-5 h-5 text-orange-600" />}
                    label="Skills Dirating"
                    value={stats.totalSkillsRated}
                    color="bg-orange-50 dark:bg-orange-900/20"
                  />
                  <StatCard
                    icon={<Trophy className="w-5 h-5 text-pink-600" />}
                    label="Pencapaian"
                    value={`${unlockedCount}/${totalAchievements}`}
                    color="bg-pink-50 dark:bg-pink-900/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-2 p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      Pencapaian
                    </h2>
                    <div className="flex gap-1">
                      {["all", "learning", "exam", "creator", "milestone"].map(filter => (
                        <button
                          key={filter}
                          onClick={() => setAchievementFilter(filter)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            achievementFilter === filter
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {filter === "all" ? "Semua" : filter === "learning" ? "Belajar" : filter === "exam" ? "Ujian" : filter === "creator" ? "Creator" : "Milestone"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredAchievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className={`p-3 rounded-xl border transition-all ${
                          achievement.unlocked
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800/50"
                            : "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/30 opacity-50"
                        }`}
                      >
                        <div className={`mb-2 ${achievement.unlocked ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-600"}`}>
                          {achievement.icon}
                        </div>
                        <p className={`text-sm font-semibold ${achievement.unlocked ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
                          {achievement.title}
                        </p>
                        <p className={`text-xs mt-0.5 ${achievement.unlocked ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-600"}`}>
                          {achievement.description}
                        </p>
                        {achievement.unlocked && (
                          <Badge className="mt-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] border-green-200 dark:border-green-800">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress pencapaian</span>
                      <span>{unlockedCount}/{totalAchievements}</span>
                    </div>
                    <Progress value={(unlockedCount / totalAchievements) * 100} className="h-2" />
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Aktivitas Terbaru
                  </h2>
                  <div className="space-y-3">
                    {activities.map(activity => (
                      <Link
                        key={activity.id}
                        href={activity.link}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                      >
                        <div className={`p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 ${activity.color}`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                            {activity.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.description}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-500 mt-1 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Rocket className="w-5 h-5 text-purple-500" />
                  Lanjutkan Belajar
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link href="/storybook" className="group">
                    <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-all">
                      <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-blue-600 transition-colors">Storybook Visual</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Belajar lewat cerita bergambar</p>
                    </div>
                  </Link>
                  <Link href="/learning-path" className="group">
                    <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 hover:shadow-md transition-all">
                      <Layers className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 transition-colors">Learning Path</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Jalur belajar terstruktur</p>
                    </div>
                  </Link>
                  <Link href="/sertifikasi" className="group">
                    <div className="p-4 rounded-xl border border-green-200 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:shadow-md transition-all">
                      <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-green-600 transition-colors">Ujian & Sertifikasi</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Uji kompetensi + sertifikat</p>
                    </div>
                  </Link>
                  <Link href="/skills-matrix" className="group">
                    <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-800/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover:shadow-md transition-all">
                      <Target className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-orange-600 transition-colors">Skills Matrix</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Mapping kompetensi tim</p>
                    </div>
                  </Link>
                </div>
              </Card>
            </>
          )}

          {!stats && !authLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
