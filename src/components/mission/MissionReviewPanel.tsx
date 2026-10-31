import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clock3, ExternalLink, FileText, LoaderCircle, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  missionReviewService,
  type ReviewSubmission,
  type SupervisorAssignment,
} from "@/services/missionReviewService";
import { normalizeMissionProgress } from "@/services/microLearningService";

type MissionReviewPanelProps = {
  courseId: string;
  isOwner: boolean;
};

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu tidak tersedia"
    : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MissionReviewPanel({ courseId, isOwner }: MissionReviewPanelProps) {
  const [authReady, setAuthReady] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<SupervisorAssignment[]>([]);
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
  const [participantId, setParticipantId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [feedbackByProgress, setFeedbackByProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestSequence = useRef(0);
  const authUserRef = useRef<string | null>(null);
  const authInitialized = useRef(false);

  useEffect(() => {
    let active = true;
    const clearPrivateState = (nextUserId: string | null) => {
      if (authInitialized.current && authUserRef.current === nextUserId) return;
      authInitialized.current = true;
      authUserRef.current = nextUserId;
      requestSequence.current += 1;
      setAssignments([]);
      setSubmissions([]);
      setFeedbackByProgress({});
      setParticipantId("");
      setSupervisorId("");
      setError("");
      setNotice("");
      setAuthUserId(nextUserId);
      setAuthReady(true);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session?.user.id !== authUserRef.current) clearPrivateState(session?.user.id ?? null);
    });
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active || authInitialized.current) return;
      if (authError) {
        clearPrivateState(null);
        setError("Sesi tidak dapat diperiksa. Muat ulang untuk mencoba lagi.");
      } else {
        clearPrivateState(data.user?.id ?? null);
      }
    }).catch(() => {
      if (!active || authInitialized.current) return;
      clearPrivateState(null);
      setError("Sesi tidak dapat diperiksa. Muat ulang untuk mencoba lagi.");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async (showLoading = false) => {
    if (!courseId || !authReady) return;
    const sequence = ++requestSequence.current;
    if (showLoading) setLoading(true);
    setError("");
    try {
      const results = await Promise.all([
        isOwner ? missionReviewService.getAssignments(courseId) : Promise.resolve(null),
        missionReviewService.getSubmissions(courseId),
      ]);
      if (sequence !== requestSequence.current) return;
      const [assignmentResult, submissionResult] = results;
      if (assignmentResult?.error) throw assignmentResult.error;
      if (submissionResult.error) throw submissionResult.error;
      setAssignments(assignmentResult?.data ?? []);
      setSubmissions(submissionResult.data ?? []);
    } catch {
      if (sequence === requestSequence.current) {
        setError("Data peninjauan belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [authReady, courseId, isOwner]);

  useEffect(() => {
    if (!authReady) return;
    void refresh(true);
    const poll = window.setInterval(() => void refresh(), 30_000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [authUserId, authReady, refresh]);

  const addAssignment = async () => {
    const participant = participantId.trim();
    const supervisor = supervisorId.trim();
    if (!USER_ID_PATTERN.test(participant) || !USER_ID_PATTERN.test(supervisor)) {
      setError("Masukkan UUID pengguna yang valid pada kedua kolom.");
      return;
    }
    setBusyId("assignment-add");
    setError("");
    setNotice("");
    try {
      const result = await missionReviewService.assignSupervisor(courseId, participant, supervisor);
      if (result.error) throw result.error;
      setParticipantId("");
      setSupervisorId("");
      setNotice("Pendamping berhasil ditugaskan.");
      await refresh();
    } catch {
      setError("Penugasan belum tersimpan. Periksa UUID dan coba lagi.");
    } finally {
      setBusyId("");
    }
  };

  const removeAssignment = async (assignment: SupervisorAssignment) => {
    if (!window.confirm("Cabut penugasan pendamping ini?")) return;
    setBusyId(assignment.id);
    setError("");
    setNotice("");
    try {
      const result = await missionReviewService.removeAssignment(assignment.id);
      if (result.error) throw result.error;
      setNotice("Penugasan pendamping telah dicabut.");
      await refresh();
    } catch {
      setError("Penugasan belum dapat dicabut. Coba lagi.");
    } finally {
      setBusyId("");
    }
  };

  const openEvidence = async (storagePath: string, key: string) => {
    // Open during the click event so browsers do not block the window while
    // the signed URL request is in flight. Disconnect the opener immediately.
    const opened = window.open("about:blank", "_blank");
    if (!opened) {
      setError("Jendela bukti diblokir. Izinkan pop-up lalu buka kembali.");
      return;
    }
    opened.opener = null;
    setBusyId(`evidence:${key}`);
    setError("");
    try {
      const temporaryUrl = await missionReviewService.openEvidence(storagePath);
      opened.location.replace(temporaryUrl);
    } catch {
      opened.close();
      setError("Bukti belum dapat dibuka. Tautan akses sementara gagal dibuat.");
    } finally {
      setBusyId("");
    }
  };

  const submitReview = async (submission: ReviewSubmission, status: "approved" | "retry_requested") => {
    const feedback = (feedbackByProgress[submission.id] ?? "").trim();
    if (feedback.length > 1000) {
      setError("Masukan harus berisi maksimal 1.000 karakter.");
      return;
    }
    if (status === "retry_requested" && !feedback) {
      setError("Tambahkan arahan singkat sebelum meminta peserta mencoba lagi.");
      return;
    }
    setBusyId(submission.id);
    setError("");
    setNotice("");
    try {
      const result = await missionReviewService.reviewSubmission(submission.id, status, feedback);
      if (result.error || !result.data) throw result.error ?? new Error("Review tidak tersimpan");
      setNotice(status === "approved" ? "Bukti disetujui." : "Arahan perbaikan dikirim.");
      setFeedbackByProgress((current) => ({ ...current, [submission.id]: "" }));
      await refresh();
    } catch {
      setError("Peninjauan belum tersimpan. Coba lagi.");
    } finally {
      setBusyId("");
    }
  };

  if (!authReady) {
    return <div className="animate-pulse rounded-2xl border border-blue-200/15 bg-slate-900/70 p-6" aria-label="Memeriksa sesi"><div className="h-5 w-40 rounded bg-blue-200/15" /><div className="mt-4 h-16 rounded bg-blue-200/10" /></div>;
  }

  if (!authUserId) {
    return <section className="rounded-2xl border border-blue-200/20 bg-slate-900 p-5 text-blue-50"><h2 className="font-semibold">Tinjauan misi</h2><p className="mt-2 text-sm text-blue-100/75">Masuk untuk mengakses peninjauan dan bukti praktik.</p></section>;
  }

  return (
    <section className="space-y-5 rounded-2xl border border-blue-300/20 bg-slate-950/80 p-4 text-blue-50 shadow-lg shadow-slate-950/20 sm:p-6" aria-labelledby="mission-review-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="rounded-xl border border-sky-300/20 bg-sky-400/10 p-2.5"><ShieldCheck className="h-5 w-5 text-sky-200" /></div>
          <div>
            <h2 id="mission-review-title" className="text-lg font-semibold tracking-tight">Tinjauan praktik</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-blue-100/70">Bukti praktik tetap privat. Pendamping memberi arahan untuk percobaan berikutnya.</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh(true)} disabled={loading} data-testid="button-refresh-reviews" className="border-blue-200/20 bg-blue-950/50 text-blue-50 hover:bg-blue-900/70">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
        </Button>
      </header>

      {error && <div role="alert" className="rounded-lg border border-rose-300/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100" data-testid="alert-review-error">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-sky-300/25 bg-sky-950/45 px-4 py-3 text-sm text-sky-100" data-testid="status-review-notice">{notice}</div>}
      <p className="break-all text-xs text-blue-100/70">
        ID akun Anda: <span className="select-all font-mono">{authUserId}</span>.
        {" "}Bagikan ID ini kepada pemilik kursus untuk penugasan. Setelah ditugaskan, pendamping membuka alamat halaman kursus ini untuk meninjau.
      </p>

      {isOwner && (
        <div className="rounded-xl border border-blue-200/15 bg-blue-950/35 p-4 sm:p-5">
          <div className="flex items-center gap-2"><h3 className="font-semibold">Penugasan pendamping</h3><span className="rounded-full bg-blue-300/10 px-2 py-0.5 text-[11px] font-medium text-blue-100">Pemilik kursus</span></div>
          <p className="mt-1 text-sm leading-relaxed text-blue-100/70">Hanya pemilik kursus yang dapat menetapkan pendamping. Pemilik tidak otomatis menjadi peninjau.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="block text-xs font-medium text-blue-100/80">UUID peserta
              <input value={participantId} onChange={(event) => setParticipantId(event.target.value)} autoComplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" data-testid="input-review-participant" className="mt-1.5 w-full rounded-lg border border-blue-200/20 bg-slate-950 px-3 py-2.5 text-sm text-blue-50 outline-none placeholder:text-blue-100/30 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/15" />
            </label>
            <label className="block text-xs font-medium text-blue-100/80">UUID pendamping
              <input value={supervisorId} onChange={(event) => setSupervisorId(event.target.value)} autoComplete="off" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" data-testid="input-review-supervisor" className="mt-1.5 w-full rounded-lg border border-blue-200/20 bg-slate-950 px-3 py-2.5 text-sm text-blue-50 outline-none placeholder:text-blue-100/30 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/15" />
            </label>
            <Button type="button" onClick={() => void addAssignment()} disabled={Boolean(busyId) || !participantId.trim() || !supervisorId.trim()} data-testid="button-assign-supervisor" className="bg-sky-300 text-slate-950 hover:bg-sky-200">
              {busyId === "assignment-add" && <LoaderCircle className="h-4 w-4 animate-spin" />} Tugaskan
            </Button>
          </div>
          <div className="mt-5 border-t border-blue-100/10 pt-4">
            <h4 className="text-sm font-semibold text-blue-50">Penugasan aktif <span className="ml-1 font-normal text-blue-100/55">({assignments.length})</span></h4>
            {loading ? <div className="mt-3 h-12 animate-pulse rounded-lg bg-blue-100/5" /> : assignments.length === 0 ? (
              <p className="mt-2 text-sm text-blue-100/60">Belum ada pendamping yang ditetapkan untuk kursus ini.</p>
            ) : (
              <ul className="mt-3 divide-y divide-blue-100/10">
                {assignments.map((assignment) => (
                  <li key={assignment.id} data-testid={`assignment-${assignment.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0"><p className="text-blue-50">Peserta <span className="font-mono text-xs text-blue-100/75">{assignment.participant_id}</span></p><p className="mt-1 text-blue-100/65">Pendamping <span className="font-mono text-xs">{assignment.supervisor_id}</span></p></div>
                    <Button type="button" variant="outline" size="sm" disabled={Boolean(busyId)} onClick={() => void removeAssignment(assignment)} data-testid={`button-revoke-assignment-${assignment.id}`} className="border-blue-200/20 bg-transparent text-blue-100 hover:border-rose-300/40 hover:bg-rose-950/30 hover:text-rose-100">
                      {busyId === assignment.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Cabut
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {!isOwner && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100/10 pb-3">
            <h3 className="font-semibold">Bukti yang menunggu ditinjau</h3><span className="text-xs text-blue-100/55">{submissions.length} kiriman</span>
          </div>
          {loading ? (
            <div className="space-y-3" aria-label="Memuat kiriman"><div className="h-32 animate-pulse rounded-xl bg-blue-100/5" /><div className="h-32 animate-pulse rounded-xl bg-blue-100/5" /></div>
          ) : submissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-blue-100/15 bg-blue-950/20 px-5 py-8 text-center">
              <Clock3 className="mx-auto h-6 w-6 text-sky-200/70" /><p className="mt-3 font-medium text-blue-50">Belum ada kiriman untuk ditinjau</p><p className="mt-1 text-sm text-blue-100/60">Kiriman peserta yang berada dalam cakupan pendampingan akan muncul di sini.</p>
            </div>
          ) : submissions.map((submission) => {
            const progress = normalizeMissionProgress(submission.mission_progress);
            const busy = busyId === submission.id;
            return (
              <article key={submission.id} data-testid={`submission-${submission.id}`} className="overflow-hidden rounded-xl border border-blue-100/15 bg-slate-900/80">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-100/10 bg-blue-950/35 px-4 py-4">
                  <div><p className="text-xs font-medium uppercase tracking-wider text-sky-200">Kiriman praktik</p><h4 className="mt-1 font-semibold text-blue-50">{submission.module_title || "Langkah misi"}</h4><p className="mt-1 text-xs text-blue-100/60">Peserta <span className="font-mono">{submission.user_id}</span></p></div>
                  <span className="rounded-full border border-blue-200/15 bg-blue-200/5 px-2.5 py-1 text-xs text-blue-100/75">{submission.review?.status === "retry_requested" ? "Perlu dicoba lagi" : submission.review?.status === "approved" ? "Disetujui" : "Menunggu tinjauan"}</span>
                </div>
                <div className="space-y-4 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/55">Refleksi peserta</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-blue-50/90">{progress.feedback || "Peserta belum menambahkan refleksi."}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-100/55">Bukti yang diunggah <span className="font-normal normal-case">({progress.evidenceUploads.length})</span></p>
                    {progress.evidenceUploads.length ? (
                      <ul className="mt-2 space-y-2">
                        {progress.evidenceUploads.map((upload) => (
                          <li key={`${upload.evidenceId}-${upload.storagePath}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100/10 bg-slate-950/55 p-3">
                            <div className="flex min-w-0 items-start gap-2.5"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-sky-200" /><div className="min-w-0"><p className="break-all text-sm font-medium text-blue-50">{upload.fileName}</p><p className="mt-1 text-xs text-blue-100/55">{upload.mimeType || "Jenis file tidak diketahui"} · {formatSize(upload.sizeBytes)} · Diunggah {formatDate(upload.uploadedAt)}</p></div></div>
                            <Button type="button" variant="outline" size="sm" onClick={() => void openEvidence(upload.storagePath, `${submission.id}-${upload.evidenceId}`)} disabled={Boolean(busyId)} data-testid={`button-open-evidence-${submission.id}-${upload.evidenceId}`} className="shrink-0 border-sky-200/25 bg-blue-950/50 text-sky-100 hover:bg-blue-900">
                              {busyId === `evidence:${submission.id}-${upload.evidenceId}` ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />} Buka bukti
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-1.5 text-sm text-blue-100/55">Tidak ada file bukti pada kiriman ini.</p>}
                  </div>
                  {submission.review && (
                    <div className={`rounded-lg border p-3 ${submission.review.status === "approved" ? "border-sky-200/20 bg-sky-950/30" : "border-amber-200/20 bg-amber-950/20"}`}>
                      <p className="text-xs font-semibold text-blue-50">Tinjauan terakhir · {formatDate(submission.review.reviewed_at)}</p><p className="mt-1 whitespace-pre-wrap text-sm text-blue-100/80">{submission.review.feedback || "Tidak ada catatan tambahan."}</p>
                    </div>
                  )}
                  <div className="border-t border-blue-100/10 pt-4">
                    <label className="block text-xs font-semibold text-blue-100/75">Masukan untuk peserta <span className="font-normal text-blue-100/45">· maksimal 1.000 karakter</span>
                      <Textarea value={feedbackByProgress[submission.id] ?? ""} maxLength={1000} onChange={(event) => setFeedbackByProgress((current) => ({ ...current, [submission.id]: event.target.value }))} placeholder="Sebutkan hal yang sudah baik dan satu langkah konkret berikutnya." data-testid={`textarea-review-feedback-${submission.id}`} className="mt-2 min-h-24 border-blue-100/15 bg-slate-950 text-blue-50 placeholder:text-blue-100/35 focus-visible:ring-sky-300/50" />
                    </label>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs text-blue-100/45">{(feedbackByProgress[submission.id] ?? "").length}/1.000</span>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => void submitReview(submission, "retry_requested")} disabled={Boolean(busyId)} data-testid={`button-request-retry-${submission.id}`} className="border-amber-200/25 bg-amber-950/20 text-amber-100 hover:bg-amber-900/40">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />} Minta praktik ulang</Button>
                        <Button type="button" onClick={() => void submitReview(submission, "approved")} disabled={Boolean(busyId)} data-testid={`button-approve-review-${submission.id}`} className="bg-sky-300 text-slate-950 hover:bg-sky-200"><Check className="h-4 w-4" /> Setujui</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default MissionReviewPanel;
