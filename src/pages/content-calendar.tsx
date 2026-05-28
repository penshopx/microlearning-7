import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Video,
  X, Edit2, Trash2, Radio, FileText, Clock
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

type EntryType = "live" | "broadcast" | "content";

interface CalendarEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: EntryType;
  createdAt: string;
}

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  meetingCode: string;
  status: string;
  maxParticipants: number;
  createdAt: string;
}

const TYPE_CONFIG: Record<EntryType, { label: string; color: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; icon: typeof Video }> = {
  live: {
    label: "Live Session",
    color: "green",
    bgClass: "bg-green-100 dark:bg-green-900/30",
    textClass: "text-green-700 dark:text-green-300",
    borderClass: "border-green-300 dark:border-green-700",
    dotClass: "bg-green-500",
    icon: Video,
  },
  broadcast: {
    label: "Broadcast",
    color: "blue",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-300 dark:border-blue-700",
    dotClass: "bg-blue-500",
    icon: Radio,
  },
  content: {
    label: "Content",
    color: "purple",
    bgClass: "bg-purple-100 dark:bg-purple-900/30",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-300 dark:border-purple-700",
    dotClass: "bg-purple-500",
    icon: FileText,
  },
};

const STORAGE_KEY = "chaesa_content_calendar";
const LIVE_SESSIONS_KEY = "chaesa_live_sessions";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function ContentCalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "content" as EntryType,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setEntries(JSON.parse(stored));
    } catch {}
    try {
      const stored = localStorage.getItem(LIVE_SESSIONS_KEY);
      if (stored) setLiveSessions(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const allEvents = useMemo(() => {
    const liveEvents: CalendarEntry[] = liveSessions.map((s) => ({
      id: `live-${s.id}`,
      title: s.title,
      description: s.description || "",
      date: s.date,
      time: s.time,
      type: "live" as EntryType,
      createdAt: s.createdAt,
    }));
    return [...entries, ...liveEvents];
  }, [entries, liveSessions]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    allEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [allEvents]);

  const handleSave = () => {
    if (!formData.title || !formData.date) {
      toast({ title: "Lengkapi data", description: "Judul dan tanggal wajib diisi", variant: "destructive" });
      return;
    }

    if (editingId) {
      setEntries((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...formData } : e)));
      toast({ title: "Entri diperbarui!" });
    } else {
      const newEntry: CalendarEntry = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, newEntry]);
      toast({ title: "Entri ditambahkan!" });
    }

    resetForm();
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast({ title: "Entri dihapus" });
  };

  const handleEdit = (entry: CalendarEntry) => {
    setEditingId(entry.id);
    setFormData({
      title: entry.title,
      description: entry.description,
      date: entry.date,
      time: entry.time,
      type: entry.type,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ title: "", description: "", date: "", time: "", type: "content" });
  };

  const openFormForDate = (dateStr: string) => {
    setFormData({ title: "", description: "", date: dateStr, time: "", type: "content" });
    setEditingId(null);
    setShowForm(true);
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const prevWeek = () => {
    setCurrentWeekStart((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() - 7);
      return nd;
    });
  };

  const nextWeek = () => {
    setCurrentWeekStart((d) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + 7);
      return nd;
    });
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    setCurrentWeekStart(d);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentWeekStart]);

  const formatDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const dateToStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  const renderEventDots = (dateStr: string) => {
    const events = eventsByDate[dateStr];
    if (!events || events.length === 0) return null;
    const types = Array.from(new Set(events.map((e) => e.type)));
    return (
      <div className="flex gap-0.5 justify-center mt-0.5">
        {types.map((t) => (
          <div key={t} className={`w-1.5 h-1.5 rounded-full ${TYPE_CONFIG[t].dotClass}`} />
        ))}
      </div>
    );
  };

  const renderEventBadges = (dateStr: string, limit = 2) => {
    const events = eventsByDate[dateStr];
    if (!events || events.length === 0) return null;
    return (
      <div className="mt-1 space-y-0.5">
        {events.slice(0, limit).map((e) => {
          const cfg = TYPE_CONFIG[e.type];
          return (
            <div
              key={e.id}
              className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${cfg.bgClass} ${cfg.textClass} cursor-pointer`}
              onClick={(ev) => {
                ev.stopPropagation();
                setSelectedDate(dateStr);
              }}
            >
              {e.title}
            </div>
          );
        })}
        {events.length > limit && (
          <div className="text-[10px] text-gray-400">+{events.length - limit} lagi</div>
        )}
      </div>
    );
  };

  return (
    <>
      <SEO title="Content Calendar - Chaesa Live" description="Kalender konten untuk mengatur jadwal live, broadcast, dan publikasi konten" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Content Calendar" icon={Calendar} />

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Content Calendar</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Atur jadwal live, broadcast, dan konten di satu tempat</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("month")}
              >
                Bulan
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("week")}
              >
                Minggu
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                  setFormData({ title: "", description: "", date: "", time: "", type: "content" });
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            {(Object.entries(TYPE_CONFIG) as [EntryType, typeof TYPE_CONFIG["live"]][]).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <div className={`w-3 h-3 rounded-full ${cfg.dotClass}`} />
                <span>{cfg.label}</span>
              </div>
            ))}
          </div>

          {showForm && (
            <Card className="p-6 mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingId ? "Edit Entri" : "Tambah Entri Baru"}
                </h3>
                <Button variant="ghost" size="icon" onClick={resetForm}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Judul *</label>
                  <Input
                    placeholder="Judul konten atau acara"
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Deskripsi</label>
                  <textarea
                    placeholder="Deskripsi singkat..."
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-h-[60px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tanggal *</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Waktu</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tipe</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as EntryType }))}
                      className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="content">Content</option>
                      <option value="broadcast">Broadcast</option>
                      <option value="live">Live Session</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
                    {editingId ? "Simpan Perubahan" : "Tambah Entri"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="border-gray-300 dark:border-gray-700">
                    Batal
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                {viewMode === "month" ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {MONTH_NAMES[currentMonth]} {currentYear}
                        </h3>
                        <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
                          Hari Ini
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7">
                      {DAY_NAMES.map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2 border-b border-gray-100 dark:border-gray-800">
                          {d}
                        </div>
                      ))}
                      {calendarDays.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50" />;
                        }
                        const dateStr = formatDateStr(currentYear, currentMonth, day);
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const hasEvents = !!eventsByDate[dateStr];

                        return (
                          <div
                            key={dateStr}
                            className={`min-h-[80px] p-1 border-b border-r border-gray-100 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSelected ? "bg-purple-50 dark:bg-purple-900/20" : ""}`}
                            onClick={() => setSelectedDate(dateStr)}
                            onDoubleClick={() => openFormForDate(dateStr)}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                                  isToday
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {day}
                              </span>
                              {hasEvents && (
                                <button
                                  className="text-gray-400 hover:text-purple-500 p-0.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFormForDate(dateStr);
                                  }}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {renderEventBadges(dateStr)}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <Button variant="ghost" size="icon" onClick={prevWeek}>
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {weekDays[0].toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {weekDays[6].toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </h3>
                        <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
                          Hari Ini
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={nextWeek}>
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7">
                      {weekDays.map((d) => {
                        const dateStr = dateToStr(d);
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const events = eventsByDate[dateStr] || [];

                        return (
                          <div
                            key={dateStr}
                            className={`min-h-[200px] p-2 border-r border-gray-100 dark:border-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSelected ? "bg-purple-50 dark:bg-purple-900/20" : ""}`}
                            onClick={() => setSelectedDate(dateStr)}
                            onDoubleClick={() => openFormForDate(dateStr)}
                          >
                            <div className="text-center mb-2">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {DAY_NAMES[d.getDay()]}
                              </div>
                              <div
                                className={`text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${
                                  isToday
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {d.getDate()}
                              </div>
                            </div>
                            <div className="space-y-1">
                              {events.map((e) => {
                                const cfg = TYPE_CONFIG[e.type];
                                return (
                                  <div
                                    key={e.id}
                                    className={`text-xs px-1.5 py-1 rounded ${cfg.bgClass} ${cfg.textClass} truncate cursor-pointer`}
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      setSelectedDate(dateStr);
                                    }}
                                  >
                                    {e.time && <span className="font-medium">{e.time} </span>}
                                    {e.title}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {selectedDate ? formatDisplayDate(selectedDate) : "Pilih tanggal"}
                  </h3>
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openFormForDate(selectedDate)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {!selectedDate && (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Klik tanggal di kalender untuk melihat detail</p>
                  </div>
                )}

                {selectedDate && selectedDateEvents.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400 mb-3">Tidak ada acara di tanggal ini</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openFormForDate(selectedDate)}
                      className="border-gray-300 dark:border-gray-700"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Tambah
                    </Button>
                  </div>
                )}

                {selectedDate && selectedDateEvents.length > 0 && (
                  <div className="space-y-3">
                    {selectedDateEvents.map((e) => {
                      const cfg = TYPE_CONFIG[e.type];
                      const isLiveImported = e.id.startsWith("live-");
                      return (
                        <div
                          key={e.id}
                          className={`p-3 rounded-lg border ${cfg.borderClass} ${cfg.bgClass}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <cfg.icon className={`w-3.5 h-3.5 ${cfg.textClass}`} />
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.textClass} ${cfg.borderClass}`}>
                                  {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.title}</p>
                              {e.time && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" /> {e.time}
                                </p>
                              )}
                              {e.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{e.description}</p>
                              )}
                            </div>
                            {!isLiveImported && (
                              <div className="flex gap-1 shrink-0">
                                <button
                                  className="p-1 text-gray-400 hover:text-purple-500"
                                  onClick={() => handleEdit(e)}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  className="p-1 text-gray-400 hover:text-red-500"
                                  onClick={() => handleDelete(e.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 mt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Acara Mendatang</h3>
                {(() => {
                  const upcoming = allEvents
                    .filter((e) => e.date >= todayStr)
                    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
                    .slice(0, 5);

                  if (upcoming.length === 0) {
                    return <p className="text-sm text-gray-400">Tidak ada acara mendatang</p>;
                  }

                  return (
                    <div className="space-y-2">
                      {upcoming.map((e) => {
                        const cfg = TYPE_CONFIG[e.type];
                        return (
                          <div
                            key={e.id}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => setSelectedDate(e.date)}
                          >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotClass}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-900 dark:text-white truncate">{e.title}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(e.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                {e.time ? ` · ${e.time}` : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
