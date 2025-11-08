import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  stat: "notes" | "quizzes" | "messages";
  color: "cyan" | "purple" | "pink";
}

const StatsCard = ({ icon: Icon, label, stat, color }: StatsCardProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();
  }, [stat]);

  const fetchCount = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let query;
      switch (stat) {
        case "notes":
          query = supabase
            .from("notes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userData.user.id);
          break;
        case "quizzes":
          query = supabase
            .from("quizzes")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userData.user.id);
          break;
        case "messages":
          query = supabase
            .from("chat_messages")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userData.user.id);
          break;
      }

      const { count } = await query;
      setCount(count || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const glowColor = {
    cyan: "shadow-glow-cyan/20",
    purple: "shadow-glow-purple/20",
    pink: "shadow-glow-pink/20",
  };

  return (
    <Card className={`glass-panel ${glowColor[color]}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold">{count}</p>
          </div>
          <div className={`w-12 h-12 rounded-full bg-${color}-500/10 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-glow-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;