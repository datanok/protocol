'use server';

import { supabase } from '@/lib/supabase';

export async function logSkillSession({
  userId,
  subject,
  durationMin,
  nodeId,
  notes,
}: {
  userId:      string;
  subject:     string;
  durationMin: number;
  nodeId:      string | null;
  notes:       string | null;
}): Promise<void> {
  const norm = subject.trim().toLowerCase();

  const { error: insErr } = await supabase.from('skill_sessions').insert({
    user_id:       userId,
    skill_subject: norm,
    duration_min:  durationMin,
    notes:         notes || null,
    benchmark_id:  nodeId || null,
  });
  if (insErr) throw new Error(insErr.message);

  if (!nodeId) return;

  const { data: existing } = await supabase
    .from('skill_node_progress')
    .select('xp, status')
    .eq('user_id', userId)
    .eq('skill_subject', norm)
    .eq('benchmark_id', nodeId)
    .maybeSingle();

  const addXp  = Math.max(0, Math.round(durationMin * 10));
  const nextXp = (existing?.xp ?? 0) + addXp;
  const curSt  = existing?.status as string | undefined;

  const { error: upErr } = await supabase.from('skill_node_progress').upsert({
    user_id:       userId,
    skill_subject: norm,
    benchmark_id:  nodeId,
    status:        (!curSt || curSt === 'locked') ? 'in-progress' : curSt,
    xp:            nextXp,
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'user_id,skill_subject,benchmark_id' });
  if (upErr) throw new Error(upErr.message);
}
