'use client';

import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import type { SkillBenchmark } from '@/types/schema';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  subject: string;
  benchmarks: SkillBenchmark[];
  defaultBenchmarkId?: string | null;
  onSaved?: () => void;
};

function normalizeSubject(subject: string) {
  return subject.trim().toLowerCase();
}

export default function LogSkillSessionModal({
  open,
  onClose,
  userId,
  subject,
  benchmarks,
  defaultBenchmarkId,
  onSaved,
}: Props) {
  const normalizedSubject = useMemo(() => normalizeSubject(subject), [subject]);
  const [durationMin, setDurationMin] = useState<number>(30);
  const [notes, setNotes] = useState<string>('');
  const [benchmarkId, setBenchmarkId] = useState<string>(defaultBenchmarkId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const selectedBenchmarkId = benchmarkId || null;

      const { error: insertErr } = await supabase.from('skill_sessions').insert({
        user_id: userId,
        skill_subject: normalizedSubject,
        duration_min: durationMin,
        notes: notes.trim() || null,
        benchmark_id: selectedBenchmarkId,
      });
      if (insertErr) throw insertErr;

      // Minimal dynamic progress: every logged session adds XP to the selected node
      // (or the first benchmark if none selected).
      const targetBenchmarkId =
        selectedBenchmarkId || (benchmarks[0]?.id ?? null);

      if (targetBenchmarkId) {
        // Fetch existing row (cheap and simple; avoids RPC requirement).
        const { data: existing, error: fetchErr } = await supabase
          .from('skill_node_progress')
          .select('xp, status')
          .eq('user_id', userId)
          .eq('skill_subject', normalizedSubject)
          .eq('benchmark_id', targetBenchmarkId)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        const addXp = Math.max(0, Math.round(durationMin * 10)); // keep consistent with hook
        const nextXp = (existing?.xp ?? 0) + addXp;
        const nextStatus = (existing?.status as string | undefined) ?? 'in-progress';

        const { error: upsertErr } = await supabase
          .from('skill_node_progress')
          .upsert(
            {
              user_id: userId,
              skill_subject: normalizedSubject,
              benchmark_id: targetBenchmarkId,
              status: nextStatus === 'locked' ? 'in-progress' : nextStatus,
              xp: nextXp,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,skill_subject,benchmark_id' }
          );

        if (upsertErr) throw upsertErr;
      }

      onSaved?.();
      onClose();
      setNotes('');
    } catch (e: any) {
      setError(e?.message || 'Failed to save session.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-l1 border border-surface-l3 shadow-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-l3">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-text-secondary">Log session</div>
            <div className="mt-1 font-sans font-bold uppercase tracking-tight text-gold">{subject}</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-error/10 border-l-4 border-error text-error font-mono text-[11px] p-3">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Duration (min)</div>
              <input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full bg-background border border-surface-l3 px-3 py-2 font-mono text-sm outline-none focus:border-gold"
              />
            </label>

            <label className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Link node</div>
              <select
                value={benchmarkId}
                onChange={(e) => setBenchmarkId(e.target.value)}
                className="w-full bg-background border border-surface-l3 px-3 py-2 font-mono text-sm outline-none focus:border-gold"
              >
                <option value="">(auto)</option>
                {benchmarks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 block">
            <div className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[110px] bg-background border border-surface-l3 px-3 py-2 font-mono text-sm outline-none focus:border-gold resize-none"
              placeholder="What did you practice?"
            />
          </label>
        </div>

        <div className="px-6 py-4 border-t border-surface-l3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-surface-l3 text-text-secondary hover:text-text-primary hover:border-gold/40 transition-colors font-mono text-xs uppercase tracking-widest"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={save}
            className={cn(
              'px-4 py-2 bg-gold text-black font-mono text-xs uppercase tracking-widest',
              isSaving && 'opacity-60 cursor-not-allowed'
            )}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving
              </span>
            ) : (
              'Log session'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

