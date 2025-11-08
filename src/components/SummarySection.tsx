import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SummarySectionProps {
  noteId: string;
  noteContent: string;
}

const SummarySection = ({ noteId, noteContent }: SummarySectionProps) => {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, [noteId]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("summaries")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setSummary(data.content);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("generate-summary", {
        body: { noteId, noteContent },
      });

      if (error) throw error;

      const newSummary = data.summary;
      setSummary(newSummary);

      // Save to database
      await supabase.from("summaries").insert({
        user_id: userData.user.id,
        note_id: noteId,
        content: newSummary,
      });

      toast.success("Summary generated!");
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast.error(error.message || "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel">
        <CardContent className="py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Summary
          </CardTitle>
          <Button onClick={generateSummary} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {summary ? "Regenerate" : "Generate"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-foreground">{summary}</div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-primary/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No summary yet. Click "Generate" to create an AI-powered summary of your notes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummarySection;