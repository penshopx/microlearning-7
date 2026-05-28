import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ThemeSwitch } from "@/components/ThemeSwitch"
import { 
  Home, BookOpen, Mic, Brain, Calendar, 
  Search, MessageSquare, ArrowLeft, Sparkles 
} from "lucide-react"
import { ChaesaLogo } from "@/components/ChaesaLogo"

const quickLinks = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: BookOpen },
  { href: "/ai-studio", label: "AI Studio", icon: Brain },
  { href: "/micro-learning", label: "Micro-Learning", icon: Sparkles },
  { href: "/schedule", label: "Jadwal Live", icon: Calendar },
  { href: "/pricing", label: "Harga", icon: Search },
]

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Halaman Tidak Ditemukan | Chaesa Live</title>
        <meta name="description" content="Halaman yang Anda cari tidak ditemukan" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-50 to-gray-100 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <ChaesaLogo size={32} />
            <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Chaesa Live</span>
          </Link>
          <ThemeSwitch />
        </header>

        <div className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="max-w-lg w-full text-center space-y-8">
            <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-purple-500/10 dark:bg-purple-500/20 animate-pulse" />
              <div className="absolute inset-3 rounded-full bg-purple-500/15 dark:bg-purple-500/25" />
              <span className="relative text-7xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent select-none">
                404
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Oops! Halaman Tidak Ditemukan
              </h1>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Halaman ini mungkin sudah dipindahkan, dihapus, atau belum pernah ada. Coba kembali ke beranda atau kunjungi salah satu halaman populer di bawah.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <link.icon className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="outline" className="border-gray-300 dark:border-white/20 dark:text-white dark:hover:bg-white/10">
                <Link href="/" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Beranda
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Buka Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
