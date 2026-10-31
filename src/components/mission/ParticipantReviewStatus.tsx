import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { missionReviewService, type MissionReview } from "@/services/missionReviewService";

type ParticipantReviewStatusProps = {
  progressId: string;
  isSubmitted?: boolean;
  onRetry?: () => Promise<void>;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu tidak tersedia"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function ParticipantReviewStatus({ progressId, isSubmitted = true, onRetry }: ParticipantReviewStatusProps) {
  const [authReady, setAuthReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [review, setReview] = useState<MissionReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const authUserRef = useRef<string | null>(null);
  const loadSequence = useRef(0);
  const authInitialized = useRef(false);

  useEffect(() => {
    let active = true;
    const updateUser = (userId: string | null) => {
      if (authInitialized.current && authUserRef.current === userId) return;
      authInitialized.current = true;
      authUserRef.current = userId;
      loadSequence.current += 1;
      setAuthUserId(userId);
      setReview(null);
      setError("");
      setLoading(true);
      setAuthReady(true);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session?.user.id !== authUserRef.current) updateUser(session?.user.id ?? null);
    });
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active || authInitialized.current) return;
      updateUser(authError ? null : data.user?.id ?? null);
      if (authError) setError("Sesi tidak dapat diperiksa. Muat ulang untuk mencoba lagi.");
    }).catch(() => {
      if (!active || authInitialized.current) return;
      updateUser(null);
      setError("Sesi tidak dapat diperiksa. Muat ulang untuk mencoba lagi.");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadReview = useCallback(async () => {
    if (!authReady || !authUserId || !progressId) return;
    const sequence = ++loadSequence.current;
    setError("");
    try {
      const result = await missionReviewService.getMyReview(progressId);
      if (result.error) throw result.error;
      if (sequence !== loadSequence.current || authUserRef.current !== authUserId) return;
      setReview(result.data ?? null);
    } catch {
      if (sequence === loadSequence.current && authUserRef.current === authUserId) setError("Status tinjauan belum dapat dimuat.");
    } finally {
      if (sequence === loadSequence.current && authUserRef.current === authUserId) setLoading(false);
    }
  }, [authReady, authUserId, progressId]);

  useEffect(() => {
    if (!authReady) return;
    if (!authUserId) {
      setReview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadReview();
    const poll = window.setInterval(() => void loadReview(), 30_000);
    const onFocus = () => void loadReview();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [authUserId, authReady, loadReview, isSubmitted]);

  const retryPractice = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    setError("");
    try {
      await onRetry();
    } catch {
      setError("Misi belum dapat dibuka untuk percobaan berikutnya. Coba lagi.");
    } finally {
      setRetrying(false);
    }
  };

  if (!authReady || loading) {
    return <div className="animate-pulse rounded-xl border border-blue-200/15 bg-slate-900/70 p-4" aria-label="Memuat status tinjauan"><div className="h-4 w-36 rounded bg-blue-100/15" /><div className="mt-3 h-9 rounded bg-blue-100/10" /></div>;
  }

  if (!authUserId) return null;

  return (
    <section aria-label="Status tinjauan praktik" className="rounded-xl border border-blue-200/20 bg-slate-900/90 p-4 text-blue-50">
      {error && <div role="alert" className="mb-3 rounded-lg border border-rose-300/25 bg-rose-950/35 px-3 py-2 text-sm text-rose-100" data-testid="alert-participant-review-error">{error}</div>}
      {!review ? (
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" />
          <div className="min-w-0 flex-1"><p className="font-semibold">{isSubmitted ? "Menunggu tinjauan pendamping" : "Bukti belum dikirim untuk ditinjau"}</p><p className="mt-1 text-sm leading-relaxed text-blue-100/65">{isSubmitted ? "Bukti praktikmu sudah dikirim. Status akan diperbarui saat pendamping memberi masukan." : "Selesaikan praktik dan kirim bukti agar pendamping dapat meninjaunya."}</p></div>
          <Button type="button" size="icon" variant="outline" onClick={() => void loadReview()} aria-label="Muat ulang status tinjauan" data-testid="button-refresh-participant-review" className="shrink-0 border-blue-200/20 bg-transparent text-blue-100 hover:bg-blue-900/50"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {review.status === "approved" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-200" /> : <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-semibold">{review.status === "approved" ? "Praktik disetujui" : "Saatnya mencoba lagi"}</h3>
              <span className="text-xs text-blue-100/55">{formatDate(review.reviewed_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-blue-100/80">{review.feedback || (review.status === "approved" ? "Pendamping menyetujui praktikmu." : "Pendamping meminta percobaan ulang.")}</p>
            {review.status === "retry_requested" && onRetry && <Button type="button" onClick={() => void retryPractice()} disabled={retrying} data-testid="button-retry-mission" className="mt-3 bg-sky-300 text-slate-950 hover:bg-sky-200">{retrying && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />} Coba praktik lagi</Button>}
          </div>
        </div>
      )}
    </section>
  );
}

export default ParticipantReviewStatus;
