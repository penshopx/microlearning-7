import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { aiCourseService } from "@/services/aiCourseService";
import { meetingService } from "@/services/meetingService";
import {
  Sparkles,
  FileText,
  Presentation,
  BookOpen,
  Mic,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Trash2,
  Share2,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type GeneratedContent = Database["public"]["Tables"]["generated_content"]["Row"];
type AIProcessingJob = Database["public"]["Tables"]["ai_processing_jobs"]["Row"];

export default function AIStudio() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("library");
  const [library, setLibrary] = useState<GeneratedContent[]>([]);
  const [jobs, setJobs] = useState<AIProcessingJob[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please login to access AI Studio",
          variant: "destructive",
        });
        router.push("/");
        return;
      }

      // TODO: Re-enable subscription check after trial period
      // const { data: profile } = await supabase
      //   .from("profiles")
      //   .select("subscription_plan, subscription_expires_at")
      //   .eq("id", user.id)
      //   .single();
      //
      // const plan = profile?.subscription_plan || "free";
      // const expiresAt = profile?.subscription_expires_at;
      // const isActive = !expiresAt || new Date(expiresAt) > new Date();
      //
      // if (plan === "free" || !isActive) {
      //   toast({
      //     title: "Upgrade Required",
      //     description: "AI Studio requires Pro plan or higher",
      //     variant: "destructive",
      //   });
      //   router.push("/pricing");
      //   return;
      // }

      setHasAccess(true);
      loadData();
    } catch (error) {
      console.error("Error checking access:", error);
      router.push("/");
    }
  };

  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [hasAccess]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load content library
      const { data: contentData } = await aiCourseService.getContentLibrary();
      if (contentData) setLibrary(contentData);

      // Load processing jobs
      const { data: jobsData } = await aiCourseService.getUserJobs();
      if (jobsData) setJobs(jobsData);

      // Load user meetings with recordings
      const { data: meetingsData } = await meetingService.getUserMeetings();
      if (meetingsData) setMeetings(meetingsData);
    } catch (error) {
      console.error("Failed to load AI Studio data:", error);
      toast({
        title: "Error",
        description: "Failed to load AI Studio data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCourse = async () => {
    if (!selectedMeeting) {
      toast({
        title: "No meeting selected",
        description: "Please select a meeting to generate course content",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await aiCourseService.generateCoursePackage(
        selectedMeeting,
        selectedMeeting // In real app, we'd get recording ID separately
      );

      if (error) throw error;

      toast({
        title: "Course generation started! 🎉",
        description: "We're processing your meeting. This usually takes 2-5 minutes.",
      });

      // Refresh jobs list
      setTimeout(() => loadData(), 1000);
    } catch (error) {
      console.error("Course generation error:", error);
      toast({
        title: "Generation failed",
        description: "Failed to start course generation",
        variant: "destructive",
      });
    }
  };

  const getContentIcon = (type: string) => {
    const icons: Record<string, any> = {
      presentation: Presentation,
      ebook: BookOpen,
      quiz: FileText,
      podcast: Mic,
      summary: FileText,
    };
    return icons[type] || FileText;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { icon: Clock, color: "bg-yellow-500" },
      processing: { icon: Loader2, color: "bg-blue-500" },
      completed: { icon: CheckCircle, color: "bg-green-500" },
      failed: { icon: AlertCircle, color: "bg-red-500" },
    };

    const { icon: Icon, color } = variants[status] || variants.pending;

    return (
      <Badge variant="outline" className={`${color} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <SEO
        title="AI Studio - Transform Meetings into Courses | Chaesa Live"
        description="AI-powered course generator. Transform your meetings into presentations, ebooks, quizzes, and podcasts automatically."
      />
      <Head>
        <link rel="canonical" href="https://chaesa.live/ai-studio" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <PageHeader title="AI Studio" icon={Sparkles} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-10 h-10 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">AI Studio</h1>
            </div>
            <p className="text-gray-300 text-lg">
              Transform your meetings into professional course materials with AI
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="generate" className="data-[state=active]:bg-white/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </TabsTrigger>
              <TabsTrigger value="library" className="data-[state=active]:bg-white/20">
                <BookOpen className="w-4 h-4 mr-2" />
                Library ({library.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-white/20">
                <Clock className="w-4 h-4 mr-2" />
                Processing ({jobs.filter((j) => j.status !== "completed").length})
              </TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Generate Course Package
                </h2>
                <p className="text-gray-300 mb-6">
                  Select a meeting and we'll automatically generate:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Presentation className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="text-white font-semibold">Presentation</h3>
                    <p className="text-sm text-gray-400">PowerPoint slides</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <BookOpen className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="text-white font-semibold">eBook</h3>
                    <p className="text-sm text-gray-400">PDF module</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <FileText className="w-8 h-8 text-yellow-400 mb-2" />
                    <h3 className="text-white font-semibold">Quiz</h3>
                    <p className="text-sm text-gray-400">Assessment test</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2">Select Meeting:</label>
                    <select
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      value={selectedMeeting || ""}
                      onChange={(e) => setSelectedMeeting(e.target.value)}
                    >
                      <option value="">Choose a meeting...</option>
                      {meetings.map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.title || `Meeting ${meeting.meeting_code}`} -{" "}
                          {new Date(meeting.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={handleGenerateCourse}
                    disabled={!selectedMeeting}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Course Package
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library" className="space-y-4">
              {library.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No content yet
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Generate your first course package to get started
                  </p>
                  <Button onClick={() => setActiveTab("generate")}>
                    Generate Now
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {library.map((content) => {
                    const Icon = getContentIcon(content.content_type);
                    return (
                      <Card
                        key={content.id}
                        className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <Icon className="w-8 h-8 text-blue-400" />
                          {content.is_published && (
                            <Badge className="bg-green-500">Published</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {content.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                          {content.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Eye className="w-4 h-4" />
                          {content.views_count} views
                          <Download className="w-4 h-4 ml-2" />
                          {content.downloads_count} downloads
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" className="flex-1">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Processing Jobs Tab */}
            <TabsContent value="jobs" className="space-y-4">
              {jobs.filter((j) => j.status !== "completed").length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    All caught up!
                  </h3>
                  <p className="text-gray-400">No processing jobs in queue</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {jobs
                    .filter((j) => j.status !== "completed")
                    .map((job) => (
                      <Card
                        key={job.id}
                        className="p-4 bg-white/5 border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold">
                            {job.job_type.replace(/_/g, " ").toUpperCase()}
                          </h3>
                          {getStatusBadge(job.status)}
                        </div>
                        {job.status === "processing" && (
                          <Progress value={65} className="h-2" />
                        )}
                        <p className="text-sm text-gray-400 mt-2">
                          Started {new Date(job.created_at).toLocaleString()}
                        </p>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}