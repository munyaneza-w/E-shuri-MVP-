import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Upload as UploadIcon } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  title: string;
  unit_number: number;
  class_year: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content_type: "text",
    content_text: "",
    content_url: "",
    subject_id: "",
    class_year: "",
    unit_id: "",
    book_cover_url: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);
  const [coverImageSource, setCoverImageSource] = useState<"url" | "file">("url");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name")
      .order("name");

    if (error) {
      toast.error("Failed to load subjects");
      return;
    }

    setSubjects(data || []);
  };

  const fetchUnits = async (subjectId: string, classYear: string) => {
    if (!subjectId || !classYear) return;
    
    const { data, error } = await supabase
      .from("units")
      .select("id, title, unit_number, class_year")
      .eq("subject_id", subjectId)
      .eq("class_year", classYear as any)
      .order("unit_number");

    if (error) {
      console.error("Failed to load units:", error);
      setUnits([]);
      return;
    }

    setUnits(data || []);
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

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
    setLoading(true);
    setUploading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      setLoading(false);
      setUploading(false);
      return;
    }

    let filePath: string | null = null;
    let coverImagePath: string | null = null;

    // Handle file upload if selected
    if (selectedFile && formData.content_type === "file") {
      filePath = await handleFileUpload(selectedFile);
      if (!filePath) {
        setLoading(false);
        setUploading(false);
        return;
      }
    }

    // Handle book cover image upload if selected
    if (formData.content_type === "book" && coverImageSource === "file" && selectedCoverImage) {
      coverImagePath = await handleFileUpload(selectedCoverImage);
      if (!coverImagePath) {
        toast.error("Failed to upload cover image");
        setLoading(false);
        setUploading(false);
        return;
      }
    }

    // Log the data being inserted for debugging
    const insertData = {
      title: formData.title,
      description: formData.description,
      content_type: formData.content_type,
      content_text: formData.content_type === "text" || formData.content_type === "book" ? formData.content_text : null,
      content_url: formData.content_type === "url" ? formData.content_url : null,
      file_path: filePath,
      subject_id: formData.subject_id,
      unit_id: formData.unit_id || null,
      teacher_id: session.user.id,
      book_cover_url: coverImagePath || formData.book_cover_url || null,
    };

    console.log("Attempting to insert content:", insertData);

    const { error } = await supabase.from("content").insert(insertData);

    if (error) {
      console.error("Upload error details:", error);
      toast.error(`Failed to upload content: ${error.message}`);
      setLoading(false);
      setUploading(false);
      return;
    }

    toast.success("Content uploaded successfully!");
    setFormData({
      title: "",
      description: "",
      content_type: "text",
      content_text: "",
      content_url: "",
      subject_id: "",
      class_year: "",
      unit_id: "",
      book_cover_url: "",
    });
    setSelectedFile(null);
    setSelectedCoverImage(null);
    setUnits([]);
    setLoading(false);
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <UploadIcon className="h-8 w-8 text-primary" />
              Upload Learning Content
            </CardTitle>
            <CardDescription>Share lessons, videos, and materials with your students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Introduction to Photosynthesis"
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, subject_id: value, unit_id: "" });
                    setUnits([]);
                    if (formData.class_year) {
                      fetchUnits(value, formData.class_year);
                    }
                  }}
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

              <div>
                <Label htmlFor="class_year">Class Year *</Label>
                <Select
                  value={formData.class_year}
                  onValueChange={(value) => {
                    setFormData({ ...formData, class_year: value, unit_id: "" });
                    if (formData.subject_id) {
                      fetchUnits(formData.subject_id, value);
                    }
                  }}
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
                  </SelectContent>
                </Select>
              </div>

              {units.length > 0 && (
                <div>
                  <Label htmlFor="unit">Unit (Optional)</Label>
                  <Select
                    value={formData.unit_id}
                    onValueChange={(value) => setFormData({ ...formData, unit_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          Unit {unit.unit_number}: {unit.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="content_type">Content Type *</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Type Content</SelectItem>
                    <SelectItem value="file">Upload File from Device</SelectItem>
                    <SelectItem value="url">Add File from Internet (URL)</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this content"
                  rows={3}
                />
              </div>

              {formData.content_type === "text" ? (
                <div>
                  <Label htmlFor="content_text">Content *</Label>
                  <Textarea
                    id="content_text"
                    value={formData.content_text}
                    onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                    required
                    placeholder="Enter your lesson content here..."
                    rows={8}
                  />
                </div>
              ) : formData.content_type === "file" ? (
                <div>
                  <Label htmlFor="file_upload">Upload File *</Label>
                  <Input
                    id="file_upload"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    required
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.mp4,.mp3"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              ) : formData.content_type === "url" ? (
                <div>
                  <Label htmlFor="content_url">File URL *</Label>
                  <Input
                    id="content_url"
                    type="url"
                    value={formData.content_url}
                    onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                    required
                    placeholder="https://example.com/document.pdf"
                  />
                </div>
              ) : formData.content_type === "book" ? (
                <div className="space-y-4">
                  <div>
                    <Label>Book Cover Image Source</Label>
                    <Select
                      value={coverImageSource}
                      onValueChange={(value: "url" | "file") => setCoverImageSource(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">Image URL from Internet</SelectItem>
                        <SelectItem value="file">Upload from Device</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {coverImageSource === "url" ? (
                    <div>
                      <Label htmlFor="book_cover_url">Book Cover Image URL</Label>
                      <Input
                        id="book_cover_url"
                        type="url"
                        value={formData.book_cover_url}
                        onChange={(e) => setFormData({ ...formData, book_cover_url: e.target.value })}
                        placeholder="https://example.com/book-cover.jpg"
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="cover_image_upload">Upload Book Cover Image</Label>
                      <Input
                        id="cover_image_upload"
                        type="file"
                        onChange={(e) => setSelectedCoverImage(e.target.files?.[0] || null)}
                        accept=".jpg,.jpeg,.png,.webp"
                      />
                      {selectedCoverImage && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {selectedCoverImage.name}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="content_text">Book Content *</Label>
                    <Textarea
                      id="content_text"
                      value={formData.content_text}
                      onChange={(e) => setFormData({ ...formData, content_text: e.target.value })}
                      required
                      placeholder="Enter book chapters, lessons, or paste book content..."
                      rows={10}
                    />
                  </div>
                </div>
              ) : null}

              <Button type="submit" disabled={loading || uploading} className="w-full">
                {uploading ? "Uploading file..." : loading ? "Saving..." : "Upload Content"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
