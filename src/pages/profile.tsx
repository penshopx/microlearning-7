import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  User, Mail, Edit3, Save, LogOut, Key,
  BarChart3, Settings, Crown, CheckCircle, Loader2
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading, userName } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>("Free");
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("active");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/auth?mode=login");
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
      setDisplayName(name);
      loadSubscription(user.id);
    }
  }, [user]);

  async function loadSubscription(userId: string) {
    try {
      const status = await authService.getSubscriptionStatus(userId);
      if (status) {
        const planLabel = status.plan === "free" ? "Free" : status.plan === "pro" ? "Pro" : status.plan === "business" ? "Business" : status.plan === "yearly" ? "Yearly" : "Free";
        setSubscriptionPlan(planLabel);
        setSubscriptionStatus(status.isActive ? "active" : "inactive");
      }
    } catch {
      setSubscriptionPlan("Free");
    }
  }

  async function handleSaveName() {
    if (!user || !displayName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await authService.updateProfile(user.id, {
        full_name: displayName.trim(),
      });
      if (error) throw error;
      await supabase.auth.updateUser({
        data: { full_name: displayName.trim() },
      });
      setIsEditing(false);
      toast({
        title: "Profil Diperbarui",
        description: "Nama tampilan berhasil diubah",
      });
    } catch (err: any) {
      toast({
        title: "Gagal Memperbarui",
        description: err?.message || "Terjadi kesalahan, coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout Berhasil",
        description: "Anda telah keluar dari akun",
      });
      router.push("/");
    } catch {
      toast({
        title: "Error",
        description: "Gagal logout, silakan coba lagi",
        variant: "destructive",
      });
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      toast({
        title: "Email Terkirim",
        description: "Link reset password telah dikirim ke email Anda",
      });
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err?.message || "Gagal mengirim email reset password",
        variant: "destructive",
      });
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-gray-500 dark:text-gray-400">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  const avatarInitial = (displayName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <>
      <SEO
        title="Profil — Chaesa Live"
        description="Kelola profil dan akun Anda di Chaesa Live"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/20">
        <PageHeader title="Profil" icon={User} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <User className="w-8 h-8 text-purple-600" />
              Profil Saya
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Kelola informasi akun dan preferensi Anda
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                {avatarInitial}
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {displayName || "User"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 break-all">
                {user?.email}
              </p>
              <Badge className={`mt-3 ${
                subscriptionPlan !== "Free"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                  : "bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
              }`}>
                <Crown className="w-3 h-3 mr-1" />
                {subscriptionPlan}
              </Badge>
              {subscriptionStatus === "active" && subscriptionPlan !== "Free" && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Aktif
                </div>
              )}
            </Card>

            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Edit3 className="w-5 h-5 text-purple-500" />
                  Informasi Profil
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{user?.email}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600 dark:text-gray-400">Nama Tampilan</Label>
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Masukkan nama tampilan"
                          className="max-w-xs"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={isSaving || !displayName.trim()}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            setDisplayName(
                              user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""
                            );
                          }}
                        >
                          Batal
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {displayName || "Belum diatur"}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                          className="text-purple-600 dark:text-purple-400"
                        >
                          <Edit3 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Langganan
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      Paket Saat Ini: <span className="text-purple-600 dark:text-purple-400">{subscriptionPlan}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {subscriptionPlan === "Free"
                        ? "Upgrade untuk fitur premium"
                        : "Langganan aktif"}
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">
                      {subscriptionPlan === "Free" ? "Upgrade" : "Kelola"}
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-gray-500" />
                  Akun
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={handleResetPassword}
                  >
                    <Key className="w-4 h-4" />
                    Ubah Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar dari Akun
                  </Button>
                </div>
              </Card>

              <Card className="p-6 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-green-500" />
                  Pintasan
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Crown className="w-4 h-4" />
                      Harga
                    </Button>
                  </Link>
                  <Link href="/ai-studio">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Settings className="w-4 h-4" />
                      AI Studio
                    </Button>
                  </Link>
                  <Link href="/creator-dashboard">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Edit3 className="w-4 h-4" />
                      Creator Dashboard
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}