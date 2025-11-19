import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";

const yearLevels = ["S1", "S2", "S3", "S4", "S5", "S6"];

const rwandaSubjects = [
  { name: "English", icon: "BookOpen", category: "Languages" },
  { name: "French", icon: "BookOpen", category: "Languages" },
  { name: "Kinyarwanda", icon: "BookOpen", category: "Languages" },
  { name: "Kiswahili", icon: "BookOpen", category: "Languages" },
  { name: "Literature", icon: "BookOpen", category: "Languages" },
  { name: "Mathematics", icon: "Calculator", category: "Sciences" },
  { name: "Physics", icon: "Atom", category: "Sciences" },
  { name: "Chemistry", icon: "Flask", category: "Sciences" },
  { name: "Biology", icon: "Dna", category: "Sciences" },
  { name: "Computer Science", icon: "Code", category: "Sciences" },
  { name: "History", icon: "ScrollText", category: "Social Studies" },
  { name: "Geography", icon: "Globe", category: "Social Studies" },
  { name: "Economics", icon: "BookOpen", category: "Social Studies" },
  { name: "General Studies", icon: "BookOpen", category: "Social Studies" },
  { name: "Entrepreneurship", icon: "BookOpen", category: "Social Studies" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    checkAdminAccess();
    fetchSubjects();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some(r => r.role === "admin");
    setIsAdmin(hasAdminRole || false);

    if (!hasAdminRole) {
      toast.error("Access denied: Admin only");
      navigate("/dashboard");
    }
  };

  const fetchSubjects = async () => {
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .order("year_level, name");

    setSubjects(data || []);
  };

  const seedAllCourses = async () => {
    setLoading(true);
    try {
      const coursesToCreate = [];

      for (const subject of rwandaSubjects) {
        for (const yearLevel of yearLevels) {
          // Skip General Studies for S4-S6
          if (subject.name === "General Studies" && ["S4", "S5", "S6"].includes(yearLevel)) {
            continue;
          }

          coursesToCreate.push({
            name: `${subject.name} - ${yearLevel}`,
            description: `${subject.name} course for ${yearLevel} students`,
            icon: subject.icon,
            year_level: yearLevel,
          });
        }
      }

      const { error } = await supabase
        .from("subjects")
        .upsert(coursesToCreate, { 
          onConflict: "name,year_level",
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success(`Successfully created ${coursesToCreate.length} courses!`);
      fetchSubjects();
    } catch (error: any) {
      toast.error("Failed to seed courses: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <p>Checking access...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage Rwanda secondary education platform</p>
        </div>
        <Button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Course Management
          </CardTitle>
          <CardDescription>
            Seed and manage all Rwanda secondary education courses (S1-S6)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Seed All Courses</h3>
              <p className="text-sm text-muted-foreground">
                Create all subject courses for S1-S6 year levels
              </p>
            </div>
            <Button 
              onClick={seedAllCourses}
              disabled={loading}
              className="bg-primary hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Creating..." : "Seed Courses"}
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Current Courses: {subjects.length}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {yearLevels.map(year => (
                <div key={year} className="text-center p-2 bg-muted rounded">
                  <p className="font-medium">{year}</p>
                  <p className="text-sm text-muted-foreground">
                    {subjects.filter(s => s.year_level === year).length} courses
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
          <CardDescription>View all created courses grouped by year level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {yearLevels.map(year => {
              const yearSubjects = subjects.filter(s => s.year_level === year);
              return (
                <div key={year}>
                  <h3 className="font-semibold mb-2 text-primary">{year} Courses ({yearSubjects.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {yearSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center gap-2 p-2 border rounded">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{subject.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
