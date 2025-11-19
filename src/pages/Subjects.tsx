import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calculator, Atom, Beaker, Dna, BookOpen, ScrollText, Globe, Code } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  year_level: string;
}

const iconMap: Record<string, any> = {
  Calculator,
  Atom,
  Flask: Beaker,
  Dna,
  BookOpen,
  ScrollText,
  Globe,
  Code,
};

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userYearLevel, setUserYearLevel] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndSubjects();
  }, []);

  const fetchUserAndSubjects = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user's year level
      const { data: profile } = await supabase
        .from("profiles")
        .select("class_year")
        .eq("id", user.id)
        .single();

      const yearLevel = profile?.class_year || null;
      setUserYearLevel(yearLevel);

      // Fetch subjects filtered by year level
      let query = supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (yearLevel) {
        query = query.eq("year_level", yearLevel);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to load subjects");
        setLoading(false);
        return;
      }

      setSubjects(data || []);
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {userYearLevel ? `${userYearLevel} Courses` : "Explore Subjects"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {userYearLevel 
              ? `Browse courses for your year level (${userYearLevel})`
              : "Browse all available subjects"
            }
          </p>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="bg-muted h-12 w-12 rounded-lg mb-3" />
                  <div className="bg-muted h-6 w-32 rounded" />
                  <div className="bg-muted h-4 w-full rounded mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => {
              const Icon = iconMap[subject.icon] || BookOpen;
              return (
                <Card
                  key={subject.id}
                  className="hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => navigate(`/subject/${subject.id}`)}
                >
                  <CardHeader>
                    <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">{subject.name}</CardTitle>
                    <CardDescription className="text-base">
                      {subject.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      View Content
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && subjects.length === 0 && !searchTerm && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-2">
              No subjects added yet
            </p>
            <p className="text-sm text-muted-foreground">
              Teachers can add subjects to get started
            </p>
          </div>
        )}
        
        {!loading && filteredSubjects.length === 0 && searchTerm && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No subjects found matching "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;
