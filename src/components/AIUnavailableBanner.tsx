import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, X } from "lucide-react";
import {
  AI_UNAVAILABLE_EVENT,
  type AIUnavailableDetails,
} from "@/lib/ai-client";

export function AIUnavailableBanner() {
  const [details, setDetails] = useState<AIUnavailableDetails | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleUnavailable = (event: Event) => {
      const customEvent = event as CustomEvent<AIUnavailableDetails>;
      setDetails(customEvent.detail || {});
      setDismissed(false);
    };

    window.addEventListener(AI_UNAVAILABLE_EVENT, handleUnavailable);
    return () => window.removeEventListener(AI_UNAVAILABLE_EVENT, handleUnavailable);
  }, []);

  if (!details || dismissed) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 z-[10000] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-amber-500/60 bg-amber-950 px-4 py-3 text-amber-100 shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">AI sedang tidak tersedia sementara</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-200/85">
            {details.error ||
              "Kunci API AI tidak valid. Silakan coba lagi nanti. Jika Anda admin, perbarui konfigurasi AI."}
          </p>
          <Link
            href={details.adminUrl || "/admin"}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-300 underline underline-offset-2 hover:text-amber-100"
          >
            Buka halaman admin untuk memperbaiki konfigurasi
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Tutup notifikasi AI"
          className="shrink-0 rounded-md p-1 text-amber-300/70 transition-colors hover:bg-amber-800/60 hover:text-amber-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}