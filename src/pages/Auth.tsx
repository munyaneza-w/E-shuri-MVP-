import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, BookOpen, Globe } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [level, setLevel] = useState<"O" | "A">("O");
  const [classYear, setClassYear] = useState<string>("S1");
  const [aLevelOption, setALevelOption] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "rw">("en");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          navigate("/dashboard");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const age = formData.get("age") as string;
    const schoolName = formData.get("schoolName") as string;

    // Validation
    if (!email || !password || !fullName) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (role === "student") {
      if (!age || !schoolName) {
        toast.error("Students must provide age and school name");
        setLoading(false);
        return;
      }
      if (level === "A" && !aLevelOption) {
        toast.error("A-Level students must select an option");
        setLoading(false);
        return;
      }
    }

    if (role === "teacher" && !schoolName) {
      toast.error("Teachers must provide school name");
      setLoading(false);
      return;
    }

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      toast.error("Failed to create user");
      setLoading(false);
      return;
    }

    // Update profile with additional data
    const profileData: any = {
      id: authData.user.id,
      full_name: fullName,
      language,
    };

    if (role === "student") {
      profileData.age = parseInt(age);
      profileData.level = level;
      profileData.class_year = classYear;
      if (level === "A") {
        profileData.a_level_option = aLevelOption;
      }
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Insert school if needed (simplified - in production, search existing schools first)
    if (schoolName) {
      const { data: schoolData } = await supabase
        .from("schools")
        .select("id")
        .eq("name", schoolName)
        .maybeSingle();

      let schoolId = schoolData?.id;

      if (!schoolId) {
        const { data: newSchool, error: schoolError } = await supabase
          .from("schools")
          .insert({ name: schoolName })
          .select("id")
          .single();

        if (!schoolError && newSchool) {
          schoolId = newSchool.id;
        }
      }

      if (schoolId) {
        await supabase
          .from("profiles")
          .update({ school_id: schoolId })
          .eq("id", authData.user.id);
      }
    }

    // Assign role
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role })
      .eq("user_id", authData.user.id);

    if (roleError) {
      console.error("Role assignment error:", roleError);
    }

    setLoading(false);
    toast.success("Account created! Redirecting...");
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
    }
  };

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary-dark p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-2xl">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-primary">E-shuri</h1>
              <p className="text-sm text-muted-foreground">Rwanda Learning Platform</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription className="text-base">
            Sign in to continue your learning journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={role} onValueChange={(val) => setRole(val as "student" | "teacher")} className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer flex-1">
                        <BookOpen className="h-4 w-4" />
                        Student
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="flex items-center gap-2 cursor-pointer flex-1">
                        <GraduationCap className="h-4 w-4" />
                        Teacher
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {role === "student" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          min="10"
                          max="30"
                          placeholder="15"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="level">Level</Label>
                        <Select value={level} onValueChange={(val) => setLevel(val as "O" | "A")}>
                          <SelectTrigger id="level">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="O">O Level</SelectItem>
                            <SelectItem value="A">A Level</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class-year">Class Year</Label>
                      <Select value={classYear} onValueChange={setClassYear}>
                        <SelectTrigger id="class-year">
                          <SelectValue />
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

                    {level === "A" && (
                      <div className="space-y-2">
                        <Label htmlFor="a-level-option">A-Level Option</Label>
                        <Select value={aLevelOption} onValueChange={setALevelOption}>
                          <SelectTrigger id="a-level-option">
                            <SelectValue placeholder="Select your option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PCB">PCB - Physics, Chemistry, Biology</SelectItem>
                            <SelectItem value="PCM">PCM - Physics, Chemistry, Mathematics</SelectItem>
                            <SelectItem value="MEG">MEG - Mathematics, Economics, Geography</SelectItem>
                            <SelectItem value="HEG">HEG - History, Economics, Geography</SelectItem>
                            <SelectItem value="HK">HK - History, Kinyarwanda</SelectItem>
                            <SelectItem value="LKK">LKK - Languages, Kinyarwanda, Kiswahili</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="school-name">School Name</Label>
                  <Input
                    id="school-name"
                    name="schoolName"
                    type="text"
                    placeholder="Your school"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Preferred Language
                  </Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val as "en" | "rw")}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="rw">🇷🇼 Kinyarwanda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
