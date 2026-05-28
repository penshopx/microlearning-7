import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Award,
  BookOpen,
  GraduationCap,
  Target,
  Zap,
  CheckCheck,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  icon: string;
  title: string;
  description: string;
  href: string;
  timestamp: number;
  read: boolean;
}

const ICON_MAP: Record<string, any> = {
  award: Award,
  book: BookOpen,
  exam: GraduationCap,
  target: Target,
  zap: Zap,
  layers: Layers,
};

function getUserKey(userId: string | null) {
  return `chaesa_${userId || "guest"}_notifications`;
}

function getReadKey(userId: string | null) {
  return `chaesa_${userId || "guest"}_notifications_read`;
}

function generateNotifications(userId: string | null): Notification[] {
  const notifications: Notification[] = [];
  const storageKey = (key: string) => `chaesa_${userId || "guest"}_${key}`;
  const now = Date.now();

  try {
    const certsRaw = localStorage.getItem(storageKey("certificates"));
    if (certsRaw) {
      const certs = JSON.parse(certsRaw);
      if (Array.isArray(certs)) {
        certs.slice(-3).forEach((cert: any, i: number) => {
          notifications.push({
            id: `cert_${cert.id || i}`,
            icon: "award",
            title: "Sertifikat Baru!",
            description: cert.recipientName
              ? `Sertifikat untuk ${cert.recipientName}`
              : "Sertifikat digital berhasil dibuat",
            href: "/sertifikat",
            timestamp: cert.issuedDate ? new Date(cert.issuedDate).getTime() : now - i * 86400000,
            read: false,
          });
        });
      }
    }

    const examsRaw = localStorage.getItem(storageKey("certification_results"));
    if (examsRaw) {
      const exams = JSON.parse(examsRaw);
      if (Array.isArray(exams)) {
        exams
          .filter((e: any) => e.passed)
          .slice(-3)
          .forEach((exam: any, i: number) => {
            notifications.push({
              id: `exam_${exam.examId || i}`,
              icon: "exam",
              title: "Ujian Lulus!",
              description: `Skor: ${exam.score}% — ${exam.examTitle || "Ujian"}`,
              href: "/sertifikasi",
              timestamp: exam.date ? new Date(exam.date).getTime() : now - i * 86400000,
              read: false,
            });
          });
      }
    }

    const storiesRaw = localStorage.getItem(storageKey("storybooks"));
    if (storiesRaw) {
      const stories = JSON.parse(storiesRaw);
      if (Array.isArray(stories)) {
        stories
          .filter((s: any) => !s.isSample)
          .slice(-2)
          .forEach((story: any, i: number) => {
            notifications.push({
              id: `story_${story.id || i}`,
              icon: "book",
              title: "Cerita Baru Dibuat",
              description: story.title || "Storybook visual baru",
              href: "/storybook",
              timestamp: story.createdAt ? new Date(story.createdAt).getTime() : now - i * 86400000,
              read: false,
            });
          });
      }
    }

    const pathsRaw = localStorage.getItem(storageKey("learning_paths"));
    if (pathsRaw) {
      const paths = JSON.parse(pathsRaw);
      if (Array.isArray(paths)) {
        paths
          .filter((p: any) => p.completedModules && p.totalModules && p.completedModules >= p.totalModules)
          .slice(-2)
          .forEach((path: any, i: number) => {
            notifications.push({
              id: `path_${path.id || i}`,
              icon: "layers",
              title: "Learning Path Selesai!",
              description: path.title || "Jalur belajar diselesaikan",
              href: "/learning-path",
              timestamp: now - i * 86400000,
              read: false,
            });
          });
      }
    }

    const skillsRaw = localStorage.getItem(storageKey("skills-matrix"));
    if (skillsRaw) {
      const skills = JSON.parse(skillsRaw);
      if (Array.isArray(skills) && skills.length > 0) {
        notifications.push({
          id: "skills_update",
          icon: "target",
          title: "Skills Matrix Diperbarui",
          description: `${skills.length} framework kompetensi aktif`,
          href: "/skills-matrix",
          timestamp: now - 3600000,
          read: false,
        });
      }
    }
  } catch {
  }

  if (notifications.length === 0) {
    notifications.push({
      id: "welcome",
      icon: "zap",
      title: "Selamat Datang!",
      description: "Mulai eksplorasi fitur Chaesa Live",
      href: "/dashboard",
      timestamp: now,
      read: false,
    });
  }

  return notifications.sort((a, b) => b.timestamp - a.timestamp);
}

export function NotificationCenter() {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(() => {
    const notifs = generateNotifications(userId);

    try {
      const readRaw = localStorage.getItem(getReadKey(userId));
      if (readRaw) {
        const readArr = JSON.parse(readRaw);
        const readSet = new Set<string>(readArr);
        setReadIds(readSet);
        setNotifications(
          notifs.map((n) => ({ ...n, read: readSet.has(n.id) }))
        );
        return;
      }
    } catch {}

    setNotifications(notifs);
  }, [userId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    const newReadSet = new Set(allIds);
    setReadIds(newReadSet);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      localStorage.setItem(getReadKey(userId), JSON.stringify(allIds));
    } catch {}
  };

  const markRead = (id: string) => {
    const newReadSet = new Set(readIds);
    newReadSet.add(id);
    setReadIds(newReadSet);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      localStorage.setItem(
        getReadKey(userId),
        JSON.stringify(Array.from(newReadSet))
      );
    } catch {}
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="w-4.5 h-4.5 text-gray-500 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Notifikasi
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 h-auto p-1"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Tandai Semua Dibaca
            </Button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Belum ada notifikasi
            </div>
          ) : (
            notifications.map((notif) => {
              const IconComponent = ICON_MAP[notif.icon] || Zap;
              return (
                <Link
                  key={notif.id}
                  href={notif.href}
                  onClick={() => {
                    markRead(notif.id);
                    setOpen(false);
                  }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0 ${
                    !notif.read ? "bg-purple-50/50 dark:bg-purple-900/10" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      !notif.read
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        !notif.read
                          ? "font-medium text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 truncate">
                      {notif.description}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatTime(notif.timestamp)}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="mt-2 w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                  )}
                </Link>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            Lihat semua aktivitas →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
