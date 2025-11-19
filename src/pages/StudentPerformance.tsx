import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, TrendingUp, Users, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface QuizAttempt {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
  student_id: string;
  quiz: {
    title: string;
  };
  profiles: {
    full_name: string;
  };
}

interface Student {
  id: string;
  full_name: string;
}

const StudentPerformance = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [allAttempts, setAllAttempts] = useState<QuizAttempt[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    uniqueStudents: 0,
  });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select(`
        id,
        score,
        max_score,
        completed_at,
        student_id,
        quiz:quizzes(title),
        profiles:student_id(full_name)
      `)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) {
      toast.error("Failed to load performance data");
      setLoading(false);
      return;
    }

    const typedData = data as unknown as QuizAttempt[];
    setAllAttempts(typedData);
    setAttempts(typedData);

    // Get all students with student role (not just those with quiz attempts)
    const { data: allStudentsData } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles:user_id(full_name)
      `)
      .eq("role", "student");

    const studentList = allStudentsData?.map((item: any) => ({
      id: item.user_id,
      full_name: item.profiles?.full_name || "Unknown",
    })) || [];
    
    setStudents(studentList);

    // Calculate stats with total student count from user_roles
    calculateStats(typedData, studentList.length);
    setLoading(false);
  };

  const calculateStats = (data: QuizAttempt[], totalStudents?: number) => {
    const totalAttempts = data.length;
    const averageScore =
      data.reduce((sum, attempt) => sum + (attempt.score / attempt.max_score) * 100, 0) /
      (totalAttempts || 1);
    const uniqueStudents = totalStudents !== undefined ? totalStudents : new Set(data.map((a) => a.student_id)).size;

    setStats({ totalAttempts, averageScore, uniqueStudents });
  };

  const handleStudentFilter = (studentId: string) => {
    setSelectedStudent(studentId);
    if (studentId === "all") {
      setAttempts(allAttempts);
      calculateStats(allAttempts, students.length);
    } else {
      const filtered = allAttempts.filter((attempt) => attempt.student_id === studentId);
      setAttempts(filtered);
      calculateStats(filtered, 1); // Only 1 student when filtered
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background">
        <div className="container mx-auto p-6 max-w-7xl">
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
      <div className="container mx-auto p-6 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">Student Performance Analytics</h1>

        <div className="mb-6">
          <Label>Filter by Student</Label>
          <Select value={selectedStudent} onValueChange={handleStudentFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                {stats.averageScore.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-secondary">{stats.uniqueStudents}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent-foreground" />
                Total Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-accent-foreground">{stats.totalAttempts}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Quiz Attempts</CardTitle>
            <CardDescription>View detailed student performance on quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No quiz attempts yet. Students will appear here after taking quizzes.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.profiles.full_name}</TableCell>
                      <TableCell>{attempt.quiz.title}</TableCell>
                      <TableCell>
                        {attempt.score} / {attempt.max_score}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            (attempt.score / attempt.max_score) * 100 >= 70
                              ? "text-green-600"
                              : (attempt.score / attempt.max_score) * 100 >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {((attempt.score / attempt.max_score) * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentPerformance;
