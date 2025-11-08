import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  score: number;
  total_questions: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
}

interface QuizSectionProps {
  noteId: string;
  noteContent: string;
}

const QuizSection = ({ noteId, noteContent }: QuizSectionProps) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchQuiz();
  }, [noteId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const { data: quizData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (quizData) {
        setQuiz(quizData);

        const { data: questionsData } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quizData.id);

        if (questionsData) {
          setQuestions(questionsData.map(q => ({
            ...q,
            options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setGenerating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { noteId, noteContent },
      });

      if (error) throw error;

      const newQuiz = data.quiz;
      const newQuestions = data.questions;

      // Save quiz
      const { data: quizData } = await supabase
        .from("quizzes")
        .insert({
          user_id: userData.user.id,
          note_id: noteId,
          title: `Quiz - ${new Date().toLocaleDateString()}`,
          total_questions: newQuestions.length,
        })
        .select()
        .single();

      if (quizData) {
        // Save questions
        const questionsToInsert = newQuestions.map((q: any) => ({
          quiz_id: quizData.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
        }));

        await supabase.from("quiz_questions").insert(questionsToInsert);
        
        await fetchQuiz();
        toast.success("Quiz generated!");
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast.error(error.message || "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [questionId]: answer });
  };

  const submitQuiz = async () => {
    if (!quiz) return;

    let score = 0;
    const updates = questions.map((q) => {
      const userAnswer = selectedAnswers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) score++;

      return supabase
        .from("quiz_questions")
        .update({ user_answer: userAnswer, is_correct: isCorrect })
        .eq("id", q.id);
    });

    await Promise.all(updates);

    await supabase.from("quizzes").update({ score }).eq("id", quiz.id);

    toast.success(`Quiz completed! Score: ${score}/${questions.length}`);
    fetchQuiz();
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
            <Trophy className="w-5 h-5 text-primary" />
            AI Quiz
          </CardTitle>
          <Button onClick={generateQuiz} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 mr-2" />
                {quiz ? "New Quiz" : "Generate"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {questions.length > 0 ? (
          <div className="space-y-6">
            {quiz && quiz.score > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <p className="text-center text-lg font-bold">
                  Score: {quiz.score}/{quiz.total_questions}
                </p>
              </div>
            )}

            {questions.map((q, idx) => (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-primary">Q{idx + 1}.</span>
                  <p className="flex-1 font-medium">{q.question}</p>
                  {q.is_correct !== undefined && (
                    <div>
                      {q.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 ml-8">
                  {q.options.map((option, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswerSelect(q.id, option)}
                      disabled={q.user_answer !== undefined}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedAnswers[q.id] === option
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      } ${
                        q.user_answer && q.correct_answer === option
                          ? "border-green-500 bg-green-500/10"
                          : ""
                      } ${
                        q.user_answer && q.user_answer === option && !q.is_correct
                          ? "border-red-500 bg-red-500/10"
                          : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {!quiz?.score && (
              <Button
                onClick={submitQuiz}
                className="w-full"
                disabled={Object.keys(selectedAnswers).length !== questions.length}
              >
                Submit Quiz
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-primary/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No quiz yet. Click "Generate" to create an AI-powered quiz from your notes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizSection;