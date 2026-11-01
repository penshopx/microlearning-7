import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { authService } from "@/services/authService";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setReady(!error && !!data.user);
      setChecking(false);
    }).catch(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!ready || busy) return;
    if (password.length < 6) {
      setError("Gunakan kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError("Kata sandi belum dapat diperbarui. Gunakan kata sandi baru yang lebih kuat atau minta tautan pemulihan baru.");
        return;
      }
      const { error: logoutError } = await authService.signOut();
      setPassword("");
      setConfirmation("");
      setDone(true);
      if (logoutError) {
        setError("Kata sandi sudah diperbarui, tetapi sesi belum berhasil ditutup. Coba keluar melalui halaman profil.");
      }
    } catch {
      setError("Tidak dapat menghubungi layanan autentikasi. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <SEO title="Ganti Kata Sandi - Chaesa Live" description="Atur kata sandi baru untuk akun Anda." />
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-gray-900 border-gray-700 space-y-5">
          <h1 className="text-2xl font-bold">Ganti Kata Sandi</h1>
          {error && <p role="alert" className="text-red-300">{error}</p>}
          {checking ? <p role="status">Memeriksa tautan pemulihan...</p> : done ? (
            <div className="space-y-4">
              <p role="status">Kata sandi berhasil diperbarui.</p>
              <Link href={error ? "/profile" : "/auth?mode=login"} className="text-blue-300 underline">
                {error ? "Buka profil" : "Masuk dengan kata sandi baru"}
              </Link>
            </div>
          ) : !ready ? (
            <div className="space-y-4">
              <p>Tautan pemulihan tidak valid atau sudah kedaluwarsa.</p>
              <Link href="/auth" className="text-blue-300 underline">Minta tautan baru melalui Lupa Password</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">Kata sandi baru</Label>
                <Input id="new-password" type="password" autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} disabled={busy} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi kata sandi</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password"
                  value={confirmation} onChange={e => setConfirmation(e.target.value)}
                  required minLength={6} disabled={busy} />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Menyimpan..." : "Simpan kata sandi"}
              </Button>
            </form>
          )}
        </Card>
      </main>
    </>
  );
}
