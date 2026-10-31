import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { CheckCircle2, Clock3, FileText, MessageSquareText, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatTimestamp, isCoachFeedbackComplete } from "@/lib/supervisorReview";
import {
  supervisorReviewService,
  type MissionReviewCommentDraft,
  type SupervisorQueueItem,
} from "@/services/supervisorReviewService";

type QueueFilter = "needs_review" | "completed";

function statusLabel(item: SupervisorQueueItem) {
  if (item.review?.review_status === "resubmission_requested") return "Perlu bukti ulang";
  if (item.review?.review_status === "completed") return "Sudah direview";
  return "Menunggu review";
}

export default function CoachingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<SupervisorQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [filter, setFilter] = useState<QueueFilter>("needs_review");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [glow, setGlow] = useState("");
  const [grow, setGrow] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [comments, setComments] = useState<MissionReviewCommentDraft[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [activeMediaId, setActiveMediaId] = useState("");
  const [mediaSeconds, setMediaSeconds] = useState<Record<string, number>>({});
  const mediaRefs = useRef<Record<string, HTMLMediaElement | null>>({});

  const reload = async () => {
    setLoading(true);
    setError("");
    const result = await supervisorReviewService.getQueue();
    if (result.error) {
      setError("Antrean review tidak dapat dimuat. Pastikan kamu pemilik misi dan coba lagi.");
      setItems([]);
    } else {
      setItems(result.data || []);
      setSelectedId((current) =>
        result.data?.some((item) => item.progress.id === current)
          ? current
          : result.data?.[0]?.progress.id || ""
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void reload();
  }, [user?.id, authLoading]);

  const visibleItems = useMemo(() => items.filter((item) =>
    filter === "completed"
      ? item.review?.review_status === "completed"
      : item.review?.review_status !== "completed"
  ), [filter, items]);
  const selected = visibleItems.find((item) => item.progress.id === selectedId) || visibleItems[0] || null;
  const reviewLocked = selected?.review?.review_status === "completed";
  const mediaUploads = selected?.practiceProgress.evidenceUploads.filter((upload) =>
    upload.mimeType.startsWith("audio/") || upload.mimeType.startsWith("video/")
  ) || [];

  useEffect(() => {
    if (!selected) {
      setSignedUrls({});
      return;
    }
    let active = true;
    void Promise.all(selected.practiceProgress.evidenceUploads.map(async (upload) => {
      const { data, error: signedUrlError } = await supabase.storage
        .from("mission-evidence")
        .createSignedUrl(upload.storagePath, 60 * 30);
      return !signedUrlError && data?.signedUrl
        ? [upload.evidenceId, data.signedUrl] as const
        : null;
    })).then((entries) => {
      if (active) {
        setSignedUrls(Object.fromEntries(entries.filter(
          (entry): entry is readonly [string, string] => Boolean(entry)
        )));
      }
    });
    return () => { active = false; };
  }, [selected?.progress.id]);

  useEffect(() => {
    setGlow(selected?.review?.glow_feedback || "");
    setGrow(selected?.review?.grow_feedback || "");
    setNextSteps(selected?.review?.next_steps || "");
    setComments([]);
    setCommentDraft("");
    setActiveMediaId(mediaUploads[0]?.evidenceId || "");
    setNotice("");
    if (!selected?.review?.id) return;
    let active = true;
    void supervisorReviewService.getComments(selected.review.id).then(({ data }) => {
      if (active && data) {
        setComments(data.map(({ evidence_id, timestamp_seconds, comment_text }) => ({
          evidence_id,
          timestamp_seconds,
          comment_text,
        })));
      }
    });
    return () => { active = false; };
  }, [selected?.progress.id, selected?.review?.updated_at]);

  const addTimestampComment = () => {
    const text = commentDraft.trim();
    if (reviewLocked || !activeMediaId || !text || !mediaRefs.current[activeMediaId]) return;
    setComments((current) => [...current, {
      evidence_id: activeMediaId,
      timestamp_seconds: Math.floor(mediaRefs.current[activeMediaId]?.currentTime || 0),
      comment_text: text,
    }].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
    setCommentDraft("");
  };

  const jumpToTimestamp = (comment: MissionReviewCommentDraft) => {
    const media = mediaRefs.current[comment.evidence_id];
    if (!media) return;
    setActiveMediaId(comment.evidence_id);
    media.currentTime = comment.timestamp_seconds;
    void media.play().catch(() => undefined);
  };

  const submitReview = async (reviewStatus: "completed" | "resubmission_requested") => {
    if (!selected || !user || saving || reviewLocked) return;
    if (!isCoachFeedbackComplete({ glowFeedback: glow, growFeedback: grow, nextSteps })) {
      setError("Isi kekuatan, hal yang perlu ditingkatkan, dan langkah berikutnya.");
      return;
    }
    setSaving(true);
    setError("");
    const result = await supervisorReviewService.saveReview({
      learnerProgressId: selected.progress.id,
      reviewerId: user.id,
      reviewStatus,
      glowFeedback: glow,
      growFeedback: grow,
      nextSteps,
      comments,
    });
    setSaving(false);
    if (result.error || !result.data) {
      setError("Feedback belum tersimpan. Periksa koneksi dan hak akses misi ini.");
      return;
    }
    setNotice(reviewStatus === "completed"
      ? "Feedback tersimpan dan praktik ditandai selesai."
      : "Feedback tersimpan. Peserta diminta mengirim bukti praktik yang diperbarui.");
    await reload();
  };

  if (authLoading || loading && !items.length) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <PageHeader title="Review praktik" backHref="/micro-learning" />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-slate-400">Memuat antrean review...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <PageHeader title="Review praktik" backHref="/micro-learning" />
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Masuk untuk meninjau praktik</h1>
          <p className="mt-3 text-slate-400">Review hanya tersedia bagi pemilik misi.</p>
          <Button asChild className="mt-6 bg-blue-500 text-white hover:bg-blue-400"><Link href="/auth">Masuk</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head><title>Review praktik | Chaesa Live</title></Head>
      <SEO title="Review praktik" description="Tinjau bukti dan berikan coaching untuk praktik kerja berikutnya." />
      <main className="min-h-screen bg-slate-950 text-white">
        <PageHeader title="Review praktik" backHref="/micro-learning" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">Coaching</p>
              <h1 className="mt-2 text-3xl font-bold">Bukti praktik peserta</h1>
              <p className="mt-2 text-slate-400">Berikan feedback yang jelas untuk satu pengulangan berikutnya.</p>
            </div>
            <Button variant="outline" onClick={() => void reload()} disabled={loading}
              className="border-white/15 text-slate-100 hover:bg-white/10">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Muat ulang
            </Button>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <section aria-label="Antrean review" className="space-y-4">
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-900 p-1">
                {(["needs_review", "completed"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setFilter(value)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      filter === value ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
                    }`}>
                    {value === "needs_review" ? "Perlu ditinjau" : "Selesai"}
                  </button>
                ))}
              </div>
              {visibleItems.length === 0 ? (
                <Card className="border-white/10 bg-slate-900 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />
                  <p className="mt-3 font-semibold">{filter === "completed" ? "Belum ada review selesai" : "Antrean sudah kosong"}</p>
                  <p className="mt-1 text-sm text-slate-400">Bukti baru dari peserta akan muncul di sini.</p>
                </Card>
              ) : visibleItems.map((item) => (
                <button key={item.progress.id} type="button" onClick={() => setSelectedId(item.progress.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selected?.progress.id === item.progress.id
                      ? "border-blue-400 bg-blue-500/10"
                      : "border-white/10 bg-slate-900 hover:border-white/25"
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug">{item.moduleTitle}</p>
                    <Badge className={item.review?.review_status === "resubmission_requested"
                      ? "shrink-0 border border-amber-300/20 bg-amber-400/10 text-amber-200"
                      : item.review?.review_status === "completed"
                        ? "shrink-0 border border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                        : "shrink-0 border border-blue-300/20 bg-blue-400/10 text-blue-200"}>
                      {statusLabel(item)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{item.courseTitle}</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <Clock3 className="h-3.5 w-3.5" />
                    {item.progress.completed_at
                      ? new Date(item.progress.completed_at).toLocaleDateString("id-ID")
                      : "Waktu tidak tersedia"}
                    <span>·</span>{item.practiceProgress.evidenceUploads.length} bukti
                  </p>
                </button>
              ))}
            </section>

            <section aria-label="Detail dan feedback">
              {error && <p role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
              {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{notice}</p>}
              {!selected ? (
                error ? null : <Card className="border-white/10 bg-slate-900 p-8 text-center text-slate-400">Pilih bukti dari antrean untuk mulai meninjau.</Card>
              ) : (
                <div className="space-y-5">
                  <Card className="border-white/10 bg-slate-900 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-blue-300">{selected.courseTitle}</p>
                        <h2 className="mt-1 text-2xl font-bold">{selected.moduleTitle}</h2>
                        <p className="mt-3 text-sm text-slate-300">{selected.mission.objective.statement}</p>
                      </div>
                      <Badge className="border border-white/10 bg-white/5 text-slate-200">
                        Peserta {selected.progress.user_id.slice(0, 8)}
                      </Badge>
                    </div>
                    {selected.practiceProgress.selectedDecision && (
                      <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Keputusan peserta</p>
                        <p className="mt-2 text-sm">{selected.practiceProgress.selectedDecision}</p>
                      </div>
                    )}
                    {selected.practiceProgress.feedback && (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Refleksi diri</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{selected.practiceProgress.feedback}</p>
                      </div>
                    )}
                  </Card>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                    <Card className="border-white/10 bg-slate-900 p-5">
                      <h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-blue-300" /> Bukti yang dikirim</h3>
                      <div className="mt-4 space-y-4">
                        {selected.practiceProgress.evidenceUploads.map((upload) => {
                          const evidence = selected.mission.evidence.find((item) => item.id === upload.evidenceId);
                          const url = signedUrls[upload.evidenceId];
                          return (
                            <div key={upload.evidenceId} className="rounded-xl border border-white/10 bg-black/20 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium">{evidence?.label || upload.fileName}</p>
                                  <p className="mt-1 truncate text-xs text-slate-400">{upload.fileName} · {(upload.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                                {url && <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-sm text-blue-300 underline">Buka</a>}
                              </div>
                              {url && upload.mimeType.startsWith("image/") && <img src={url} alt={upload.fileName} className="mt-3 max-h-80 w-full rounded-lg object-contain bg-black" />}
                              {url && upload.mimeType.startsWith("video/") && <video
                                ref={(node) => { mediaRefs.current[upload.evidenceId] = node; }}
                                src={url} controls className="mt-3 max-h-80 w-full rounded-lg bg-black"
                                onTimeUpdate={(event) => setMediaSeconds((current) => ({
                                  ...current, [upload.evidenceId]: Math.floor(event.currentTarget.currentTime),
                                }))}
                                onPlay={() => setActiveMediaId(upload.evidenceId)}
                              />}
                              {url && upload.mimeType.startsWith("audio/") && <audio
                                ref={(node) => { mediaRefs.current[upload.evidenceId] = node; }}
                                src={url} controls className="mt-3 w-full"
                                onTimeUpdate={(event) => setMediaSeconds((current) => ({
                                  ...current, [upload.evidenceId]: Math.floor(event.currentTarget.currentTime),
                                }))}
                                onPlay={() => setActiveMediaId(upload.evidenceId)}
                              />}
                              {url && upload.mimeType === "application/pdf" && <iframe title={upload.fileName} src={url} className="mt-3 h-80 w-full rounded-lg bg-white" />}
                              {!url && <p className="mt-3 text-xs text-amber-200">Pratinjau privat belum dapat dibuat. Coba muat ulang.</p>}
                              {evidence?.instruction && <p className="mt-3 text-xs text-slate-400">{evidence.instruction}</p>}
                            </div>
                          );
                        })}
                      </div>
                      {mediaUploads.length > 0 && (
                        <div className="mt-5 border-t border-white/10 pt-4">
                          <p className="text-sm font-semibold text-blue-100">Komentar bertimestamp</p>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <select value={activeMediaId} onChange={(event) => setActiveMediaId(event.target.value)}
                              disabled={reviewLocked}
                              className="min-w-0 flex-1 rounded-md border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white">
                              {mediaUploads.map((upload) => <option key={upload.evidenceId} value={upload.evidenceId}>{upload.fileName}</option>)}
                            </select>
                            <Button type="button" variant="outline" onClick={addTimestampComment}
                              disabled={reviewLocked || !activeMediaId || !commentDraft.trim()}
                              className="border-white/15 text-white hover:bg-white/10">
                              Tambah pada {formatTimestamp(mediaSeconds[activeMediaId] || 0)}
                            </Button>
                          </div>
                          <Textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)}
                            disabled={reviewLocked}
                            placeholder="Catat bagian yang perlu diperhatikan..." className="mt-3 min-h-20 border-white/15 bg-black/25 text-white placeholder:text-slate-500" />
                          {comments.length > 0 && (
                            <ul className="mt-3 space-y-2">
                              {comments.map((comment, index) => (
                                <li key={`${comment.evidence_id}-${comment.timestamp_seconds}-${index}`}>
                                  <button type="button" onClick={() => jumpToTimestamp(comment)}
                                    className="flex w-full items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-left hover:border-blue-300/30">
                                    <span className="shrink-0 rounded bg-blue-400/15 px-2 py-1 font-mono text-xs text-blue-200">
                                      {formatTimestamp(comment.timestamp_seconds)}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block truncate text-xs text-slate-400">
                                        {mediaUploads.find((upload) => upload.evidenceId === comment.evidence_id)?.fileName}
                                      </span>
                                      <span className="mt-1 block text-sm text-slate-200">{comment.comment_text}</span>
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </Card>

                    <Card className="border-white/10 bg-slate-900 p-5">
                      <h3 className="flex items-center gap-2 font-semibold"><MessageSquareText className="h-4 w-4 text-blue-300" /> Feedback coaching</h3>
                      <label className="mt-4 block text-sm font-medium text-emerald-200" htmlFor="review-glow">Yang sudah dilakukan dengan baik</label>
                      <Textarea id="review-glow" value={glow} onChange={(event) => setGlow(event.target.value)}
                        disabled={reviewLocked}
                        placeholder="Sebutkan perilaku atau keputusan yang efektif..." className="mt-2 min-h-24 border-white/15 bg-black/25 text-white placeholder:text-slate-500" />
                      <label className="mt-4 block text-sm font-medium text-amber-200" htmlFor="review-grow">Hal yang perlu ditingkatkan</label>
                      <Textarea id="review-grow" value={grow} onChange={(event) => setGrow(event.target.value)}
                        disabled={reviewLocked}
                        placeholder="Berikan masukan yang spesifik dan dapat dilakukan..." className="mt-2 min-h-24 border-white/15 bg-black/25 text-white placeholder:text-slate-500" />
                      <label className="mt-4 block text-sm font-medium text-blue-200" htmlFor="review-next">Fokus praktik berikutnya</label>
                      <Textarea id="review-next" value={nextSteps} onChange={(event) => setNextSteps(event.target.value)}
                        disabled={reviewLocked}
                        placeholder="Tuliskan satu langkah konkret untuk praktik selanjutnya..." className="mt-2 min-h-24 border-white/15 bg-black/25 text-white placeholder:text-slate-500" />
                      {reviewLocked ? (
                        <p className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">
                          Review selesai. Feedback ini dikunci agar peserta menerima catatan yang konsisten.
                        </p>
                      ) : <div className="mt-5 grid gap-2">
                        <Button type="button" onClick={() => void submitReview("completed")} disabled={saving}
                          className="bg-blue-500 text-white hover:bg-blue-400">
                          <CheckCircle2 className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Selesaikan review"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => void submitReview("resubmission_requested")} disabled={saving}
                          className="border-amber-300/30 text-amber-100 hover:bg-amber-300/10">
                          <Send className="mr-2 h-4 w-4" />Minta kirim ulang bukti
                        </Button>
                      </div>}
                    </Card>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
