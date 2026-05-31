'use client';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { useDashboardVM } from '@/contexts/PlanContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { supabase } from '@/lib/supabase';

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ZoneA_Commit() {
  const { today: commit } = useDashboardVM();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useDashboardStats(user?.id);

  const lastCommitHours = data?.commits.lastCommitHoursAgo ?? null;
  const streak = data?.commits.streakDays ?? 0;

  // Sync DB state into local optimistic set
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null); // habitId being saved

  useEffect(() => {
    if (data?.commits.completedHabitIds) {
      setCompleted(new Set(data.commits.completedHabitIds));
    }
  }, [data?.commits.completedHabitIds]);

  async function toggleHabit(habitId: string) {
    if (!user || saving) return;

    const next = new Set(completed);
    if (next.has(habitId)) next.delete(habitId);
    else next.add(habitId);

    // Optimistic update
    setCompleted(next);
    setSaving(habitId);

    try {
      const { error } = await supabase
        .from('daily_commits')
        .upsert(
          {
            user_id: user.id,
            date: toYmd(new Date()),
            completed_habits: Array.from(next),
          },
          { onConflict: 'user_id,date' }
        );
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
    } catch {
      // Rollback on error
      setCompleted(completed);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="bg-surface-l1 border border-[#1E1E1E] p-6 shadow-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <span className="font-mono text-[10px] text-[#3A3A3A] tracking-[0.15em] uppercase">Execute</span>
        <span className="text-[#D4AF37]/30 text-[10px] animate-blink">▌</span>
      </div>

      {/* Habit buttons */}
      <div className="flex flex-col gap-[10px] flex-1 overflow-y-auto scrollbar-none">
        {commit.habits.map((habit, idx) => {
          const isDone = completed.has(habit.id);
          const isLoading = saving === habit.id;
          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              disabled={isLoading}
              className={`relative w-full min-h-[52px] shrink-0 border overflow-hidden group transition-all duration-180 ease-out active:scale-[0.992]
                ${isDone
                  ? 'bg-gold/5 border-gold'
                  : 'bg-gradient-to-br from-[#1A1A1A] to-[#141414] border-[#2A2A2A] hover:border-gold hover:bg-gold/5'
                }`}
            >
              {/* Left accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-180 ease-out
                ${isDone ? 'bg-gold shadow-[0_0_8px_rgba(212,175,55,0.4)]' : idx === 0 ? 'bg-gold' : 'bg-gold-dim group-hover:bg-gold'}`}
              />

              <div className="flex items-center justify-between h-full px-4 ml-1">
                <div className="flex flex-col items-start py-2 min-w-0">
                  <span className={`font-sans font-semibold text-[13px] tracking-[0.08em] uppercase text-left truncate
                    ${isDone ? 'text-gold' : 'text-text-primary'}`}>
                    {habit.name}
                  </span>
                  <span className="font-mono text-[10px] text-[#4A4A4A] uppercase">
                    {isDone ? `✓ ${habit.category} · done` : `Category: ${habit.category}`}
                  </span>
                </div>
                {isLoading
                  ? <Loader2 className="w-3.5 h-3.5 text-gold animate-spin shrink-0 ml-2" />
                  : <ChevronRight className={`w-4 h-4 shrink-0 ml-2 transition-colors duration-180
                      ${isDone ? 'text-gold' : 'text-[#3A3A3A] group-hover:text-gold'}`} />
                }
              </div>
            </button>
          );
        })}

        {/* Missed Day */}
        <button className="relative w-full min-h-[52px] shrink-0 mt-auto bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#2A2A2A] overflow-hidden group transition-all duration-180 hover:border-[#3A3A3A] active:scale-[0.992]">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#2A2A2A]" />
          <div className="flex items-center justify-between h-full px-4 ml-1">
            <div className="flex flex-col items-start py-2">
              <span className="font-sans font-medium text-[13px] text-text-secondary group-hover:text-[#8A8A8A] uppercase transition-colors">
                Missed Day
              </span>
              <span className="font-mono text-[10px] text-[#333333]">log gap · system recalibrates</span>
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#1E1E1E] shrink-0">
        <span className="font-mono text-[11px] text-[#2A2A2A]">
          &gt; {lastCommitHours === null ? 'no commits yet' : `last commit: ${lastCommitHours}h ago`} · streak: {streak}d
        </span>
      </div>
    </div>
  );
}
