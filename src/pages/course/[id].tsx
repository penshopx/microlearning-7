import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  CheckCircle, Circle, Lock, ChevronRight, Award,
  Download, Share2, Clock, BookOpen, Trophy, Zap
} from "lucide-react";
import { microLearningService } from "@/services/microLearningService";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"] & {
  modules?: Module[];
};

type Module = Database["public"]["Tables"]["course_modules"]["Row"] & {
  content?: ModuleContent[];
  quizzes?: ModuleQuiz[];
};

type ModuleContent = Database["public"]["Tables"]["module_content"]["Row"];
type ModuleQuiz = Database["public"]["Tables"]["module_quizzes"]["Row"];
type LearnerProgress = Database["public"]["Tables"]["learner_progress"]["Row"];

export default function CoursePage() {
  const router = useRouter();
  const { id } = router.query;
  const courseId = typeof id === "string" ? id : "";

  const [course, setCourse] = useState<Course | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [progress, setProgress] = useState<LearnerProgress[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadProgress();
    }
  }, [courseId]);

  const loadCourse = async () => {
    setLoading(true);
    const result = await microLearningService.getCourseWithModules(courseId);
    if (result.data) {
      setCourse(result.data);
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    const result = await microLearningService.getLearnerProgress(courseId);
    if (result.data) {
      setProgress(result.data);
    }
  };

  const currentModule = course?.modules?.[currentModuleIndex];
  const moduleProgress = progress.find((p) => p.module_id === currentModule?.id);
  const completedModules = progress.filter((p) => p.status === "completed").length;
  const totalModules = course?.modules?.length || 0;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  const handleModuleComplete = async () => {
    if (!currentModule) return;

    await microLearningService.updateProgress(courseId, currentModule.id, {
      status: "completed",
      progressPercentage: 100,
    });

    // Check for achievements
    const newCompletedCount = completedModules + 1;
    const newAchievements = [];

    if (newCompletedCount === 1) {
      newAchievements.push("First Steps");
      await microLearningService.awardAchievement(
        "first_module",
        "First Steps",
        "Completed your first module",
        10
      );
    }

    if (newCompletedCount === 5) {
      newAchievements.push("Quick Learner");
      await microLearningService.awardAchievement(
        "five_modules",
        "Quick Learner",
        "Completed 5 modules",
        50
      );
    }

    if (newCompletedCount === totalModules) {
      newAchievements.push("Course Master");
      await microLearningService.awardAchievement(
        "course_complete",
        "Course Master",
        `Completed ${course?.title}`,
        100
      );
    }

    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements]);
    }

    loadProgress();
  };

  const handleNextModule = () => {
    if (currentModuleIndex < totalModules - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
    }
  };

  const handlePreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
      setShowQuiz(false);
      setQuizSubmitted(false);
      setQuizAnswers({});
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    
    const quizzes = currentModule?.quizzes || [];
    const correctCount = quizzes.filter((q, idx) => 
      quizAnswers[idx] === q.correct_answer
    ).length;
    const score = (correctCount / quizzes.length) * 100;

    if (score >= 70) {
      handleModuleComplete();
    }
  };

  const getModuleStatus = (moduleId: string) => {
    const prog = progress.find((p) => p.module_id === moduleId);
    return prog?.status || "not_started";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Course not found</h1>
          <Link href="/micro-learning">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{course.title} - Chaesa Live Micro-Learning</title>
      </Head>
      <SEO
        title={course.title || "Course"}
        description={course.description || "Learn with Chaesa Live"}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Achievement Popup */}
        {achievements.length > 0 && (
          <div className="fixed top-20 right-4 z-50 space-y-2">
            {achievements.map((achievement, idx) => (
              <Card key={idx} className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-slide-in-right">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <div>
                    <div className="font-bold">Achievement Unlocked!</div>
                    <div className="text-sm">{achievement}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/micro-learning">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    ← Back to Courses
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl font-bold text-white">{course.title}</h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {completedModules}/{totalModules} modules
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {Math.floor((course.total_duration_seconds || 0) / 60)} min total
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-white border-white/20">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" className="text-white border-white/20">
                  <Download className="w-4 h-4 mr-2" />
                  Download Materials
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player & Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <Card className="bg-black/40 backdrop-blur-sm border-white/10 overflow-hidden">
                <div className="aspect-video bg-black relative group">
                  {currentModule?.video_url ? (
                    <video
                      className="w-full h-full"
                      controls
                      src={currentModule.video_url}
                      poster={currentModule.thumbnail_url || undefined}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <Play className="w-20 h-20" />
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        Module {currentModuleIndex + 1} of {totalModules}
                      </div>
                      <h2 className="text-2xl font-bold text-white">
                        {currentModule?.title}
                      </h2>
                    </div>
                    {moduleProgress?.status === "completed" && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  <p className="text-gray-300 mb-6">
                    {currentModule?.description}
                  </p>

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePreviousModule}
                      disabled={currentModuleIndex === 0}
                      className="text-white border-white/20"
                    >
                      <SkipBack className="w-4 h-4 mr-2" />
                      Previous
                    </Button>

                    {!showQuiz && currentModule?.quizzes && currentModule.quizzes.length > 0 && (
                      <Button
                        onClick={() => setShowQuiz(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Take Quiz
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      onClick={handleNextModule}
                      disabled={currentModuleIndex === totalModules - 1}
                      className="text-white border-white/20"
                    >
                      Next
                      <SkipForward className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quiz Section */}
              {showQuiz && currentModule?.quizzes && (
                <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-yellow-500" />
                    Module Quiz
                  </h3>

                  <div className="space-y-6">
                    {currentModule.quizzes.map((quiz, idx) => {
                      const options = (quiz.options as { options?: string[] })?.options || [];
                      const isCorrect = quizSubmitted && quizAnswers[idx] === quiz.correct_answer;
                      const isWrong = quizSubmitted && quizAnswers[idx] !== quiz.correct_answer;

                      return (
                        <div key={quiz.id} className="space-y-3">
                          <div className="text-white font-medium">
                            {idx + 1}. {quiz.question_text}
                          </div>

                          <div className="space-y-2">
                            {options.map((option, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [idx]: option })}
                                disabled={quizSubmitted}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                  quizAnswers[idx] === option
                                    ? quizSubmitted
                                      ? option === quiz.correct_answer
                                        ? "bg-green-500/20 border-green-500 text-green-300"
                                        : "bg-red-500/20 border-red-500 text-red-300"
                                      : "bg-purple-500/20 border-purple-500 text-white"
                                    : quizSubmitted && option === quiz.correct_answer
                                    ? "bg-green-500/10 border-green-500/50 text-green-300"
                                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>

                          {quizSubmitted && quiz.explanation && (
                            <div className={`p-3 rounded-lg ${
                              isCorrect ? "bg-green-500/10 text-green-300" : "bg-blue-500/10 text-blue-300"
                            }`}>
                              <div className="font-medium mb-1">Explanation:</div>
                              <div className="text-sm">{quiz.explanation}</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted && (
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={Object.keys(quizAnswers).length !== currentModule.quizzes.length}
                      className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      Submit Quiz
                    </Button>
                  )}

                  {quizSubmitted && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg text-center">
                      <div className="text-white text-lg font-bold mb-2">
                        Quiz Complete!
                      </div>
                      <div className="text-gray-300">
                        You got {currentModule.quizzes.filter((q, idx) => quizAnswers[idx] === q.correct_answer).length} out of {currentModule.quizzes.length} correct
                      </div>
                      <Button
                        onClick={() => {
                          setShowQuiz(false);
                          handleNextModule();
                        }}
                        className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        Continue to Next Module
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* Additional Content */}
              <Card className="bg-black/40 backdrop-blur-sm border-white/10">
                <Tabs defaultValue="notes" className="w-full">
                  <TabsList className="w-full bg-black/40">
                    <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                    <TabsTrigger value="slides" className="flex-1">Slides</TabsTrigger>
                    <TabsTrigger value="resources" className="flex-1">Resources</TabsTrigger>
                  </TabsList>

                  <TabsContent value="notes" className="p-6">
                    <div className="text-gray-300 space-y-4">
                      <p>Take notes while watching this module...</p>
                      <textarea
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Write your notes here..."
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="slides" className="p-6">
                    <div className="text-gray-300">
                      {currentModule?.content?.filter(c => c.content_type === "slides").length ? (
                        <div className="space-y-4">
                          {currentModule.content
                            .filter(c => c.content_type === "slides")
                            .map((content) => (
                              <a
                                key={content.id}
                                href={content.file_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span>Download Slides (PDF)</span>
                                  <Download className="w-5 h-5" />
                                </div>
                              </a>
                            ))}
                        </div>
                      ) : (
                        <p>No slides available for this module.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="resources" className="p-6">
                    <div className="text-gray-300">
                      <p>Additional resources and reading materials...</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Sidebar - Module List */}
            <div className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Course Modules</h3>
                
                <div className="space-y-2">
                  {course.modules?.map((module, idx) => {
                    const status = getModuleStatus(module.id);
                    const isActive = idx === currentModuleIndex;

                    return (
                      <button
                        key={module.id}
                        onClick={() => setCurrentModuleIndex(idx)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isActive
                            ? "bg-purple-500/20 border-purple-500"
                            : "bg-white/5 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : status === "in_progress" ? (
                              <Circle className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">
                              {module.title}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              {Math.floor((module.duration_seconds || 0) / 60)} min
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Course Stats */}
              <Card className="bg-black/40 backdrop-blur-sm border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Your Progress</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Completed Modules</span>
                      <span>{completedModules}/{totalModules}</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Time Invested</div>
                    <div className="text-2xl font-bold text-white">
                      {Math.floor((progress.reduce((acc, p) => acc + (p.time_spent_seconds || 0), 0)) / 60)} min
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400 mb-2">Quiz Average</div>
                    <div className="text-2xl font-bold text-white">
                      {progress.length > 0
                        ? Math.round(progress.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / progress.length)
                        : 0}%
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}