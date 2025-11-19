import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Clock, FileText, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Quiz {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  subject: {
    name: string;
  };
}

const Quizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select(`
        id,
        title,
        description,
        time_limit_minutes,
        subject:subjects(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load quizzes");
      setLoading(false);
      return;
    }

    setQuizzes(data as unknown as Quiz[]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background">
        <div className="container mx-auto p-6 max-w-6xl">
          <Skeleton className="h-10 w-48 mb-6" />
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
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Available Quizzes</h1>
          <p className="text-muted-foreground text-lg">
            Test your knowledge and track your progress
          </p>
        </div>

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No quizzes available yet</h3>
              <p className="text-muted-foreground">
                Check back later for new quizzes from your teachers
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/quiz/${quiz.id}`)}
              >
                <CardHeader>
                  <div className="bg-primary/10 text-primary p-3 rounded-lg w-fit mb-2">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{quiz.subject.name}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.time_limit_minutes} min
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;
