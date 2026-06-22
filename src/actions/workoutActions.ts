'use server';

import { supabase } from '@/lib/supabase';

type SetInput = { weight: string; reps: string };

export async function saveWorkoutSession(
  userId: string,
  loggedDate: string, // YYYY-MM-DD
  logs: Record<string, SetInput[]>,
  notes: string,
): Promise<void> {
  const rows: Array<{
    user_id:     string;
    logged_date: string;
    exercise:    string;
    set_number:  number;
    weight_kg:   number | null;
    reps:        number | null;
    notes:       string | null;
  }> = [];

  for (const [exercise, sets] of Object.entries(logs)) {
    sets.forEach((set, idx) => {
      if (!set.weight && !set.reps) return; // skip completely empty rows
      rows.push({
        user_id:     userId,
        logged_date: loggedDate,
        exercise,
        set_number:  idx + 1,
        weight_kg:   set.weight ? parseFloat(set.weight) : null,
        reps:        set.reps   ? parseInt(set.reps, 10) : null,
        notes:       idx === 0 && notes ? notes : null,
      });
    });
  }

  if (rows.length === 0) return;

  const { error } = await supabase.from('workout_logs').insert(rows);
  if (error) throw new Error(error.message);
}
