import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Lightbulb,
  MessageSquareText,
  Play,
  Repeat2,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/hooks/useAuth";
import { formatTimestamp } from "@/lib/supervisorReview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { missionReviewService } from "@/services/missionReviewService";
import { MissionReviewPanel } from "@/components/mission/MissionReviewPanel";
import { ParticipantReviewStatus } from "@/components/mission/ParticipantReviewStatus";
import type { Database } from "@/integrations/supabase/types";
import {
  emptyMissionProgress,
  microLearningService,
  normalizeMissionProgress,
  normalizeWorkplaceMission,
  type MissionProgress,
  type MissionEvidenceUpload,
  type WorkplaceMission,
} from "@/services/microLearningService";
import {
  supervisorReviewService,
  type MissionReviewComment,
  type MissionReview,
} from "@/services/supervisorReviewService";

type ModuleContent = Database["public"]["Tables"]["module_content"]["Row"];
type ModuleQuiz = Database["public"]["Tables"]["module_quizzes"]["Row"];
type LearnerProgress = Database["public"]["Tables"]["learner_progress"]["Row"];
type Module = Database["public"]["Tables"]["course_modules"]["Row"] & {
  content?: ModuleContent[];
  quizzes?: ModuleQuiz[];
};
type Course = Database["public"]["Tables"]["courses"]["Row"] & {
  modules?: Module[];
};

const MISSION_EVIDENCE_BUCKET = "mission-evidence";
const MAX_EVIDENCE_BYTES = 50 * 1024 * 1024;
const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function getQuizOptions(options: ModuleQuiz["options"]): string[] {
  return Array.isArray(options)
    ? options.filter((option): option is string => typeof option === "string")
    : [];
}

function getEvidenceAccept(type: WorkplaceMission["evidence"][number]["type"]): string {
  if (type === "photo") return "image/*";
  if (type === "recording") return "audio/*,video/*";
  return "image/*,.pdf,.txt,.doc,.docx";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFileName(fileName: string): string {
  const sanitized = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return sanitized || "evidence";
}

function mergeProgress(
  progress: LearnerProgress[],
  updated: LearnerProgress
): LearnerProgress[] {
  const index = progress.findIndex((item) => item.module_id === updated.module_id);
  if (index === -1) return [...progress, updated];
  return progress.map((item, itemIndex) => itemIndex === index ? updated : item);
}

export default function CoursePage() {
  const router = useRouter();
  const { user } = useAuth();
  const courseId = typeof router.query.id === "string" ? router.query.id : "";
  const [course, setCourse] = useState<Course | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [progress, setProgress] = useState<LearnerProgress[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [missionProgress, setMissionProgress] = useState<MissionProgress>(emptyMissionProgress);
  const [legacyAnswers, setLegacyAnswers] = useState<Record<string, string>>({});
  const [legacySubmitted, setLegacySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncRequired, setSyncRequired] = useState(false);
  const [reflectionDraft, setReflectionDraft] = useState<string | null>(null);
  const [restoredReflection, setRestoredReflection] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [uploadingEvidenceId, setUploadingEvidenceId] = useState<string | null>(null);
  const [removingEvidenceId, setRemovingEvidenceId] = useState<string | null>(null);
  const [evidenceUrls, setEvidenceUrls] = useState<Record<string, string>>({});
  const [missionReview, setMissionReview] = useState<MissionReview | null>(null);
  const [missionReviewComments, setMissionReviewComments] = useState<MissionReviewComment[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const finalizingRef = useRef(false);
  const evidenceOperationRef = useRef(false);
  const viewerIdRef = useRef<string | null>(null);
  const revisionRef = useRef<Record<string, number>>({});
  const saveContextRef = useRef(0);
  const saveBlockedRef = useRef(false);
  const activeModuleRef = useRef<string | undefined>(undefined);
  const localReflectionRef = useRef("");
  localReflectionRef.current = restoredReflection ?? missionProgress.feedback;

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const updateViewer = (id: string | null) => {
      if (!active || viewerIdRef.current === id) return;
      viewerIdRef.current = id;
      setViewerId(id);
      setCourse(null);
      setProgress([]);
      revisionRef.current = {};
      saveContextRef.current++;
      setMissionProgress(emptyMissionProgress());
      setReflectionDraft(null);
      setRestoredReflection(null);
      setCopyMessage("");
      setEvidenceUrls({});
    };
    void supabase.auth.getUser().then(({ data }) => {
      if (!authEventReceived) updateViewer(data.user?.id ?? null);
    }).catch(() => {
      if (!authEventReceived) updateViewer(null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      updateViewer(session?.user?.id ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!courseId) return;

    let active = true;
    setLoading(true);
    Promise.all([
      microLearningService.getCourseWithModules(courseId),
      microLearningService.getLearnerProgress(courseId),
    ]).then(([courseResult, progressResult]) => {
      if (!active) return;
      if (courseResult.data) setCourse(courseResult.data);
      if (progressResult.data) {
        setProgress(progressResult.data);
        revisionRef.current = Object.fromEntries(progressResult.data.map(
          (row) => [row.module_id, row.mission_revision]
        ));
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [courseId, viewerId]);

  useEffect(() => {
    if (!viewerId) return;
    const cleanup = () => { void microLearningService.reconcileEvidence().catch(() => undefined); };
    cleanup();
    const timer = window.setInterval(cleanup, 60_000);
    return () => window.clearInterval(timer);
  }, [viewerId]);

  const currentModule = course?.modules?.[currentModuleIndex];
  activeModuleRef.current = currentModule?.id;
  const moduleProgress = progress.find((item) => item.module_id === currentModule?.id);
  const mission = useMemo<WorkplaceMission | null>(() => {
    const missionContent = currentModule?.content?.find((item) => {
      const value = item.content_data as { kind?: unknown } | null;
      return item.content_type === "worksheet" && value?.kind === "workplace-mission";
    });
    return normalizeWorkplaceMission(missionContent?.content_data);
  }, [currentModule]);
  const isResubmissionRequested = missionReview?.review_status === "resubmission_requested";
  const restoringReflection = restoredReflection !== null && saving;
  const evidenceEditable = !syncRequired && !restoringReflection &&
    (moduleProgress?.status !== "completed" || isResubmissionRequested);

  useEffect(() => {
    let active = true;
    setMissionReview(null);
    setMissionReviewComments([]);
    if (!moduleProgress?.id) return () => { active = false; };
    void supervisorReviewService.getReview(moduleProgress.id).then(async ({ data }) => {
      if (!active) return;
      setMissionReview(data);
      if (data) {
        const { data: comments } = await supervisorReviewService.getComments(data.id);
        if (active && comments) setMissionReviewComments(comments);
      }
    });
    return () => { active = false; };
  }, [moduleProgress?.id]);

  useEffect(() => {
    saveContextRef.current++;
    saveBlockedRef.current = false;
    setSyncRequired(false);
    setReflectionDraft(null);
    setRestoredReflection(null);
    setCopyMessage("");
    setMissionProgress(normalizeMissionProgress(moduleProgress?.mission_progress));
    setLegacyAnswers({});
    setLegacySubmitted(false);
    setCompletionMessage("");
    setErrorMessage("");
    setFinalizing(false);
    finalizingRef.current = false;
    setEvidenceUrls({});
  }, [currentModule?.id]);

  useEffect(() => {
    let active = true;

    const loadEvidenceUrls = async () => {
      const uploads = missionProgress.evidenceUploads;
      if (!uploads.length) {
        setEvidenceUrls({});
        return;
      }

      const signedEntries = await Promise.all(
        uploads.map(async (upload) => {
          const { data } = await supabase.storage
            .from(MISSION_EVIDENCE_BUCKET)
            .createSignedUrl(upload.storagePath, 60 * 60);
          return data?.signedUrl ? [upload.evidenceId, data.signedUrl] as const : null;
        })
      );

      if (!active) return;
      setEvidenceUrls(
        Object.fromEntries(signedEntries.filter(
          (entry): entry is readonly [string, string] => Boolean(entry)
        ))
      );
    };

    void loadEvidenceUrls();
    return () => {
      active = false;
    };
  }, [missionProgress.evidenceUploads]);

  const completedModules = progress.filter((item) => item.status === "completed").length;
  const totalModules = course?.modules?.length || 0;
  const overallProgress = totalModules ? (completedModules / totalModules) * 100 : 0;

  const practiceChecks = useMemo(() => {
    if (!mission) return [];
    return mission.practice.flatMap((step) => {
      if (!step.checklist.length) {
        return [{ id: step.id, label: step.instruction }];
      }
      return step.checklist.map((label, index) => ({
        id: `${step.id}:${index + 1}`,
        label,
      }));
    });
  }, [mission]);

  const scenarioOptions = useMemo(() => {
    if (!mission) return [];
    if (mission.scenario.options.length) return mission.scenario.options;
    return getQuizOptions(currentModule?.quizzes?.[0]?.options ?? null);
  }, [currentModule?.quizzes, mission]);

  const requiredEvidenceItems = mission?.evidence.filter((item) => item.required) || [];
  const requiredEvidence = requiredEvidenceItems.length;
  const evidenceBusy = Boolean(uploadingEvidenceId || removingEvidenceId);
  const missionLocked = moduleProgress?.status === "completed" || finalizing || evidenceBusy || syncRequired || restoringReflection;
  const practiceComplete = practiceChecks.length > 0 &&
    practiceChecks.every((item) => missionProgress.checkedPracticeIds.includes(item.id));
  const decisionComplete = scenarioOptions.length === 0 || Boolean(missionProgress.selectedDecision);
  const reflectionComplete = missionProgress.feedback.trim().length >= 10;
  const evidenceComplete = requiredEvidence === 0 || requiredEvidenceItems.every((item) =>
    missionProgress.evidenceUploads.some((upload) => upload.evidenceId === item.id)
  );
  const canCompleteMission = Boolean(
    mission &&
    practiceComplete &&
    decisionComplete &&
    evidenceComplete &&
    reflectionComplete
  );

  const persistMissionProgress = (
    next: MissionProgress,
    status: "in_progress" | "completed" = "in_progress"
  ): Promise<boolean> => {
    if (!currentModule || saveBlockedRef.current) return Promise.resolve(false);
    if ((moduleProgress?.status === "completed" || finalizingRef.current) && status !== "completed") {
      return Promise.resolve(false);
    }
    const moduleId = currentModule.id;
    const context = saveContextRef.current;
    let operationContext = context;
    const sequence = ++saveSequenceRef.current;
    setSaving(true);
    setErrorMessage("");

    const operation = saveQueueRef.current.then(async () => {
      if (context !== saveContextRef.current || saveBlockedRef.current) return false;
      const nextPracticeComplete = practiceChecks.length > 0 &&
        practiceChecks.every((item) => next.checkedPracticeIds.includes(item.id));
      const nextDecisionComplete = scenarioOptions.length === 0 || Boolean(next.selectedDecision);
      const completedPieces = [
        nextPracticeComplete,
        nextDecisionComplete,
        requiredEvidence === 0 || next.evidenceConfirmed,
        next.feedback.trim().length >= 10,
      ].filter(Boolean).length;

      const result = await microLearningService.updateProgress(courseId, moduleId, {
        status,
        progressPercentage: status === "completed" ? 100 : completedPieces * 25,
        missionProgress: next,
        expectedMissionRevision: revisionRef.current[moduleId] ?? 0,
        awardCompletion: moduleProgress?.status !== "completed",
      });
      if (context !== saveContextRef.current) return false;

      if (result.error || !result.data) {
        // Capture the latest editor value, not the older snapshot whose save
        // failed: newer reflection edits may already be queued behind it.
        setReflectionDraft(localReflectionRef.current);
        setRestoredReflection(null);
        setCopyMessage("");
        // Invalidate already queued stale snapshots as well. A lost response is
        // ambiguous, so reload rather than blindly retrying or deleting proof.
        const refreshContext = ++saveContextRef.current;
        operationContext = refreshContext;
        saveBlockedRef.current = true;
        setSyncRequired(true);
        const latest = await microLearningService.getLearnerProgress(courseId);
        if (refreshContext !== saveContextRef.current) return false;
        if (latest.data && !latest.error) {
          setProgress(latest.data);
          revisionRef.current = Object.fromEntries(latest.data.map(
            (row) => [row.module_id, row.mission_revision]
          ));
          if (activeModuleRef.current === moduleId) {
            setMissionProgress(normalizeMissionProgress(
              latest.data.find((row) => row.module_id === moduleId)?.mission_progress
            ));
          }
          saveBlockedRef.current = false;
          setSyncRequired(false);
        }
        setErrorMessage(result.error && "code" in result.error && result.error.code === "40001"
          ? "Progres berubah di tab atau perangkat lain. Perubahan ini tidak disimpan. Data terbaru dimuat; periksa lalu ulangi perubahanmu."
          : "Penyimpanan belum dapat dipastikan. Periksa data terbaru sebelum mencoba lagi. Jika belum dimuat, muat ulang halaman.");
        return false;
      }

      revisionRef.current[moduleId] = result.data.mission_revision;
      setProgress((current) => mergeProgress(current, result.data));
      return true;
    }).catch(() => {
      if (operationContext !== saveContextRef.current) return false;
      setReflectionDraft(localReflectionRef.current);
      setRestoredReflection(null);
      saveContextRef.current++;
      saveBlockedRef.current = true;
      setSyncRequired(true);
      setErrorMessage("Penyimpanan belum dapat dipastikan. Muat ulang halaman sebelum mencoba lagi.");
      return false;
    }).finally(() => {
      if (sequence === saveSequenceRef.current) setSaving(false);
    });

    saveQueueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  };

  const copyReflectionDraft = async () => {
    if (reflectionDraft === null) return;
    try {
      await navigator.clipboard.writeText(reflectionDraft);
      setCopyMessage("Draf refleksi disalin.");
    } catch {
      setCopyMessage("Tidak dapat menyalin otomatis. Pilih teks draf lokal lalu salin secara manual.");
    }
  };

  const saveRestoredReflection = async () => {
    if (restoredReflection === null || missionLocked || saving || saveBlockedRef.current) return;
    // Restore text only. Never reapply the conflicted evidence/checklist snapshot.
    const next = { ...missionProgress, feedback: restoredReflection };
    if (await persistMissionProgress(next)) {
      setMissionProgress(next);
      setReflectionDraft(null);
      setRestoredReflection(null);
      setCompletionMessage("Refleksi disimpan ulang. Bukti terbaru tetap dipertahankan.");
    }
  };

  const togglePracticeCheck = (checkId: string) => {
    if (saveBlockedRef.current || evidenceOperationRef.current || finalizingRef.current || restoringReflection || moduleProgress?.status === "completed") return;
    setMissionProgress((current) => {
      const checked = current.checkedPracticeIds.includes(checkId);
      const next = {
        ...current,
        checkedPracticeIds: checked
          ? current.checkedPracticeIds.filter((id) => id !== checkId)
          : [...current.checkedPracticeIds, checkId],
      };
      void persistMissionProgress(next);
      return next;
    });
  };

  const chooseDecision = (option: string) => {
    if (saveBlockedRef.current || evidenceOperationRef.current || finalizingRef.current || restoringReflection || moduleProgress?.status === "completed") return;
    setMissionProgress((current) => {
      const next = { ...current, selectedDecision: option };
      void persistMissionProgress(next);
      return next;
    });
  };

  const hasRequiredEvidence = (uploads: MissionEvidenceUpload[]) =>
    requiredEvidence === 0 || requiredEvidenceItems.every((item) =>
      uploads.some((upload) => upload.evidenceId === item.id)
    );

  const handleEvidenceUpload = async (
    evidenceId: string,
    file: File | null,
    input: HTMLInputElement
  ) => {
    input.value = "";
    if (!file || !currentModule || !mission) return;
    if (
      saveBlockedRef.current || evidenceOperationRef.current ||
      finalizingRef.current || restoringReflection ||
      (moduleProgress?.status === "completed" && !isResubmissionRequested)
    ) return;

    const evidence = mission.evidence.find((item) => item.id === evidenceId);
    if (!evidence) return;

    const isMedia = file.type.startsWith("image/") ||
      file.type.startsWith("audio/") ||
      file.type.startsWith("video/");
    const isDocument = DOCUMENT_MIME_TYPES.has(file.type);
    if (!isMedia && !isDocument) {
      setErrorMessage("Tipe file belum didukung. Gunakan foto, PDF, DOC, DOCX, TXT, audio, atau video.");
      return;
    }
    if (evidence.type === "photo" && !file.type.startsWith("image/")) {
      setErrorMessage("Bukti ini membutuhkan foto atau gambar.");
      return;
    }
    if (evidence.type === "recording" &&
      !file.type.startsWith("audio/") &&
      !file.type.startsWith("video/")) {
      setErrorMessage("Bukti ini membutuhkan rekaman audio atau video.");
      return;
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      setErrorMessage("Ukuran file maksimal 50 MB.");
      return;
    }

    evidenceOperationRef.current = true;
    setUploadingEvidenceId(evidenceId);
    setErrorMessage("");
    setCompletionMessage("");

    const uploadContext = saveContextRef.current;
    let uploadedPath: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Masuk terlebih dahulu untuk mengunggah bukti.");
        return;
      }

      const storagePath = [
        user.id,
        courseId,
        currentModule.id,
        evidenceId,
        `${globalThis.crypto.randomUUID()}-${sanitizeFileName(file.name)}`,
      ].join("/");
      const { error: uploadError } = await supabase.storage
        .from(MISSION_EVIDENCE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        setErrorMessage(`Bukti belum tersimpan: ${uploadError.message}`);
        return;
      }
      uploadedPath = storagePath;
      if (uploadContext !== saveContextRef.current) return;

      const nextUploads: MissionEvidenceUpload[] = [
        ...missionProgress.evidenceUploads.filter((upload) => upload.evidenceId !== evidenceId),
        {
          evidenceId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          storagePath,
          uploadedAt: new Date().toISOString(),
        },
      ];
      const next = {
        ...missionProgress,
        evidenceUploads: nextUploads,
        evidenceConfirmed: hasRequiredEvidence(nextUploads),
      };
      setMissionProgress(next);
      const saved = await persistMissionProgress(next, isResubmissionRequested ? "completed" : "in_progress");

      if (!saved) {
        return;
      }

      if (isResubmissionRequested && moduleProgress?.id) {
        const { data: submitted, error: submitError } = await supabase.rpc(
          "submit_mission_resubmission",
          { p_learner_progress_id: moduleProgress.id }
        );
        if (submitError || !submitted) {
          setErrorMessage("Bukti tersimpan, tetapi pengiriman ulang belum tercatat. Ganti bukti lagi untuk mencoba.");
          return;
        }
        setMissionReview(submitted);
      }

      setCompletionMessage(isResubmissionRequested
        ? "Bukti diperbarui dan dikirim kembali untuk ditinjau."
        : "Bukti praktik berhasil disimpan.");
    } catch {
      setErrorMessage("Bukti belum tersimpan karena koneksi bermasalah. Coba lagi.");
    } finally {
      if (uploadedPath) {
        const cleaned = await microLearningService.reconcileEvidence(uploadedPath).catch(() => false);
        if (!cleaned) setErrorMessage((current) => current ||
          "Pembersihan file tertunda dan akan dicoba kembali otomatis. Bukti yang tersimpan tetap aman.");
      }
      evidenceOperationRef.current = false;
      setUploadingEvidenceId(null);
    }
  };

  const handleRemoveEvidence = async (evidenceId: string) => {
    if (
      saveBlockedRef.current || evidenceOperationRef.current ||
      finalizingRef.current || restoringReflection ||
      moduleProgress?.status === "completed"
    ) return;
    const upload = missionProgress.evidenceUploads.find((item) => item.evidenceId === evidenceId);
    if (!upload) return;

    evidenceOperationRef.current = true;
    setRemovingEvidenceId(evidenceId);
    setErrorMessage("");
    setCompletionMessage("");

    try {
      const nextUploads = missionProgress.evidenceUploads.filter(
        (item) => item.evidenceId !== evidenceId
      );
      const next = {
        ...missionProgress,
        evidenceUploads: nextUploads,
        evidenceConfirmed: hasRequiredEvidence(nextUploads),
      };
      setMissionProgress(next);
      const saved = await persistMissionProgress(next);

      if (!saved) {
        return;
      }

      const cleaned = await microLearningService.reconcileEvidence();
      if (!cleaned) {
        setErrorMessage("Bukti dihapus dari progres. Pembersihan file tertunda dan akan dicoba kembali otomatis.");
        return;
      }
      setCompletionMessage("Bukti praktik dihapus.");
    } catch {
      setErrorMessage("Bukti belum bisa dihapus karena koneksi bermasalah. Coba lagi.");
    } finally {
      evidenceOperationRef.current = false;
      setRemovingEvidenceId(null);
    }
  };

  const completeMission = async () => {
    if (saveBlockedRef.current || evidenceOperationRef.current || !canCompleteMission) return;
    finalizingRef.current = true;
    setFinalizing(true);
    const saved = await persistMissionProgress(missionProgress, "completed");
    if (saved) {
      setCompletionMessage("Misi selesai. Bawa perbaikanmu ke pengulangan berikutnya.");
    } else {
      finalizingRef.current = false;
      setFinalizing(false);
    }
  };

  const submitLegacyScenario = async () => {
    if (!currentModule) return;
    if (!currentModule.quizzes?.length) {
      const result = await microLearningService.updateProgress(courseId, currentModule.id, {
        status: "completed",
        progressPercentage: 100,
      });
      if (result.data) {
        setProgress((current) => mergeProgress(current, result.data));
        setCompletionMessage("Langkah lama selesai dan progresmu sudah tersimpan.");
      }
      return;
    }
    setLegacySubmitted(true);
    const correct = currentModule.quizzes.filter(
      (quiz) => legacyAnswers[quiz.id] === quiz.correct_answer
    ).length;
    const score = Math.round((correct / currentModule.quizzes.length) * 100);
    if (score < 70) return;

    const result = await microLearningService.updateProgress(courseId, currentModule.id, {
      status: "completed",
      progressPercentage: 100,
      quizScore: score,
    });
    if (result.data) {
      setProgress((current) => mergeProgress(current, result.data));
      setCompletionMessage("Langkah lama selesai dan progresmu sudah tersimpan.");
    }
  };

  const restartPractice = async () => {
    if (!moduleProgress || saving || evidenceOperationRef.current) return;
    const result = await missionReviewService.restartPractice(moduleProgress.id);
    if (result.error || !result.data) throw new Error("Praktik belum dapat dibuka ulang. Muat ulang lalu coba lagi.");
    setProgress((current) => mergeProgress(current, result.data));
    revisionRef.current[result.data.module_id!] = result.data.mission_revision;
    setMissionProgress(normalizeMissionProgress(result.data.mission_progress));
    setFinalizing(false);
    finalizingRef.current = false;
    setCompletionMessage("Praktik dibuka ulang. Perbaiki bukti sesuai arahan supervisor, lalu selesaikan kembali.");
  };

  const selectModule = (index: number) => {
    setCurrentModuleIndex(index);
    setMissionProgress(emptyMissionProgress());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-lg">Menyiapkan misi kerja...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-3">Misi tidak ditemukan</h1>
          <p className="text-slate-400 mb-6">Misi mungkin sudah dipindahkan atau tidak dapat kamu akses.</p>
          <Link href="/micro-learning">
            <Button>Kembali ke Workplace Coach</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{course.title} - Workplace Coach</title>
      </Head>
      <SEO
        title={course.title || "Workplace Mission"}
        description={course.description || "Praktikkan skill kerja bersama Workplace Coach"}
      />

      <main className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-white/10 bg-black/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
            <Link
              href="/micro-learning"
              className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke daftar misi
            </Link>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge className="bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  Workplace mission
                </Badge>
                <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h1>
                <p className="mt-2 max-w-2xl text-slate-300">{course.description}</p>
              </div>
              <div className="min-w-64 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Progres misi</span>
                  <span>{completedModules}/{totalModules} langkah</span>
                </div>
                <Progress value={overallProgress} className="mt-3 h-2" />
              </div>
            </div>
            {course.user_id === user?.id && (
              <Link
                href="/coaching"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-300/25 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-400/20"
              >
                Tinjau bukti peserta
              </Link>
            )}
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <MissionReviewPanel courseId={courseId} isOwner={viewerId === course.user_id} />
          {mission && moduleProgress && (
            <ParticipantReviewStatus
              key={moduleProgress.id}
              progressId={moduleProgress.id}
              isSubmitted={moduleProgress.status === "completed"}
              onRetry={moduleProgress.status === "completed" ? restartPractice : undefined}
            />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
            <div className="space-y-6">
              <Card className="overflow-hidden border-white/10 bg-slate-900">
                {currentModule?.video_url ? (
                  <video
                    className="w-full aspect-video bg-black"
                    controls
                    src={currentModule.video_url}
                    poster={currentModule.thumbnail_url || undefined}
                  />
                ) : (
                  <div className="aspect-video bg-black flex items-center justify-center text-slate-600">
                    <Play className="w-16 h-16" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-blue-300">
                        Langkah {currentModuleIndex + 1} dari {totalModules}
                      </p>
                      <h2 className="mt-1 text-2xl font-bold">{currentModule?.title}</h2>
                    </div>
                    {moduleProgress?.status === "completed" && (
                      <Badge className="bg-emerald-500 text-slate-950">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Selesai
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-slate-300">{currentModule?.description}</p>
                </div>
              </Card>

              {mission ? (
                <>
                  <Card className="border-blue-400/25 bg-blue-950/40 p-6">
                    <div className="flex gap-4">
                      <div className="rounded-xl bg-blue-400/15 p-3 h-fit">
                        <Target className="w-6 h-6 text-blue-300" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
                          Tujuan kerja
                        </p>
                        <h3 className="mt-2 text-xl font-bold">{mission.objective.statement}</h3>
                        {mission.objective.successCriteria.length > 0 && (
                          <ul className="mt-4 space-y-2 text-sm text-slate-300">
                            {mission.objective.successCriteria.map((criterion) => (
                              <li key={criterion} className="flex gap-2">
                                <Check className="w-4 h-4 mt-0.5 text-blue-300 shrink-0" />
                                {criterion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="border-white/10 bg-slate-900 p-6">
                    <div className="flex items-center gap-3">
                      <MessageSquareText className="w-6 h-6 text-amber-300" />
                      <div>
                        <p className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
                          1. Ambil keputusan
                        </p>
                        <h3 className="text-xl font-bold">Hadapi skenario kerja</h3>
                      </div>
                    </div>
                    <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-slate-200">
                      {mission.scenario.prompt}
                    </p>
                    <p className="mt-5 font-semibold">{mission.scenario.decisionQuestion}</p>
                    {scenarioOptions.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {scenarioOptions.map((option) => {
                          const selected = missionProgress.selectedDecision === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => chooseDecision(option)}
                              disabled={missionLocked}
                              className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                                selected
                                  ? "border-blue-400 bg-blue-400/15 text-white"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                              }`}
                            >
                              <span className="flex gap-3">
                                {selected
                                  ? <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />
                                  : <Circle className="w-5 h-5 text-slate-500 shrink-0" />}
                                {option}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-400">
                        Pertimbangkan tindakanmu, lalu lanjutkan ke praktik.
                      </p>
                    )}
                    {missionProgress.selectedDecision && (
                      <div className="mt-4 rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
                        <p className="text-sm font-semibold text-blue-200">Arahan coach</p>
                        <p className="mt-1 text-sm text-slate-200">{mission.scenario.debrief}</p>
                        <p className="mt-2 text-xs text-blue-200">
                          Tindakan yang disarankan: {mission.scenario.recommendedAction}
                        </p>
                      </div>
                    )}
                  </Card>

                  <Card className="border-white/10 bg-slate-900 p-6">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="w-6 h-6 text-blue-300" />
                      <div>
                        <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
                          2. Praktikkan
                        </p>
                        <h3 className="text-xl font-bold">Lakukan di pekerjaanmu</h3>
                      </div>
                    </div>
                    {mission.knowledge.length > 0 && (
                      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                          <Lightbulb className="w-4 h-4 text-amber-300" />
                          Pegangan singkat
                        </p>
                        <ul className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                          {mission.knowledge.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="mt-5 space-y-5">
                      {mission.practice.map((step, stepIndex) => (
                        <div key={step.id}>
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-semibold">
                              {stepIndex + 1}. {step.instruction}
                            </p>
                            <span className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
                              <Clock3 className="w-3.5 h-3.5" />
                              ±{step.estimatedMinutes} menit
                            </span>
                          </div>
                          <div className="mt-3 space-y-2">
                            {(step.checklist.length
                              ? step.checklist.map((label, index) => ({
                                id: `${step.id}:${index + 1}`,
                                label,
                              }))
                              : [{ id: step.id, label: step.instruction }]
                            ).map((checkItem) => {
                              const checked = missionProgress.checkedPracticeIds.includes(checkItem.id);
                              return (
                                <button
                                  key={checkItem.id}
                                  type="button"
                                  onClick={() => togglePracticeCheck(checkItem.id)}
                                  disabled={missionLocked}
                                  className="w-full flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-slate-200 hover:border-blue-400/40"
                                >
                                  {checked
                                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                    : <Circle className="w-5 h-5 text-slate-500 shrink-0" />}
                                  <span className={checked ? "line-through text-slate-400" : ""}>
                                    {checkItem.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border-white/10 bg-slate-900 p-6">
                    <div className="flex items-center gap-3">
                      <Camera className="w-6 h-6 text-emerald-300" />
                      <div>
                        <p className="text-xs uppercase tracking-widest text-emerald-300 font-semibold">
                          3. Siapkan bukti
                        </p>
                        <h3 className="text-xl font-bold">Buat praktikmu dapat ditinjau</h3>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {mission.evidence.map((evidence) => {
                        const upload = missionProgress.evidenceUploads.find(
                          (item) => item.evidenceId === evidence.id
                        );
                        const isUploading = uploadingEvidenceId === evidence.id;
                        const isRemoving = removingEvidenceId === evidence.id;

                        return (
                          <div key={evidence.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <FileCheck2 className="w-5 h-5 text-emerald-300" />
                              <div className="flex gap-2">
                                {evidence.required && (
                                  <Badge className="bg-amber-400/15 text-amber-200 border border-amber-300/20">
                                    Wajib
                                  </Badge>
                                )}
                                <Badge variant="outline" className="border-white/15 text-slate-300 capitalize">
                                  {evidence.type}
                                </Badge>
                              </div>
                            </div>
                            <p className="mt-3 font-semibold">{evidence.label}</p>
                            <p className="mt-1 text-sm text-slate-400">{evidence.instruction}</p>

                            {upload ? (
                              <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-emerald-100">
                                      {upload.fileName}
                                    </p>
                                    <p className="mt-1 text-xs text-emerald-200/70">
                                      {formatFileSize(upload.sizeBytes)} · tersimpan{" "}
                                      {new Date(upload.uploadedAt).toLocaleDateString("id-ID")}
                                    </p>
                                  </div>
                                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {evidenceUrls[evidence.id] && (
                                    <a
                                      href={evidenceUrls[evidence.id]}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center rounded-md border border-emerald-300/30 px-3 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-300/10"
                                    >
                                      Lihat file
                                    </a>
                                  )}
                                  {evidenceEditable && !finalizing && (
                                    <label className="inline-flex cursor-pointer items-center rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10">
                                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                                      {isUploading ? "Mengunggah..." : "Ganti"}
                                      <input
                                        type="file"
                                        className="sr-only"
                                        accept={getEvidenceAccept(evidence.type)}
                                        disabled={isUploading || isRemoving}
                                        onChange={(event) => void handleEvidenceUpload(
                                          evidence.id,
                                          event.currentTarget.files?.[0] || null,
                                          event.currentTarget
                                        )}
                                      />
                                    </label>
                                  )}
                                  {!missionLocked && moduleProgress?.status !== "completed" && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={isUploading || isRemoving}
                                      onClick={() => void handleRemoveEvidence(evidence.id)}
                                      className="h-8 px-3 text-xs text-red-200 hover:bg-red-400/10 hover:text-red-100"
                                    >
                                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                      {isRemoving ? "Menghapus..." : "Hapus"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <label className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition ${
                                isUploading
                                  ? "border-blue-400/40 bg-blue-400/10"
                                  : "border-white/20 bg-black/15 hover:border-emerald-400/40 hover:bg-emerald-400/5"
                              }`}>
                                <Upload className="h-5 w-5 text-emerald-300" />
                                <span className="mt-2 text-sm font-medium text-white">
                                  {isUploading ? "Mengunggah bukti..." : "Pilih file bukti"}
                                </span>
                                <span className="mt-1 text-xs text-slate-500">
                                  Foto, dokumen, audio, atau video · maks. 50 MB
                                </span>
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept={getEvidenceAccept(evidence.type)}
                                  disabled={!evidenceEditable || finalizing || isUploading || isRemoving}
                                  onChange={(event) => void handleEvidenceUpload(
                                    evidence.id,
                                    event.currentTarget.files?.[0] || null,
                                    event.currentTarget
                                  )}
                                />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className={`mt-5 rounded-xl border p-4 text-sm ${
                      evidenceComplete
                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                        : "border-amber-300/20 bg-amber-300/5 text-amber-100"
                    }`}>
                      {evidenceComplete
                        ? "Semua bukti wajib sudah tersimpan dan siap ditinjau."
                        : `${requiredEvidenceItems.filter((item) =>
                          !missionProgress.evidenceUploads.some((upload) => upload.evidenceId === item.id)
                        ).length} bukti wajib belum diunggah.`}
                    </div>
                  </Card>

                  <Card className="border-blue-400/20 bg-blue-950/35 p-6">
                    <div className="flex items-center gap-3">
                      <Repeat2 className="w-6 h-6 text-blue-300" />
                      <div>
                        <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
                          4. Refleksi dan ulangi
                        </p>
                        <h3 className="text-xl font-bold">{mission.feedback.prompt}</h3>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1 text-sm text-slate-300">
                      {mission.feedback.questions.map((question) => <li key={question}>• {question}</li>)}
                    </ul>
                    <Textarea
                      aria-label="Catatan refleksi"
                      value={restoredReflection ?? missionProgress.feedback}
                      onChange={(event) => {
                        localReflectionRef.current = event.target.value;
                        if (reflectionDraft !== null) {
                          setRestoredReflection(event.target.value);
                        } else {
                          setMissionProgress({ ...missionProgress, feedback: event.target.value });
                        }
                      }}
                      onBlur={() => {
                        if (reflectionDraft === null) void persistMissionProgress(missionProgress);
                      }}
                      disabled={missionLocked || (restoredReflection !== null && saving)}
                      placeholder="Tulis refleksi singkat (minimal 10 karakter)..."
                      className="mt-4 min-h-28 border-white/15 bg-black/25 text-white placeholder:text-slate-500"
                    />
                    {reflectionDraft !== null && (
                      <section aria-label="Pemulihan refleksi" className="mt-4 space-y-3 rounded-xl border border-amber-300/30 bg-amber-950/30 p-4">
                        <h4 className="font-semibold text-amber-100">Bandingkan refleksi sebelum menyimpan ulang</h4>
                        <p className="text-sm text-slate-300">
                          Draf lokal belum disimpan ulang. Pulihkan hanya teks refleksi; bukti dan progres terbaru tidak diganti.
                          {syncRequired && " Versi server belum berhasil dimuat. Pemulihan dinonaktifkan sampai data terbaru tersedia."}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label className="text-sm text-slate-200">
                            Draf lokal
                            <Textarea readOnly value={reflectionDraft} aria-label="Draf refleksi lokal" className="mt-1 bg-black/25 text-white" />
                          </label>
                          <label className="text-sm text-slate-200">
                            Versi server{syncRequired ? " (belum tersedia)" : ""}
                            <Textarea readOnly value={syncRequired ? "" : normalizeMissionProgress(moduleProgress?.mission_progress).feedback} aria-label="Refleksi versi server" className="mt-1 bg-black/25 text-white" />
                          </label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => void copyReflectionDraft()}>Salin draf lokal</Button>
                          <Button type="button" variant="outline" disabled={missionLocked || saving} onClick={() => {
                            setRestoredReflection(reflectionDraft);
                            localReflectionRef.current = reflectionDraft;
                          }}>Pulihkan draf ke editor</Button>
                          {restoredReflection !== null && (
                            <Button type="button" disabled={missionLocked || saving} onClick={() => void saveRestoredReflection()}>Simpan ulang refleksi</Button>
                          )}
                          <Button type="button" variant="outline" disabled={saving || syncRequired} onClick={() => {
                            setReflectionDraft(null);
                            setRestoredReflection(null);
                            setCopyMessage("");
                          }}>Gunakan versi server</Button>
                        </div>
                        {restoredReflection !== null && <p className="text-sm text-amber-100">Draf dipulihkan ke editor. Edit bila perlu, lalu tekan Simpan ulang refleksi.</p>}
                        {copyMessage && <p role="status" className="text-sm text-amber-100">{copyMessage}</p>}
                      </section>
                    )}
                    <div className="mt-4 flex gap-3 rounded-xl border border-blue-400/20 bg-blue-400/10 p-4">
                      <CalendarClock className="w-5 h-5 text-blue-300 shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-100">{mission.repetition.cadenceLabel}</p>
                        <p className="mt-1 text-sm text-slate-300">{mission.repetition.nextAction}</p>
                        <p className="mt-2 text-xs text-blue-200">Tip: {mission.feedback.coachTip}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={completeMission}
                      disabled={!canCompleteMission || saving || missionLocked || restoredReflection !== null}
                      className="mt-5 w-full bg-blue-500 hover:bg-blue-400 text-white font-semibold"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {moduleProgress?.status === "completed"
                        ? "Misi sudah selesai"
                        : saving
                          ? "Menyimpan..."
                          : "Selesaikan misi"}
                    </Button>
                    {!canCompleteMission && moduleProgress?.status !== "completed" && (
                      <p className="mt-3 text-center text-xs text-slate-400">
                        Selesaikan keputusan, checklist, bukti, dan refleksi untuk menutup misi.
                      </p>
                    )}
                  </Card>

                  {missionReview && (
                    <Card className={`border p-6 ${
                      missionReview.review_status === "completed"
                        ? "border-emerald-300/20 bg-emerald-950/30"
                        : missionReview.review_status === "resubmission_requested"
                          ? "border-amber-300/20 bg-amber-950/30"
                          : "border-blue-300/20 bg-blue-950/30"
                    }`}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                        Coaching supervisor
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {missionReview.review_status === "completed"
                          ? "Feedback untuk praktikmu"
                          : missionReview.review_status === "resubmission_requested"
                            ? "Supervisor meminta bukti diperbarui"
                            : "Bukti sedang menunggu review"}
                      </h3>
                      {missionReview.review_status === "resubmission_requested" && (
                        <p className="mt-2 text-sm text-amber-100">
                          Ganti bukti yang diminta supervisor untuk mengirim ulang praktik ini.
                        </p>
                      )}
                      {missionReview.review_status === "pending" && (
                        <p className="mt-2 text-sm text-slate-300">
                          Feedback akan muncul di sini setelah supervisor meninjau bukti.
                        </p>
                      )}
                      {missionReview.glow_feedback && (
                        <div className="mt-5">
                          <p className="text-sm font-semibold text-emerald-200">Yang sudah baik</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{missionReview.glow_feedback}</p>
                        </div>
                      )}
                      {missionReview.grow_feedback && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-amber-200">Yang perlu ditingkatkan</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{missionReview.grow_feedback}</p>
                        </div>
                      )}
                      {missionReview.next_steps && (
                        <div className="mt-4 rounded-lg border border-blue-300/20 bg-blue-300/10 p-4">
                          <p className="text-sm font-semibold text-blue-100">Fokus praktik berikutnya</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{missionReview.next_steps}</p>
                        </div>
                      )}
                      {missionReviewComments.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-blue-200">Catatan pada rekaman</p>
                          <ul className="mt-2 space-y-2">
                            {missionReviewComments.map((comment) => {
                              const timestamp = formatTimestamp(comment.timestamp_seconds);
                              const mediaUrl = evidenceUrls[comment.evidence_id];
                              return (
                                <li key={comment.id}>
                                  <a
                                    href={mediaUrl
                                      ? `${mediaUrl}#t=${comment.timestamp_seconds}`
                                      : undefined}
                                    target={mediaUrl ? "_blank" : undefined}
                                    rel={mediaUrl ? "noreferrer" : undefined}
                                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm"
                                  >
                                    <span className="shrink-0 rounded bg-blue-400/15 px-2 py-1 font-mono text-xs text-blue-200">
                                      {timestamp}
                                    </span>
                                    <span className="text-slate-200">{comment.comment_text}</span>
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </Card>
                  )}
                </>
              ) : (
                <Card className="border-white/10 bg-slate-900 p-6">
                  <Badge variant="outline" className="border-white/15 text-slate-300">
                    Format lama
                  </Badge>
                  <h3 className="mt-3 text-xl font-bold">Selesaikan langkah ini</h3>
                  <p className="mt-2 text-slate-300">
                    Konten lama tetap dapat dijalankan. Jawab skenario untuk mencatat progres.
                  </p>
                  {currentModule?.key_points?.length ? (
                    <ul className="mt-5 space-y-2 text-sm text-slate-300">
                      {currentModule.key_points.map((point) => <li key={point}>• {point}</li>)}
                    </ul>
                  ) : null}
                  <div className="mt-6 space-y-6">
                    {currentModule?.quizzes?.map((quiz) => (
                      <div key={quiz.id}>
                        <p className="font-semibold">{quiz.question_text}</p>
                        <div className="mt-3 space-y-2">
                          {getQuizOptions(quiz.options).map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setLegacyAnswers((answers) => ({
                                ...answers,
                                [quiz.id]: option,
                              }))}
                              className={`w-full rounded-xl border p-3 text-left text-sm ${
                                legacyAnswers[quiz.id] === option
                                  ? "border-blue-400 bg-blue-400/15"
                                  : "border-white/10 bg-white/5"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {legacySubmitted && (
                          <p className={`mt-2 text-sm ${
                            legacyAnswers[quiz.id] === quiz.correct_answer
                              ? "text-emerald-300"
                              : "text-amber-300"
                          }`}>
                            {quiz.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    className="mt-6 w-full bg-blue-500 hover:bg-blue-400"
                    onClick={submitLegacyScenario}
                    disabled={moduleProgress?.status === "completed"}
                  >
                    {moduleProgress?.status === "completed"
                      ? "Langkah selesai"
                      : currentModule?.quizzes?.length
                        ? "Periksa jawaban"
                        : "Tandai langkah selesai"}
                  </Button>
                </Card>
              )}

              {errorMessage && (
                <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {errorMessage}
                </p>
              )}
              {completionMessage && (
                <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {completionMessage}
                </p>
              )}

              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => selectModule(currentModuleIndex - 1)}
                  disabled={currentModuleIndex === 0}
                  className="border-white/15 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  onClick={() => selectModule(currentModuleIndex + 1)}
                  disabled={currentModuleIndex >= totalModules - 1}
                  className="border-white/15 text-white hover:bg-white/10"
                >
                  Berikutnya
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            <aside className="space-y-5">
              <Card className="border-white/10 bg-slate-900 p-5 lg:sticky lg:top-5">
                <h2 className="font-bold">Langkah misi</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Pilih langkah yang ingin kamu praktikkan.
                </p>
                <div className="mt-4 space-y-2">
                  {course.modules?.map((module, index) => {
                    const status = progress.find((item) => item.module_id === module.id)?.status;
                    const active = index === currentModuleIndex;
                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => selectModule(index)}
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          active
                            ? "border-blue-400 bg-blue-400/15"
                            : "border-white/10 bg-white/5 hover:border-white/25"
                        }`}
                      >
                        <span className="flex gap-3">
                          {status === "completed"
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            : <Circle className="w-5 h-5 text-slate-500 shrink-0" />}
                          <span>
                            <span className="block text-sm font-medium text-white">{module.title}</span>
                            <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <Clock3 className="w-3.5 h-3.5" />
                              {Math.max(1, Math.round(module.duration_seconds / 60))} menit praktik
                            </span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}