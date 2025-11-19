import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, BookOpen, FileText, Download, Eye, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: string;
}

interface Unit {
  id: string;
  title: string;
  description: string;
  unit_number: number;
  class_year: string;
}

interface Content {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  file_path: string;
  content_text: string;
  book_cover_url?: string | null;
}

const SubjectDetails = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjectDetails();
  }, [subjectId]);

  const fetchSubjectDetails = async () => {
    if (!subjectId) return;

    // Fetch subject
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (subjectError) {
      toast.error("Failed to load subject details");
      setLoading(false);
      return;
    }

    setSubject(subjectData);

    // Fetch units
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .eq("subject_id", subjectId)
      .order("unit_number");

    setUnits(unitsData || []);

    // Fetch content
    const { data: contentData } = await supabase
      .from("content")
      .select("*")
      .eq("subject_id", subjectId);

    setContent(contentData || []);
    setLoading(false);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("content-files")
      .download(filePath);

    if (error) {
      toast.error("Failed to download file");
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File downloaded successfully");
  };

  const viewFile = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("content-files")
      .download(filePath);

    if (error) {
      toast.error("Failed to load file");
      return;
    }

    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => URL.revokeObjectURL(url);
    } else {
      toast.error("Please allow popups to view files");
      URL.revokeObjectURL(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading subject details...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Subject not found</p>
          <Button onClick={() => navigate("/subjects")} className="mt-4">
            Back to Subjects
          </Button>
        </div>
      </div>
    );
  }

  // Separate books from other content
  const bookContent = content.filter(item => item.content_type === 'book');
  const nonBookContent = content.filter(item => item.content_type !== 'book');

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <nav className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/subjects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subjects
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-secondary p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">E-shuri</h1>
              <p className="text-xs text-muted-foreground">Rwanda Learning Platform</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{subject.name}</h1>
          <p className="text-lg text-muted-foreground">{subject.description}</p>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="books">Books</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-6">
            {nonBookContent.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No content available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonBookContent.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all overflow-hidden">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {item.title}
                      </CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Type: <span className="font-medium capitalize">{item.content_type}</span>
                        </p>
                        {item.content_text && (
                          <p className="text-sm line-clamp-3">{item.content_text}</p>
                        )}
                        {item.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => downloadFile(item.file_path, item.title)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </Button>
                        )}
                        {item.content_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => window.open(item.content_url, "_blank")}
                          >
                            View Content
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="units" className="mt-6">
            {units.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No units available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {units.map((unit) => (
                  <Card key={unit.id}>
                    <CardHeader>
                      <CardTitle>
                        Unit {unit.unit_number}: {unit.title}
                      </CardTitle>
                      <CardDescription>
                        {unit.description}
                        <span className="block mt-1 text-xs">
                          Class Year: {unit.class_year}
                        </span>
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            {bookContent.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No books available yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {bookContent.map((book) => (
                  <Card key={book.id} className="hover:shadow-lg transition-all overflow-hidden">
                    {book.book_cover_url ? (
                      <div className="w-full aspect-[3/4] bg-muted">
                        <img 
                          src={book.book_cover_url} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-20 w-20 text-muted-foreground" />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                      {book.description && (
                        <CardDescription className="line-clamp-2">{book.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        {book.file_path && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1"
                              onClick={() => viewFile(book.file_path, book.title)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => downloadFile(book.file_path, book.title)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                        {book.content_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(book.content_url, "_blank")}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SubjectDetails;
