import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { useAuth, getUserStorageKey } from "@/hooks/useAuth";
import { microLearningService } from "@/services/microLearningService";
import {
  Video, TrendingUp,
  Sparkles, Radio, Send, BarChart3, Clock,
  PlayCircle, FileText, Mic, BookOpen,
  Plus, ChevronRight, Award, Layers
} from "lucide-react";

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: any;
  color: string;
  bgColor: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: "video" | "course" | "podcast" | "article" | "story";
  date: string;
}

function loadCreatorData(userId: string | null) {
  let totalCourses = 0;
  let totalModules = 0;
  let totalStories = 0;
  let totalCertificates = 0;
  let skillFrameworks = 0;
  const recentItems: ContentItem[] = [];

  try {
    const stories = localStorage.getItem(getUserStorageKey(userId, "storybooks"));
    if (stories) {
      const parsed = JSON.parse(stories);
      const userStories = parsed.filter((s: any) => !s.isSample);
      totalStories = userStories.length;
      userStories.forEach((s: any) => {
        recentItems.push({
          id: s.id || `story-${Math.random()}`,
          title: s.title || "Untitled Story",
          type: "story",
          date: s.createdAt || s.created_at || new Date().toISOString(),
        });
      });
    }
  } catch {}

  try {
    const certs = localStorage.getItem(getUserStorageKey(userId, "certificates"));
    if (certs) {
      const parsed = JSON.parse(certs);
      totalCertificates = parsed.length;
    }
  } catch {}

  try {
    const matrix = localStorage.getItem(getUserStorageKey(userId, "skills-matrix"));
    if (matrix) {
      const parsed = JSON.parse(matrix);
      skillFrameworks = (parsed.categories || []).length > 0 ? 1 : 0;
    }
  } catch {}

  return { totalCourses, totalModules, totalStories, totalCertificates, skillFrameworks, recentItems };
}

export default function CreatorDashboard() {
  const router = useRouter();
  const { isLoggedIn, user, userId } = useAuth();
  const userEmail = user?.email || "";
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [totalStories, setTotalStories] = useState(0);
  const [totalCertificates, setTotalCertificates] = useState(0);
  const [skillFrameworks, setSkillFrameworks] = useState(0);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);

  useEffect(() => {
    const local = loadCreatorData(userId);
    setTotalStories(local.totalStories);
    setTotalCertificates(local.totalCertificates);
    setSkillFrameworks(local.skillFrameworks);

    const courseItems: ContentItem[] = [];
    let moduleCount = 0;

    microLearningService.getUserCourses().then(({ data }) => {
      if (data && data.length > 0) {
        setTotalCourses(data.length);
        data.forEach((c: any) => {
          courseItems.push({
            id: c.id,
            title: c.title || "Untitled Course",
            type: "course",
            date: c.created_at || new Date().toISOString(),
          });
          moduleCount += c.module_count || 0;
        });
        setTotalModules(moduleCount);
      }

      const merged = [...courseItems, ...local.recentItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      setRecentContent(merged);
    }).catch(() => {
      const merged = [...local.recentItems]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      setRecentContent(merged);
    });
  }, [userId]);

  const stats: StatCard[] = [
    {
      title: "Total Konten",
      value: String(totalCourses + totalStories),
      change: `${totalCourses} kursus, ${totalStories} cerita`,
      changeType: "up",
      icon: Layers,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Modul",
      value: String(totalModules),
      change: "dari semua kursus",
      changeType: "up",
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Sertifikat Dibuat",
      value: String(totalCertificates),
      change: "sertifikat diraih",
      changeType: "up",
      icon: Award,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Skills Framework",
      value: String(skillFrameworks),
      change: skillFrameworks > 0 ? "framework aktif" : "belum ada",
      changeType: skillFrameworks > 0 ? "up" : "down",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return PlayCircle;
      case "course": return BookOpen;
      case "podcast": return Mic;
      case "article": return FileText;
      case "story": return FileText;
      default: return FileText;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "video": return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
      case "course": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "podcast": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "article": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30";
      case "story": return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
      default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video": return "Video";
      case "course": return "Kursus";
      case "podcast": return "Podcast";
      case "article": return "Artikel";
      case "story": return "Cerita";
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const quickActions = [
    {
      title: "Mulai Live",
      description: "Mulai sesi live streaming sekarang",
      icon: Radio,
      color: "from-red-600 to-pink-600",
      hoverColor: "hover:from-red-700 hover:to-pink-700",
      href: null as string | null,
      onClick: () => {
        const newMeetingId = Math.random().toString(36).substring(2, 15);
        router.push(`/meeting/${newMeetingId}`);
      },
    },
    {
      title: "Buat Konten",
      description: "Generate kursus dengan AI Studio",
      icon: Sparkles,
      color: "from-purple-600 to-blue-600",
      hoverColor: "hover:from-purple-700 hover:to-blue-700",
      href: "/ai-studio",
      onClick: null as (() => void) | null,
    },
    {
      title: "Broadcast",
      description: "Kirim pesan ke semua channel",
      icon: Send,
      color: "from-green-600 to-emerald-600",
      hoverColor: "hover:from-green-700 hover:to-emerald-700",
      href: "/broadcast",
      onClick: null as (() => void) | null,
    },
  ];

  return (
    <>
      <SEO
        title="Creator Dashboard - Chaesa Live"
        description="Pantau performa konten, analytics, dan kelola channel kreator Anda"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Creator Dashboard" icon={BarChart3} />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Kreator</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Pantau performa dan kelola konten Anda</p>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
              {(["7d", "30d", "90d"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {range === "7d" ? "7 Hari" : range === "30d" ? "30 Hari" : "90 Hari"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.change}</div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, idx) => {
              const content = (
                <Card
                  key={idx}
                  className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                </Card>
              );

              if (action.href) {
                return (
                  <Link key={idx} href={action.href}>
                    {content}
                  </Link>
                );
              }

              return (
                <div key={idx} onClick={action.onClick || undefined}>
                  {content}
                </div>
              );
            })}
          </div>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performa Konten Terbaru</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Performa konten yang baru dipublikasikan</p>
              </div>
              <Link href="/ai-studio">
                <Button variant="ghost" size="sm" className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                  Lihat Semua <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {recentContent.length === 0 ? (
                <div className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Belum ada konten</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Buat kursus atau cerita pertama Anda di AI Studio</p>
                  <Link href="/ai-studio">
                    <Button size="sm" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="w-4 h-4 mr-1" /> Buat Konten
                    </Button>
                  </Link>
                </div>
              ) : (
                recentContent.map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                          <TypeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">{item.title}</h4>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className={`text-xs ${getTypeBadgeColor(item.type)}`}>
                              {getTypeLabel(item.type)}
                            </Badge>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Channel</h3>
              <div className="space-y-3">
                {[
                  { name: "YouTube", views: 12400, color: "bg-red-500" },
                  { name: "Instagram", views: 6200, color: "bg-pink-500" },
                  { name: "TikTok", views: 4100, color: "bg-gray-800 dark:bg-white" },
                  { name: "LinkedIn", views: 2132, color: "bg-blue-600" },
                ].map((channel, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${channel.color}`} />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{channel.name}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{channel.views.toLocaleString()} views</span>
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${channel.color}`}
                        style={{ width: `${(channel.views / 12400) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Jadwal Mendatang</h3>
              <div className="space-y-3">
                {[
                  { title: "Workshop AI Studio", date: "Senin, 9 Jun 2025", time: "14:00 WIB", status: "upcoming" },
                  { title: "Live Q&A Monetisasi", date: "Rabu, 11 Jun 2025", time: "19:00 WIB", status: "upcoming" },
                  { title: "Demo Fitur Baru", date: "Jumat, 13 Jun 2025", time: "10:00 WIB", status: "upcoming" },
                ].map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Video className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{event.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{event.date} - {event.time}</div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                      Akan Datang
                    </Badge>
                  </div>
                ))}
              </div>
              <Link href="/schedule">
                <Button variant="ghost" size="sm" className="w-full mt-3 text-purple-600 dark:text-purple-400">
                  Lihat Semua Jadwal <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
