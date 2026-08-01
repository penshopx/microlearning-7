import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

export function AdminAIWarning() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    let mounted = true;

    async function check() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const res = await fetch("/api/admin/ai-status", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) return; // 401/403 = not admin, ignore silently

        const data = await res.json();
        if (mounted && !data.hasKey) {
          setShow(true);
        }
      } catch {
        // silently ignore — this is a non-critical check
      }
    }

    check();
    return () => { mounted = false; };
  }, [dismissed]);

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9998] max-w-sm w-full shadow-2xl rounded-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-amber-950 border border-amber-700/60 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0 p-1.5 bg-amber-500/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-200">
              Kunci AI belum dikonfigurasi
            </p>
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
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:text-amber-300 hover:bg-amber-800/50 transition-colors"
            aria-label="Tutup peringatan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
