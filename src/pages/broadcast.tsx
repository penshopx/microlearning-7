import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import {
  Send, MessageSquare, Mail, Share2,
  Plus, Trash2, Upload, Clock, X, Copy, Check,
  Instagram, Youtube, Linkedin, Twitter, Facebook,
  FileText, Megaphone, CalendarDays, Users, Hash,
  Sparkles, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface BroadcastTemplate {
  id: string;
  name: string;
  category: "promo" | "event" | "content" | "reminder";
  subject: string;
  body: string;
  hashtags: string[];
}

const DEFAULT_TEMPLATES: BroadcastTemplate[] = [
  {
    id: "promo-1",
    name: "Promo Diskon",
    category: "promo",
    subject: "🔥 Diskon Spesial Hanya Hari Ini!",
    body: "Hai! Ada penawaran spesial buat kamu 🎉\n\nDapatkan DISKON 50% untuk semua kursus premium kami!\n\n✅ Akses seumur hidup\n✅ Sertifikat resmi\n✅ Bonus materi eksklusif\n\nGunakan kode: SPECIAL50\n\n⏰ Berlaku hanya sampai malam ini!\n\nJangan sampai ketinggalan ya! 🚀",
    hashtags: ["promo", "diskon", "belajar", "kursus", "edukasi"]
  },
  {
    id: "event-1",
    name: "Undangan Event Live",
    category: "event",
    subject: "🎬 Undangan Live Session Eksklusif",
    body: "Halo! Kamu diundang untuk hadir di sesi live eksklusif kami 🎬\n\n📌 Topik: [Judul Topik]\n📅 Tanggal: [Tanggal]\n⏰ Waktu: [Waktu] WIB\n👤 Pembicara: [Nama Pembicara]\n\nYang akan kamu pelajari:\n• Strategi terbaru di industri\n• Tips & trick dari praktisi\n• Sesi Q&A langsung\n\n🔗 Link bergabung: [Link Meeting]\n\nSlot terbatas, daftar sekarang! 🎯",
    hashtags: ["live", "webinar", "event", "belajar", "workshop"]
  },
  {
    id: "content-1",
    name: "Konten Baru",
    category: "content",
    subject: "🆕 Konten Baru Sudah Tersedia!",
    body: "Hai! Ada konten baru yang sudah bisa kamu akses 📚\n\n🎬 [Judul Konten]\n\nDi konten ini kamu akan belajar:\n✅ [Point 1]\n✅ [Point 2]\n✅ [Point 3]\n\nKonten ini cocok untuk:\n👉 Pemula yang ingin mulai belajar\n👉 Profesional yang ingin upgrade skill\n\n🔗 Tonton sekarang: [Link]\n\nJangan lupa share ke teman yang butuh! 🙌",
    hashtags: ["konten", "baru", "belajar", "skill", "tutorial"]
  },
  {
    id: "reminder-1",
    name: "Reminder Event",
    category: "reminder",
    subject: "⏰ Reminder: Sesi Live Dimulai Sebentar Lagi!",
    body: "Hai! Jangan lupa, sesi live kita dimulai dalam 30 menit! ⏰\n\n📌 [Judul Sesi]\n⏰ Mulai: [Waktu] WIB\n\n🔗 Link bergabung: [Link Meeting]\n📋 Kode Meeting: [Kode]\n\nPastikan:\n✅ Koneksi internet stabil\n✅ Audio & video siap\n✅ Siapkan pertanyaan untuk Q&A\n\nSampai jumpa di sesi live! 🎬",
    hashtags: ["reminder", "live", "janganlupa", "segera"]
  }
];

const PLATFORM_CONFIGS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-pink-500 to-purple-500", charLimit: 2200 },
  { id: "tiktok", name: "TikTok", icon: Hash, color: "from-gray-800 to-gray-900", charLimit: 2200 },
  { id: "youtube", name: "YouTube", icon: Youtube, color: "from-red-500 to-red-600", charLimit: 5000 },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "from-blue-600 to-blue-700", charLimit: 3000 },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "from-sky-400 to-sky-500", charLimit: 280 },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "from-blue-500 to-blue-600", charLimit: 63206 },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  promo: { label: "Promo", color: "bg-orange-500" },
  event: { label: "Event", color: "bg-blue-500" },
  content: { label: "Konten Baru", color: "bg-purple-500" },
  reminder: { label: "Reminder", color: "bg-yellow-500" },
};

export default function BroadcastPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "templates" | "audience">("compose");
  const [channel, setChannel] = useState<"whatsapp" | "email" | "social">("whatsapp");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });
  const [csvText, setCsvText] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiPlatform, setAiPlatform] = useState("instagram");
  const [aiTone, setAiTone] = useState("fun");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("chaesa_broadcast_contacts");
    if (stored) {
      try {
        setContacts(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (contacts.length > 0) {
      localStorage.setItem("chaesa_broadcast_contacts", JSON.stringify(contacts));
    }
  }, [contacts]);

  const generateAICaption = async () => {
    if (!aiTopic.trim()) {
      toast({ title: "Tulis topik dulu", description: "Masukkan topik konten untuk generate caption", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, platform: aiPlatform, tone: aiTone }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.caption || "");
        setHashtags((data.hashtags || []).map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" "));
        toast({ title: "Caption berhasil dibuat!", description: `Platform: ${aiPlatform} | Waktu posting terbaik: ${data.bestPostingTime || "-"}` });
      } else {
        toast({ title: "Gagal generate", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Gagal menghubungi AI", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const addContact = () => {
    if (!newContact.name.trim()) {
      toast({ title: "Nama wajib diisi", variant: "destructive" });
      return;
    }
    if (!newContact.phone.trim() && !newContact.email.trim()) {
      toast({ title: "Isi minimal nomor HP atau email", variant: "destructive" });
      return;
    }
    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
    };
    setContacts(prev => [...prev, contact]);
    setNewContact({ name: "", phone: "", email: "" });
    toast({ title: "Kontak ditambahkan!" });
  };

  const removeContact = (id: string) => {
    setContacts(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (updated.length === 0) {
        localStorage.removeItem("chaesa_broadcast_contacts");
      }
      return updated;
    });
    setSelectedContacts(prev => prev.filter(sid => sid !== id));
  };

  const importCsv = () => {
    if (!csvText.trim()) {
      toast({ title: "Teks CSV kosong", variant: "destructive" });
      return;
    }
    const lines = csvText.trim().split("\n");
    let imported = 0;
    const newContacts: Contact[] = [];
    for (const line of lines) {
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 2) {
        newContacts.push({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          name: parts[0] || "",
          phone: parts[1] || "",
          email: parts[2] || "",
        });
        imported++;
      }
    }
    if (imported > 0) {
      setContacts(prev => [...prev, ...newContacts]);
      setCsvText("");
      setShowCsvImport(false);
      toast({ title: `${imported} kontak berhasil diimpor!` });
    } else {
      toast({ title: "Format CSV tidak valid", description: "Gunakan format: Nama,NoHP,Email", variant: "destructive" });
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const applyTemplate = (template: BroadcastTemplate) => {
    setSubject(template.subject);
    setMessage(template.body);
    setHashtags(template.hashtags.map(h => `#${h}`).join(" "));
    setActiveTab("compose");
    toast({ title: "Template diterapkan!", description: `Template "${template.name}" siap diedit` });
  };

  const getFullMessage = () => {
    let full = message;
    if (hashtags.trim()) {
      full += "\n\n" + hashtags;
    }
    return full;
  };

  const sendWhatsAppBlast = () => {
    const targetContacts = selectedContacts.length > 0
      ? contacts.filter(c => selectedContacts.includes(c.id) && c.phone)
      : contacts.filter(c => c.phone);

    if (targetContacts.length === 0 && !message.trim()) {
      toast({ title: "Tulis pesan terlebih dahulu", variant: "destructive" });
      return;
    }

    const text = getFullMessage();

    if (targetContacts.length > 0) {
      const phone = targetContacts[0].phone.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
      if (targetContacts.length > 1) {
        toast({
          title: "WhatsApp dibuka untuk kontak pertama",
          description: `Ulangi untuk ${targetContacts.length - 1} kontak lainnya. Salin pesan untuk kirim manual.`,
        });
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const sendEmailCampaign = () => {
    const targetContacts = selectedContacts.length > 0
      ? contacts.filter(c => selectedContacts.includes(c.id) && c.email)
      : contacts.filter(c => c.email);

    const emails = targetContacts.map(c => c.email).join(",");
    const body = getFullMessage();

    window.open(
      `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank"
    );
    toast({ title: "Email client dibuka!" });
  };

  const copyForPlatform = (platformId: string) => {
    const text = getFullMessage();
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platformId);
    toast({ title: `Caption disalin untuk ${PLATFORM_CONFIGS.find(p => p.id === platformId)?.name}!` });
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  const shareToSocialMedia = (platformId: string) => {
    const text = encodeURIComponent(getFullMessage());
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?quote=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "")}&summary=${text}`,
    };

    if (urls[platformId]) {
      window.open(urls[platformId], "_blank");
    } else {
      copyForPlatform(platformId);
    }
  };

  return (
    <>
      <SEO title="Broadcast Hub - Chaesa Live" description="Kirim broadcast multi-channel: WhatsApp, Email, dan Social Media" />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageHeader title="Broadcast Hub" icon={Megaphone} />

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-purple-500" />
              Broadcast Hub
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Kirim pesan ke banyak orang sekaligus melalui WhatsApp, Email, dan Social Media</p>
          </div>

          <div className="flex gap-2 mb-6">
            {[
              { key: "compose" as const, label: "Compose", icon: Send },
              { key: "templates" as const, label: "Template", icon: FileText },
              { key: "audience" as const, label: "Audience", icon: Users },
            ].map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                onClick={() => setActiveTab(tab.key)}
                className={activeTab === tab.key ? "bg-purple-600 hover:bg-purple-700" : "border-gray-300 dark:border-gray-700"}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            ))}
          </div>

          {activeTab === "compose" && (
            <div className="space-y-6">
              <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pilih Channel</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "whatsapp" as const, label: "WhatsApp Blast", icon: MessageSquare, gradient: "from-green-500 to-green-600" },
                    { key: "email" as const, label: "Email Campaign", icon: Mail, gradient: "from-blue-500 to-blue-600" },
                    { key: "social" as const, label: "Social Media", icon: Share2, gradient: "from-purple-500 to-pink-500" },
                  ].map(ch => (
                    <button
                      key={ch.key}
                      onClick={() => setChannel(ch.key)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        channel === ch.key
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${ch.gradient} flex items-center justify-center mb-2`}>
                        <ch.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{ch.label}</div>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {channel === "whatsapp" && "Compose WhatsApp Blast"}
                  {channel === "email" && "Compose Email Campaign"}
                  {channel === "social" && "Compose Social Media Post"}
                </h3>

                <div className="space-y-4">
                  {channel === "email" && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Subject Email</label>
                      <Input
                        placeholder="Contoh: 🔥 Diskon 50% Hanya Hari Ini!"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      {channel === "whatsapp" ? "Pesan WhatsApp" : channel === "email" ? "Body Email" : "Caption"}
                    </label>
                    <textarea
                      placeholder={
                        channel === "whatsapp"
                          ? "Tulis pesan broadcast WhatsApp..."
                          : channel === "email"
                          ? "Tulis konten email..."
                          : "Tulis caption untuk social media..."
                      }
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-h-[200px] resize-y"
                    />
                    <div className="text-xs text-gray-400 mt-1 text-right">{message.length} karakter</div>
                  </div>

                  {(channel === "social" || channel === "whatsapp") && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                        <Hash className="w-4 h-4 inline mr-1" />
                        Hashtags
                      </label>
                      <Input
                        placeholder="#marketing #konten #kreator #live"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  )}

                  {channel === "social" && (
                    <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Caption Generator</h4>
                      </div>
                      <Input
                        placeholder="Topik konten, misal: tips jualan online..."
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={aiPlatform}
                          onChange={(e) => setAiPlatform(e.target.value)}
                          className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="youtube">YouTube</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="twitter">Twitter/X</option>
                        </select>
                        <select
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value)}
                          className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                          <option value="fun">Fun & Santai</option>
                          <option value="professional">Profesional</option>
                          <option value="viral">Viral & Catchy</option>
                        </select>
                      </div>
                      <Button
                        onClick={generateAICaption}
                        disabled={isGenerating || !aiTopic.trim()}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {isGenerating ? (
                          <><span className="animate-spin mr-2">⏳</span> Generating...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> Generate Caption AI</>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSchedule(!showSchedule)}
                      className="border-gray-300 dark:border-gray-700"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      {showSchedule ? "Sembunyikan Jadwal" : "Jadwalkan Broadcast"}
                    </Button>
                  </div>

                  {showSchedule && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Tanggal</label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Waktu (WIB)</label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                        />
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-gray-400">
                          <CalendarDays className="w-3 h-3 inline mr-1" />
                          Broadcast akan dikirim sesuai jadwal yang ditentukan
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {channel === "whatsapp" && (
                <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kirim WhatsApp Blast</h3>
                  {selectedContacts.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {selectedContacts.length} kontak dipilih dari daftar audience
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button onClick={sendWhatsAppBlast} className="bg-green-600 hover:bg-green-700" disabled={!message.trim()}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Kirim via WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(getFullMessage()); toast({ title: "Pesan disalin!" }); }} className="border-gray-300 dark:border-gray-700">
                      <Copy className="w-4 h-4 mr-2" /> Salin Pesan
                    </Button>
                  </div>
                </Card>
              )}

              {channel === "email" && (
                <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kirim Email Campaign</h3>
                  {selectedContacts.length > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {selectedContacts.filter(id => contacts.find(c => c.id === id)?.email).length} email terpilih
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button onClick={sendEmailCampaign} className="bg-blue-600 hover:bg-blue-700" disabled={!message.trim() || !subject.trim()}>
                      <Mail className="w-4 h-4 mr-2" /> Buka Email Client
                    </Button>
                    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(getFullMessage()); toast({ title: "Body email disalin!" }); }} className="border-gray-300 dark:border-gray-700">
                      <Copy className="w-4 h-4 mr-2" /> Salin Body
                    </Button>
                  </div>
                </Card>
              )}

              {channel === "social" && (
                <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share ke Social Media</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Klik platform untuk share langsung atau salin caption yang sudah siap pakai
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {PLATFORM_CONFIGS.map(platform => (
                      <div key={platform.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                            <platform.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{platform.name}</span>
                        </div>
                        <div className="text-xs text-gray-400 mb-3">
                          Maks {platform.charLimit} karakter
                          {message.length > platform.charLimit && (
                            <span className="text-red-400 ml-1">({message.length - platform.charLimit} lebih)</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyForPlatform(platform.id)}
                            className="flex-1 text-xs border-gray-300 dark:border-gray-700"
                          >
                            {copiedPlatform === platform.id ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                            Salin
                          </Button>
                          {["twitter", "facebook", "linkedin"].includes(platform.id) && (
                            <Button
                              size="sm"
                              onClick={() => shareToSocialMedia(platform.id)}
                              className={`flex-1 text-xs bg-gradient-to-r ${platform.color} text-white`}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" /> Share
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "templates" && (
            <div className="space-y-4">
              <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Template Library</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Pilih template siap pakai untuk broadcast kamu</p>

                <div className="space-y-3">
                  {DEFAULT_TEMPLATES.map(template => {
                    const cat = CATEGORY_LABELS[template.category];
                    return (
                      <div
                        key={template.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={`${cat.color} text-white text-xs`}>{cat.label}</Badge>
                            <span className="font-medium text-gray-900 dark:text-white">{template.name}</span>
                          </div>
                          {expandedTemplate === template.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        {expandedTemplate === template.id && (
                          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
                            <div className="mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Subject:</span>
                              <p className="text-sm text-gray-900 dark:text-white">{template.subject}</p>
                            </div>
                            <div className="mb-3">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Preview:</span>
                              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mt-1 max-h-48 overflow-y-auto">
                                {template.body}
                              </pre>
                            </div>
                            <div className="mb-3 flex flex-wrap gap-1">
                              {template.hashtags.map(h => (
                                <Badge key={h} variant="secondary" className="text-xs">#{h}</Badge>
                              ))}
                            </div>
                            <Button size="sm" onClick={() => applyTemplate(template)} className="bg-purple-600 hover:bg-purple-700">
                              <Sparkles className="w-4 h-4 mr-1" /> Gunakan Template
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "audience" && (
            <div className="space-y-6">
              <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tambah Kontak</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <Input
                    placeholder="Nama *"
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                  <Input
                    placeholder="No. HP (628xxx)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                  <Input
                    placeholder="Email"
                    value={newContact.email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={addContact} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Tambah Kontak
                  </Button>
                  <Button variant="outline" onClick={() => setShowCsvImport(!showCsvImport)} className="border-gray-300 dark:border-gray-700">
                    <Upload className="w-4 h-4 mr-2" /> Import CSV
                  </Button>
                </div>

                {showCsvImport && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Paste data CSV (format: Nama,NoHP,Email per baris)
                    </label>
                    <textarea
                      placeholder={"Budi,6281234567890,budi@email.com\nAni,6289876543210,ani@email.com"}
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 text-sm min-h-[100px] resize-y mb-3"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={importCsv} className="bg-green-600 hover:bg-green-700">
                        <Upload className="w-4 h-4 mr-1" /> Import
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowCsvImport(false)} className="border-gray-300 dark:border-gray-700">
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Daftar Kontak ({contacts.length})
                  </h3>
                  {contacts.length > 0 && (
                    <Button variant="outline" size="sm" onClick={selectAllContacts} className="border-gray-300 dark:border-gray-700">
                      {selectedContacts.length === contacts.length ? "Batal Pilih Semua" : "Pilih Semua"}
                    </Button>
                  )}
                </div>

                {contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Belum ada kontak. Tambahkan kontak atau import dari CSV.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {contacts.map(contact => (
                      <div
                        key={contact.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          selectedContacts.includes(contact.id)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <button
                          onClick={() => toggleSelectContact(contact.id)}
                          className="flex items-center gap-3 flex-1 text-left"
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedContacts.includes(contact.id)
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}>
                            {selectedContacts.includes(contact.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">{contact.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.phone && <span className="mr-3">📱 {contact.phone}</span>}
                              {contact.email && <span>✉️ {contact.email}</span>}
                            </div>
                          </div>
                        </button>
                        <Button size="icon" variant="ghost" onClick={() => removeContact(contact.id)} className="h-8 w-8 text-red-500 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {selectedContacts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                      {selectedContacts.length} kontak dipilih — buka tab Compose untuk kirim broadcast
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
