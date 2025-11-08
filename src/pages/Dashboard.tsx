import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Brain, Upload, FileText, Trophy, MessageSquare, LogOut } from "lucide-react";
import { toast } from "sonner";
import FileUploadCard from "@/components/FileUploadCard";
import NotesListCard from "@/components/NotesListCard";
import StatsCard from "@/components/StatsCard";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Brain className="w-16 h-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center neon-glow">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold neon-text">Smart Study Buddy</h1>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.full_name || "Student"}! 👋
          </h2>
          <p className="text-muted-foreground">
            Upload your notes and let AI help you study smarter.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={FileText}
            label="Uploaded Notes"
            stat="notes"
            color="cyan"
          />
          <StatsCard
            icon={Trophy}
            label="Quizzes Taken"
            stat="quizzes"
            color="purple"
          />
          <StatsCard
            icon={MessageSquare}
            label="Chat Messages"
            stat="messages"
            color="pink"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FileUploadCard userId={user?.id || ""} />
          <NotesListCard userId={user?.id || ""} />
        </div>
      </main>

      <footer className="mt-16 py-6 text-center text-sm text-muted-foreground">
        Study Smarter. Learn Faster. Verify Instantly.
      </footer>
    </div>
  );
};

export default Dashboard;