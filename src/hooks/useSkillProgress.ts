import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SkillBenchmark } from '@/types/schema';

export type SkillSession = {
  id: string;
  occurred_at: string;
  duration_min: number;
  notes: string | null;
  tags: string[] | null;
  benchmark_id: string | null;
};

export type SkillNodeProgressRow = {
  benchmark_id: string;
  status: 'completed' | 'in-progress' | 'locked';
  xp: number;
  updated_at: string;
  completed_at: string | null;
};

export type SkillProgress = {
  subject: string;
  sessions: SkillSession[];
  nodeProgress: Record<string, SkillNodeProgressRow>;
  derived: {
    totalMinutes30: number;
    totalXp30: number;
    level: number;
    xpToNextLevel: number;
    completionPct: number;
    streakDays: number;
  };
};

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function daysBack(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function normalizeSubject(subject: string) {
  return subject.trim().toLowerCase();
}

function xpFromMinutes(minutes: number) {
  // Simple, predictable mapping: 10 XP per minute.
  return Math.max(0, Math.round(minutes * 10));
}

function levelFromXp(totalXp: number) {
  // Soft ramp: each level needs +500 XP.
  const level = 1 + Math.floor(Math.max(0, totalXp) / 500);
  const nextLevelAt = level * 500;
  return { level, xpToNextLevel: Math.max(0, nextLevelAt - totalXp) };
}

export function useSkillProgress(params: {
  userId: string | null | undefined;
  subject: string | null | undefined;
  benchmarks?: SkillBenchmark[];
}) {
  const userId = params.userId ?? null;
  const subject = params.subject ? normalizeSubject(params.subject) : null;
  const benchmarks = params.benchmarks ?? [];

  return useQuery({
    queryKey: ['skill-progress', userId, subject],
    enabled: !!userId && !!subject,
    retry: false,
    staleTime: 30 * 1000,
    queryFn: async (): Promise<SkillProgress> => {
      const since30 = new Date();
      since30.setDate(since30.getDate() - 30);

      const [sessionsRes, progressRes] = await Promise.all([
        supabase
          .from('skill_sessions')
          .select('id, occurred_at, duration_min, notes, tags, benchmark_id')
          .eq('user_id', userId!)
          .eq('skill_subject', subject!)
          .order('occurred_at', { ascending: false })
          .limit(25),
        supabase
          .from('skill_node_progress')
          .select('benchmark_id, status, xp, updated_at, completed_at')
          .eq('user_id', userId!)
          .eq('skill_subject', subject!),
      ]);

      if (sessionsRes.error) throw new Error(sessionsRes.error.message);
      if (progressRes.error) throw new Error(progressRes.error.message);

      const sessions = (sessionsRes.data || []) as SkillSession[];
      const progressRows = (progressRes.data || []) as SkillNodeProgressRow[];
      const nodeProgress: Record<string, SkillNodeProgressRow> = {};
      for (const row of progressRows) nodeProgress[row.benchmark_id] = row;

      // Derived stats (30-day window from sessions)
      const sessions30 = sessions.filter(s => new Date(s.occurred_at) >= since30);
      const totalMinutes30 = sessions30.reduce((sum, s) => sum + (s.duration_min || 0), 0);
      const totalXp30 = xpFromMinutes(totalMinutes30);

      // Streak based on session dates (any session on a day counts)
      const dateSet = new Set(sessions.map(s => toYmd(new Date(s.occurred_at))));
      let streakDays = 0;
      for (let i = 0; i < 365; i++) {
        if (!dateSet.has(toYmd(daysBack(i)))) break;
        streakDays++;
      }

      const completedCount = benchmarks.length
        ? benchmarks.filter(b => nodeProgress[b.id]?.status === 'completed').length
        : Object.values(nodeProgress).filter(r => r.status === 'completed').length;
      const completionPct = benchmarks.length ? Math.round((completedCount / Math.max(1, benchmarks.length)) * 100) : 0;

      const { level, xpToNextLevel } = levelFromXp(totalXp30);

      return {
        subject: subject!,
        sessions,
        nodeProgress,
        derived: {
          totalMinutes30,
          totalXp30,
          level,
          xpToNextLevel,
          completionPct,
          streakDays,
        },
      };
    },
  });
}

