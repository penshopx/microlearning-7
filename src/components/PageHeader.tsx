import Link from "next/link";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, LogIn, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ChaesaLogo } from "@/components/ChaesaLogo";

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  showAuth?: boolean;
  backHref?: string;
  backLabel?: string;
  rightContent?: ReactNode;
}

export function PageHeader({
  title,
  icon: Icon,
  showAuth = true,
  backHref = "/",
  backLabel = "Beranda",
  rightContent,
}: PageHeaderProps) {
  const { isLoggedIn, userName, user } = useAuth();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-lg shrink-0"
          >
            <ChaesaLogo size={28} />
            <span className="hidden sm:inline">Chaesa Live</span>
          </Link>
          <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
          <div className="flex items-center gap-1.5 min-w-0">
            {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />}
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium truncate">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {rightContent}

          {showAuth && (
            <>
              {isLoggedIn ? (
                <Link
                  href="/profile"
                  className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors truncate max-w-[140px]"
                >
                  {userName || user?.email}
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Login
                </Link>
              )}
            </>
          )}

          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                ctrlKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            title="Pencarian cepat (Ctrl+K)"
          >
            <Search className="w-3 h-3" />
            <span className="hidden md:inline">Cari...</span>
            <kbd className="hidden md:inline px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono ml-1">
              ⌘K
            </kbd>
          </button>

          <NotificationCenter />
          <ThemeSwitch />

          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
