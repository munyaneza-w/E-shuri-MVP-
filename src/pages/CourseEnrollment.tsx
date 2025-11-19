import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
}

export default function CourseEnrollment() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedCombination, setSelectedCombination] = useState<string>("");
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchSubjects();
    }
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);
      setSelectedYear(profileData?.class_year || "");
      setSelectedCombination(profileData?.a_level_option || "");

      // Fetch enrolled courses
      const { data: enrolledData } = await supabase
        .from("student_courses")
        .select("subject_id")
        .eq("student_id", user.id);

      setEnrolledCourses(new Set(enrolledData?.map(c => c.subject_id) || []));
    } catch (error: any) {
      toast.error("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedYear) return;

    try {
      // Fetch subjects filtered by year level
      const { data: subjectsData, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("year_level", selectedYear)
        .order("name");

      if (error) throw error;
      setSubjects(subjectsData || []);
    } catch (error: any) {
      toast.error("Failed to load subjects");
      console.error(error);
    }
  };

  const handleEnroll = async (subjectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("student_courses").insert({
        student_id: user.id,
        subject_id: subjectId,
      });

      if (error) throw error;

      setEnrolledCourses(new Set([...enrolledCourses, subjectId]));
      toast.success("Enrolled successfully!");
      
      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "course_enrolled",
        title: "Course Enrolled",
        message: "You have successfully enrolled in a new course",
      });
    } catch (error: any) {
      toast.error("Failed to enroll in course");
      console.error(error);
    }
  };

  const handleDrop = async (subjectId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Note: We don't delete the record, we could add a dropped_at field instead
      // For now, let's just remove it (progress will be saved in content_progress table)
      const { error } = await supabase
        .from("student_courses")
        .delete()
        .eq("student_id", user.id)
        .eq("subject_id", subjectId);

      if (error) throw error;

      const newEnrolled = new Set(enrolledCourses);
      newEnrolled.delete(subjectId);
      setEnrolledCourses(newEnrolled);
      toast.success("Dropped course (your progress is saved!)");
    } catch (error: any) {
      toast.error("Failed to drop course");
      console.error(error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          class_year: selectedYear as any,
          a_level_option: selectedCombination as any,
          level: ['S1', 'S2', 'S3', 'S4'].includes(selectedYear) ? 'O' as any : 'A' as any,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated!");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleJoinWithCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find classroom with code
      const { data: classData } = await supabase
        .from("class_codes")
        .select("classroom_id, classrooms(id, name)")
        .eq("code", classCode.toUpperCase())
        .eq("active", true)
        .single();

      if (!classData) {
        toast.error("Invalid or expired class code");
        return;
      }

      // Enroll in classroom
      const { error } = await supabase.from("enrollments").insert({
        student_id: user.id,
        classroom_id: classData.classroom_id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error("You're already enrolled in this class");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Joined class successfully!");
      setClassCode("");
    } catch (error: any) {
      toast.error("Failed to join class");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Course Enrollment
        </h1>
        <p className="text-muted-foreground mt-2">Select your year and enroll in courses</p>
      </div>

      {/* Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Your Academic Info</CardTitle>
          <CardDescription>Select your year and combination to see relevant courses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Class Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">S1 (Ordinary Level)</SelectItem>
                  <SelectItem value="S2">S2 (Ordinary Level)</SelectItem>
                  <SelectItem value="S3">S3 (Ordinary Level)</SelectItem>
                  <SelectItem value="S4">S4 (O-Level)</SelectItem>
                  <SelectItem value="S5">S5 (Advanced Level)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedYear === 'S5' && (
              <div>
                <label className="text-sm font-medium mb-2 block">A-Level Combination</label>
                <Select value={selectedCombination} onValueChange={setSelectedCombination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select combination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCB">PCB (Physics, Chemistry, Biology)</SelectItem>
                    <SelectItem value="PCM">PCM (Physics, Chemistry, Math)</SelectItem>
                    <SelectItem value="MEG">MEG (Math, Economics, Geography)</SelectItem>
                    <SelectItem value="HEG">HEG (History, Economics, Geography)</SelectItem>
                    <SelectItem value="HK">HK (History, Kinyarwanda)</SelectItem>
                    <SelectItem value="LKK">LKK (Languages)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              <Button onClick={handleUpdateProfile} className="w-full">
                Update Profile
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="text-sm font-medium mb-2 block">Join Class with Code</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter class code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button onClick={handleJoinWithCode}>Join Class</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
          <CardDescription>Browse and enroll in courses that interest you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => {
              const isEnrolled = enrolledCourses.has(subject.id);
              
              return (
                <Card key={subject.id} className={isEnrolled ? "border-primary" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl">{subject.icon || "📚"}</div>
                      <Badge variant={isEnrolled ? "default" : "outline"}>
                        {subject.level === 'O' ? 'O-Level' : subject.level === 'A' ? 'A-Level' : 'Both Levels'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {subject.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isEnrolled ? (
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate(`/subject/${subject.id}`)}
                        >
                          <BookOpen className="mr-2 h-4 w-4" />
                          Go to Course
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => handleDrop(subject.id)}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Drop Course
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleEnroll(subject.id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Enroll Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}