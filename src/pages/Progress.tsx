import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Award, TrendingUp, Target, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateCertificate } from "@/components/CertificateGenerator";

interface AttemptData {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
  quiz: {
    title: string;
    subject: {
      name: string;
    };
  };
}

interface CompletedCourse {
  id: string;
  subject_id: string;
  completed: boolean;
  completed_at: string;
  certificate_url: string | null;
  subject: {
    name: string;
    year_level: string;
  };
}

const Progress = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [completedCourses, setCompletedCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCert, setGeneratingCert] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    averageScore: 0,
    highestScore: 0,
  });

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to view your progress");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        score,
        max_score,
        completed_at,
        quiz:quizzes(
          title,
          subject:subjects(name)
        )
      `)
      .eq("student_id", session.user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) {
      toast.error("Failed to load progress");
      setLoading(false);
      return;
    }

    const typedData = data as unknown as AttemptData[];
    setAttempts(typedData);

    // Calculate stats
    const totalQuizzes = typedData.length;
    const scores = typedData.map((a) => (a.score / a.max_score) * 100);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / (totalQuizzes || 1);
    const highestScore = Math.max(...scores, 0);

    setStats({ totalQuizzes, averageScore, highestScore });

    // Fetch completed courses
    const { data: coursesData } = await supabase
      .from("student_courses")
      .select(`
        id,
        subject_id,
        completed,
        completed_at,
        certificate_url,
        subject:subjects(name, year_level)
      `)
      .eq("student_id", session.user.id)
      .eq("completed", true);

    setCompletedCourses((coursesData as any) || []);
    setLoading(false);
  };

  const handleGenerateCertificate = async (course: CompletedCourse) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    setGeneratingCert(course.id);
    await generateCertificate({
      studentName: profile?.full_name || "Student",
      courseName: `${course.subject.name} ${course.subject.year_level}`,
      completionDate: course.completed_at,
      courseId: course.subject_id,
      studentId: session.user.id,
    });
    setGeneratingCert(null);
    fetchProgress(); // Refresh to get updated certificate URL
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background">
        <div className="container mx-auto p-6 max-w-6xl">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">My Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Quizzes Taken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{stats.totalQuizzes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">
                {stats.averageScore.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent-foreground" />
                Best Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent-foreground">
                {stats.highestScore.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Completed Courses & Certificates */}
        {completedCourses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-secondary" />
                Completed Courses & Certificates
              </CardTitle>
              <CardDescription>Download your course completion certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedCourses.map((course) => (
                  <Card key={course.id} className="border-secondary/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">
                            {course.subject.name} {course.subject.year_level}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Completed {new Date(course.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleGenerateCertificate(course)}
                          disabled={generatingCert === course.id}
                          className="bg-secondary"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {course.certificate_url ? "Download" : "Generate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quiz History</CardTitle>
            <CardDescription>Your recent quiz performance</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No quiz attempts yet. Start taking quizzes to track your progress!
              </p>
            ) : (
              <div className="space-y-4">
                {attempts.map((attempt) => {
                  const percentage = (attempt.score / attempt.max_score) * 100;
                  return (
                    <div key={attempt.id} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{attempt.quiz.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {attempt.quiz.subject.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {attempt.score}/{attempt.max_score}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(attempt.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ProgressBar value={percentage} className="h-2" />
                      <p className="text-sm text-muted-foreground text-right">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;

