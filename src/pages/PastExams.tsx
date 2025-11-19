import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Download, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Subject {
  id: string;
  name: string;
}

interface PastExam {
  id: string;
  title: string;
  subject_id: string;
  class_year: string;
  file_path: string;
  created_at: string;
  subjects: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

const PastExams = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    class_year: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuth();
    fetchSubjects();
    fetchPastExams();
  }, []);

  useEffect(() => {
    filterExams();
  }, [filterSubject, filterYear]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    setIsTeacher(roleData?.role === "teacher" || roleData?.role === "admin");
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");

    if (!error && data) {
      setSubjects(data);
    }
  };

  const fetchPastExams = async () => {
    const { data, error } = await supabase
      .from("content")
      .select(`
        id,
        title,
        subject_id,
        file_path,
        created_at,
        subjects (name),
        profiles:teacher_id (full_name)
      `)
      .eq("content_type", "file")
      .ilike("title", "%past exam%")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPastExams(data as unknown as PastExam[]);
    }
    setLoading(false);
  };

  const filterExams = () => {
    // This will be used to filter displayed exams
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `past-exams/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('content-files')
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload file");
      return null;
    }

    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      setUploading(false);
      return;
    }

    const filePath = await handleFileUpload(selectedFile);
    if (!filePath) {
      setUploading(false);
      return;
    }

    const { error } = await supabase.from("content").insert({
      title: `Past Exam - ${formData.title}`,
      content_type: "file",
      file_path: filePath,
      subject_id: formData.subject_id,
      teacher_id: session.user.id,
    });

    if (error) {
      toast.error("Failed to upload past exam");
      setUploading(false);
      return;
    }

    toast.success("Past exam uploaded successfully!");
    setFormData({ title: "", subject_id: "", class_year: "" });
    setSelectedFile(null);
    setUploading(false);
    fetchPastExams();
  };

  const handleDownload = async (filePath: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('content-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("File downloaded successfully");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Failed to download file");
    }
  };

  const handleViewPdf = async (filePath: string, title: string) => {
    try {
      const { data: fileData, error } = await supabase.storage
        .from('content-files')
        .download(filePath);

      if (error) throw error;
      if (!fileData) {
        toast.error("Failed to load PDF");
        return;
      }

      // Create blob URL and open in new tab
      const blob = new Blob([fileData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.onload = () => URL.revokeObjectURL(url);
      } else {
        toast.error("Please allow popups to view PDFs");
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('View error:', error);
      toast.error("Failed to open PDF");
    }
  };

  const filteredExams = pastExams.filter((exam) => {
    if (filterSubject !== "all" && exam.subject_id !== filterSubject) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent to-background">
        <div className="container mx-auto p-6 max-w-7xl">
          <Skeleton className="h-10 w-48 mb-6" />
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
      <div className="container mx-auto p-6 max-w-7xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-bold mb-8">Past Exam Questions</h1>

        {isTeacher && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-6 w-6 text-primary" />
                Upload Past Exam
              </CardTitle>
              <CardDescription>Share past exam papers with students</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Exam Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., 2023 National Exam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Select
                      value={formData.subject_id}
                      onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="year">Class Year *</Label>
                  <Select
                    value={formData.class_year}
                    onValueChange={(value) => setFormData({ ...formData, class_year: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S1">Senior 1</SelectItem>
                      <SelectItem value="S2">Senior 2</SelectItem>
                      <SelectItem value="S3">Senior 3</SelectItem>
                      <SelectItem value="S4">Senior 4</SelectItem>
                      <SelectItem value="S5">Senior 5</SelectItem>
                      <SelectItem value="S6">Senior 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="file_upload">Upload PDF File *</Label>
                  <Input
                    id="file_upload"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    required
                    accept=".pdf"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={uploading} className="w-full">
                  {uploading ? "Uploading..." : "Upload Past Exam"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <Label>Filter by Subject</Label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger>
                <SelectValue />
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
          </div>
          <div className="flex-1">
            <Label>Filter by Year</Label>
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="S1">Senior 1</SelectItem>
                <SelectItem value="S2">Senior 2</SelectItem>
                <SelectItem value="S3">Senior 3</SelectItem>
                <SelectItem value="S4">Senior 4</SelectItem>
                <SelectItem value="S5">Senior 5</SelectItem>
                <SelectItem value="S6">Senior 6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No past exams available yet. {isTeacher && "Upload your first past exam above!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    {exam.title}
                  </CardTitle>
                  <CardDescription>
                    {exam.subjects.name} • Uploaded by {exam.profiles?.full_name || "Unknown"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewPdf(exam.file_path, exam.title)}
                      variant="default"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      onClick={() => handleDownload(exam.file_path, exam.title)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default PastExams;
