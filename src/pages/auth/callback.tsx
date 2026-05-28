import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Memproses autentikasi...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session) {
          setStatus("success");
          setMessage("Login berhasil! Mengalihkan...");
          setTimeout(() => {
            router.replace("/");
          }, 1500);
        } else {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (setError) throw setError;

            setStatus("success");
            setMessage("Login berhasil! Mengalihkan...");
            setTimeout(() => {
              router.replace("/");
            }, 1500);
          } else {
            throw new Error("Sesi tidak ditemukan");
          }
        }
      } catch (err: any) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setMessage(err?.message || "Gagal memproses autentikasi");
        setTimeout(() => {
          router.replace("/auth");
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        {status === "loading" && (
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto" />
        )}
        {status === "success" && (
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
        )}
        {status === "error" && (
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        )}
        <p className="text-lg text-gray-300">{message}</p>
        {status === "error" && (
          <p className="text-sm text-gray-500">Mengalihkan ke halaman login...</p>
        )}
      </div>
    </div>
  );
}
