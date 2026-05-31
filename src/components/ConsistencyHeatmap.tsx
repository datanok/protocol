'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function ConsistencyHeatmap({ userId }: { userId: string }) {
  const { data: commits, isLoading } = useQuery({
    queryKey: ['heatmap', userId],
    queryFn: async () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data, error } = await supabase
        .from('daily_commits')
        .select('date, completed_habits')
        .eq('user_id', userId)
        .gte('date', sixtyDaysAgo.toISOString().split('T')[0]);

      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  if (isLoading) {
    return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
  }

  // Generate last 60 days array
  const days = Array.from({ length: 60 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (59 - i));
    return d.toISOString().split('T')[0];
  });

  const commitMap = new Map(commits?.map(c => [c.date, c.completed_habits?.length || 0]));

  return (
    <div className="space-y-4">
      <h2 className="font-sans font-semibold text-sm uppercase tracking-widest text-foreground/70">
        Consistency Vector [Last 60 Days]
      </h2>
      <div className="p-6 bg-surface-lowest border border-surface-highest overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {days.map((day) => {
            const count = commitMap.get(day) || 0;
            return (
              <div
                key={day}
                title={`${count} commits on ${day}`}
                className={cn(
                  "w-3 h-3 rounded-none transition-colors duration-300",
                  count === 0 ? "bg-surface-high" :
                  count === 1 ? "bg-primary/40" :
                  count === 2 ? "bg-primary/70" :
                  "bg-primary glow-gold"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
