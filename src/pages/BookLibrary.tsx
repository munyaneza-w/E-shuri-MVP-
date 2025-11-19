import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BookOpen, Download, Eye, GraduationCap } from "lucide-react";
import { toast } from "sonner";

interface Book {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  file_path: string;
  content_text: string;
  book_cover_url?: string | null;
  subject_id: string;
  subjects?: {
    name: string;
    level: string;
  };
}

interface Subject {
  id: string;
  name: string;
  level: string;
}

const BookLibrary = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [selectedSubject, selectedLevel, books]);

  const fetchData = async () => {
    // Fetch all books
    const { data: booksData, error: booksError } = await supabase
      .from("content")
      .select(`
        *,
        subjects (
          name,
          level
        )
      `)
      .eq("content_type", "book");

    if (booksError) {
      toast.error("Failed to load books");
      setLoading(false);
      return;
    }

    setBooks(booksData || []);
    setFilteredBooks(booksData || []);

    // Fetch subjects
    const { data: subjectsData } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    setSubjects(subjectsData || []);
    setLoading(false);
  };

  const filterBooks = () => {
    let filtered = [...books];

    if (selectedSubject !== "all") {
      filtered = filtered.filter((book) => book.subject_id === selectedSubject);
    }

    if (selectedLevel !== "all") {
      filtered = filtered.filter((book) => book.subjects?.level === selectedLevel);
    }

    setFilteredBooks(filtered);
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
          <p className="text-muted-foreground">Loading book library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <nav className="bg-card border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
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
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-4xl font-bold">Book Library</h1>
              <p className="text-lg text-muted-foreground">Browse and download educational books</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="ordinary">Ordinary Level</SelectItem>
                <SelectItem value="advanced">Advanced Level</SelectItem>
                <SelectItem value="both">Both Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No books found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-all overflow-hidden group">
                <div className="w-full h-64 bg-muted relative overflow-hidden">
                  {book.book_cover_url ? (
                    <img
                      src={book.book_cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-lg">{book.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{book.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="text-muted-foreground">
                        Subject: <span className="font-medium text-foreground">{book.subjects?.name}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Level: <span className="font-medium text-foreground capitalize">{book.subjects?.level}</span>
                      </p>
                    </div>
                    {book.content_text && (
                      <p className="text-sm line-clamp-2 text-muted-foreground">{book.content_text}</p>
                    )}
                    <div className="flex flex-col gap-2 pt-2">
                      {book.file_path && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => viewFile(book.file_path, book.title)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
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
                          className="w-full"
                          onClick={() => window.open(book.content_url, "_blank")}
                        >
                          View Online
                        </Button>
                      )}
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

export default BookLibrary;
