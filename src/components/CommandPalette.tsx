import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  BarChart3,
  BookOpen,
  Sparkles,
  Video,
  Award,
  GraduationCap,
  Users,
  Send,
  Calendar,
  DollarSign,
  User,
  LogIn,
  Home,
  Target,
  Radio,
  Layers,
  Search,
} from "lucide-react";

const NAV_ITEMS = [
  {
    group: "Navigasi",
    items: [
      { label: "Beranda", description: "Halaman utama", icon: Home, href: "/" },
      { label: "Dashboard Progress", description: "Lihat XP dan pencapaian", icon: BarChart3, href: "/dashboard" },
      { label: "Harga & Paket", description: "Pilih paket langganan", icon: DollarSign, href: "/pricing" },
      { label: "Jadwal Live", description: "Buat jadwal meeting", icon: Calendar, href: "/schedule" },
    ],
  },
  {
    group: "Belajar",
    items: [
      { label: "Micro-Learning", description: "Kursus dari rekaman meeting", icon: Sparkles, href: "/micro-learning" },
      { label: "Learning Path", description: "Jalur belajar terstruktur", icon: Layers, href: "/learning-path" },
      { label: "Ujian & Sertifikasi", description: "Ikuti ujian online", icon: GraduationCap, href: "/sertifikasi" },
      { label: "Sertifikat Saya", description: "Lihat sertifikat digital", icon: Award, href: "/sertifikat" },
      { label: "Storybook Visual", description: "Cerita interaktif bergambar", icon: BookOpen, href: "/storybook" },
    ],
  },
  {
    group: "Creator Tools",
    items: [
      { label: "AI Studio", description: "Generate kursus dengan AI", icon: Sparkles, href: "/ai-studio" },
      { label: "Dashboard Kreator", description: "Pantau performa konten", icon: BarChart3, href: "/creator-dashboard" },
      { label: "Broadcast Hub", description: "Kirim pesan ke channel", icon: Send, href: "/broadcast" },
      { label: "Kalender Konten", description: "Jadwal dan rencana konten", icon: Calendar, href: "/content-calendar" },
    ],
  },
  {
    group: "HRD & Training",
    items: [
      { label: "Skills Matrix", description: "Analisis gap kompetensi", icon: Target, href: "/skills-matrix" },
      { label: "Exam Center", description: "Pusat ujian karyawan", icon: GraduationCap, href: "/sertifikasi" },
    ],
  },
  {
    group: "Akun",
    items: [
      { label: "Profil Saya", description: "Kelola akun dan profil", icon: User, href: "/profile" },
      { label: "Masuk / Daftar", description: "Login atau buat akun", icon: LogIn, href: "/auth" },
    ],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Cari halaman, fitur, atau tools..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-500">Tidak ada hasil ditemukan.</p>
          </div>
        </CommandEmpty>
        {NAV_ITEMS.map((group, gi) => (
          <div key={group.group}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={group.group}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href + item.label}
                  onSelect={() => handleSelect(item.href)}
                  className="cursor-pointer"
                >
                  <item.icon className="mr-3 h-4 w-4 shrink-0 text-purple-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <span>Navigasi dengan ↑↓ lalu Enter untuk membuka</span>
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">
          ESC
        </kbd>
      </div>
    </CommandDialog>
  );
}
