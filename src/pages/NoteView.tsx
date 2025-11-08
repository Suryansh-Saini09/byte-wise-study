import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowLeft, Sparkles, Trophy, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SummarySection from "@/components/SummarySection";
import QuizSection from "@/components/QuizSection";
import ChatSection from "@/components/ChatSection";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const NoteView = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "quiz" | "chat">("summary");

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      setNote(data);
    } catch (error) {
      console.error("Error fetching note:", error);
      toast.error("Failed to load note");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Note not found</p>
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
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center neon-glow">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold truncate max-w-md">{note.title}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === "summary" ? "default" : "outline"}
            onClick={() => setActiveTab("summary")}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Summary
          </Button>
          <Button
            variant={activeTab === "quiz" ? "default" : "outline"}
            onClick={() => setActiveTab("quiz")}
            className="flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Quiz
          </Button>
          <Button
            variant={activeTab === "chat" ? "default" : "outline"}
            onClick={() => setActiveTab("chat")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
          </Button>
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel */}
          <div className="lg:col-span-2">
            {activeTab === "summary" && <SummarySection noteId={note.id} noteContent={note.content} />}
            {activeTab === "quiz" && <QuizSection noteId={note.id} noteContent={note.content} />}
            {activeTab === "chat" && <ChatSection noteId={note.id} noteContent={note.content} />}
          </div>

          {/* Side Panel - Note Preview */}
          <div className="lg:col-span-1">
            <Card className="glass-panel sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Note Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content.slice(0, 1000)}
                    {note.content.length > 1000 && "..."}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteView;