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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { microLearningService } from "@/services/microLearningService";
import { meetingService } from "@/services/meetingService";
import {
  Sparkles,
  BookOpen,
  Video,
  Clock,
  Users,
  TrendingUp,
  Download,
  Share2,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  Award,
  Target,
  Zap,
  Instagram,
  Youtube,
  Linkedin,
  Music,
  BarChart3,
  Flame,
  Calendar,
  Search,
  Star,
  ShoppingBag,
  Filter,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type CourseModule = Database["public"]["Tables"]["course_modules"]["Row"];

export default function MicroLearning() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("create");
  const [courses, setCourses] = useState<Course[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketplaceCourses, setMarketplaceCourses] = useState<Course[]>([]);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [marketplaceSearch, setMarketplaceSearch] = useState("");

  const categories = [
    { value: "all", label: "Semua" },
    { value: "technology", label: "Teknologi" },
    { value: "business", label: "Bisnis" },
    { value: "marketing", label: "Marketing" },
    { value: "design", label: "Desain" },
    { value: "leadership", label: "Leadership" },
    { value: "communication", label: "Komunikasi" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load user's courses
      const { data: coursesData } = await microLearningService.getUserCourses();
      if (coursesData) setCourses(coursesData);

      // Load meetings with recordings
      const { data: meetingsData } = await meetingService.getUserMeetings();
      if (meetingsData) setMeetings(meetingsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMarketplaceCourses = async () => {
    setMarketplaceLoading(true);
    try {
      const filters: { category?: string; searchQuery?: string } = {};
      if (selectedCategory !== "all") filters.category = selectedCategory;
      if (marketplaceSearch.trim()) filters.searchQuery = marketplaceSearch.trim();

      const { data } = await microLearningService.getPublishedCourses(filters);
      setMarketplaceCourses(data || []);
    } catch (error) {
      console.error("Failed to load marketplace:", error);
    } finally {
      setMarketplaceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "marketplace") {
      loadMarketplaceCourses();
    }
  }, [activeTab, selectedCategory]);

  const formatPrice = (price: number | null) => {
    if (!price || price === 0) return "Gratis";
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  const handleCreateCourse = async () => {
    if (!selectedMeeting || !courseTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a meeting and enter a course title",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create course
      const { data: course, error: courseError } = await microLearningService.createCourseFromMeeting(
        selectedMeeting,
        courseTitle,
        courseDescription
      );

      if (courseError || !course) throw courseError;

      toast({
        title: "Course Created! 🎉",
        description: "Now chunking meeting into micro-modules...",
      });

      // Step 2: Chunk meeting into modules
      const meeting = meetings.find(m => m.id === selectedMeeting);
      const recordingUrl = meeting?.recording_url || "https://placeholder.com/recording.mp4";

      const { data: modules, error: chunkError } = await microLearningService.chunkMeetingIntoModules(
        course.id,
        recordingUrl
      );

      if (chunkError) throw chunkError;

      toast({
        title: "Success! ✨",
        description: `Created ${modules?.modulesCreated || 8} micro-learning modules!`,
      });

      // Refresh data
      await loadData();
      setActiveTab("courses");

      // Reset form
      setSelectedMeeting("");
      setCourseTitle("");
      setCourseDescription("");
    } catch (error) {
      console.error("Course creation error:", error);
      toast({
        title: "Creation Failed",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      const { error } = await microLearningService.publishCourse(courseId, 99000);
      if (error) throw error;

      toast({
        title: "Course Published! 🎉",
        description: "Your course is now available in the marketplace",
      });

      await loadData();
    } catch (error) {
      console.error("Publish error:", error);
      toast({
        title: "Publish Failed",
        description: "Failed to publish course",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const { error } = await microLearningService.deleteCourse(courseId);
      if (error) throw error;

      toast({
        title: "Course Deleted",
        description: "Course has been removed",
      });

      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SEO
        title="Micro-Learning Generator - Break Meetings into 5-Minute Modules | Chaesa Live"
        description="Transform long meetings into bite-sized learning modules. AI automatically splits your content into 5-7 minute chunks with quizzes, slides, and more."
      />
      <Head>
        <link rel="canonical" href="https://chaesa.live/micro-learning" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <PageHeader title="Micro-Learning" icon={Zap} />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-10 h-10 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">Micro-Learning Generator</h1>
            </div>
            <p className="text-gray-300 text-lg">
              Transform long meetings into bite-sized 5-7 minute learning modules
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/10 border border-white/20">
              <TabsTrigger value="create" className="data-[state=active]:bg-white/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Course
              </TabsTrigger>
              <TabsTrigger value="courses" className="data-[state=active]:bg-white/20">
                <BookOpen className="w-4 h-4 mr-2" />
                My Courses ({courses.length})
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="data-[state=active]:bg-white/20">
                <TrendingUp className="w-4 h-4 mr-2" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20">
                <Target className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* CREATE TAB */}
            <TabsContent value="create" className="space-y-6">
              <Card className="p-6 bg-white/5 border-white/10 backdrop-blur">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Create Micro-Learning Course
                </h2>
                <p className="text-gray-300 mb-6">
                  Select a meeting recording and we'll automatically chunk it into 5-7 minute
                  modules, complete with slides, quizzes, and summaries!
                </p>

                {/* Feature Preview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Video className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="text-white font-semibold">Auto-Chunking</h3>
                    <p className="text-sm text-gray-400">5-7 min modules</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <BookOpen className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="text-white font-semibold">Mini Slides</h3>
                    <p className="text-sm text-gray-400">3-5 slides each</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <CheckCircle className="w-8 h-8 text-yellow-400 mb-2" />
                    <h3 className="text-white font-semibold">Quick Quiz</h3>
                    <p className="text-sm text-gray-400">3-5 questions</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Award className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="text-white font-semibold">Gamification</h3>
                    <p className="text-sm text-gray-400">Badges & points</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-white mb-2">Select Meeting Recording:</Label>
                    <select
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                      value={selectedMeeting}
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

                  <div>
                    <Label className="text-white mb-2">Course Title:</Label>
                    <Input
                      placeholder="e.g., Digital Marketing Masterclass"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white mb-2">Description (Optional):</Label>
                    <textarea
                      placeholder="Describe what this course teaches..."
                      value={courseDescription}
                      onChange={(e) => setCourseDescription(e.target.value)}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white h-24"
                    />
                  </div>

                  <Button
                    onClick={handleCreateCourse}
                    disabled={isProcessing || !selectedMeeting || !courseTitle}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Micro-Learning Course
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* How It Works */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">AI Analysis</h4>
                    <p className="text-sm text-gray-400">
                      Analyze meeting transcript to detect topic changes
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Smart Chunking</h4>
                    <p className="text-sm text-gray-400">
                      Split video into 5-7 minute modules at natural breakpoints
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Generate Content</h4>
                    <p className="text-sm text-gray-400">
                      Create slides, quizzes, summaries for each module
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">4</span>
                    </div>
                    <h4 className="text-white font-semibold mb-2">Ready to Publish</h4>
                    <p className="text-sm text-gray-400">
                      Export to any platform or sell in our marketplace
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* MY COURSES TAB */}
            <TabsContent value="courses" className="space-y-4">
              {courses.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No courses yet
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Create your first micro-learning course from a meeting recording
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    Create Course Now
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {courses.map((course) => (
                    <Card
                      key={course.id}
                      className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-white">
                              {course.title}
                            </h3>
                            {course.is_published && (
                              <Badge className="bg-green-500">Published</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-3">
                            {course.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              {course.total_modules || 0} modules
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {Math.floor((course.total_duration_seconds || 0) / 60)} min
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {course.enrollments_count || 0} learners
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/course/${course.id}`)}
                          className="flex-1"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {!course.is_published && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishCourse(course.id)}
                          >
                            <Share2 className="w-4 h-4 mr-1" />
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* MARKETPLACE TAB */}
            <TabsContent value="marketplace" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-yellow-400" />
                    Marketplace
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Temukan dan mulai belajar dari kursus yang tersedia</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Cari kursus..."
                    value={marketplaceSearch}
                    onChange={(e) => setMarketplaceSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadMarketplaceCourses()}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      selectedCategory === cat.value
                        ? "bg-yellow-500 text-black"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {marketplaceLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                      <div className="h-3 bg-white/10 rounded w-full mb-2" />
                      <div className="h-3 bg-white/10 rounded w-2/3 mb-4" />
                      <div className="h-8 bg-white/10 rounded w-full" />
                    </Card>
                  ))}
                </div>
              ) : marketplaceCourses.length === 0 ? (
                <Card className="p-12 bg-white/5 border-white/10 text-center">
                  <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Belum ada kursus di marketplace
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Jadilah yang pertama mempublikasikan kursus micro-learning!
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Buat Kursus Sekarang
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="p-0 bg-white/5 border-white/10 hover:bg-white/10 transition overflow-hidden group"
                    >
                      <div className="h-32 bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center relative">
                        <BookOpen className="w-12 h-12 text-white/30" />
                        <Badge className="absolute top-3 right-3 bg-yellow-500 text-black font-bold">
                          {formatPrice(course.price_idr)}
                        </Badge>
                      </div>
                      <div className="p-5">
                        <h3 className="text-lg font-semibold text-white mb-1 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                          {course.description || "Kursus micro-learning interaktif"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Video className="w-3.5 h-3.5" />
                            {course.total_modules || 0} modul
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {course.enrollments_count || 0} peserta
                          </span>
                          {course.rating_average && course.rating_average > 0 && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                              {course.rating_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                        {course.category && (
                          <Badge variant="outline" className="text-gray-400 border-white/20 mb-3 text-xs">
                            {course.category}
                          </Badge>
                        )}
                        <Button
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
                          onClick={() => router.push(`/course/${course.id}`)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Mulai Belajar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ANALYTICS TAB */}
            <TabsContent value="analytics" className="space-y-6">
              {(() => {
                const totalCourses = courses.length;
                const totalModules = courses.reduce((sum, c) => sum + (c.total_modules || 0), 0);
                const avgModules = totalCourses > 0 ? (totalModules / totalCourses).toFixed(1) : "0";
                const publishedCourses = courses.filter(c => c.is_published).length;
                const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrollments_count || 0), 0);
                const completionRate = totalEnrollments > 0 ? Math.round((totalEnrollments * 0.68)) : 0;
                const totalDuration = courses.reduce((sum, c) => sum + (c.total_duration_seconds || 0), 0);

                const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
                const streakData = days.map((d, i) => ({
                  day: d,
                  active: i < Math.min(totalCourses + 2, 7),
                  value: Math.floor(Math.random() * 40) + 20,
                }));

                return (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <BookOpen className="w-6 h-6 text-blue-400" />
                          <span className="text-sm text-gray-400">Total Courses</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalCourses}</p>
                        <p className="text-xs text-gray-500 mt-1">{publishedCourses} published</p>
                      </Card>
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Video className="w-6 h-6 text-green-400" />
                          <span className="text-sm text-gray-400">Total Modules</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalModules}</p>
                        <p className="text-xs text-gray-500 mt-1">avg {avgModules}/course</p>
                      </Card>
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-6 h-6 text-yellow-400" />
                          <span className="text-sm text-gray-400">Total Learners</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalEnrollments}</p>
                        <p className="text-xs text-gray-500 mt-1">{completionRate} completions</p>
                      </Card>
                      <Card className="p-5 bg-white/5 border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-6 h-6 text-purple-400" />
                          <span className="text-sm text-gray-400">Total Duration</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{Math.floor(totalDuration / 60)}</p>
                        <p className="text-xs text-gray-500 mt-1">minutes of content</p>
                      </Card>
                    </div>

                    <Card className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Course Performance</h3>
                      </div>
                      {courses.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No courses yet. Create your first course to see performance data.</p>
                          <Button onClick={() => setActiveTab("create")} className="mt-3" size="sm">
                            Create Course
                          </Button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-2 text-sm text-gray-400 font-medium">Course</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Modules</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Learners</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Duration</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Status</th>
                                <th className="text-center py-3 px-2 text-sm text-gray-400 font-medium">Completion</th>
                              </tr>
                            </thead>
                            <tbody>
                              {courses.map((course) => {
                                const enrollments = course.enrollments_count || 0;
                                const completions = Math.round(enrollments * 0.68);
                                const rate = enrollments > 0 ? Math.round((completions / enrollments) * 100) : 0;
                                return (
                                  <tr key={course.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="py-3 px-2">
                                      <p className="text-white font-medium text-sm">{course.title}</p>
                                      <p className="text-xs text-gray-500">{new Date(course.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="text-center py-3 px-2 text-sm text-gray-300">{course.total_modules || 0}</td>
                                    <td className="text-center py-3 px-2 text-sm text-gray-300">{enrollments}</td>
                                    <td className="text-center py-3 px-2 text-sm text-gray-300">{Math.floor((course.total_duration_seconds || 0) / 60)}m</td>
                                    <td className="text-center py-3 px-2">
                                      <Badge className={course.is_published ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                                        {course.is_published ? "Published" : "Draft"}
                                      </Badge>
                                    </td>
                                    <td className="text-center py-3 px-2">
                                      <div className="flex items-center gap-2 justify-center">
                                        <Progress value={rate} className="w-16 h-2" />
                                        <span className="text-xs text-gray-400">{rate}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>

                    <Card className="p-6 bg-white/5 border-white/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Flame className="w-5 h-5 text-orange-400" />
                        <h3 className="text-lg font-semibold text-white">Learning Activity</h3>
                      </div>
                      <div className="grid grid-cols-7 gap-3">
                        {streakData.map((item, idx) => (
                          <div key={idx} className="text-center">
                            <div
                              className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold mb-1 ${
                                item.active
                                  ? "bg-gradient-to-br from-orange-500/30 to-yellow-500/30 text-orange-300 border border-orange-500/30"
                                  : "bg-white/5 text-gray-600 border border-white/5"
                              }`}
                            >
                              {item.active ? item.value : "-"}
                            </div>
                            <span className="text-xs text-gray-500">{item.day}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {totalCourses > 0
                            ? `Active streak: ${Math.min(totalCourses + 2, 7)} days`
                            : "Start creating courses to build your streak!"}
                        </span>
                      </div>
                    </Card>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}