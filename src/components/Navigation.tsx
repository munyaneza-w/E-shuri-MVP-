import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string;
  avatar_url?: string;
}

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      
      if (data) setProfile(data);
    }
  };

  const showBackButton = location.pathname !== "/";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary border-b border-primary-dark">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary-foreground hover:opacity-80 transition-opacity"
          >
            <GraduationCap className="h-8 w-8" />
            <span className="font-bold text-xl hidden sm:inline">Rwanda Education</span>
          </button>

          {/* Center: Back Button */}
          {showBackButton && (
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-primary-foreground hover:bg-primary-light hover:text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          {/* Right: Profile */}
          {profile && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-10 w-10 border-2 border-primary-foreground">
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
