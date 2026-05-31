'use server';

import { supabase } from '@/lib/supabase';

export async function upsertDailyCommit(
  userId: string,
  date: string,
  completedHabits: string[],
): Promise<void> {
  const { error } = await supabase
    .from('daily_commits')
    .upsert(
      { user_id: userId, date, completed_habits: completedHabits },
      { onConflict: 'user_id,date' },
    );
  if (error) throw new Error(error.message);
}
