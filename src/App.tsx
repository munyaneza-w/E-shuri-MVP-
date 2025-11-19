import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Analytics from "./pages/Analytics";
import GradingQueue from "./pages/GradingQueue";
import CourseEnrollment from "./pages/CourseEnrollment";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import Upload from "./pages/Upload";
import CreateQuiz from "./pages/CreateQuiz";
import StudentPerformance from "./pages/StudentPerformance";
import Quizzes from "./pages/Quizzes";
import Progress from "./pages/Progress";
import PastExams from "./pages/PastExams";
import BookLibrary from "./pages/BookLibrary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/grading-queue" element={<GradingQueue />} />
            <Route path="/enroll" element={<CourseEnrollment />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/subject/:subjectId" element={<SubjectDetails />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route path="/student-performance" element={<StudentPerformance />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/past-exams" element={<PastExams />} />
            <Route path="/book-library" element={<BookLibrary />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
