import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { 
  Video, Users, Lock, Share2, Award, MessageSquare, 
  Mic, MonitorPlay, Shield, Sparkles, ArrowRight, 
  Zap, TrendingUp, DollarSign, Clock, CheckCircle,
  Star, PlayCircle, Rocket, Brain, Target, Gift, Menu
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "@/hooks/use-toast";
import { Footer } from "@/components/Footer";
import { ChaesaLogo } from "@/components/ChaesaLogo";

export default function Home() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeUseCaseFilter, setActiveUseCaseFilter] = useState("Semua");
  const [stats, setStats] = useState({
    creators: 1234,
    courses: 5678,
    learners: 12340
  });

  // Debug toggle with Ctrl+D
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Auth check:", { session: !!session, error });
        
        if (session && !error) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email || "");
          console.log("User logged in:", session.user.email);
        } else {
          setIsLoggedIn(false);
          setUserEmail("");
          console.log("User not logged in");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoggedIn(false);
        setUserEmail("");
      }
    };
    checkAuth();
  }, []);

  // Simulate real-time stats counter
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        creators: prev.creators + Math.floor(Math.random() * 3),
        courses: prev.courses + Math.floor(Math.random() * 5),
        learners: prev.learners + Math.floor(Math.random() * 10)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      // Just redirect to meeting page - validation will happen there
      router.push(`/meeting/${meetingCode.trim()}`);
    } else {
      toast({
        title: "Kode Meeting Diperlukan",
        description: "Silakan masukkan kode meeting untuk bergabung",
        variant: "destructive"
      });
    }
  };

  const handleStartMeeting = () => {
    const newMeetingId = Math.random().toString(36).substring(2, 15);
    router.push(`/meeting/${newMeetingId}`);
  };

  return (
    <>
      <SEO
        title="Chaesa Live - Ubah Meeting Jadi Kursus Micro-Learning yang Menghasilkan"
        description="Satu-satunya platform yang menggabungkan video conference, AI course generator, dan live commerce. Hemat 59% vs platform premium sambil cuan dari konten Anda."
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-50 to-gray-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 overflow-x-hidden">
        {/* Header Navigation */}
        <header className="bg-white/80 dark:bg-black/20 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/">
                <div className="flex items-center gap-3 cursor-pointer">
                  <ChaesaLogo size={40} />
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Chaesa Live
                  </span>
                </div>
              </Link>

              {/* Navigation */}
              <nav className="hidden lg:flex items-center gap-5">
                <Link href="/platform" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors flex items-center gap-1">
                  <Rocket className="w-3 h-3" /> Platform
                </Link>
                <Link href="/hub" className="text-sm font-semibold text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors flex items-center gap-1">
                  🧩 ChaesaHub
                </Link>
                <Link href="/ai-agents" className="text-sm font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1">
                  🤖 AI Experts
                </Link>
                <Link href="/tools" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1">
                  🔧 AI Tools
                </Link>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                  Harga
                </Link>
                <Link href="/schedule" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                  Jadwal Live
                </Link>
                <div className="relative group">
                  <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors flex items-center gap-1">
                    Belajar <Award className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                    <Link href="/micro-learning" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Micro-Learning
                    </Link>
                    <Link href="/learning-path" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Learning Path
                    </Link>
                    <Link href="/sertifikasi" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Ujian & Sertifikasi
                    </Link>
                    <Link href="/sertifikat" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Sertifikat Saya
                    </Link>
                    <Link href="/storybook" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Storybook Visual
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                    <Link href="/dashboard" className="block px-4 py-2.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium">
                      📊 Dashboard Progress
                    </Link>
                  </div>
                </div>
                <div className="relative group">
                  <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors flex items-center gap-1">
                    HRD & Training <Shield className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                    <Link href="/bimtek-integration" className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium">
                      🏗️ BimtekKita Integration <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 px-1.5 py-0.5 rounded-full">Baru</span>
                    </Link>
                    <Link href="/competency-builder" className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium">
                      🎯 Competency Builder <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded-full">Baru</span>
                    </Link>
                    <Link href="/competency-passport" className="flex items-center gap-2 px-4 py-2.5 text-sm text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 font-medium">
                      🛡️ Competency Passport <span className="ml-auto text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-300 px-1.5 py-0.5 rounded-full">Baru</span>
                    </Link>
                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                    <Link href="/skills-matrix" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Skills Matrix & Gap Analysis
                    </Link>
                    <Link href="/sertifikasi" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Exam Center
                    </Link>
                    <Link href="/learning-path" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Training Path
                    </Link>
                    <Link href="/sertifikat" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Digital Certificate
                    </Link>
                  </div>
                </div>
                <div className="relative group">
                  <button className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors flex items-center gap-1">
                    Creator Tools <Sparkles className="w-3 h-3" />
                  </button>
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
                    <Link href="/ai-studio" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      AI Studio
                    </Link>
                    <Link href="/creator-dashboard" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Dashboard Kreator
                    </Link>
                    <Link href="/broadcast" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Broadcast & Marketing
                    </Link>
                    <Link href="/content-calendar" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Kalender Konten
                    </Link>
                  </div>
                </div>
              </nav>

              <button
                className="lg:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader className="mb-4">
                    <SheetTitle className="flex items-center gap-3">
                      <ChaesaLogo size={36} />
                      <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Chaesa Live
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="flex flex-col gap-2 mb-4">
                    <Link href="/platform" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                      <Rocket className="w-4 h-4" /> Platform Overview
                    </Link>
                    <Link href="/hub" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                      🧩 ChaesaHub — Skill Library
                    </Link>
                    <Link href="/ai-agents" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg">
                      🤖 AI Experts — 8 Ahli Konstruksi
                    </Link>
                    <Link href="/tools" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg">
                      🔧 AI Tools Hub — 30+ Tools Konstruksi
                    </Link>
                    <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      Harga
                    </Link>
                    <Link href="/schedule" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      Jadwal Live
                    </Link>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="belajar">
                      <AccordionTrigger className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><Award className="w-4 h-4" /> Belajar</span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-3">
                        <div className="flex flex-col gap-1">
                          <Link href="/micro-learning" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Micro-Learning
                          </Link>
                          <Link href="/learning-path" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Learning Path
                          </Link>
                          <Link href="/sertifikasi" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Ujian & Sertifikasi
                          </Link>
                          <Link href="/sertifikat" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Sertifikat Saya
                          </Link>
                          <Link href="/storybook" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Storybook Visual
                          </Link>
                          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg font-medium">
                            📊 Dashboard Progress
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="hrd">
                      <AccordionTrigger className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> HRD & Training</span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-3">
                        <div className="flex flex-col gap-1">
                          <Link href="/bimtek-integration" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg font-medium">
                            🏗️ BimtekKita Integration <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900/40 px-1.5 rounded-full">Baru</span>
                          </Link>
                          <Link href="/competency-builder" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg font-medium">
                            🎯 Competency Builder <span className="ml-1 text-xs bg-purple-100 dark:bg-purple-900/40 px-1.5 rounded-full">Baru</span>
                          </Link>
                          <Link href="/competency-passport" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg font-medium">
                            🛡️ Competency Passport <span className="ml-1 text-xs bg-teal-100 dark:bg-teal-900/40 px-1.5 rounded-full">Baru</span>
                          </Link>
                          <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
                          <Link href="/skills-matrix" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Skills Matrix & Gap Analysis
                          </Link>
                          <Link href="/sertifikasi" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Exam Center
                          </Link>
                          <Link href="/learning-path" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Training Path
                          </Link>
                          <Link href="/sertifikat" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Digital Certificate
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="creator">
                      <AccordionTrigger className="px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Creator Tools</span>
                      </AccordionTrigger>
                      <AccordionContent className="pl-3">
                        <div className="flex flex-col gap-1">
                          <Link href="/ai-studio" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            AI Studio
                          </Link>
                          <Link href="/creator-dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Dashboard Kreator
                          </Link>
                          <Link href="/broadcast" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Broadcast & Marketing
                          </Link>
                          <Link href="/content-calendar" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                            Kalender Konten
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex flex-col gap-2">
                    {!isLoggedIn ? (
                      <>
                        <Link href="/auth?mode=login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full">
                            Masuk
                          </Button>
                        </Link>
                        <Link href="/auth?mode=register" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                            Daftar Gratis
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg">
                          Profil Saya
                        </Link>
                        <div className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{userEmail || "User"}</div>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            setMobileMenuOpen(false);
                            try {
                              await supabase.auth.signOut();
                              setIsLoggedIn(false);
                              setUserEmail("");
                              toast({
                                title: "Logout Berhasil",
                                description: "Anda telah keluar dari akun",
                              });
                              router.reload();
                            } catch (error) {
                              console.error("Logout error:", error);
                              toast({
                                title: "Error",
                                description: "Gagal logout, silakan coba lagi",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Keluar
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Theme Toggle & Auth Buttons */}
              <div className="flex items-center gap-3">
                <ThemeSwitch />
                {!isLoggedIn ? (
                  <>
                    <Link href="/auth?mode=login" className="hidden lg:block">
                      <Button variant="ghost" className="text-gray-700 hover:bg-gray-200 dark:text-white dark:hover:bg-white/10">
                        Masuk
                      </Button>
                    </Link>
                    <Link href="/auth?mode=register" className="hidden lg:block">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        Daftar Gratis
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link href="/profile" className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block hover:text-purple-600 dark:hover:text-purple-400 transition-colors">{userEmail || "User"}</Link>
                    <Button
                      variant="ghost"
                      className="text-gray-700 hover:bg-gray-200 dark:text-white dark:hover:bg-white/10"
                      onClick={async () => {
                        try {
                          console.log("Logging out...");
                          await supabase.auth.signOut();
                          setIsLoggedIn(false);
                          setUserEmail("");
                          toast({
                            title: "Logout Berhasil",
                            description: "Anda telah keluar dari akun",
                          });
                          router.reload();
                        } catch (error) {
                          console.error("Logout error:", error);
                          toast({
                            title: "Error",
                            description: "Gagal logout, silakan coba lagi",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Keluar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Limited Time Offer Banner */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 px-4 text-center sticky top-0 z-50">
          <div className="flex items-center justify-center gap-2 text-sm md:text-base font-semibold">
            <Gift className="w-5 h-5 animate-bounce" />
            <span>🎉 PROMO TERBATAS: Paket 1 Tahun Rp 999.000 (Hemat 16%!) - Khusus Kreator Serius</span>
            <Link href="/pricing">
              <Button size="sm" variant="secondary" className="ml-4">
                Ambil Sekarang →
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            {/* Trust Badge */}
            <Badge className="mb-6 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50 px-4 py-2">
              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
              Dipercaya oleh 1.000+ Kreator & Educator
            </Badge>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Ubah Meeting Anda<br />
              Jadi <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Kursus Micro-Learning</span><br />
              yang Menghasilkan dalam 15 Menit
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Berhenti buang waktu berjam-jam editing rekaman. AI kami otomatis memotong meeting 2 jam Anda jadi 20 modul siap jual lengkap dengan slides, quiz, dan podcast. <span className="text-purple-400 font-semibold">Plus live commerce untuk konversi 3-5x lebih tinggi.</span>
            </p>

            {/* Dual CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                onClick={handleStartMeeting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Mulai Meeting Gratis Sekarang
              </Button>
              <Link href="#demo">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 px-8 py-6 text-lg rounded-xl"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Tonton Demo 2 Menit
                </Button>
              </Link>
            </div>

            {/* Social Proof Stats */}
            <div className="flex flex-wrap gap-8 justify-center text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.creators.toLocaleString()}+</div>
                <div className="text-gray-500 dark:text-gray-400">Kreator Aktif</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.courses.toLocaleString()}+</div>
                <div className="text-gray-500 dark:text-gray-400">Kursus Dihasilkan</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.learners.toLocaleString()}+</div>
                <div className="text-gray-500 dark:text-gray-400">Pelajar Puas</div>
              </div>
            </div>
          </div>

          {/* Join Meeting Form */}
          <Card className="max-w-2xl mx-auto p-8 bg-white/80 dark:bg-white/5 backdrop-blur-sm border-gray-200 dark:border-white/10">
            <form onSubmit={handleJoinMeeting} className="space-y-4">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-6">
                Gabung Meeting yang Sudah Ada
              </h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Masukkan kode meeting (contoh: abc123xyz)"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                />
                <Button 
                  type="submit" 
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 px-8 py-4 text-lg rounded-xl"
                >
                  Gabung Meeting
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Problem-Agitate-Solution Section */}
        <div className="bg-gray-50 dark:bg-black/30 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/50">
                Masalah dengan Platform Saat Ini
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Platform Meeting Konvensional <span className="text-red-400">Bunuh Produktivitas</span> Anda
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                {
                  icon: Clock,
                  problem: "Buang 10+ Jam",
                  description: "Download → Transcribe → Edit → Bikin slides → Bikin quiz = 10-20 jam per kursus",
                  color: "red"
                },
                {
                  icon: DollarSign,
                  problem: "Biaya Mahal",
                  description: "Platform meeting premium biaya Rp 200-300K/bulan. Plus gak bisa jual kursus langsung dari meeting.",
                  color: "orange"
                },
                {
                  icon: TrendingUp,
                  problem: "Kehilangan Konversi",
                  description: "Gak ada cara push CTA saat webinar. Viewer lupa beli setelah meeting selesai.",
                  color: "yellow"
                }
              ].map((item, idx) => (
                <Card key={idx} className={`p-6 bg-${item.color}-900/20 border-${item.color}-500/30 backdrop-blur-sm`}>
                  <item.icon className={`w-12 h-12 text-${item.color}-400 mb-4`} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.problem}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Chaesa Live Selesaikan Semua Ini 👇
              </h3>
            </div>
          </div>
        </div>

        {/* MyClaw-style Competitive Advantage Section */}
        <div className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Headline */}
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <Badge className="mb-4 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                AI Asisten Kompetensi Pribadi
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 leading-tight">
                Semua Orang Mau Naik Kompetensi.{" "}
                <span className="text-red-500">Hampir Tidak Ada Yang Berhasil.</span>
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Chaesa Live hadir seperti asisten pribadi yang selalu online — kerja untuk Anda 24/7, tanpa setup, tanpa ribet.
              </p>
            </div>

            {/* Before / After Split */}
            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {/* Without */}
              <div className="bg-gray-950 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-gray-500 font-mono">Tanpa Chaesa Live</span>
                </div>
                <div className="font-mono text-sm space-y-2">
                  <p className="text-green-400">$ Cari kelas konstruksi di Google...</p>
                  <p className="text-gray-400">→ Nemu 50 hasil, tidak jelas mana yang BNSP-resmi</p>
                  <p className="text-green-400">$ Daftar pelatihan offline...</p>
                  <p className="text-red-400">ERROR: Kota terdekat 3 jam perjalanan. Biaya Rp 4.5 juta.</p>
                  <p className="text-green-400">$ Coba YouTube gratis...</p>
                  <p className="text-red-400">ERROR: Tidak ada sertifikat. Tidak ada ujian terstruktur.</p>
                  <p className="text-green-400">$ Hubungi LSP untuk jadwal asesmen...</p>
                  <p className="text-red-400">ERROR: Antrian 3 bulan. Materi persiapan tidak ada.</p>
                  <p className="text-yellow-400 mt-4">⚠ PKB 150 jam belum terpenuhi. SKK kedaluarsa.</p>
                  <p className="text-gray-600 mt-2">✗ Tidak ada struktur belajar</p>
                  <p className="text-gray-600">✗ Tidak ada AI Expert yang bisa ditanya</p>
                  <p className="text-gray-600">✗ Menyerah sebelum sertifikasi</p>
                </div>
              </div>
              {/* With */}
              <div className="bg-gradient-to-br from-purple-950 to-indigo-950 rounded-2xl p-6 border border-purple-500/40">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-purple-300 font-mono">Dengan Chaesa Live — Online 24/7</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "🤖", from: "Anda:", msg: "Saya mau ambil SKK Pelaksana Lapangan Gedung", you: true },
                    { icon: "⚡", from: "Chaesa AI:", msg: "Siap! Saya temukan 12 modul BIMTEK yang relevan, 15 jam PKB, dan quiz simulasi 30 soal. Mulai sekarang?", you: false },
                    { icon: "🤖", from: "Anda:", msg: "Ya. Juga carikan jadwal asesmen LSP terdekat.", you: true },
                    { icon: "⚡", from: "Chaesa AI:", msg: "Jalur belajar 3 minggu disiapkan. PKB tracker aktif. 2 LSP di kota Anda tersedia bulan depan — mau saya buatkan reminder?", you: false },
                    { icon: "🤖", from: "Anda:", msg: "Iya. Dan rekap progress ke Competency Passport saya.", you: true },
                    { icon: "⚡", from: "Chaesa AI:", msg: "Done! Passport diupdate. Anda sudah 40% menuju SKK L2. Lanjut modul berikutnya? ✅", you: false },
                  ].map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.you ? "flex-row-reverse" : ""}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${m.you ? "bg-purple-600" : "bg-indigo-600"}`}>{m.icon}</div>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-xs ${m.you ? "bg-purple-600/30 text-purple-100 rounded-tr-none" : "bg-white/10 text-gray-200 rounded-tl-none"}`}>
                        <span className="font-semibold block text-[10px] opacity-70 mb-0.5">{m.from}</span>
                        {m.msg}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-purple-800/50">
                    {["✓ PKB otomatis tercatat", "✓ AI Expert siap konsultasi", "✓ Sertifikasi siap dalam 3 minggu"].map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-green-900/40 text-green-300 border border-green-700/50">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 8 AI Capabilities Grid */}
            <div className="mb-14">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Apa yang Bisa AI Lakukan untuk Anda
              </h3>
              <p className="text-center text-gray-400 text-sm mb-8">Asisten yang selalu aktif — mengerjakan semua ini otomatis di background</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: "🏗️", title: "Jalur BIMTEK & SKK", desc: "Temukan modul wajib, lacak PKB 150 jam, dan siapkan asesmen BNSP dari satu tempat", color: "hover:border-orange-300 dark:hover:border-orange-600" },
                  { icon: "🤖", title: "AI Expert 24/7", desc: "Tanya soal K3, struktur, MEP, atau manajemen proyek kapan saja — jawaban dalam detik", color: "hover:border-purple-300 dark:hover:border-purple-600" },
                  { icon: "⚡", title: "Kursus dari Rekaman", desc: "Upload rekaman training/meeting → AI buat 20 modul siap pakai dalam 15 menit", color: "hover:border-blue-300 dark:hover:border-blue-600" },
                  { icon: "🛡️", title: "Competency Passport", desc: "Semua SKK, PKB, dan sertifikat terdokumentasi di passport digital ber-QR code", color: "hover:border-teal-300 dark:hover:border-teal-600" },
                  { icon: "✍️", title: "Quiz & Simulasi SKK", desc: "65+ soal latihan asesmen BNSP dengan pembahasan AI — tingkat kelulusan lebih tinggi", color: "hover:border-green-300 dark:hover:border-green-600" },
                  { icon: "📊", title: "Skills Matrix Tim", desc: "HRD pantau kompetensi seluruh tim, alert SKK kedaluarsa, laporan per departemen", color: "hover:border-indigo-300 dark:hover:border-indigo-600" },
                  { icon: "🎬", title: "Konten Multi-Platform", desc: "Dari 1 rekaman: kursus, podcast, slide, caption IG/TikTok/LinkedIn — semua otomatis", color: "hover:border-pink-300 dark:hover:border-pink-600" },
                  { icon: "🗺️", title: "Learning Path Karir", desc: "AI rancangkan jalur belajar personal menuju posisi target dengan milestone terukur", color: "hover:border-amber-300 dark:hover:border-amber-600" },
                ].map((cap, i) => (
                  <div key={i} className={`p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all group cursor-default ${cap.color}`}>
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cap.icon}</div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{cap.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{cap.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Proof Quotes */}
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-900 dark:to-purple-950/30 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
              <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-6 font-semibold">Apa Kata Pengguna</p>
              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { quote: "Pertama kali nanya soal perhitungan pondasi ke AI Expert-nya, dijawab dalam 10 detik lengkap dengan rumus. Ini yang saya butuhkan sebelum asesmen LSP.", name: "Rudi H.", role: "Pelaksana Lapangan, Surabaya", avatar: "RH" },
                  { quote: "Rekam internal training 2 jam, 15 menit kemudian sudah ada 18 modul siap pakai untuk onboarding karyawan baru. Hemat berminggu-minggu kerja tim HRD.", name: "Sinta M.", role: "HRD Manager, Jakarta", avatar: "SM" },
                  { quote: "PKB saya sudah 140 jam dari 150 jam target — semua terhitung otomatis. Dulu saya tidak tahu harus mulai dari mana, sekarang tinggal ikuti jalur yang AI buat.", name: "Agus P.", role: "Site Engineer, Medan", avatar: "AP" },
                ].map((t, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 italic">"{t.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.avatar}</div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</div>
                        <div className="text-xs text-gray-400">{t.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link href="/auth">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg text-base">
                    <Zap className="w-4 h-4 mr-2" /> Mulai Gratis — Tidak Perlu Setup
                  </Button>
                </Link>
                <p className="text-xs text-gray-400 mt-2">Langsung pakai. Cancel kapan saja.</p>
              </div>
            </div>

          </div>
        </div>

        {/* What People Build — Use Cases Grid */}
        {(() => {
          const USE_CASES = [
            { cat: "Otomasi Belajar", icon: "⚡", title: "Jadwal Belajar Otomatis Harian", desc: "AI menyusun jadwal belajar 30 menit/hari berdasarkan gap kompetensi dan kalender kerja Anda — tanpa perlu mikir.", user: "Rudi H., Pelaksana Lapangan" },
            { cat: "Konstruksi & BIMTEK", icon: "🏗️", title: "Rekaman Training K3 → 18 Modul", desc: "Upload rekaman induction K3 2 jam, AI memotong jadi 18 modul siap distribusi ke seluruh tim proyek dalam 15 menit.", user: "Sinta M., HSE Manager Cikarang" },
            { cat: "Creator & Konten", icon: "🎬", title: "Webinar → Kursus + Podcast + Caption", desc: "Dari 1 rekaman webinar: e-course 15 modul, naskah podcast 3 episode, dan 20 caption IG/TikTok/LinkedIn — otomatis.", user: "Maya R., Edu-Creator Bandung" },
            { cat: "Akademik", icon: "🎓", title: "Rekaman Kuliah → Mind Map + Ringkasan", desc: "Rekam kuliah 90 menit, AI buat mind map visual + ringkasan 1 halaman + 10 soal latihan — siap belajar saat commute.", user: "Dimas A., Mahasiswa Sipil ITS" },
            { cat: "Karir & Profesi", icon: "💼", title: "Competency Gap Finder", desc: "Masukkan jabatan target Anda, AI analisa gap kompetensi vs standar SKKNI dan rekomendasikan jalur belajar prioritas.", user: "Ari B., Site Engineer Bandung" },
            { cat: "Corporate & HRD", icon: "🏢", title: "Onboarding Kit Karyawan Baru Otomatis", desc: "Upload SOP perusahaan → AI buat modul onboarding interaktif + quiz kompetensi awal untuk setiap departemen.", user: "Fitri N., HRD PT Adhi Karya" },
            { cat: "Sertifikasi BNSP", icon: "🛡️", title: "Simulator Asesmen SKK 65+ Soal", desc: "Latihan soal persis seperti asesmen LSP — AI analisa kelemahan per unit kompetensi dan buat jadwal intensif 3 minggu.", user: "Hendra W., Teknisi MEP Jakarta" },
            { cat: "Otomasi Belajar", icon: "⚡", title: "PKB 150 Jam Terpenuhi Otomatis", desc: "Setiap modul BIMTEK yang diselesaikan otomatis tercatat ke PKB tracker — dapat notifikasi kalau sudah 80% dari target tahunan.", user: "Bowo S., Pengawas Lapangan Semarang" },
            { cat: "Konstruksi & BIMTEK", icon: "🏗️", title: "Tanya AI Expert Soal Pondasi", desc: "\"Tentukan jenis pondasi untuk SPT < 5\" — dijawab AI Expert Geoteknik dalam 10 detik dengan rumus dan rekomendasi lapangan.", user: "Eko P., Konsultan Perencana" },
            { cat: "Corporate & HRD", icon: "🏢", title: "Dashboard SKK Kedaluarsa 50 Karyawan", desc: "Skills matrix seluruh tim dengan alert otomatis 3 bulan sebelum SKK kedaluarsa — HRD tidak perlu tracking manual lagi.", user: "Dewi K., HR Director PP Konstruksi" },
            { cat: "Creator & Konten", icon: "🎬", title: "Live Commerce: Jual Kursus Saat Live", desc: "Push CTA beli kursus langsung di tengah live — integrasi Mayar.id, konversi 3–5x lebih tinggi dari link bio biasa.", user: "Bagas T., Instructor Konstruksi" },
            { cat: "Akademik", icon: "🎓", title: "Portfolio Karir dari Tugas Akhir", desc: "Upload skripsi/TA → AI ekstrak kompetensi, buat Competency Passport awal yang bisa langsung dipakai melamar kerja.", user: "Nisa F., Fresh Graduate Unsri" },
            { cat: "Karir & Profesi", icon: "💼", title: "Radar Chart Kompetensi vs Jabatan Target", desc: "Visualisasi spider chart 12 kompetensi Anda vs standar Ahli Muda — langsung tahu area yang perlu diperkuat bulan ini.", user: "Danu I., Civil Engineer 5 Tahun" },
            { cat: "Sertifikasi BNSP", icon: "🛡️", title: "Alur Sertifikasi Step-by-Step", desc: "AI jelaskan dokumen yang dibutuhkan, LSP terdekat, estimasi biaya, dan tanggal asesmen — semua dalam 1 chat.", user: "Rino A., Teknisi Listrik Surabaya" },
            { cat: "Otomasi Belajar", icon: "⚡", title: "Morning Briefing Kompetensi", desc: "Setiap pagi: ringkasan modul hari ini, reminder quiz yang belum selesai, dan 1 tips dari AI Expert — langsung di WhatsApp.", user: "Toni L., Project Manager Makassar" },
            { cat: "Konstruksi & BIMTEK", icon: "🏗️", title: "Kalkulasi Beton + Tulangan via Chat", desc: "\"Hitung kebutuhan beton dan tulangan untuk plat lantai 10x12m tebal 12cm\" — AI hitung dan tampilkan tabel material.", user: "Slamet R., Kontraktor Yogyakarta" },
          ];
          const FILTERS = ["Semua", "Otomasi Belajar", "Konstruksi & BIMTEK", "Creator & Konten", "Akademik", "Karir & Profesi", "Corporate & HRD", "Sertifikasi BNSP"];
          const FILTER_ICONS: Record<string, string> = { "Semua": "🔥", "Otomasi Belajar": "⚡", "Konstruksi & BIMTEK": "🏗️", "Creator & Konten": "🎬", "Akademik": "🎓", "Karir & Profesi": "💼", "Corporate & HRD": "🏢", "Sertifikasi BNSP": "🛡️" };
          const filtered = activeUseCaseFilter === "Semua" ? USE_CASES : USE_CASES.filter(u => u.cat === activeUseCaseFilter);
          return (
            <div className="py-20 bg-gray-50 dark:bg-gray-900/50">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                  <Badge className="mb-4 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                    Dari Komunitas Pengguna
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                    Apa yang Dibangun dengan{" "}
                    <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Chaesa Live</span>
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                    Use case nyata dari pengguna. Semua ini berjalan di Chaesa Live — dan dengan AI selalu aktif, semuanya bisa jalan 24/7 tanpa Anda angkat jari.
                  </p>
                </div>

                {/* Filter tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {FILTERS.map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveUseCaseFilter(f)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                        activeUseCaseFilter === f
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <span>{FILTER_ICONS[f]}</span> {f}
                    </button>
                  ))}
                </div>

                {/* Use case cards grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  {filtered.map((uc, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-2xl group-hover:scale-110 transition-transform">{uc.icon}</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">{uc.cat}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 leading-snug">{uc.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{uc.desc}</p>
                      <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shrink-0" />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">{uc.user}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Link href="/auth">
                    <Button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
                      Coba Sendiri — Gratis <ArrowRight className="w-4 h-4 ml-2 inline" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3 Killer Features */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50">
              Fitur Revolusioner
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              3 Fitur yang <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Gak Ada</span> di Kompetitor
            </h2>
          </div>

          <div className="space-y-16">
            {/* Feature 1: AI Course Factory */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/50">
                  <Brain className="w-4 h-4 mr-2" />
                  AI Course Factory
                </Badge>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Bikin Kursus 1 Klik dengan AI Otomatis
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  Rekam 1 meeting → AI potong jadi 20 modul micro (5-7 menit tiap modul) → Otomatis bikin slides, quiz, podcast, ebook → Publish & jual dalam 15 menit.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    "📊 Bikin slides PowerPoint otomatis",
                    "📖 Bikin ebook PDF & study guide",
                    "✅ Bikin quiz lengkap dengan penjelasan",
                    "🎙️ Podcast AI dengan 2 host berbincang",
                    "📱 Optimize untuk platform social media"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                  <div className="text-sm text-purple-600 dark:text-purple-300 font-semibold mb-1">HEMAT WAKTU</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    90% (20 jam → 2 jam)
                  </div>
                </div>
                <Link href="/ai-studio">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                    Coba AI Studio <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-2xl p-8 flex items-center justify-center">
                  <Brain className="w-32 h-32 text-purple-400" />
                </div>
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  Hemat 90% Waktu
                </div>
              </div>
            </div>

            {/* Feature 2: Live Sales CTA */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative">
                <div className="aspect-video bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900 dark:to-orange-900 rounded-2xl p-8 flex items-center justify-center">
                  <Zap className="w-32 h-32 text-orange-400" />
                </div>
                <div className="absolute -top-4 -left-4 bg-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  Konversi 3-5x
                </div>
              </div>
              <div className="order-1 md:order-2">
                <Badge className="mb-4 bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-500/50">
                  <Zap className="w-4 h-4 mr-2" />
                  Live Sales CTA
                </Badge>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Live Commerce Interaktif (Push CTA ke Semua Viewer)
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  Saat webinar/demo, push tombol "Beli Sekarang" langsung ke layar semua viewer dengan countdown timer. Impulse buying = konversi 3-5x lebih tinggi dari "link di chat".
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    "💰 Push penawaran produk saat demo live",
                    "⏱️ Countdown timer untuk urgency",
                    "📊 Tracking klik real-time",
                    "🎯 CTA warna & copy bisa di-custom",
                    "💳 Checkout langsung via payment gateway"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-6">
                  <div className="text-sm text-orange-600 dark:text-orange-300 font-semibold mb-1">BOOST KONVERSI</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    3-5x vs Webinar Tradisional
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-orange-600 to-pink-600">
                  Lihat Demo Live <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Feature 3: Studio Mode */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/50">
                  <MonitorPlay className="w-4 h-4 mr-2" />
                  Studio Mode
                </Badge>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Mode Studio untuk Content Creator & Streamer Profesional
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                  Platform meeting konvensional bunuh kualitas audio saat streaming? Kami fix itu. Toggle "Studio Mode" → Feed bersih (tanpa UI) + "Original Sound" (tanpa processing) = Sempurna untuk live streaming.
                </p>
                <div className="space-y-3 mb-6">
                  {[
                    "🎥 Feed bersih (sembunyikan semua UI untuk capture)",
                    "🎵 Mode Original Sound (tanpa audio processing)",
                    "🎙️ Kompatibel dengan software streaming populer",
                    "🎬 Sempurna untuk live streaming profesional",
                    "⌨️ Keyboard shortcut (Ctrl+Shift+U)"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="text-sm text-green-600 dark:text-green-300 font-semibold mb-1">KUALITAS AUDIO</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    Kualitas Studio (Tanpa Suara Robot)
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-green-600 to-teal-600">
                  Coba Studio Mode <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 rounded-2xl p-8 flex items-center justify-center">
                  <MonitorPlay className="w-32 h-32 text-green-400" />
                </div>
                <div className="absolute -top-4 -right-4 bg-teal-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  Zero Masalah Audio
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Comparison */}
        <div className="bg-gray-50 dark:bg-black/30 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50">
                Harga Transparan
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Hemat <span className="text-green-500 dark:text-green-400">Hingga 60%</span>, Dapat <span className="text-purple-600 dark:text-purple-400">10x Lebih Banyak Fitur</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-white/20">
                    <th className="p-4 text-gray-900 dark:text-white font-semibold">Fitur</th>
                    <th className="p-4 text-gray-900 dark:text-white font-semibold text-center">Platform A</th>
                    <th className="p-4 text-gray-900 dark:text-white font-semibold text-center">Platform B</th>
                    <th className="p-4 text-gray-900 dark:text-white font-semibold text-center bg-purple-100 dark:bg-purple-900/30">
                      <Badge className="mb-2">Rekomendasi</Badge>
                      <div>Chaesa Live Pro</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4 font-semibold">Harga/Bulan</td>
                    <td className="p-4 text-center">Rp 240.000</td>
                    <td className="p-4 text-center">Rp 130.000</td>
                    <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/20 font-bold text-green-600 dark:text-green-400">Rp 99.000</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Hemat vs Platform Premium</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center bg-purple-900/20 font-bold text-green-400">Hemat 59%</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Durasi Meeting</td>
                    <td className="p-4 text-center">Unlimited</td>
                    <td className="p-4 text-center">Unlimited</td>
                    <td className="p-4 text-center bg-purple-900/20">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">AI Course Generator</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center bg-purple-900/20 text-green-400">✅</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Live Sales CTA</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center bg-purple-900/20 text-green-400">✅</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Studio Mode (Streaming-Friendly)</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center bg-purple-900/20 text-green-400">✅</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Original Sound (Fix Audio)</td>
                    <td className="p-4 text-center text-yellow-400">⚠️ Rumit</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center bg-purple-900/20 text-green-400">✅ Toggle 1x</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Podcast AI Otomatis</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center bg-purple-900/20 text-green-400">✅</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <td className="p-4">Micro-Learning Chunking</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center text-red-400">❌</td>
                    <td className="p-4 text-center bg-purple-900/20 text-green-400">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-12">
              <Link href="/pricing">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-12 py-6 text-lg">
                  Lihat Harga Lengkap <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Use Cases by Persona */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50">
              Sempurna Untuk
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Siapa yang Paling Untung Pakai Chaesa Live?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Brain,
                persona: "Kreator E-Course & Coach",
                pain: "Buang 10-20 jam bikin kursus dari rekaman meeting",
                solution: "Rekam 1 webinar → AI bikin 20 modul → Jual dalam 15 menit",
                roi: "Hemat 90% waktu, Cuan 5x lebih banyak kursus",
                cta: "Bikin Kursus Pertama",
                color: "blue"
              },
              {
                icon: DollarSign,
                persona: "Live Seller & E-Commerce",
                pain: "Konversi webinar rendah, susah closing",
                solution: "Push CTA saat demo live → Impulse buying → Konversi 3-5x",
                roi: "Tingkat konversi 3-5x lebih tinggi",
                cta: "Boost Penjualan",
                color: "orange"
              },
              {
                icon: Video,
                persona: "Content Creator & Streamer",
                pain: "Masalah audio saat streaming, gak bisa pakai platform meeting untuk broadcast",
                solution: "Studio Mode + Original Sound → Zero konflik audio",
                roi: "Kualitas streaming profesional",
                cta: "Fix Masalah Audio",
                color: "green"
              },
              {
                icon: Users,
                persona: "Corporate Trainer & HR",
                pain: "Platform training mahal, susah tracking progress",
                solution: "Rekam training sekali → Auto-chunk → Gamified learning",
                roi: "Hemat 80% biaya training",
                cta: "Mulai Corporate Training",
                color: "purple"
              }
            ].map((useCase, idx) => (
              <Card key={idx} className={`p-8 bg-${useCase.color}-900/20 border-${useCase.color}-500/30 backdrop-blur-sm hover:bg-${useCase.color}-900/30 transition-all`}>
                <useCase.icon className={`w-12 h-12 text-${useCase.color}-400 mb-4`} />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{useCase.persona}</h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <div className="text-sm text-red-500 dark:text-red-400 font-semibold mb-1">❌ Masalah:</div>
                    <div className="text-gray-600 dark:text-gray-300">{useCase.pain}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-500 dark:text-green-400 font-semibold mb-1">✅ Solusi Chaesa:</div>
                    <div className="text-gray-600 dark:text-gray-300">{useCase.solution}</div>
                  </div>
                  <div className={`bg-${useCase.color}-500/10 border border-${useCase.color}-500/30 rounded-lg p-3`}>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ROI</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{useCase.roi}</div>
                  </div>
                </div>
                <Button className={`w-full bg-gradient-to-r from-${useCase.color}-600 to-${useCase.color}-700`}>
                  {useCase.cta} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Competency Builder + BimtekKita Integration Section */}
        <div className="py-20 bg-gradient-to-br from-indigo-50 via-blue-50 to-teal-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-teal-950/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50">
                Ekosistem Terintegrasi
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Chaesa Live × BimtekKita<br />
                <span className="bg-gradient-to-r from-orange-500 via-blue-600 to-teal-500 bg-clip-text text-transparent">Platform Kompetensi Lengkap</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                157 modul BIMTEK konstruksi, 334 posisi SKK/BNSP, AI Expert, dan learning management — semuanya terhubung dalam satu ekosistem
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* BimtekKita Card */}
              <Link href="/bimtek-integration">
                <div className="group relative bg-white dark:bg-gray-900 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-7 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer h-full">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">Integrasi</Badge>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                    <span className="text-2xl">🏗️</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">BimtekKita Integration</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">157 modul BIMTEK konstruksi dengan PKB points, database 334 posisi SKK, 8 AI Expert, dan tools kalkulasi teknik sipil.</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {["157 Modul BIMTEK", "334 Posisi SKK", "8 AI Expert", "PKB Tracker"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold group-hover:gap-3 transition-all text-sm">
                    Buka Integrasi <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
              {/* Competency Builder Card */}
              <Link href="/competency-builder">
                <div className="group relative bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-7 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer h-full">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700">Baru</Badge>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🎯 Competency E-Course Builder</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Bangun e-course berbasis kompetensi SKKNI dengan 6 langkah terstruktur dan AI Chaesa Live untuk generate konten otomatis.</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {["6 Langkah Terstruktur", "4 Level L1-L4", "SKKNI Mapping", "AI Generator"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all text-sm">
                    Mulai Build E-Course <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
              {/* Competency Passport Card */}
              <Link href="/competency-passport">
                <div className="group relative bg-white dark:bg-gray-900 border-2 border-teal-200 dark:border-teal-700 rounded-2xl p-7 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-xl transition-all cursor-pointer h-full">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700">Baru</Badge>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">🛡️ Competency Passport</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Portfolio digital terverifikasi. Catat SKK konstruksi, PKB points dari BIMTEK, dan semua kompetensi SKKNI dalam satu passport.</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {["SKK/BNSP Support", "PKB Points", "Radar Chart", "Cetak PDF"].map(f => (
                      <div key={f} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-500 shrink-0" />{f}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold group-hover:gap-3 transition-all text-sm">
                    Lihat Passport Saya <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">Ekosistem Terintegrasi: Chaesa Live × BimtekKita</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {[
                  { label: "BIMTEK Modules", href: "/bimtek-integration", icon: "🎓" },
                  { label: "→", href: null },
                  { label: "AI Studio", href: "/micro-learning", icon: "🤖" },
                  { label: "→", href: null },
                  { label: "Competency Builder", href: "/competency-builder", icon: "🎯" },
                  { label: "→", href: null },
                  { label: "Quiz SKK", href: "/bimtek-integration", icon: "✍️" },
                  { label: "→", href: null },
                  { label: "Exam Center", href: "/sertifikasi", icon: "📝" },
                  { label: "→", href: null },
                  { label: "Competency Passport", href: "/competency-passport", icon: "🛡️" },
                ].map((item, i) =>
                  item.href === null ? (
                    <ArrowRight key={i} className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Link key={i} href={item.href}>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer">
                        {item.icon} {item.label}
                      </span>
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Untuk Siapa Section */}
        <div className="py-20 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50">
                6 Segmen Pengguna
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Dirancang untuk <span className="bg-gradient-to-r from-purple-600 via-orange-500 to-teal-500 bg-clip-text text-transparent">Semua Orang</span>
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Dari pelajar SMA hingga corporate — satu platform yang memenuhi semua kebutuhan belajar dan sertifikasi
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { emoji: "🎒", label: "Pelajar SMA/SMK", desc: "Quiz, ringkasan AI, sertifikat", color: "border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" },
                { emoji: "🎓", label: "Mahasiswa", desc: "Rekam kuliah, portfolio, SKK", color: "border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20" },
                { emoji: "🦺", label: "Pekerja & Teknisi", desc: "BIMTEK, PKB, SKK BNSP", color: "border-orange-200 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20" },
                { emoji: "💼", label: "Profesional", desc: "Competency builder, passport", color: "border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" },
                { emoji: "🎬", label: "Content Creator", desc: "Meeting → kursus, podcast, caption", color: "border-pink-200 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20" },
                { emoji: "🏢", label: "Corporate & HRD", desc: "Training management, skills matrix", color: "border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20" },
              ].map((s, i) => (
                <Link key={i} href="/platform">
                  <div className={`p-5 rounded-2xl border-2 bg-white dark:bg-gray-900 ${s.color} transition-all cursor-pointer group`}>
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{s.emoji}</div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">{s.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Lihat fitur <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/platform">
                <Button className="bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold px-8 py-3 rounded-xl text-base shadow-lg hover:shadow-xl transition-shadow">
                  <Rocket className="w-4 h-4 mr-2" /> Lihat Platform Overview Lengkap
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-gray-50 dark:bg-black/30 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50">
                Kisah Sukses
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Apa Kata Early Adopter
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  role: "Kreator E-Course",
                  avatar: "SC",
                  quote: "Dulu bikin kursus 2 minggu. Sekarang 1 hari pakai AI Chaesa Live. Udah cuan Rp 50 juta dari 5 kursus!",
                  metric: "Revenue Rp 50 juta"
                },
                {
                  name: "Budi Santoso",
                  role: "Live Seller",
                  avatar: "BS",
                  quote: "Fitur Live CTA game changer banget. Konversi webinar gue naik dari 2% jadi 8%. Itu 4x lipat!",
                  metric: "Konversi naik 4x"
                },
                {
                  name: "Amanda Wijaya",
                  role: "YouTuber (150K subs)",
                  avatar: "AW",
                  quote: "Akhirnya gak ada masalah audio OBS lagi! Studio Mode bikin live stream gue jauh lebih bersih. Highly recommend buat content creator.",
                  metric: "Zero masalah audio"
                }
              ].map((testimonial, idx) => (
                <Card key={idx} className="p-6 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-semibold">{testimonial.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/50">
                    {testimonial.metric}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Card className="p-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border-purple-300 dark:border-purple-500/30 backdrop-blur-sm text-center">
            <Badge className="mb-6 bg-green-500/20 text-green-600 dark:text-green-300 border-green-500/50">
              <Gift className="w-4 h-4 mr-2" />
              Khusus Kreator Serius
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Siap 10x Revenue Konten Anda?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Gabung 1.000+ kreator yang sudah cuan lebih dengan usaha lebih sedikit. Paket 1 Tahun <span className="font-bold text-yellow-400">Rp 999.000</span> - Semua fitur Pro, zero penyesalan. Ini investasi, bukan pengeluaran.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/pricing">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-12 py-6 text-lg">
                  <Rocket className="w-5 h-5 mr-2" />
                  Ambil Pro Sekarang - Rp 99K/bulan
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleStartMeeting}
                className="border-2 border-purple-500 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 px-12 py-6 text-lg"
              >
                Coba Meeting Gratis Dulu
              </Button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Tanpa kartu kredit • Batal kapan saja • Garansi uang kembali 7 hari
            </p>
          </Card>
        </div>

        {/* Trust Signals */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Shield, label: "Keamanan Enterprise-Grade" },
              { icon: Award, label: "99,9% Uptime SLA" },
              { icon: Users, label: "Support 24/7" },
              { icon: Lock, label: "GDPR Compliant" }
            ].map((trust, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <trust.icon className="w-10 h-10 text-purple-400" />
                <div className="text-gray-600 dark:text-gray-300 font-semibold">{trust.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/50 px-4 py-2">
              <MessageSquare className="w-4 h-4 mr-2" />
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Temukan jawaban untuk pertanyaan umum tentang Chaesa Live
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="faq-1" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Berapa harga berlangganan Chaesa Live?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Chaesa Live menawarkan paket mulai dari Rp 99.000/bulan untuk paket Pro. Kami juga menyediakan paket tahunan seharga Rp 999.000 (hemat 16%). Tersedia juga paket gratis dengan fitur dasar seperti video meeting hingga 45 menit dan akses micro-learning terbatas. Kunjungi halaman Harga untuk detail lengkap.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-2" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Bagaimana AI mengubah meeting saya jadi kursus micro-learning?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                AI kami secara otomatis mentranskrip dan menganalisis rekaman meeting Anda. Kemudian, AI memotong konten menjadi modul-modul pendek (5-15 menit), menghasilkan slides presentasi, membuat quiz interaktif, dan bahkan mengubahnya menjadi format podcast. Semua proses ini selesai dalam hitungan menit, bukan berjam-jam.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-3" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Apakah data dan rekaman meeting saya aman?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Keamanan adalah prioritas utama kami. Semua data dienkripsi end-to-end, baik saat transit maupun saat disimpan. Kami menggunakan infrastruktur enterprise-grade dengan kepatuhan GDPR, dan menjamin uptime 99,9% SLA. Rekaman meeting Anda hanya bisa diakses oleh Anda dan peserta yang Anda izinkan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-4" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Apakah Chaesa Live kompatibel dengan perangkat saya?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Chaesa Live berbasis web dan bisa diakses dari browser modern manapun (Chrome, Firefox, Safari, Edge) tanpa perlu install aplikasi tambahan. Platform kami juga mendukung Progressive Web App (PWA), sehingga bisa dipasang di smartphone dan tablet untuk pengalaman seperti aplikasi native.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-5" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Bagaimana kebijakan refund jika saya tidak puas?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Kami menawarkan garansi uang kembali 7 hari tanpa syarat. Jika Anda tidak puas dengan layanan kami dalam 7 hari pertama setelah berlangganan, hubungi tim support kami dan kami akan memproses refund penuh. Anda juga bisa membatalkan langganan kapan saja tanpa biaya tambahan.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-6" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Bagaimana cara mulai menggunakan Chaesa Live?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Sangat mudah! Cukup daftar akun gratis, lalu Anda bisa langsung memulai meeting pertama Anda. Untuk fitur AI course generator, cukup rekam meeting Anda dan biarkan AI kami yang bekerja. Kami juga menyediakan template siap pakai dan panduan onboarding untuk membantu Anda memulai dengan cepat.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-7" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Apa bedanya Chaesa Live dengan Zoom atau Google Meet?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Chaesa Live bukan sekadar platform video conference. Kami menggabungkan video meeting, AI course generator, dan live commerce dalam satu platform. Sementara Zoom/Meet hanya merekam meeting, Chaesa Live secara otomatis mengubah rekaman menjadi kursus micro-learning yang bisa Anda monetisasi. Plus, fitur live commerce memungkinkan konversi 3-5x lebih tinggi langsung saat presentasi.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-8" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Apakah Chaesa Live mendukung akses mobile?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Ya! Chaesa Live sepenuhnya responsif dan dioptimalkan untuk perangkat mobile. Anda bisa mengikuti meeting, mengakses kursus micro-learning, dan mengelola konten langsung dari smartphone Anda. Dengan dukungan PWA, Anda bisa menginstall Chaesa Live di home screen untuk akses cepat tanpa perlu download dari app store.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-9" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Berapa banyak peserta yang bisa ikut dalam satu meeting?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Paket gratis mendukung hingga 10 peserta per meeting. Paket Pro mendukung hingga 100 peserta dengan fitur breakout room dan recording. Untuk kebutuhan enterprise dengan peserta lebih banyak, hubungi tim sales kami untuk solusi kustom yang disesuaikan dengan kebutuhan organisasi Anda.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="faq-10" className="border border-gray-200 dark:border-white/10 rounded-xl px-6 bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <AccordionTrigger className="text-base font-semibold text-gray-900 dark:text-white hover:no-underline">
                Apakah ada fitur sertifikasi untuk peserta kursus?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300">
                Ya! Chaesa Live menyediakan sistem sertifikasi digital lengkap. Setelah peserta menyelesaikan kursus dan lulus ujian, mereka akan mendapatkan sertifikat digital yang bisa diverifikasi. Fitur ini sangat berguna untuk program training korporat, sertifikasi profesional, dan bukti kompetensi yang bisa dibagikan di LinkedIn.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Debug Panel (Ctrl+D to toggle) */}
        {showDebug && (
          <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-2xl border border-purple-500 max-w-sm z-50">
            <div className="text-xs font-mono space-y-2">
              <div className="font-bold text-purple-400 mb-2">DEBUG INFO (Ctrl+D to hide)</div>
              <div>isLoggedIn: <span className={isLoggedIn ? "text-green-400" : "text-red-400"}>{String(isLoggedIn)}</span></div>
              <div>userEmail: <span className="text-yellow-400">{userEmail || "(empty)"}</span></div>
              <div>meetingCode: <span className="text-yellow-400">{meetingCode || "(empty)"}</span></div>
              <div className="pt-2 border-t border-gray-700">
                <button
                  onClick={async () => {
                    const { data } = await supabase.auth.getSession();
                    console.log("Session data:", data);
                    alert(JSON.stringify(data, null, 2));
                  }}
                  className="text-xs bg-purple-600 px-2 py-1 rounded hover:bg-purple-700"
                >
                  Check Session
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
}