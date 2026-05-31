import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type WorkoutSet = {
  id:          string;
  logged_date: string; // YYYY-MM-DD
  exercise:    string;
  set_number:  number;
  weight_kg:   number | null;
  reps:        number | null;
  notes:       string | null;
};

export type SessionGroup = {
  date:     string; // YYYY-MM-DD
  sets:     WorkoutSet[];
  setCount: number;
};

export type ExerciseHistory = {
  exercise: string;
  sessions: SessionGroup[];          // grouped by date, newest first
  pr:       { weight_kg: number; reps: number } | null;
  totalSets: number;
};

export type WorkoutHistory = {
  allSets:      WorkoutSet[];
  byExercise:   Record<string, ExerciseHistory>;
  exercises:    string[];            // all exercises seen, sorted
  weeklyVolume: { label: string; sets: number }[]; // 8 entries, oldest→newest
  totalSets:    number;
  activeDays:   number;             // days with any logged sets in last 30d
};

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(date: Date): Date {
  // Monday-based weeks
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useWorkoutHistory(userId: string | null | undefined) {
  return useQuery<WorkoutHistory>({
    queryKey: ['workout-history', userId],
    enabled:  !!userId,
    staleTime: 30 * 1000,
    retry:    false,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const sinceStr = toYmd(since);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, logged_date, exercise, set_number, weight_kg, reps, notes')
        .eq('user_id', userId!)
        .gte('logged_date', sinceStr)
        .order('logged_date', { ascending: false })
        .order('exercise',    { ascending: true  })
        .order('set_number',  { ascending: true  });

      if (error) throw new Error(error.message);

      const allSets = (data ?? []) as WorkoutSet[];

      // ── Group by exercise ──────────────────────────────────────────────────
      const byExercise: Record<string, ExerciseHistory> = {};

      for (const set of allSets) {
        if (!byExercise[set.exercise]) {
          byExercise[set.exercise] = {
            exercise:  set.exercise,
            sessions:  [],
            pr:        null,
            totalSets: 0,
          };
        }
        const entry = byExercise[set.exercise];
        entry.totalSets++;

        // PR: heaviest weight, tie-break on reps
        if (set.weight_kg != null && set.reps != null) {
          const cur = entry.pr;
          if (
            !cur ||
            set.weight_kg > cur.weight_kg ||
            (set.weight_kg === cur.weight_kg && set.reps > cur.reps)
          ) {
            entry.pr = { weight_kg: set.weight_kg, reps: set.reps };
          }
        }
      }

      // Group sets into sessions (by date) per exercise
      for (const entry of Object.values(byExercise)) {
        const byDate: Record<string, WorkoutSet[]> = {};
        for (const set of allSets.filter(s => s.exercise === entry.exercise)) {
          if (!byDate[set.logged_date]) byDate[set.logged_date] = [];
          byDate[set.logged_date].push(set);
        }
        entry.sessions = Object.entries(byDate)
          .sort(([a], [b]) => b.localeCompare(a)) // newest first
          .map(([date, sets]) => ({ date, sets, setCount: sets.length }));
      }

      const exercises = Object.keys(byExercise).sort();

      // ── Weekly volume (last 8 ISO weeks) ──────────────────────────────────
      const weeklyVolume: { label: string; sets: number }[] = [];
      const now = new Date();

      for (let w = 7; w >= 0; w--) {
        const refDate = new Date(now);
        refDate.setDate(refDate.getDate() - w * 7);
        const weekStart = startOfWeek(refDate);
        const weekEnd   = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const count = allSets.filter(s => {
          const d = new Date(s.logged_date + 'T12:00:00');
          return d >= weekStart && d <= weekEnd;
        }).length;

        weeklyVolume.push({
          label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sets:  count,
        });
      }

      // ── Active days (last 30d) ─────────────────────────────────────────────
      const since30 = new Date();
      since30.setDate(since30.getDate() - 30);
      const activeDates = new Set(
        allSets
          .filter(s => new Date(s.logged_date + 'T12:00:00') >= since30)
          .map(s => s.logged_date)
      );

      return {
        allSets,
        byExercise,
        exercises,
        weeklyVolume,
        totalSets:  allSets.length,
        activeDays: activeDates.size,
      };
    },
  });
}
