import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, ClipboardCheck, TrendingUp, Plus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Subject {
  id: string;
  name: string;
  icon: string;
}

interface Classroom {
  id: string;
  name: string;
  class_year: string;
  student_count: number;
}

interface PendingGrading {
  id: string;
  student_name: string;
  assignment_title: string;
  submitted_at: string;
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [pendingGrading, setPendingGrading] = useState<PendingGrading[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssignments: 0,
    pendingSubmissions: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch teacher's subjects
      const { data: subjectsData } = await supabase
        .from("teacher_subjects")
        .select("subject:subjects(id, name, icon)")
        .eq("teacher_id", user.id);

      // Fetch teacher's classrooms
      const { data: classroomsData } = await supabase
        .from("classroom_teachers")
        .select(`
          classroom:classrooms(id, name, class_year)
        `)
        .eq("teacher_id", user.id);

      // Fetch pending grading
      const { data: pendingData } = await supabase
        .from("assignment_submissions")
        .select(`
          id,
          submitted_at,
          student:profiles(full_name),
          assignment:assignments(title, teacher_id)
        `)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: true })
        .limit(10);

      // Filter only this teacher's assignments
      const teacherPending = pendingData?.filter((s: any) => s.assignment?.teacher_id === user.id) || [];

      // Get student counts for classrooms
      const classroomsWithCounts = await Promise.all(
        (classroomsData || []).map(async (ct: any) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: 'exact', head: true })
            .eq("classroom_id", ct.classroom.id);
          
          return {
            ...ct.classroom,
            student_count: count || 0,
          };
        })
      );

      // Calculate stats
      const { count: totalAssignments } = await supabase
        .from("assignments")
        .select("*", { count: 'exact', head: true })
        .eq("teacher_id", user.id);

      const totalStudents = classroomsWithCounts.reduce((sum, c) => sum + c.student_count, 0);

      setSubjects((subjectsData as any)?.map((ts: any) => ts.subject) || []);
      setClassrooms(classroomsWithCounts);
      setPendingGrading(teacherPending as any);
      setStats({
        totalStudents,
        totalAssignments: totalAssignments || 0,
        pendingSubmissions: teacherPending.length,
      });
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage your classes and track student progress</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/analytics")} variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={() => navigate("/grading-queue")} variant="outline">
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Grading Queue
          </Button>
          <Button onClick={() => navigate("/create-quiz")} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Assignment
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all your classes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Total assignments created</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Submissions awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* My Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Subjects
          </CardTitle>
          <CardDescription>Subjects you're teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/subject/${subject.id}`)}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{subject.icon || "📚"}</div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Classrooms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Classrooms
          </CardTitle>
          <CardDescription>Classes you're teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                <div>
                  <h3 className="font-semibold">{classroom.name}</h3>
                  <p className="text-sm text-muted-foreground">Year: {classroom.class_year}</p>
                </div>
                <Badge variant="secondary">{classroom.student_count} students</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Grading Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Grading Queue
          </CardTitle>
          <CardDescription>Recent submissions waiting for your review</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingGrading.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No pending submissions</p>
          ) : (
            <div className="space-y-3">
              {pendingGrading.map((submission: any) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{submission.assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Submitted by {submission.student.full_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                    <Button size="sm" variant="outline" className="mt-1">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}