'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardVM } from '@/contexts/PlanContext';
import { getFirstModule } from '@/lib/viewModels';
import type { WorkoutModuleData } from '@/types/schema';
import { Check, X, Plus, Minus } from 'lucide-react';

import { T } from '@/lib/tokens';

export default function WorkoutCommitFlow() {
  return <WorkoutCommitFlowContent />;
}

type SetLog = { weight: string; reps: string };
type ExerciseLogs = Record<string, SetLog[]>;

function WorkoutCommitFlowContent() {
  const router = useRouter();
  const { today, modules } = useDashboardVM();
  const [isCommitting, setIsCommitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notes, setNotes] = useState('');

  const workoutMod  = getFirstModule(modules, 'workout');
  const workoutData = workoutMod?.data as WorkoutModuleData | undefined;
  const exercises   = workoutData?.split[today.dayName] ?? [];
  const focus       = workoutData?.focus ?? 'Rest Day';
  const todayStr    = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  const initialLogs = useMemo<ExerciseLogs>(
    () => Object.fromEntries(exercises.map(ex => [ex, [{ weight: '', reps: '' }]])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [logs, setLogs] = useState<ExerciseLogs>(initialLogs);

  const totalSets  = Object.values(logs).reduce((a, s) => a + s.length, 0);
  const filledSets = Object.values(logs).reduce((a, s) => a + s.filter(x => x.weight || x.reps).length, 0);
  const pct        = totalSets > 0 ? Math.round((filledSets / totalSets) * 100) : 0;

  function addSet(ex: string) {
    setLogs(p => ({ ...p, [ex]: [...p[ex], { weight: '', reps: '' }] }));
  }
  function removeSet(ex: string, idx: number) {
    setLogs(p => {
      const updated = p[ex].filter((_, i) => i !== idx);
      return { ...p, [ex]: updated.length ? updated : [{ weight: '', reps: '' }] };
    });
  }
  function updateSet(ex: string, idx: number, field: 'weight' | 'reps', value: string) {
    setLogs(p => ({ ...p, [ex]: p[ex].map((s, i) => i === idx ? { ...s, [field]: value } : s) }));
  }

  const handleCommit = () => {
    setIsCommitting(true);
    setTimeout(() => {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    }, 800);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.surface, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px 80px', fontFamily: T.sans }}>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 560, border: `1px solid ${T.rule}`, background: T.surface, display: 'flex', flexDirection: 'column', maxHeight: '92vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${T.rule}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 3, alignSelf: 'stretch', background: T.accent, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 4 }}>
              Workout · {todayStr}
            </div>
            <h1 style={{ fontFamily: T.serifD, fontSize: 28, color: T.ink, margin: 0, lineHeight: 1.05 }}>{focus}</h1>
          </div>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.stone, padding: 4, marginTop: -2 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ padding: '10px 24px', borderBottom: `1px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 24, background: T.tint }}>
          {[['Exercises', exercises.length], ['Sets', totalSets], ['Logged', `${filledSets}/${totalSets}`]].map(([label, val]) => (
            <div key={label as string}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone, marginBottom: 2 }}>{label}</div>
              <div style={{ fontFamily: T.mono, fontSize: 14, color: T.ink }}>{val}</div>
            </div>
          ))}
          <div style={{ flex: 1, height: 2, background: T.rule, position: 'relative', marginLeft: 8 }}>
            <div style={{ position: 'absolute', left: 0, top: -1, width: `${pct}%`, height: 4, background: T.ink, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Exercise list */}
          <div style={{ padding: '20px 24px 0' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 16 }}>Performance Log</div>

            {exercises.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: T.mono, fontSize: 11, color: T.stone }}>
                No exercises scheduled for {today.dayName}.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {exercises.map((ex, exIdx) => (
                  <div key={ex} style={{ borderBottom: `1px solid ${T.rule}`, paddingBottom: 16, marginBottom: 16 }}>
                    {/* Exercise header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, width: 20, textAlign: 'right', flexShrink: 0 }}>
                        {String(exIdx + 1).padStart(2, '0')}
                      </span>
                      <span style={{ flex: 1, fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ex}</span>
                      <button type="button" onClick={() => addSet(ex)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        <Plus style={{ width: 11, height: 11 }} /> Set
                      </button>
                    </div>

                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 24px', gap: 8, padding: '0 0 6px', marginLeft: 30 }}>
                      {['SET', 'KG', 'REPS', ''].map(h => (
                        <span key={h} style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone, textAlign: 'center' }}>{h}</span>
                      ))}
                    </div>

                    {/* Set rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 30 }}>
                      {(logs[ex] ?? []).map((set, setIdx) => (
                        <div key={setIdx} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 1fr 24px', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, textAlign: 'center', fontWeight: 600 }}>{setIdx + 1}</span>
                          <input type="number" min="0" step="0.5" value={set.weight}
                            onChange={e => updateSet(ex, setIdx, 'weight', e.target.value)}
                            placeholder="—"
                            style={{ background: T.tint, border: `1px solid ${T.rule}`, outline: 'none', padding: '6px 4px', fontFamily: T.mono, fontSize: 12, color: T.ink, textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
                          <input type="number" min="0" value={set.reps}
                            onChange={e => updateSet(ex, setIdx, 'reps', e.target.value)}
                            placeholder="—"
                            style={{ background: T.tint, border: `1px solid ${T.rule}`, outline: 'none', padding: '6px 4px', fontFamily: T.mono, fontSize: 12, color: T.ink, textAlign: 'center', width: '100%', boxSizing: 'border-box' }} />
                          <button type="button" onClick={() => removeSet(ex, setIdx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.stone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Minus style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 8 }}>Session Notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{ width: '100%', background: T.tint, border: `1px solid ${T.rule}`, outline: 'none', padding: '10px 12px', fontFamily: T.mono, fontSize: 11, color: T.ink, resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
              onFocus={e => ((e.target as HTMLTextAreaElement).style.borderColor = T.accent)}
              onBlur={e => ((e.target as HTMLTextAreaElement).style.borderColor = T.rule)}
            />
          </div>
        </div>

        {/* Commit button */}
        <button
          onClick={handleCommit}
          disabled={isCommitting || success || exercises.length === 0}
          style={{
            width: '100%', padding: '16px 0', flexShrink: 0,
            background: isCommitting || success ? T.tint : T.ink,
            color: isCommitting || success ? T.stone : T.surface,
            border: 'none', cursor: (isCommitting || success || exercises.length === 0) ? 'not-allowed' : 'pointer',
            fontFamily: T.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
            borderTop: `1px solid ${T.rule}`,
            transition: 'background 0.15s',
          }}
        >
          {isCommitting ? 'Logging…' : 'Commit Workout'}
        </button>
      </div>

      {/* Success overlay */}
      {success && (
        <div style={{
          position: 'fixed', inset: 0, background: T.surface, zIndex: 50,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{ width: 64, height: 64, border: `1px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check style={{ width: 28, height: 28, color: T.positive }} />
          </div>
          <div style={{ fontFamily: T.serifD, fontSize: 28, color: T.ink }}>Workout committed.</div>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone }}>
            Returning to dashboard…
          </div>
        </div>
      )}
    </div>
  );
}
