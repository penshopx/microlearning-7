import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, X, Send, User, Bot, Loader2, HelpCircle, GripVertical, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "bot" | "support";
  text: string;
  isHelpful?: boolean;
  metadata?: any;
}

interface FeatureLink {
  label: string;
  path: string;
}

const PAGE_GREETINGS: Record<string, string> = {
  "/": "Halo Kak! Saya **Chaesa**, konsultan AI Kamu. Saya bisa membantu Kamu menemukan fitur yang tepat. Kamu di sini sebagai **Pembelajar**, **Content Creator**, atau **HRD/Trainer**?",
  "/storybook": "Halo Kak! Kamu sedang di **Storybook Visual** — belajar lewat cerita bergambar. Mau saya bantu pilihkan cerita yang cocok, atau buat cerita baru dari topik tertentu?",
  "/sertifikasi": "Halo Kak! Kamu di halaman **Ujian & Sertifikasi**. Mau buat ujian baru, ambil ujian, atau generate soal otomatis dengan AI?",
  "/sertifikat": "Halo Kak! Ini halaman **Sertifikat Digital**. Saya bisa bantu cara membuat sertifikat, memverifikasi keasliannya, atau menjelaskan cara kerjanya.",
  "/skills-matrix": "Halo Kak! Kamu di **Skills Matrix & Gap Analysis**. Mau saya bantu pilih framework kompetensi atau jelaskan cara mapping skill tim?",
  "/learning-path": "Halo Kak! Ini **Learning Path Builder**. Mau mulai dari template yang sudah jadi atau buat jalur belajar custom?",
  "/broadcast": "Halo Kak! Kamu di **Broadcast Hub**. Mau kirim WhatsApp blast, email campaign, atau generate caption AI untuk sosmed?",
  "/creator-dashboard": "Halo Kak! Ini **Dashboard Kreator**. Ada pertanyaan tentang analytics, engagement, atau strategi konten?",
  "/content-calendar": "Halo Kak! Kamu di **Content Calendar**. Perlu bantuan merencanakan jadwal konten atau tips konsistensi posting?",
  "/micro-learning": "Halo Kak! Ini halaman **Micro-Learning**. Mau buat kursus dari rekaman meeting atau belajar kursus yang tersedia?",
  "/schedule": "Halo Kak! Kamu di **Jadwal Live**. Mau buat jadwal live baru atau tanya tentang fitur meeting?",
  "/pricing": "Halo Kak! Ini halaman **Harga**. Mau saya jelaskan perbedaan paket atau bantu pilih yang paling cocok untuk kebutuhan Kamu?",
  "/ai-studio": "Halo Kak! Kamu di **AI Studio**. Mau generate kursus dari meeting, atau tanya tentang fitur AI lainnya?",
  "/dashboard": "Halo Kak! Ini **Dashboard Progress** Kamu. Di sini Kamu bisa lihat XP, pencapaian, dan progress belajar. Ada yang mau ditanyakan?",
  "/profile": "Halo Kak! Ini halaman **Profil** Kamu. Di sini Kamu bisa ubah nama, lihat status langganan, dan kelola akun. Ada yang bisa saya bantu?",
};

const PAGE_SUGGESTIONS: Record<string, string[]> = {
  "/": ["Saya mau belajar", "Saya content creator", "Untuk HRD/Training", "Fitur apa saja?"],
  "/storybook": ["Buat cerita baru", "Cerita apa saja?", "Cara kerja Storybook"],
  "/sertifikasi": ["Buat ujian baru", "AI generate soal", "Kategori ujian apa saja?"],
  "/sertifikat": ["Cara buat sertifikat", "Verifikasi sertifikat", "Format sertifikat"],
  "/skills-matrix": ["Framework apa saja?", "Cara mapping skill", "Export laporan"],
  "/learning-path": ["Template apa saja?", "Buat path custom", "Cara kerja gamifikasi"],
  "/broadcast": ["AI Caption Generator", "WhatsApp blast", "Template broadcast"],
  "/creator-dashboard": ["Tips engagement", "Strategi konten", "Fitur analytics"],
  "/content-calendar": ["Tips jadwal posting", "Cara pakai kalender", "Rencana konten"],
  "/micro-learning": ["Buat kursus baru", "Format konten", "Cara kerja AI"],
  "/schedule": ["Buat jadwal live", "Fitur meeting", "Share jadwal"],
  "/pricing": ["Paket mana yang cocok?", "Bandingkan dengan Zoom", "Daftar gratis"],
  "/ai-studio": ["Generate kursus", "Fitur AI lainnya", "Cara mulai"],
  "/dashboard": ["Cara dapat XP?", "Pencapaian apa saja?", "Fitur apa saja?"],
  "/profile": ["Ubah nama saya", "Upgrade langganan", "Reset password"],
};

function BotMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>,
        h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>,
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-1.5 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        hr: () => <hr className="my-2 border-gray-200 dark:border-gray-700" />,
        code: ({ className, children }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-gray-100 dark:bg-gray-700 text-green-600 dark:text-green-400 px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg my-1.5 overflow-x-auto">
              <code className="text-xs font-mono text-gray-800 dark:text-gray-200">{children}</code>
            </pre>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-3 border-green-500 pl-2 my-1.5 italic text-gray-600 dark:text-gray-400">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => {
          if (href && href.startsWith("/")) {
            return (
              <Link href={href} className="text-green-600 dark:text-green-400 underline hover:text-green-700 font-medium">
                {children}
              </Link>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 underline hover:text-green-700">
              {children}
            </a>
          );
        },
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-green-50 dark:bg-green-900/30">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="border-b border-gray-200 dark:border-gray-700 last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1.5 text-left font-semibold text-green-700 dark:text-green-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasGreetedRef = useRef<string>("");

  const [btnPos, setBtnPos] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragDistRef = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    setWindowSize({ w, h });
    if (btnPos.x === -1 && btnPos.y === -1) {
      setBtnPos({ x: w - 70, y: h - 90 });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWindowSize({ w, h });
      setBtnPos(prev => ({
        x: Math.min(prev.x, w - 56),
        y: Math.min(prev.y, h - 56),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const currentPath = router.pathname;
    if (hasGreetedRef.current === currentPath) return;

    const greeting = PAGE_GREETINGS[currentPath] || PAGE_GREETINGS["/"]!;
    const suggestions = PAGE_SUGGESTIONS[currentPath] || PAGE_SUGGESTIONS["/"]!;

    const welcomeMsg: Message = {
      id: "welcome_" + currentPath,
      role: "bot",
      text: greeting,
      metadata: { quickReplies: suggestions },
    };

    if (!hasGreetedRef.current) {
      setMessages([welcomeMsg]);
    } else {
      setMessages(prev => [...prev, welcomeMsg]);
    }
    hasGreetedRef.current = currentPath;
  }, [router.pathname]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragDistRef.current = 0;
    dragStartRef.current = { x: e.clientX - btnPos.x, y: e.clientY - btnPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [btnPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    const w = typeof window !== "undefined" ? window.innerWidth : 1280;
    const h = typeof window !== "undefined" ? window.innerHeight : 720;
    const clampedX = Math.max(0, Math.min(newX, w - 56));
    const clampedY = Math.max(0, Math.min(newY, h - 56));
    const dx = clampedX - btnPos.x;
    const dy = clampedY - btnPos.y;
    dragDistRef.current += Math.sqrt(dx * dx + dy * dy);
    setBtnPos({ x: clampedX, y: clampedY });
  }, [isDragging, btnPos]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (dragDistRef.current < 5) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = messages
        .filter(m => m.id !== "welcome" && (m.role === "user" || m.role === "bot"))
        .map(m => ({ role: m.role === "user" ? "user" : "bot", text: m.text }));

      const response = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatHistory,
          currentPage: router.pathname,
        })
      });

      const data = await response.json();

      const botMsg: Message = {
        id: Date.now().toString() + "_bot",
        role: "bot",
        text: data.reply || "Maaf, ada gangguan. Coba lagi ya.",
        metadata: {
          quickReplies: data.quick_replies,
          relatedArticles: data.related_articles,
          featureLinks: data.feature_links,
        }
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: "error_" + Date.now(),
        role: "bot",
        text: "Maaf, saya sedang mengalami gangguan koneksi. Silakan coba lagi nanti ya."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  const [chatPanelStyle, setChatPanelStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (windowSize.w < 768) {
      setChatPanelStyle({});
      return;
    }
    const isLeftSide = btnPos.x < windowSize.w / 2;
    if (isLeftSide) {
      setChatPanelStyle({
        left: Math.max(8, btnPos.x - 10) + "px",
        bottom: (windowSize.h - btnPos.y + 16) + "px",
        right: "auto",
      });
    } else {
      setChatPanelStyle({
        right: Math.max(8, windowSize.w - btnPos.x - 56 - 10) + "px",
        bottom: (windowSize.h - btnPos.y + 16) + "px",
        left: "auto",
      });
    }
  }, [btnPos, isOpen, windowSize]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col md:inset-auto md:w-[420px] md:h-[620px] md:rounded-2xl md:border md:border-gray-200 md:dark:border-gray-800 md:shadow-2xl overflow-hidden"
          style={chatPanelStyle}
        >
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex items-center justify-between text-white safe-area-top">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Chaesa AI Consultant</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Atentif & Proaktif
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-950" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                    msg.role === "user" ? "bg-gray-200 dark:bg-gray-700" : "bg-green-100 dark:bg-green-900/50"
                  )}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-gray-600" /> : <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />}
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className={cn(
                      "p-3 rounded-2xl text-sm shadow-sm",
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-tr-none whitespace-pre-wrap"
                        : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none"
                    )}>
                      {msg.role === "user" ? msg.text : <BotMarkdown content={msg.text} />}
                    </div>

                    {msg.metadata?.featureLinks?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {msg.metadata.featureLinks.map((link: FeatureLink) => (
                          <Link
                            key={link.path}
                            href={link.path}
                            className="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}

                    {msg.metadata?.relatedArticles?.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800/30">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Artikel Terkait:
                        </p>
                        <div className="space-y-1">
                          {msg.metadata.relatedArticles.map((article: any) => (
                            <div key={article.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-green-100 dark:border-gray-700 cursor-pointer hover:border-green-400 transition-colors">
                              {article.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.metadata?.quickReplies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {msg.metadata.quickReplies.map((reply: string) => (
                          <button
                            key={reply}
                            onClick={() => handleQuickReply(reply)}
                            className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border shadow-sm flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-gray-400 ml-1">Chaesa sedang berpikir...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 pb-safe bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tanya apapun ke Chaesa..."
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-green-500"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-[10px] text-center text-gray-400 mt-2">
              Chaesa AI Consultant — Atentif, Proaktif, Konsultatif
            </div>
          </div>
        </div>
      )}

      {!isOpen && btnPos.x >= 0 && (
        <button
          ref={btnRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={cn(
            "fixed z-50 rounded-full h-14 w-14 shadow-xl flex items-center justify-center text-white",
            "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
            "transition-shadow duration-200 select-none touch-none",
            isDragging ? "shadow-2xl scale-110 cursor-grabbing" : "cursor-grab hover:scale-105"
          )}
          style={{
            left: btnPos.x + "px",
            top: btnPos.y + "px",
          }}
        >
          <MessageSquare className="w-6 h-6 pointer-events-none" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
            <GripVertical className="w-2.5 h-2.5 text-gray-400" />
          </div>
        </button>
      )}
    </>
  );
}
