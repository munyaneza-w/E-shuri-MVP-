import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Trophy, Flame, Zap, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface EnrolledCourse {
  id: string;
  progress: number;
  completed: boolean;
  subject: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  due_date: string;
  points: number;
  subject: { name: string };
}

interface Profile {
  energy_points: number;
  current_streak: number;
  longest_streak: number;
  full_name: string;
  avatar_url?: string;
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activityData, setActivityData] = useState<number[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch enrolled courses
      const { data: coursesData } = await supabase
        .from("student_courses")
        .select(`
          id,
          progress,
          completed,
          subject:subjects(id, name, icon, description)
        `)
        .eq("student_id", user.id)
        .order("enrolled_at", { ascending: false });

      // Fetch upcoming assignments
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          id,
          title,
          due_date,
          points,
          subject:subjects(name)
        `)
        .gte("due_date", new Date().toISOString())
        .order("due_date", { ascending: true })
        .limit(5);

      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("energy_points, current_streak, longest_streak, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      // Fetch activity for last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: activityLogs } = await supabase
        .from("activity_logs")
        .select("activity_date, energy_points")
        .eq("student_id", user.id)
        .gte("activity_date", sevenDaysAgo.toISOString().split('T')[0])
        .order("activity_date", { ascending: true });

      setCourses(coursesData as any || []);
      setAssignments(assignmentsData as any || []);
      setProfile(profileData);
      
      // Process activity data for heatmap
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
      
      const activityMap = activityLogs?.reduce((acc: any, log: any) => {
        acc[log.activity_date] = (acc[log.activity_date] || 0) + log.energy_points;
        return acc;
      }, {}) || {};
      
      setActivityData(last7Days.map(date => activityMap[date] || 0));
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxActivity = () => Math.max(...activityData, 1);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-primary">
          <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
          <AvatarFallback className="bg-accent text-accent-foreground text-2xl">
            {profile?.full_name ? getInitials(profile.full_name) : "ST"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Welcome Back, {profile?.full_name || "Student"}!
          </h1>
          <p className="text-muted-foreground mt-2">Track your progress and continue learning</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Points</CardTitle>
            <Zap className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{profile?.energy_points || 0}</div>
            <p className="text-xs text-muted-foreground">Keep learning to earn more!</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{profile?.current_streak || 0} days</div>
            <p className="text-xs text-muted-foreground">Longest: {profile?.longest_streak || 0} days</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              {courses.filter(c => c.completed).length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0</div>
            <p className="text-xs text-muted-foreground">Unlock more achievements!</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Activity
          </CardTitle>
          <CardDescription>Your learning activity for the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 justify-between">
            {activityData.map((points, index) => {
              const intensity = points === 0 ? 0 : Math.ceil((points / getMaxActivity()) * 4);
              const bgColor = intensity === 0 ? 'bg-muted' :
                            intensity === 1 ? 'bg-primary/20' :
                            intensity === 2 ? 'bg-primary/40' :
                            intensity === 3 ? 'bg-primary/60' : 'bg-primary';
              
              return (
                <div key={index} className="flex-1 text-center">
                  <div className={`h-16 rounded ${bgColor} transition-all hover:opacity-80`} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).getDay()]}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* My Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            My Courses
          </CardTitle>
          <CardDescription>Continue where you left off</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
              <Button onClick={() => navigate("/subjects")}>Browse Subjects</Button>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                   onClick={() => navigate(`/subject/${course.subject.id}`)}>
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl">{course.subject.icon || "📚"}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.subject.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={course.progress || 0} className="w-48" />
                      <span className="text-sm text-muted-foreground">{course.progress || 0}%</span>
                    </div>
                  </div>
                </div>
                {course.completed && (
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    Completed
                  </Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Upcoming Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Upcoming Assignments
          </CardTitle>
          <CardDescription>Don't miss these deadlines!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No upcoming assignments</p>
          ) : (
            assignments.map((assignment) => {
              const dueDate = new Date(assignment.due_date);
              const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysUntilDue <= 2;
              
              return (
                <div key={assignment.id} className={`flex items-center justify-between p-3 border rounded ${isUrgent ? 'border-destructive bg-destructive/5' : ''}`}>
                  <div>
                    <h4 className="font-medium">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">{assignment.subject.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Due in {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'}
                    </p>
                    <p className="text-xs text-muted-foreground">{assignment.points} points</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}