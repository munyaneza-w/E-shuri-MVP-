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
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface Question {
  question_text: string;
  question_type: "multiple_choice" | "true_false" | "short_answer";
  options: string[];
  correct_answer: string;
  points: number;
}

const CreateQuiz = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    subject_id: "",
    time_limit_minutes: 30,
    quiz_type: "quiz",
    deadline: "",
  });
  const [questions, setQuestions] = useState<Question[]>([
    {
      question_text: "",
      question_type: "multiple_choice",
      options: ["", "", "", ""],
      correct_answer: "",
      points: 1,
    },
  ]);

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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "multiple_choice",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        title: quizData.title,
        description: quizData.description,
        subject_id: quizData.subject_id,
        time_limit_minutes: quizData.time_limit_minutes,
        quiz_type: quizData.quiz_type,
        deadline: quizData.deadline || null,
        teacher_id: session.user.id,
      })
      .select()
      .single();

    if (quizError) {
      toast.error("Failed to create quiz");
      setLoading(false);
      return;
    }

    // Create questions
    const questionInserts = questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.question_type === "multiple_choice" ? q.options : q.question_type === "true_false" ? ["True", "False"] : null,
      correct_answer: q.correct_answer,
      points: q.points,
    }));

    const { error: questionsError } = await supabase
      .from("questions")
      .insert(questionInserts);

    if (questionsError) {
      toast.error("Failed to create questions");
      setLoading(false);
      return;
    }

    toast.success("Quiz created successfully!");
    navigate("/dashboard");
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
            <CardTitle className="text-3xl">Create Assessment</CardTitle>
            <CardDescription>Build a quiz or assignment for your students</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="quiz_type">Assessment Type *</Label>
                <Select
                  value={quizData.quiz_type}
                  onValueChange={(value) => setQuizData({ ...quizData, quiz_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  required
                  placeholder={quizData.quiz_type === "quiz" ? "e.g., Chapter 1 Quiz" : "e.g., Research Assignment"}
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={quizData.subject_id}
                  onValueChange={(value) => setQuizData({ ...quizData, subject_id: value })}
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={quizData.description}
                  onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                  placeholder="Brief description of this quiz"
                  rows={2}
                />
              </div>

              {quizData.quiz_type === "quiz" && (
                <div>
                  <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    value={quizData.time_limit_minutes}
                    onChange={(e) => setQuizData({ ...quizData, time_limit_minutes: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={quizData.deadline}
                  onChange={(e) => setQuizData({ ...quizData, deadline: e.target.value })}
                />
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Questions</h3>
                  <Button type="button" onClick={addQuestion} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {questions.map((question, qIndex) => (
                  <Card key={qIndex} className="mb-4">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">Question {qIndex + 1}</CardTitle>
                        {questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Question Text *</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(qIndex, "question_text", e.target.value)}
                          required
                          placeholder="Enter your question..."
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Question Type</Label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value) => updateQuestion(qIndex, "question_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                            <SelectItem value="short_answer">Short Answer (Student Types)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {question.question_type === "multiple_choice" && (
                        <div>
                          <Label>Options *</Label>
                          {question.options.map((option, oIndex) => (
                            <Input
                              key={oIndex}
                              value={option}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              required
                              placeholder={`Option ${oIndex + 1}`}
                              className="mt-2"
                            />
                          ))}
                        </div>
                      )}

                      <div>
                        <Label>
                          {question.question_type === "short_answer" 
                            ? "Model Answer (Optional - for grading reference)" 
                            : "Correct Answer *"}
                        </Label>
                        {question.question_type === "multiple_choice" ? (
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(qIndex, "correct_answer", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.filter(opt => opt.trim() !== "").map((option, oIndex) => (
                                <SelectItem key={oIndex} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                              {question.options.filter(opt => opt.trim() !== "").length === 0 && (
                                <SelectItem value="placeholder-empty" disabled>
                                  Fill in options first
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        ) : question.question_type === "true_false" ? (
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(qIndex, "correct_answer", value)}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select correct answer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="True">True</SelectItem>
                              <SelectItem value="False">False</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Textarea
                            value={question.correct_answer}
                            onChange={(e) => updateQuestion(qIndex, "correct_answer", e.target.value)}
                            placeholder="Enter a model answer for reference (students will type their own answer)"
                            rows={3}
                          />
                        )}
                      </div>

                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                          min="1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : quizData.quiz_type === "quiz" ? "Create Quiz" : "Create Assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateQuiz;
