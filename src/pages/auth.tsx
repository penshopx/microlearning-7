import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import { ChaesaLogo } from "@/components/ChaesaLogo";
import { authService } from "@/services/authService";

export default function AuthPage() {
  const router = useRouter();
  const { mode } = router.query; // 'login' or 'register'
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  // Handle email input change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmail(value)) {
      setEmailError("Format email tidak valid");
    } else {
      setEmailError("");
    }
  };

  useEffect(() => {
    if (mode === "register") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [mode]);

  useEffect(() => {
    // Check if already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format before submitting
    if (!validateEmail(email)) {
      toast({
        title: "Email Tidak Valid",
        description: "Mohon periksa kembali format email Anda. Contoh: nama@email.com",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setSuccess("Login berhasil! Mengalihkan...");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      } else {
        // Register
        if (!fullName.trim()) {
          throw new Error("Nama lengkap harus diisi");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        setSuccess("Pendaftaran berhasil! Silakan cek email untuk verifikasi.");
        
        // Auto login after register (if email confirmation not required)
        if (data.session) {
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title={isLogin ? "Masuk - Chaesa Live" : "Daftar - Chaesa Live"}
        description="Masuk atau daftar untuk mengakses fitur lengkap Chaesa Live"
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-white/5 backdrop-blur-sm border-white/10">
          {/* Back to Home */}
          <Link href="/">
            <Button variant="ghost" className="mb-6 text-gray-300 hover:text-white -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <ChaesaLogo size={44} />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Chaesa Live</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Masuk ke Akun Anda" : "Daftar Akun Baru"}
          </h1>
          <p className="text-gray-400 mb-8">
            {isLogin 
              ? "Masukkan email dan password untuk melanjutkan" 
              : "Mulai transformasi meeting Anda jadi sumber penghasilan"}
          </p>

          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white flex items-center justify-center gap-3"
            disabled={isLoading}
            onClick={async () => {
              try {
                setIsLoading(true);
                setError("");
                const { error } = await authService.signInWithGoogle();
                if (error) throw error;
                setTimeout(() => setIsLoading(false), 5000);
              } catch (err: any) {
                console.error("Google auth error:", err);
                setError(err.message || "Gagal login dengan Google. Silakan coba lagi.");
                setIsLoading(false);
              }
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {isLogin ? "Masuk dengan Google" : "Daftar dengan Google"}
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-gray-400">atau lanjut dengan email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name (Register only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-300">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={handleEmailChange}
                required
                className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {emailError && (
                <p className="text-sm text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-purple-500"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Forgot Password (Login only) */}
            {isLogin && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      toast({
                        title: "Email Diperlukan",
                        description: "Masukkan email Anda terlebih dahulu, lalu klik Lupa Password",
                        variant: "destructive"
                      });
                      return;
                    }
                    if (!validateEmail(email)) {
                      toast({
                        title: "Email Tidak Valid",
                        description: "Masukkan email yang valid untuk reset password",
                        variant: "destructive"
                      });
                      return;
                    }
                    try {
                      setIsLoading(true);
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/auth`,
                      });
                      if (error) throw error;
                      toast({
                        title: "Email Terkirim",
                        description: "Link reset password telah dikirim ke email Anda. Periksa inbox Anda.",
                      });
                    } catch (err: any) {
                      toast({
                        title: "Gagal",
                        description: err?.message || "Gagal mengirim email reset password",
                        variant: "destructive"
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading || !!emailError}
            >
              {isLoading ? "Memproses..." : (isLogin ? "Masuk" : "Daftar Gratis")}
            </Button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setSuccess("");
                  router.push(`/auth?mode=${isLogin ? "register" : "login"}`, undefined, { shallow: true });
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                {isLogin ? "Daftar di sini" : "Masuk di sini"}
              </button>
            </p>
          </div>

          {/* Benefits (Register only) */}
          {!isLogin && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-4">Dengan mendaftar, Anda mendapatkan:</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Meeting unlimited 40 menit (Gratis)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Max 100 peserta per meeting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Akses chatbot AI support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Upgrade ke Pro kapan saja (Rp 99K/bulan)
                </li>
              </ul>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}