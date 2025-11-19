import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Award, TrendingUp, Users, FileText } from "lucide-react";
import heroImage from "@/assets/hero-students.jpg";
import studentLearning from "@/assets/student-learning.jpg";
import studentsCollaborate from "@/assets/students-collaborate.jpg";
import studentSuccess from "@/assets/student-success.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary min-h-[90vh] flex items-center">
        <div className="absolute inset-0 opacity-20">
          <img src={heroImage} alt="Students learning together" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 backdrop-blur-lg p-4 rounded-2xl">
                  <GraduationCap className="h-12 w-12" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">E-shuri</h1>
                  <p className="text-lg text-white/90">Rwanda Learning Platform</p>
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Learn, Grow, and Excel with Quality Digital Education
              </h2>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Empowering students aged 11-18 and teachers across Rwanda with engaging, curriculum-aligned content
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all text-lg px-8 py-6 shadow-vibrant"
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate("/subjects")}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20 hover:scale-105 transition-all text-lg px-8 py-6"
                >
                  Browse Subjects
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src={heroImage} 
                alt="Happy Rwandan students learning together" 
                className="rounded-3xl shadow-2xl border-4 border-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Why Choose E-shuri?
            </h2>
            <p className="text-xl text-muted-foreground">Everything you need for an amazing learning journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
            <div className="bg-card p-8 rounded-3xl border-2 border-primary/20 shadow-card hover:shadow-hover hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-primary to-primary-light text-white p-4 rounded-2xl w-fit mb-4">
                <BookOpen className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Curriculum-Aligned Content</h3>
              <p className="text-muted-foreground">
                Access comprehensive learning materials perfectly aligned with Rwanda's secondary school curriculum
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl border-2 border-secondary/20 shadow-card hover:shadow-hover hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-secondary to-orange-400 text-white p-4 rounded-2xl w-fit mb-4">
                <FileText className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Interactive Quizzes</h3>
              <p className="text-muted-foreground">
                Practice with fun quizzes and get instant feedback to boost your understanding
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl border-2 border-primary/20 shadow-card hover:shadow-hover hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-primary to-accent-foreground text-white p-4 rounded-2xl w-fit mb-4">
                <TrendingUp className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Track Your Progress</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey with detailed insights and see yourself improve every day
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl border-2 border-secondary/20 shadow-card hover:shadow-hover hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-secondary to-orange-400 text-white p-4 rounded-2xl w-fit mb-4">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Teacher Resources</h3>
              <p className="text-muted-foreground">
                Teachers can easily upload content and create engaging assessments for students
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl border-2 border-primary/20 shadow-card hover:shadow-hover hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-primary to-primary-light text-white p-4 rounded-2xl w-fit mb-4">
                <Award className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Past Exam Questions</h3>
              <p className="text-muted-foreground">
                Practice with historical exam questions to prepare effectively for your tests
              </p>
            </div>

            <div className="bg-card p-8 rounded-3xl border-2 border-secondary/20 shadow-card hover:shadow-hover hover:scale-105 transition-all">
              <div className="bg-gradient-to-br from-secondary to-orange-400 text-white p-4 rounded-2xl w-fit mb-4">
                <GraduationCap className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Multi-Format Learning</h3>
              <p className="text-muted-foreground">
                Learn your way with videos, documents, interactive content, and hands-on demonstrations
              </p>
            </div>
          </div>

          {/* Image Gallery Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition-all">
              <img src={studentLearning} alt="Student learning online" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-6">
                <p className="text-white font-bold text-lg">Learn Anywhere</p>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition-all">
              <img src={studentsCollaborate} alt="Students collaborating" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent flex items-end p-6">
                <p className="text-white font-bold text-lg">Work Together</p>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-lg hover:scale-105 transition-all">
              <img src={studentSuccess} alt="Student celebrating success" className="w-full h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-6">
                <p className="text-white font-bold text-lg">Achieve Success</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary-dark py-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Join E-shuri?</h2>
          <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto">
            Join thousands of students aged 11-18 and teachers transforming education across Rwanda
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 hover:scale-110 transition-all text-lg px-10 py-7 rounded-2xl shadow-2xl"
          >
            Start Learning for Free
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
