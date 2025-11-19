import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GraduationCap, BookOpen, FileText, TrendingUp, LogOut, Award, Sparkles, Target, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Profile {
  full_name: string;
}

interface UserRole {
  role: "admin" | "teacher" | "student";
}

interface Course {
  id: string;
  subject_id: string;
  subject_name: string;
  progress: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    if (profileError) {
      toast.error("Failed to load profile");
      setLoading(false);
      return;
    }

    // Fetch user role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (roleError) {
      toast.error("Failed to load user role");
      setLoading(false);
      return;
    }

    setProfile(profileData);
    setUserRole(roleData);
    
    // Redirect to appropriate dashboard
    if (roleData.role === "student") {
      navigate("/student-dashboard");
    } else if (roleData.role === "teacher") {
      navigate("/teacher-dashboard");
    }
    
    setLoading(false);
  };

  const fetchStudentCourses = async (userId: string) => {
    const { data, error } = await supabase
      .from("student_courses")
      .select(`
        id,
        subject_id,
        progress,
        subjects (
          name
        )
      `)
      .eq("student_id", userId);

    if (!error && data) {
      setCourses(
        data.map((item: any) => ({
          id: item.id,
          subject_id: item.subject_id,
          subject_name: item.subjects?.name || "Unknown",
          progress: item.progress || 0,
        }))
      );
    }

    // Fetch student stats
    const { data: subjectData } = await supabase
      .from("subjects")
      .select("id");
    
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("id");
    
    const { data: attemptData } = await supabase
      .from("quiz_attempts")
      .select("id")
      .eq("student_id", userId)
      .not("completed_at", "is", null);

    setStats({
      totalSubjects: subjectData?.length || 0,
      totalQuizzes: quizData?.length || 0,
      completedQuizzes: attemptData?.length || 0,
    });
  };

  const fetchTeacherSubjects = async (userId: string) => {
    const { data, error } = await supabase
      .from("teacher_subjects")
      .select(`
        subject_id,
        subjects (
          id,
          name
        )
      `)
      .eq("teacher_id", userId);

    if (!error && data) {
      setCourses(
        data.map((item: any) => ({
          id: item.subject_id,
          subject_id: item.subject_id,
          subject_name: item.subjects?.name || "Unknown",
          progress: 100, // Teachers always show 100%
        }))
      );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background">
        <nav className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </nav>
        <div className="container mx-auto p-6">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary p-2.5 rounded-2xl shadow-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                E-shuri
              </h1>
              <p className="text-xs text-muted-foreground">Rwanda Learning Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/subjects")} className="hidden md:flex">
              Browse Subjects
            </Button>
            {(userRole?.role === "teacher" || userRole?.role === "admin") && (
              <Button variant="ghost" onClick={() => navigate("/upload")} className="hidden md:flex">
                Upload Content
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary py-16 md:py-24">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-primary-foreground mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                {userRole?.role === "student" ? "Student Dashboard" : "Teacher Dashboard"}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">
              Welcome back, {profile?.full_name}!
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8">
              {userRole?.role === "student"
                ? "Continue your learning journey with Rwanda's best educational platform"
                : "Manage your content and empower the next generation of learners"}
            </p>
            {userRole?.role === "student" && (
              <div className="flex flex-col gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center justify-between text-primary-foreground">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold">45%</span>
                </div>
                <Progress value={45} className="h-3 bg-white/20" />
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-foreground">{stats.totalSubjects}</div>
                    <div className="text-xs text-primary-foreground/70">Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-foreground">{stats.totalQuizzes}</div>
                    <div className="text-xs text-primary-foreground/70">Quizzes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-foreground">{stats.completedQuizzes}</div>
                    <div className="text-xs text-primary-foreground/70">Completed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {userRole?.role === "student" ? (
          <>
            {/* Quick Actions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card hover:scale-105"
                  onClick={() => navigate("/subjects")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow">
                      <BookOpen className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Browse Subjects</CardTitle>
                      <CardDescription className="text-base">
                        Explore curriculum-aligned content across all O & A Level subjects
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <span>Start Learning</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-secondary/50 bg-gradient-to-br from-card to-card hover:scale-105"
                  onClick={() => navigate("/quizzes")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground p-4 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow">
                      <FileText className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Take Quizzes</CardTitle>
                      <CardDescription className="text-base">
                        Test your knowledge with CBC-aligned practice exercises
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                      <span>Practice Now</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br from-card to-card hover:scale-105"
                  onClick={() => navigate("/progress")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl w-fit shadow-lg group-hover:shadow-xl transition-shadow">
                      <TrendingUp className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">My Progress</CardTitle>
                      <CardDescription className="text-base">
                        Track your mastery levels and performance analytics
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <span>View Stats</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* My Courses Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6 text-secondary" />
                My Courses
              </h2>
              {courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, index) => (
                    <Card 
                      key={course.id} 
                      className={`border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                        index % 2 === 0 ? "border-l-primary" : "border-l-secondary"
                      }`}
                      onClick={() => navigate(`/subjects`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{course.subject_name}</CardTitle>
                        <CardDescription>Click to view content</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={course.progress} className="mb-2" />
                        <p className="text-sm text-muted-foreground">{course.progress}% Complete</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      You haven't enrolled in any courses yet. Browse subjects to get started!
                    </p>
                    <div className="flex justify-center mt-4">
                      <Button onClick={() => navigate("/subjects")}>Browse Subjects</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Teacher Quick Actions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Teacher Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 hover:scale-105"
                  onClick={() => navigate("/upload")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl w-fit shadow-lg">
                      <BookOpen className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Upload Content</CardTitle>
                      <CardDescription className="text-base">
                        Add new lessons, videos, and educational materials by year and unit
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <span>Upload Now</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-secondary/50 hover:scale-105"
                  onClick={() => navigate("/create-quiz")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground p-4 rounded-2xl w-fit shadow-lg">
                      <FileText className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Create Quiz</CardTitle>
                      <CardDescription className="text-base">
                        Build CBC-aligned assessments for your students
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                      <span>Create Now</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 hover:scale-105"
                  onClick={() => navigate("/student-performance")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-2xl w-fit shadow-lg">
                      <TrendingUp className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Student Performance</CardTitle>
                      <CardDescription className="text-base">
                        View detailed analytics and progress tracking for all students
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                      <span>View Analytics</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-secondary/50 hover:scale-105"
                  onClick={() => navigate("/past-exams")}
                >
                  <CardHeader className="space-y-4">
                    <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground p-4 rounded-2xl w-fit shadow-lg">
                      <Award className="h-10 w-10" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">Past Exams</CardTitle>
                      <CardDescription className="text-base">
                        Upload and manage past examination papers for students
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-secondary font-medium">
                      <span>Manage Exams</span>
                      <span>→</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Teacher Courses */}
            {courses.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Subjects I Teach</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course, index) => (
                    <Card 
                      key={course.id} 
                      className={`border-l-4 cursor-pointer hover:shadow-lg transition-shadow ${
                        index % 2 === 0 ? "border-l-primary" : "border-l-secondary"
                      }`}
                      onClick={() => navigate(`/subjects`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{course.subject_name}</CardTitle>
                        <CardDescription>Manage content and students</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">
                          View Content
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
