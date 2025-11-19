import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, FileText, Send } from "lucide-react";

interface Submission {
  id: string;
  submission_text: string;
  submitted_at: string;
  is_late: boolean;
  status: string;
  grade: number | null;
  feedback: string | null;
  student: {
    full_name: string;
  };
  assignment: {
    title: string;
    points: number;
    rubric: any;
  };
}

const GradingQueue = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [bulkGrade, setBulkGrade] = useState("");
  const [bulkFeedback, setBulkFeedback] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("assignment_submissions")
      .select(`
        id,
        submission_text,
        submitted_at,
        is_late,
        status,
        grade,
        feedback,
        student:profiles!assignment_submissions_student_id_fkey(full_name),
        assignment:assignments(title, points, rubric)
      `)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true });

    if (error) {
      toast.error("Failed to load submissions");
      setLoading(false);
      return;
    }

    setSubmissions(data as any);
    setLoading(false);
  };

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedback(submission.feedback || "");
  };

  const submitGrade = async () => {
    if (!selectedSubmission || !grade) {
      toast.error("Please enter a grade");
      return;
    }

    const gradeNum = parseFloat(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > selectedSubmission.assignment.points) {
      toast.error(`Grade must be between 0 and ${selectedSubmission.assignment.points}`);
      return;
    }

    setGrading(true);
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        grade: gradeNum,
        feedback,
        status: "graded",
        graded_at: new Date().toISOString(),
        graded_by: session?.user.id,
      })
      .eq("id", selectedSubmission.id);

    if (error) {
      toast.error("Failed to submit grade");
      setGrading(false);
      return;
    }

    // Send notification to student
    await supabase.from("notifications").insert({
      user_id: (selectedSubmission as any).student_id,
      type: "assignment_graded",
      title: "Assignment Graded",
      message: `Your assignment "${selectedSubmission.assignment.title}" has been graded. Score: ${gradeNum}/${selectedSubmission.assignment.points}`,
      link: `/assignments/${(selectedSubmission as any).assignment_id}`,
    });

    toast.success("Grade submitted successfully");
    setSelectedSubmission(null);
    setGrade("");
    setFeedback("");
    setGrading(false);
    fetchSubmissions();
  };

  const handleBulkGrade = async () => {
    if (selectedSubmissions.size === 0) {
      toast.error("Please select submissions to grade");
      return;
    }

    if (!bulkGrade) {
      toast.error("Please enter a grade");
      return;
    }

    setGrading(true);
    const { data: { session } } = await supabase.auth.getSession();

    for (const submissionId of selectedSubmissions) {
      const submission = submissions.find((s) => s.id === submissionId);
      if (!submission) continue;

      const gradeNum = parseFloat(bulkGrade);
      if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > submission.assignment.points) {
        toast.error(`Invalid grade for ${submission.student.full_name}`);
        continue;
      }

      await supabase
        .from("assignment_submissions")
        .update({
          grade: gradeNum,
          feedback: bulkFeedback,
          status: "graded",
          graded_at: new Date().toISOString(),
          graded_by: session?.user.id,
        })
        .eq("id", submissionId);

      // Send notification
      await supabase.from("notifications").insert({
        user_id: (submission as any).student_id,
        type: "assignment_graded",
        title: "Assignment Graded",
        message: `Your assignment "${submission.assignment.title}" has been graded. Score: ${gradeNum}/${submission.assignment.points}`,
        link: `/assignments/${(submission as any).assignment_id}`,
      });
    }

    toast.success(`Graded ${selectedSubmissions.size} submissions`);
    setSelectedSubmissions(new Set());
    setBulkGrade("");
    setBulkFeedback("");
    setGrading(false);
    fetchSubmissions();
  };

  const toggleSubmissionSelection = (id: string) => {
    const newSet = new Set(selectedSubmissions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSubmissions(newSet);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Grading Queue</h1>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {submissions.length} Pending
        </Badge>
      </div>

      {/* Bulk Grading Section */}
      {selectedSubmissions.size > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Bulk Grading ({selectedSubmissions.size} selected)</CardTitle>
            <CardDescription>Apply the same grade and feedback to selected submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade</Label>
                <Input
                  type="number"
                  placeholder="Enter grade"
                  value={bulkGrade}
                  onChange={(e) => setBulkGrade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Feedback (optional)</Label>
                <Textarea
                  placeholder="Enter feedback for all selected submissions"
                  value={bulkFeedback}
                  onChange={(e) => setBulkFeedback(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBulkGrade} disabled={grading} className="bg-primary">
                <Send className="h-4 w-4 mr-2" />
                Grade {selectedSubmissions.size} Submissions
              </Button>
              <Button variant="outline" onClick={() => setSelectedSubmissions(new Set())}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-secondary mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">No submissions pending grading</p>
            </CardContent>
          </Card>
        ) : (
          submissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedSubmissions.has(submission.id)}
                    onCheckedChange={() => toggleSubmissionSelection(submission.id)}
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{submission.assignment.title}</h3>
                        <p className="text-muted-foreground">
                          Submitted by {submission.student.full_name}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={submission.is_late ? "destructive" : "default"}>
                          <Clock className="h-3 w-3 mr-1" />
                          {submission.is_late ? "Late" : "On Time"}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {submission.submission_text && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm">{submission.submission_text}</p>
                      </div>
                    )}

                    {submission.assignment.rubric && (
                      <div className="bg-accent/20 p-3 rounded-lg">
                        <p className="text-sm font-medium mb-2">Grading Rubric:</p>
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(submission.assignment.rubric, null, 2)}
                        </pre>
                      </div>
                    )}

                    <Button onClick={() => openGradingDialog(submission)} className="bg-primary">
                      <FileText className="h-4 w-4 mr-2" />
                      Grade Submission (out of {submission.assignment.points})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Grading Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.assignment.title} - {selectedSubmission?.student.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Grade (out of {selectedSubmission?.assignment.points})</Label>
              <Input
                type="number"
                placeholder="Enter grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                min="0"
                max={selectedSubmission?.assignment.points}
              />
            </div>

            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                placeholder="Provide feedback for the student"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                Cancel
              </Button>
              <Button onClick={submitGrade} disabled={grading} className="bg-secondary">
                <Send className="h-4 w-4 mr-2" />
                Submit Grade
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradingQueue;
