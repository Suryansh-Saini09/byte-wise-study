import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  created_at: string;
}

interface NotesListCardProps {
  userId: string;
}

const NotesListCard = ({ userId }: NotesListCardProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);
      if (error) throw error;
      
      toast.success("Note deleted");
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete note");
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Your Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Your Notes
        </CardTitle>
        <CardDescription>
          {notes.length} {notes.length === 1 ? "note" : "notes"} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No notes yet. Upload your first note to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/note/${note.id}`)}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotesListCard;