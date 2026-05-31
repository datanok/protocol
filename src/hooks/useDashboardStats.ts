import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type DailyCommitRow = {
  date: string; // YYYY-MM-DD
  completed_habits: unknown[] | null;
};

type VisualLogRow = {
  image_url: string | null;
  created_at?: string | null;
};

function toYmd(d: Date) {
  // local date → YYYY-MM-DD
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

function countCommittedDays(rows: DailyCommitRow[], windowDays: number) {
  const set = new Set(rows.map(r => r.date));
  let committed = 0;
  for (let i = 0; i < windowDays; i++) {
    if (set.has(toYmd(daysBack(i)))) committed++;
  }
  return committed;
}

function calcStreak(rows: DailyCommitRow[]) {
  const set = new Set(rows.map(r => r.date));
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (!set.has(toYmd(daysBack(i)))) break;
    streak++;
  }
  return streak;
}

function hoursSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  return Math.floor(ms / (1000 * 60 * 60));
}

export type DashboardStats = {
  commits: {
    last7Days: number;
    last30Days: number;
    consistency7Pct: number;
    consistency30Pct: number;
    best7ofLast56: number;
    delta7Days: number; // vs previous 7 days
    streakDays: number;
    lastCommitHoursAgo: number | null;
    todayCommitted: boolean;
    completedHabitIds: string[];
  };
  visual: {
    latestImageUrl: string | null;
    latestLabel: string; // e.g. "Apr 28"
  };
};

export function useDashboardStats(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', userId],
    enabled: !!userId,
    queryFn: async (): Promise<DashboardStats> => {
      const since60 = toYmd(daysBack(59));

      const [commitsRes, visualRes, lastCommitRes] = await Promise.all([
        supabase
          .from('daily_commits')
          .select('date, completed_habits')
          .eq('user_id', userId!)
          .gte('date', since60),
        supabase
          .from('visual_logs')
          .select('image_url, created_at')
          .eq('user_id', userId!)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('daily_commits')
          .select('date')
          .eq('user_id', userId!)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (commitsRes.error) throw new Error(commitsRes.error.message);
      if (visualRes.error) throw new Error(visualRes.error.message);
      if (lastCommitRes.error) throw new Error(lastCommitRes.error.message);

      const commits = (commitsRes.data || []) as DailyCommitRow[];

      const last7 = countCommittedDays(commits, 7);
      const prev7 = (() => {
        const set = new Set(commits.map(r => r.date));
        let c = 0;
        for (let i = 7; i < 14; i++) {
          if (set.has(toYmd(daysBack(i)))) c++;
        }
        return c;
      })();

      const last30 = countCommittedDays(commits, 30);

      const best7ofLast56 = (() => {
        const set = new Set(commits.map(r => r.date));
        let best = 0;
        for (let start = 0; start <= 56 - 7; start++) {
          let c = 0;
          for (let i = start; i < start + 7; i++) {
            if (set.has(toYmd(daysBack(i)))) c++;
          }
          best = Math.max(best, c);
        }
        return best;
      })();

      const streakDays = calcStreak(commits);
      const todayStr = toYmd(new Date());
      const todayRow = commits.find(r => r.date === todayStr);
      const todayCommitted = !!todayRow;
      const completedHabitIds = Array.isArray(todayRow?.completed_habits)
        ? (todayRow.completed_habits as string[])
        : [];

      const latestImageUrl = (visualRes.data as VisualLogRow | null)?.image_url ?? null;
      const latestCreatedAt = (visualRes.data as VisualLogRow | null)?.created_at ?? null;
      const latestLabel = latestCreatedAt
        ? new Date(latestCreatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
        : '—';

      // daily_commits doesn't expose created_at in our selects; approximate "hours ago" by date.
      const lastCommitDate = (lastCommitRes.data as { date?: string } | null)?.date ?? null;
      const lastCommitHoursAgo = lastCommitDate
        ? hoursSince(`${lastCommitDate}T00:00:00`)
        : null;

      const consistency7Pct = Math.round((last7 / 7) * 100);
      const consistency30Pct = Math.round((last30 / 30) * 100);

      return {
        commits: {
          last7Days: last7,
          last30Days: last30,
          consistency7Pct,
          consistency30Pct,
          best7ofLast56,
          delta7Days: last7 - prev7,
          streakDays,
          lastCommitHoursAgo,
          todayCommitted,
          completedHabitIds,
        },
        visual: {
          latestImageUrl,
          latestLabel,
        },
      };
    },
    retry: false,
    staleTime: 30 * 1000,
  });
}

