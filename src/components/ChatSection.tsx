import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatSectionProps {
  noteId: string;
  noteContent: string;
}

const ChatSection = ({ noteId, noteContent }: ChatSectionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [noteId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("note_id", noteId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data.map(msg => ({
          ...msg,
          role: msg.role as "user" | "assistant"
        })));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setFetching(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      // Add user message to UI
      const newUserMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: userMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newUserMessage]);

      // Save user message
      await supabase.from("chat_messages").insert({
        user_id: userData.user.id,
        note_id: noteId,
        role: "user",
        content: userMessage,
      });

      // Call AI function
      const { data, error } = await supabase.functions.invoke("chat-with-notes", {
        body: { noteId, noteContent, userMessage },
      });

      if (error) throw error;

      const aiResponse = data.response;

      // Add AI response to UI
      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: aiResponse,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newAiMessage]);

      // Save AI message
      await supabase.from("chat_messages").insert({
        user_id: userData.user.id,
        note_id: noteId,
        role: "assistant",
        content: aiResponse,
      });

      toast.success("Response received!");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (fetching) {
    return (
      <Card className="glass-panel">
        <CardContent className="py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Ask AI About Your Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-primary/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Ask any question about your notes and get AI-powered answers.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSection;