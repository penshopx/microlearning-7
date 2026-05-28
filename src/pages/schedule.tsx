import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Calendar, Clock, Plus, Share2, Copy, Check, Trash2,
  Video, Users, Link as LinkIcon, Edit2, X,
  Mail, MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface LiveSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  meetingCode: string;
  status: "upcoming" | "live" | "ended";
  maxParticipants: number;
  createdAt: string;
}

function generateMeetingCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 3; i++) {
    if (i > 0) code += "-";
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
}

function getSessionStatus(date: string, time: string, duration: number): "upcoming" | "live" | "ended" {
  const sessionStart = new Date(`${date}T${time}`);
  const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
  const now = new Date();

  if (now < sessionStart) return "upcoming";
  if (now >= sessionStart && now <= sessionEnd) return "live";
  return "ended";
}

export default function SchedulePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: 60,
    maxParticipants: 100,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("chaesa_live_sessions");
    if (stored) {
      try {
        const parsed: LiveSession[] = JSON.parse(stored);
        const updated = parsed.map(s => ({
          ...s,
          status: getSessionStatus(s.date, s.time, s.duration)
        }));
        setSessions(updated);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("chaesa_live_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const handleCreate = () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast({ title: "Lengkapi data", description: "Judul, tanggal, dan waktu wajib diisi", variant: "destructive" });
      return;
    }

    const newSession: LiveSession = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      duration: formData.duration,
      meetingCode: generateMeetingCode(),
      status: "upcoming",
      maxParticipants: formData.maxParticipants,
      createdAt: new Date().toISOString(),
    };

    setSessions(prev => [newSession, ...prev]);
    setFormData({ title: "", description: "", date: "", time: "", duration: 60, maxParticipants: 100 });
    setShowCreateForm(false);
    toast({ title: "Jadwal dibuat!", description: `Live "${newSession.title}" berhasil dijadwalkan` });
  };

  const handleUpdate = (id: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, ...formData, status: getSessionStatus(formData.date, formData.time, formData.duration) };
      }
      return s;
    }));
    setEditingId(null);
    setFormData({ title: "", description: "", date: "", time: "", duration: 60, maxParticipants: 100 });
    toast({ title: "Jadwal diperbarui!" });
  };

  const handleDelete = (id: string) => {
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem("chaesa_live_sessions");
      } else {
        localStorage.setItem("chaesa_live_sessions", JSON.stringify(updated));
      }
      return updated;
    });
    toast({ title: "Jadwal dihapus" });
  };

  const handleEdit = (session: LiveSession) => {
    setEditingId(session.id);
    setFormData({
      title: session.title,
      description: session.description,
      date: session.date,
      time: session.time,
      duration: session.duration,
      maxParticipants: session.maxParticipants,
    });
    setShowCreateForm(true);
  };

  const getShareLink = (session: LiveSession) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/meeting/${session.meetingCode}`;
  };

  const copyLink = (session: LiveSession) => {
    navigator.clipboard.writeText(getShareLink(session));
    setCopiedId(session.id);
    toast({ title: "Link disalin!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareViaWhatsApp = (session: LiveSession) => {
    const text = `🎬 *${session.title}*\n\n📅 ${formatDate(session.date)} pukul ${session.time} WIB\n⏱️ Durasi: ${session.duration} menit\n${session.description ? `\n📝 ${session.description}\n` : ""}\n🔗 Join di sini:\n${getShareLink(session)}\n\nKode Meeting: ${session.meetingCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareViaEmail = (session: LiveSession) => {
    const subject = `Undangan Live: ${session.title}`;
    const body = `Halo!\n\nKamu diundang untuk bergabung di sesi live:\n\n📌 ${session.title}\n📅 ${formatDate(session.date)} pukul ${session.time} WIB\n⏱️ Durasi: ${session.duration} menit\n${session.description ? `\n${session.description}\n` : ""}\n🔗 Link: ${getShareLink(session)}\n📋 Kode Meeting: ${session.meetingCode}\n\nSampai jumpa!`;
    window.open(`mailto:${inviteEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setInviteEmail("");
    setShowShareModal(null);
  };

  const copyInviteText = (session: LiveSession) => {
    const text = `🎬 ${session.title}\n📅 ${formatDate(session.date)} pukul ${session.time} WIB\n⏱️ Durasi: ${session.duration} menit\n${session.description ? `📝 ${session.description}\n` : ""}🔗 Join: ${getShareLink(session)}\nKode: ${session.meetingCode}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Teks undangan disalin!" });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge className="bg-red-500 text-white animate-pulse">LIVE</Badge>;
      case "upcoming":
        return <Badge className="bg-blue-500 text-white">Akan Datang</Badge>;
      case "ended":
        return <Badge variant="secondary">Selesai</Badge>;
    }
  };

  const upcomingSessions = sessions.filter(s => s.status === "upcoming" || s.status === "live");
  const pastSessions = sessions.filter(s => s.status === "ended");

  return (
    <>
      <SEO title="Jadwal Live - Chaesa Live" description="Atur jadwal sesi live Kamu dan undang peserta" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Jadwal Live" icon={Calendar} />

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Jadwal Sesi Live</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Buat jadwal, bagikan link, dan undang peserta</p>
            </div>
            {!showCreateForm && (
              <Button onClick={() => { setShowCreateForm(true); setEditingId(null); setFormData({ title: "", description: "", date: "", time: "", duration: 60, maxParticipants: 100 }); }} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Plus className="w-4 h-4 mr-2" /> Buat Jadwal
              </Button>
            )}
          </div>

          {showCreateForm && (
            <Card className="p-6 mb-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingId ? "Edit Jadwal" : "Buat Jadwal Baru"}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => { setShowCreateForm(false); setEditingId(null); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Judul Sesi Live *</label>
                  <Input
                    placeholder="Contoh: Workshop AI Course Factory"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Deskripsi</label>
                  <textarea
                    placeholder="Deskripsikan sesi live ini..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-h-[80px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tanggal *</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Waktu (WIB) *</label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Durasi (menit)</label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value={30}>30 menit</option>
                      <option value={60}>60 menit</option>
                      <option value={90}>90 menit</option>
                      <option value={120}>120 menit</option>
                      <option value={180}>180 menit</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Maks Peserta</label>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) || 100 }))}
                      className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => editingId ? handleUpdate(editingId) : handleCreate()} className="bg-green-600 hover:bg-green-700">
                    {editingId ? "Simpan Perubahan" : "Buat Jadwal"}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCreateForm(false); setEditingId(null); }} className="border-gray-300 dark:border-gray-700">
                    Batal
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {sessions.length === 0 && !showCreateForm && (
            <Card className="p-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada jadwal live</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Buat jadwal pertama Kamu dan undang peserta</p>
              <Button onClick={() => setShowCreateForm(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" /> Buat Jadwal Pertama
              </Button>
            </Card>
          )}

          {upcomingSessions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Akan Datang ({upcomingSessions.length})
              </h3>
              <div className="space-y-4">
                {upcomingSessions.map(session => (
                  <Card key={session.id} className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {statusBadge(session.status)}
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{session.title}</h4>
                        </div>
                        {session.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{session.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {formatDate(session.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {session.time} WIB
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> Maks {session.maxParticipants}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-gray-700 dark:text-gray-300">
                            {session.meetingCode}
                          </code>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {session.status === "live" ? (
                          <Link href={`/meeting/${session.meetingCode}`}>
                            <Button size="sm" className="bg-red-500 hover:bg-red-600 w-full">
                              <Video className="w-4 h-4 mr-1" /> Masuk
                            </Button>
                          </Link>
                        ) : (
                          <Link href={`/meeting/${session.meetingCode}`}>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 w-full">
                              <Video className="w-4 h-4 mr-1" /> Mulai
                            </Button>
                          </Link>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setShowShareModal(session.id)} className="border-gray-300 dark:border-gray-700">
                          <Share2 className="w-4 h-4 mr-1" /> Bagikan
                        </Button>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(session)} className="h-8 w-8">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(session.id)} className="h-8 w-8 text-red-500 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {showShareModal === session.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-3">Bagikan & Undang Peserta</h5>

                        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate flex-1">{getShareLink(session)}</span>
                          <Button size="sm" variant="ghost" onClick={() => copyLink(session)}>
                            {copiedId === session.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>

                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Undang via Email</label>
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              placeholder="email@contoh.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && inviteEmail.trim()) {
                                  shareViaEmail(session);
                                }
                              }}
                              className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => shareViaEmail(session)}
                              disabled={!inviteEmail.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Mail className="w-4 h-4 mr-1" /> Kirim
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Tekan Enter atau klik Kirim untuk membuka email client</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                          <Button variant="outline" size="sm" onClick={() => shareViaWhatsApp(session)} className="border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20">
                            <MessageSquare className="w-4 h-4 mr-1" /> Bagikan via WhatsApp
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyInviteText(session)} className="border-gray-300 dark:border-gray-700">
                            <Copy className="w-4 h-4 mr-1" /> Salin Teks Undangan
                          </Button>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => { setShowShareModal(null); setInviteEmail(""); }} className="text-gray-500">
                          Tutup
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                Selesai ({pastSessions.length})
              </h3>
              <div className="space-y-3">
                {pastSessions.map(session => (
                  <Card key={session.id} className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(session.status)}
                          <h4 className="font-medium text-gray-700 dark:text-gray-300">{session.title}</h4>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(session.date)} • {session.time} WIB • {session.duration} menit
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(session.id)} className="h-8 w-8 text-red-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
