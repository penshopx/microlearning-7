import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAIAuthStatus } from "@/hooks/useAIAuthIncident";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

export function AdminAIWarning() {
  const { userId, isAdmin } = useAuth();
  const status = useAIAuthStatus(userId, isAdmin);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const unavailable = status?.status === "unavailable";
  const missingKey = status?.status === "available" && status.hasKey === false;

  if (!isAdmin || !userId || (!unavailable && (!missingKey || dismissedFor === userId))) return null;

  return (
    <div role="alert" className="fixed bottom-4 right-4 z-[9998] max-w-sm w-full shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-amber-950 border border-amber-700/60 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 p-1.5 bg-amber-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-200">
              {unavailable ? "Status insiden AI tidak tersedia" : "Kunci AI belum dikonfigurasi"}
            </p>
            {unavailable ? (
              <p className="text-xs text-amber-200 mt-1 leading-relaxed">
                Penyimpanan insiden AI belum dapat dibaca. Belum dapat dipastikan
                apakah ada insiden aktif. Pemeriksaan diulang otomatis setiap 30
                detik; insiden terakhir yang diketahui tetap ditampilkan.
              </p>
            ) : (
              <>
            <p className="text-xs text-amber-400/80 mt-1 leading-relaxed">
              Fitur AI tidak akan berfungsi untuk pengguna. Tambahkan{" "}
              <code className="font-mono bg-amber-900/60 px-1 py-0.5 rounded text-amber-300">
                AI_INTEGRATIONS_OPENAI_API_KEY
              </code>{" "}
              di Secrets.
            </p>
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Dapatkan API key <ExternalLink className="h-3 w-3" />
            </a>
              </>
            )}
          </div>
          {!unavailable && (
          <button
            onClick={() => setDismissedFor(userId)}
            className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:text-amber-300 hover:bg-amber-800/50 transition-colors"
            aria-label="Tutup peringatan"
          >
            <X className="h-4 w-4" />
          </button>
          )}
        </div>
      </div>
    </div>
  );
}
