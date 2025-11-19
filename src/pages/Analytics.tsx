import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TrendingUp, Users, Award, BookOpen, GraduationCap, Target } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PerformanceTrend {
  date: string;
  averageScore: number;
  attempts: number;
}

interface SubjectCompletion {
  subject: string;
  completed: number;
  enrolled: number;
  completionRate: number;
}

interface ClassStats {
  className: string;
  students: number;
  averageScore: number;
  completionRate: number;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [performanceTrends, setPerformanceTrends] = useState<PerformanceTrend[]>([]);
  const [subjectCompletions, setSubjectCompletions] = useState<SubjectCompletion[]>([]);
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    averageCompletion: 0,
    averageScore: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch performance trends
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select("score, max_score, completed_at")
        .not("completed_at", "is", null)
        .gte("completed_at", startDate.toISOString())
        .order("completed_at");

      // Group by date
      const trendMap = new Map<string, { total: number; count: number }>();
      attemptsData?.forEach((attempt) => {
        const date = new Date(attempt.completed_at).toLocaleDateString();
        const score = (attempt.score / attempt.max_score) * 100;
        const existing = trendMap.get(date) || { total: 0, count: 0 };
        trendMap.set(date, { total: existing.total + score, count: existing.count + 1 });
      });

      const trends = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        averageScore: Math.round(data.total / data.count),
        attempts: data.count,
      }));
      setPerformanceTrends(trends);

      // Fetch subject completion rates
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select(`
          id,
          name,
          student_courses(
            id,
            completed,
            student_id
          )
        `);

      const completionsBySubject = subjectsData?.map((subject: any) => {
        const enrolled = subject.student_courses?.length || 0;
        const completed = subject.student_courses?.filter((c: any) => c.completed).length || 0;
        return {
          subject: subject.name,
          completed,
          enrolled,
          completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
        };
      }) || [];
      setSubjectCompletions(completionsBySubject.slice(0, 10)); // Top 10

      // Fetch class statistics
      const { data: classroomsData } = await supabase
        .from("classrooms")
        .select(`
          id,
          name,
          enrollments(student_id)
        `);

      const { data: allAttempts } = await supabase
        .from("quiz_attempts")
        .select("student_id, score, max_score, quiz:quizzes(id)")
        .not("completed_at", "is", null);

      const classStatsData = await Promise.all(
        classroomsData?.map(async (classroom: any) => {
          const studentIds = classroom.enrollments?.map((e: any) => e.student_id) || [];
          const studentAttempts = allAttempts?.filter((a) =>
            studentIds.includes(a.student_id)
          ) || [];

          const avgScore = studentAttempts.length > 0
            ? studentAttempts.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / studentAttempts.length
            : 0;

          // Get completion rate for this class
          const { data: classEnrollments } = await supabase
            .from("student_courses")
            .select("completed")
            .in("student_id", studentIds);

          const completionRate = classEnrollments?.length > 0
            ? (classEnrollments.filter((c) => c.completed).length / classEnrollments.length) * 100
            : 0;

          return {
            className: classroom.name,
            students: studentIds.length,
            averageScore: Math.round(avgScore),
            completionRate: Math.round(completionRate),
          };
        }) || []
      );
      setClassStats(classStatsData);

      // Overall stats
      const { count: totalStudents } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student");

      const { count: totalCourses } = await supabase
        .from("subjects")
        .select("*", { count: "exact", head: true });

      const avgCompletion = completionsBySubject.reduce((sum, s) => sum + s.completionRate, 0) /
        (completionsBySubject.length || 1);

      const avgScore = attemptsData?.length > 0
        ? attemptsData.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / attemptsData.length
        : 0;

      setOverallStats({
        totalStudents: totalStudents || 0,
        totalCourses: totalCourses || 0,
        averageCompletion: Math.round(avgCompletion),
        averageScore: Math.round(avgScore),
      });
    } catch (error) {
      console.error("Analytics error:", error);
      toast.error("Failed to load analytics");
    }
    setLoading(false);
  };

  const COLORS = ["#00A1DE", "#FAD201", "#00A651", "#FF6B6B", "#4ECDC4"];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overallStats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{overallStats.totalCourses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Target className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{overallStats.averageCompletion}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{overallStats.averageScore}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>Average quiz scores over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="averageScore" stroke="#00A1DE" name="Avg Score %" strokeWidth={2} />
              <Line type="monotone" dataKey="attempts" stroke="#FAD201" name="Quiz Attempts" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Completion Rates by Subject
            </CardTitle>
            <CardDescription>Top subjects by completion percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectCompletions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completionRate" fill="#00A651" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Class Performance
            </CardTitle>
            <CardDescription>Average scores by classroom</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#00A1DE" name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
