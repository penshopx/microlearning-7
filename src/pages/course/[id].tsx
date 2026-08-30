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
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";
import {
  emptyMissionProgress,
  microLearningService,
  normalizeMissionProgress,
  normalizeWorkplaceMission,
  type MissionProgress,
  type WorkplaceMission,
} from "@/services/microLearningService";

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

function getQuizOptions(options: ModuleQuiz["options"]): string[] {
  return Array.isArray(options)
    ? options.filter((option): option is string => typeof option === "string")
    : [];
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
  const courseId = typeof router.query.id === "string" ? router.query.id : "";
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<LearnerProgress[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [missionProgress, setMissionProgress] = useState<MissionProgress>(emptyMissionProgress);
  const [legacyAnswers, setLegacyAnswers] = useState<Record<string, string>>({});
  const [legacySubmitted, setLegacySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [completionMessage, setCompletionMessage] = useState("");
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const finalizingRef = useRef(false);

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
      if (progressResult.data) setProgress(progressResult.data);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [courseId]);

  const currentModule = course?.modules?.[currentModuleIndex];
  const moduleProgress = progress.find((item) => item.module_id === currentModule?.id);
  const mission = useMemo<WorkplaceMission | null>(() => {
    const missionContent = currentModule?.content?.find((item) => {
      const value = item.content_data as { kind?: unknown } | null;
      return item.content_type === "worksheet" && value?.kind === "workplace-mission";
    });
    return normalizeWorkplaceMission(missionContent?.content_data);
  }, [currentModule]);

  useEffect(() => {
    setMissionProgress(normalizeMissionProgress(moduleProgress?.mission_progress));
    setLegacyAnswers({});
    setLegacySubmitted(false);
    setCompletionMessage("");
    setErrorMessage("");
    setFinalizing(false);
    finalizingRef.current = false;
  }, [currentModule?.id]);

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

  const requiredEvidence = mission?.evidence.filter((item) => item.required).length || 0;
  const missionLocked = moduleProgress?.status === "completed" || finalizing;
  const practiceComplete = practiceChecks.length > 0 &&
    practiceChecks.every((item) => missionProgress.checkedPracticeIds.includes(item.id));
  const decisionComplete = scenarioOptions.length === 0 || Boolean(missionProgress.selectedDecision);
  const reflectionComplete = missionProgress.feedback.trim().length >= 10;
  const canCompleteMission = Boolean(
    mission &&
    practiceComplete &&
    decisionComplete &&
    (requiredEvidence === 0 || missionProgress.evidenceConfirmed) &&
    reflectionComplete
  );

  const persistMissionProgress = (
    next: MissionProgress,
    status: "in_progress" | "completed" = "in_progress"
  ): Promise<boolean> => {
    if (!currentModule) return Promise.resolve(false);
    if ((moduleProgress?.status === "completed" || finalizingRef.current) && status !== "completed") {
      return Promise.resolve(false);
    }
    const moduleId = currentModule.id;
    const sequence = ++saveSequenceRef.current;
    setSaving(true);
    setErrorMessage("");

    const operation = saveQueueRef.current.then(async () => {
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
      });

      if (result.error || !result.data) {
        setErrorMessage("Perubahan belum tersimpan. Coba lagi sebelum menutup halaman.");
        return false;
      }

      setProgress((current) => mergeProgress(current, result.data));
      return true;
    }).finally(() => {
      if (sequence === saveSequenceRef.current) setSaving(false);
    });

    saveQueueRef.current = operation.then(() => undefined, () => undefined);
    return operation;
  };

  const togglePracticeCheck = (checkId: string) => {
    if (finalizingRef.current || moduleProgress?.status === "completed") return;
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
    if (finalizingRef.current || moduleProgress?.status === "completed") return;
    setMissionProgress((current) => {
      const next = { ...current, selectedDecision: option };
      void persistMissionProgress(next);
      return next;
    });
  };

  const confirmEvidence = () => {
    if (finalizingRef.current || moduleProgress?.status === "completed") return;
    setMissionProgress((current) => {
      const next = {
        ...current,
        evidenceConfirmed: !current.evidenceConfirmed,
      };
      void persistMissionProgress(next);
      return next;
    });
  };

  const completeMission = async () => {
    if (!canCompleteMission) return;
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
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
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
                      {mission.evidence.map((evidence) => (
                        <div key={evidence.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <FileCheck2 className="w-5 h-5 text-emerald-300" />
                            <Badge variant="outline" className="border-white/15 text-slate-300 capitalize">
                              {evidence.type}
                            </Badge>
                          </div>
                          <p className="mt-3 font-semibold">{evidence.label}</p>
                          <p className="mt-1 text-sm text-slate-400">{evidence.instruction}</p>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={confirmEvidence}
                      disabled={missionLocked}
                      className={`mt-5 w-full border-white/15 ${
                        missionProgress.evidenceConfirmed
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      <FileCheck2 className="w-4 h-4 mr-2" />
                      {missionProgress.evidenceConfirmed
                        ? "Bukti sudah siap ditinjau"
                        : "Konfirmasi bukti sudah siap"}
                    </Button>
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
                      value={missionProgress.feedback}
                      onChange={(event) => setMissionProgress({
                        ...missionProgress,
                        feedback: event.target.value,
                      })}
                      onBlur={() => void persistMissionProgress(missionProgress)}
                      disabled={missionLocked}
                      placeholder="Tulis refleksi singkat (minimal 10 karakter)..."
                      className="mt-4 min-h-28 border-white/15 bg-black/25 text-white placeholder:text-slate-500"
                    />
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
                      disabled={!canCompleteMission || saving || moduleProgress?.status === "completed"}
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