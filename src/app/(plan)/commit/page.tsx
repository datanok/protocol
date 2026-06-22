'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Plus, Minus } from 'lucide-react';
import { usePlan, useDashboardVM } from '@/contexts/PlanContext';
import AppTopNav from '@/components/navigation/AppTopNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  WorkoutModuleData,
  SkillModuleData,
  StudyModuleData,
  NutritionModuleData,
  ModuleNode,
} from '@/types/schema';

import { T } from '@/lib/tokens';
import { FolioInput, FolioTextarea } from '@/components/ui/FolioUI';

const TYPE_ACCENTS: Record<string, string> = T.moduleColors;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Shared primitives ────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone }}>
      {children}
    </div>
  );
}

const RATING_OPTIONS = [
  { value: 1, label: 'Low'  },
  { value: 3, label: 'OK'   },
  { value: 5, label: 'High' },
] as const;

function RatingInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const selected = value <= 1 ? 1 : value <= 3 ? 3 : 5;
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {RATING_OPTIONS.map(opt => {
          const on = selected === opt.value;
          return (
            <button
              key={opt.value} type="button" onClick={() => onChange(opt.value)}
              aria-pressed={on}
              className="ci-toggle-btn"
              style={{
                padding: '6px 16px',
                border: `1px solid ${on ? T.ink : T.rule}`,
                background: on ? T.ink : 'transparent',
                color: on ? T.surface : T.stone,
                cursor: 'pointer', fontFamily: T.mono, fontSize: 11,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SectionShell ─────────────────────────────────────────────────────────────
// Header: "01  TYPE · TITLE". Border turns green when done.
function SectionShell({
  index, type, title, subtitle, done, children,
}: {
  index:     number;
  type:      string;
  title:     string;
  subtitle?: string;
  done?:     boolean;
  children:  React.ReactNode;
}) {
  const accentColor = done ? T.positive : (TYPE_ACCENTS[type] ?? T.stone);
  const edgeColor   = done ? T.positive : T.rule;
  return (
    <div style={{ border: `1px solid ${edgeColor}`, transition: 'border-color 0.2s ease-out', marginBottom: 16 }}>

      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${edgeColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: accentColor, flexShrink: 0, letterSpacing: '0.06em' }}>
            {String(index).padStart(2, '0')}
          </span>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: accentColor }}>
              {type}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}>{' · '}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.ink }}>
              {title}
            </span>
          </div>
          {done && (
            <div style={{ width: 16, height: 16, border: `1px solid ${T.positive}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check style={{ width: 10, height: 10, color: T.positive }} />
            </div>
          )}
        </div>
        {subtitle && (
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, marginTop: 4, paddingLeft: 30, letterSpacing: '0.04em' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

// ─── Module log state types ───────────────────────────────────────────────────
type SetLog       = { weight: string; reps: string };
type ExerciseLogs = Record<string, SetLog[]>;
type WorkoutLog   = { exerciseLogs: ExerciseLogs; notes: string };
type PracticeLog  = { nodeId: string; durationMin: number; rating: number; notes: string; skip: boolean };
type NutritionLog = { context: 'wfo' | 'wfh'; adherence: 'hit' | 'partial' | 'missed' | null; notes: string; skip: boolean };

const DAY_FULL  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

// ─── Workout section ──────────────────────────────────────────────────────────
function WorkoutSection({ data, dayName, todayName, log, onChange, onDayChange }: {
  data:        WorkoutModuleData;
  dayName:     string; // currently selected day
  todayName:   string; // actual calendar day
  log:         WorkoutLog;
  onChange:    (l: WorkoutLog) => void;
  onDayChange: (day: string) => void;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const exercises = data.split[dayName] ?? [];

  function addSet(ex: string) {
    onChange({ ...log, exerciseLogs: { ...log.exerciseLogs, [ex]: [...(log.exerciseLogs[ex] ?? []), { weight: '', reps: '' }] } });
  }
  function removeSet(ex: string, idx: number) {
    const sets = (log.exerciseLogs[ex] ?? []).filter((_, i) => i !== idx);
    onChange({ ...log, exerciseLogs: { ...log.exerciseLogs, [ex]: sets.length ? sets : [{ weight: '', reps: '' }] } });
  }
  function updateSet(ex: string, idx: number, field: 'weight' | 'reps', value: string) {
    const sets = (log.exerciseLogs[ex] ?? []).map((s, i) => i === idx ? { ...s, [field]: value } : s);
    onChange({ ...log, exerciseLogs: { ...log.exerciseLogs, [ex]: sets } });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Day picker — lets user log any day's split */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 6 }}>
          Logging exercises from
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${T.rule}` }}>
          {DAY_FULL.map((day, i) => {
            const hasWork  = (data.split[day] ?? []).length > 0;
            const isActive = day === dayName;
            const isToday  = day === todayName;
            return (
              <button
                key={day} type="button"
                onClick={() => onDayChange(day)}
                className={isActive ? 'ci-day-btn ci-day-active' : 'ci-day-btn'}
                style={{
                  padding: '7px 0',
                  background: isActive ? T.ink : 'transparent',
                  border: 'none',
                  borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
                  borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <span style={{
                  fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em',
                  color: isActive ? T.surface : isToday ? T.accent : T.stone,
                }}>
                  {DAY_SHORT[i]}
                </span>
                <span style={{
                  width: 3, height: 3,
                  background: hasWork ? (isActive ? T.accent : T.stone) : 'transparent',
                }} />
              </button>
            );
          })}
        </div>
        {dayName !== todayName && (
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, letterSpacing: '0.08em', marginTop: 5 }}>
            ← logging {dayName}&apos;s exercises · logged as today
          </div>
        )}
      </div>

      {exercises.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, background: T.stone }} />
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            No exercises scheduled for {dayName}
          </span>
        </div>
      )}
      {exercises.map((ex, exIdx) => (
        <div key={ex} style={{ borderBottom: `1px solid ${T.rule}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, width: 22, flexShrink: 0 }}>
              {String(exIdx + 1).padStart(2, '0')}
            </span>
            <span style={{ flex: 1, fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {ex}
            </span>
            <button type="button" onClick={() => addSet(ex)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <Plus style={{ width: 10, height: 10 }} /> Set
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr 22px', gap: 8, paddingBottom: 6, marginLeft: 32 }}>
            {['Set', 'kg', 'Reps', ''].map(h => (
              <span key={h} style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone, textAlign: 'center' }}>{h}</span>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 32 }}>
            {(log.exerciseLogs[ex] ?? []).map((set, setIdx) => (
              <div key={setIdx} style={{ display: 'grid', gridTemplateColumns: '26px 1fr 1fr 22px', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent, textAlign: 'center', fontWeight: 600 }}>{setIdx + 1}</span>
                <FolioInput type="number" min="0" step="0.5" value={set.weight} placeholder="—"
                  onChange={e => updateSet(ex, setIdx, 'weight', e.target.value)} />
                <FolioInput type="number" min="0" value={set.reps} placeholder="—"
                  onChange={e => updateSet(ex, setIdx, 'reps', e.target.value)} />
                <button type="button" onClick={() => removeSet(ex, setIdx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.stone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Workout notes — collapsed by default */}
      {exercises.length > 0 && showNotes ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Label>Session Notes</Label>
            <button type="button" onClick={() => setShowNotes(false)}
              className="ci-text-btn"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em' }}>
              hide ×
            </button>
          </div>
          <FolioTextarea
            value={log.notes} rows={2} placeholder="PR, form cues, fatigue level…"
            onChange={e => onChange({ ...log, notes: e.target.value })}
          />
        </div>
      ) : (
        exercises.length > 0 ? (
          <button type="button" onClick={() => setShowNotes(true)}
            className="ci-text-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em', textAlign: 'left', padding: 0 }}>
            + Add session note
          </button>
        ) : null
      )}
    </div>
  );
}

// ─── Practice section (skill + study) ────────────────────────────────────────
function PracticeSection({ subject, nodes, log, onChange, ratingLabel }: {
  subject:     string;
  nodes:       ModuleNode[];
  log:         PracticeLog;
  onChange:    (l: PracticeLog) => void;
  ratingLabel: string;
}) {
  const [showNotes, setShowNotes] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Skip — secondary action, top right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => onChange({ ...log, skip: !log.skip })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: T.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: log.skip ? T.accent : T.stone,
          }}
        >
          {log.skip ? '← Log session' : 'Skip today →'}
        </button>
      </div>

      {/* Form content — dimmed when skipping */}
      <div style={{ opacity: log.skip ? 0.3 : 1, pointerEvents: log.skip ? 'none' : 'auto', transition: 'opacity 0.15s', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Topic / Node</Label>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, marginBottom: 6, letterSpacing: '0.06em' }}>
              which part of your path
            </div>
            <select
              value={log.nodeId}
              onChange={e => onChange({ ...log, nodeId: e.target.value })}
              onFocus={e => { (e.target as HTMLSelectElement).style.borderColor = T.accent; }}
              onBlur={e  => { (e.target as HTMLSelectElement).style.borderColor = T.rule;   }}
              style={{
                marginTop: 0, width: '100%', background: T.tint, border: `1px solid ${T.rule}`,
                outline: 'none', padding: '7px 10px', fontFamily: T.mono, fontSize: 11,
                color: T.ink, boxSizing: 'border-box', appearance: 'none',
              }}
            >
              <option value="">— select node —</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Duration (min)</Label>
            <FolioInput
              type="number" min="1" max="480" value={log.durationMin}
              style={{ marginTop: 8, textAlign: 'left' }}
              onChange={e => onChange({ ...log, durationMin: Math.max(1, Number(e.target.value)) })}
            />
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, marginTop: 4 }}>
              ≈ {Math.round(log.durationMin * 10)} XP
            </div>
          </div>
        </div>

        <RatingInput value={log.rating} onChange={v => onChange({ ...log, rating: v })} label={ratingLabel} />

        {/* Notes — collapsed by default */}
        {showNotes ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Label>Session Notes</Label>
              <button type="button" onClick={() => setShowNotes(false)}
                className="ci-text-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em' }}>
                hide ×
              </button>
            </div>
            <FolioTextarea
              value={log.notes} rows={2}
              placeholder="Breakthroughs, difficulties, next steps…"
              onChange={e => onChange({ ...log, notes: e.target.value })}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setShowNotes(true)}
            className="ci-text-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em', textAlign: 'left', padding: 0 }}>
            + Add note
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Nutrition section ────────────────────────────────────────────────────────
function NutritionSection({ data, log, onChange }: {
  data: NutritionModuleData; log: NutritionLog; onChange: (l: NutritionLog) => void;
}) {
  const target = log.context === 'wfo' ? data.wfo : data.wfh;
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Skip — secondary action, top right */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => onChange({ ...log, skip: !log.skip })}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: T.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: log.skip ? T.accent : T.stone,
          }}
        >
          {log.skip ? '← Log nutrition' : 'Skip today →'}
        </button>
      </div>

      <div style={{ opacity: log.skip ? 0.3 : 1, pointerEvents: log.skip ? 'none' : 'auto', transition: 'opacity 0.15s', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Context + Adherence on one row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Label>Context</Label>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {(['wfh', 'wfo'] as const).map(ctx => (
                <button key={ctx} type="button" onClick={() => onChange({ ...log, context: ctx })}
                  aria-pressed={log.context === ctx}
                  className="ci-toggle-btn"
                  style={{
                    padding: '6px 12px', cursor: 'pointer',
                    border: `1px solid ${log.context === ctx ? T.ink : T.rule}`,
                    background: log.context === ctx ? T.ink : 'transparent',
                    color: log.context === ctx ? T.surface : T.stone,
                    fontFamily: T.mono, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                  {ctx === 'wfh' ? 'Home' : 'Office'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Did you hit it?</Label>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {([
                { key: 'hit',     label: 'Hit',     color: T.positive },
                { key: 'partial', label: 'Partial',  color: T.stone   },
                { key: 'missed',  label: 'Missed',   color: T.negative },
              ] as const).map(opt => (
                <button key={opt.key} type="button"
                  onClick={() => onChange({ ...log, adherence: opt.key })}
                  aria-pressed={log.adherence === opt.key}
                  className="ci-toggle-btn"
                  style={{
                    padding: '6px 10px', cursor: 'pointer',
                    border: `1px solid ${log.adherence === opt.key ? opt.color : T.rule}`,
                    background: log.adherence === opt.key ? opt.color : 'transparent',
                    color: log.adherence === opt.key ? T.surface : T.stone,
                    fontFamily: T.mono, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Target */}
        {target && (
          <div style={{ padding: '8px 12px', background: T.tint, border: `1px solid ${T.rule}` }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, marginBottom: 4 }}>TARGET</div>
            <div style={{ fontFamily: T.serifD, fontSize: 13, color: T.ink, lineHeight: 1.5, fontStyle: 'italic' }}>
              {target}
            </div>
          </div>
        )}

        {/* Notes — collapsed by default */}
        {showNotes ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Label>Notes</Label>
              <button type="button" onClick={() => setShowNotes(false)}
                className="ci-text-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em' }}>
                hide ×
              </button>
            </div>
            <FolioTextarea value={log.notes} rows={2} placeholder="Deviations, context, meal notes…"
              onChange={e => onChange({ ...log, notes: e.target.value })}
            />
          </div>
        ) : (
          <button type="button" onClick={() => setShowNotes(true)}
            className="ci-text-btn"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em', textAlign: 'left', padding: 0 }}>
            + Add note
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Habits section ───────────────────────────────────────────────────────────
function HabitsSection({ habits, checked, onChange }: {
  habits:   { id: string; name: string; category: string }[];
  checked:  Record<string, boolean>;
  onChange: (id: string, val: boolean) => void;
}) {
  if (habits.length === 0) {
    return (
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, padding: '8px 0' }}>
        No habits configured in your plan.
      </div>
    );
  }

  const done  = habits.filter(h => checked[h.id]).length;
  const total = habits.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: done === total ? T.positive : T.stone }}>
          {done}/{total} completed
        </span>
        <div style={{ flex: 1, height: 2, background: T.rule, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: -1,
            width: '100%', height: 4,
            background: done === total ? T.positive : T.ink,
            transform: `scaleX(${total > 0 ? (done / total).toFixed(3) : 0})`,
            transformOrigin: 'left center',
            transition: 'transform 0.25s ease-out',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {habits.map((h, i) => (
          <button
            key={h.id} type="button"
            onClick={() => onChange(h.id, !checked[h.id])}
            aria-pressed={checked[h.id]}
            className="ci-habit-btn"
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 0',
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              borderBottom: i < habits.length - 1 ? `1px solid ${T.rule}` : 'none',
              background: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 18, height: 18,
              border: `1px solid ${checked[h.id] ? T.positive : T.rule}`,
              background: checked[h.id] ? T.positive : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {checked[h.id] && <Check style={{ width: 10, height: 10, color: T.surface }} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: T.serifT, fontSize: 15, fontStyle: 'italic',
                color: checked[h.id] ? T.stone : T.ink,
                textDecoration: checked[h.id] ? 'line-through' : 'none',
                textDecorationColor: T.stone,
              }}>
                {h.name}
              </div>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone, flexShrink: 0 }}>
              {h.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────
function CommitPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const plan  = usePlan();
  const { today } = useDashboardVM();
  const qc    = useQueryClient();
  const { data: stats } = useDashboardStats(user?.id);

  const todayStr         = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const alreadyCommitted = stats?.commits.todayCommitted ?? false;

  // ── Workout ────────────────────────────────────────────────────────────────
  const workoutMod  = plan.modules.find(m => m.type === 'workout');
  const workoutData = workoutMod?.data as WorkoutModuleData | undefined;

  const [workoutDayName, setWorkoutDayName] = useState(today.dayName);
  const selectedExercises = workoutData?.split?.[workoutDayName] ?? [];
  // keep todayExercises alias so save logic below still reads correctly
  const todayExercises = selectedExercises;

  const initialWorkoutLogs = useMemo<ExerciseLogs>(
    () => Object.fromEntries(selectedExercises.map(ex => [ex, [{ weight: '', reps: '' }]])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [workoutLog, setWorkoutLog] = useState<WorkoutLog>({ exerciseLogs: initialWorkoutLogs, notes: '' });

  function handleWorkoutDayChange(day: string) {
    setWorkoutDayName(day);
    const exs = workoutData?.split?.[day] ?? [];
    setWorkoutLog({
      exerciseLogs: Object.fromEntries(exs.map(ex => [ex, [{ weight: '', reps: '' }]])),
      notes: '',
    });
  }

  // ── Skill ──────────────────────────────────────────────────────────────────
  const skillMod  = plan.modules.find(m => m.type === 'skill');
  const skillData = skillMod?.data as SkillModuleData | undefined;
  const [skillLog, setSkillLog] = useState<PracticeLog>({
    nodeId: skillData?.nodes?.[0]?.id ?? '', durationMin: 30, rating: 3, notes: '', skip: false,
  });

  // ── Study ──────────────────────────────────────────────────────────────────
  const studyMod  = plan.modules.find(m => m.type === 'study');
  const studyData = studyMod?.data as StudyModuleData | undefined;
  const [studyLog, setStudyLog] = useState<PracticeLog>({
    nodeId: studyData?.nodes?.[0]?.id ?? '', durationMin: studyData?.dailyGoalMin ?? 30, rating: 3, notes: '', skip: false,
  });

  // ── Nutrition ──────────────────────────────────────────────────────────────
  const nutritionMod  = plan.modules.find(m => m.type === 'nutrition');
  const nutritionData = nutritionMod?.data as NutritionModuleData | undefined;
  const [nutritionLog, setNutritionLog] = useState<NutritionLog>({
    context: 'wfh', adherence: null, notes: '', skip: false,
  });

  // ── Habits ─────────────────────────────────────────────────────────────────
  const [habitChecked, setHabitChecked] = useState<Record<string, boolean>>(
    () => Object.fromEntries((stats?.commits.completedHabitIds ?? []).map(id => [id, true]))
  );

  // ── Session persistence ────────────────────────────────────────────────────
  const storageKey = user?.id ? `commit-${user.id}-${toYmd(new Date())}` : null;
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!storageKey || restored) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (!saved) return;
      const s = JSON.parse(saved) as Partial<{
        workoutDayName: string;
        workoutLog: WorkoutLog;
        skillLog: PracticeLog;
        studyLog: PracticeLog;
        nutritionLog: NutritionLog;
        habitChecked: Record<string, boolean>;
      }>;
      if (s.workoutDayName) setWorkoutDayName(s.workoutDayName);
      if (s.workoutLog)     setWorkoutLog(s.workoutLog);
      if (s.skillLog)       setSkillLog(s.skillLog);
      if (s.studyLog)       setStudyLog(s.studyLog);
      if (s.nutritionLog)   setNutritionLog(s.nutritionLog);
      if (s.habitChecked)   setHabitChecked(s.habitChecked);
      setRestored(true);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    sessionStorage.setItem(storageKey, JSON.stringify({ workoutDayName, workoutLog, skillLog, studyLog, nutritionLog, habitChecked }));
  }, [storageKey, workoutDayName, workoutLog, skillLog, studyLog, nutritionLog, habitChecked]);

  function handleStartFresh() {
    if (storageKey) sessionStorage.removeItem(storageKey);
    window.location.reload();
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.push('/dashboard'), 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  // Summary shown in the success overlay
  type CommitSummary = {
    habits:    { done: number; total: number };
    skill?:    { durationMin: number; subject: string };
    study?:    { durationMin: number; subject: string };
    workout?:  { dayName: string; exerciseCount: number };
    nutrition?: { adherence: string; context: string };
  };
  const [summary, setSummary] = useState<CommitSummary | null>(null);

  const handleCommit = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      const todayYmd = toYmd(new Date());
      const errors: string[] = [];

      // 1. Skill session
      if (skillMod && skillData && !skillLog.skip) {
        const subject = skillData.subject.trim().toLowerCase();
        const { error: insErr } = await supabase.from('skill_sessions').insert({
          user_id: user.id, skill_subject: subject,
          duration_min: skillLog.durationMin, notes: skillLog.notes.trim() || null,
          benchmark_id: skillLog.nodeId || null,
        });
        if (insErr) errors.push(`Skill: ${insErr.message}`);
        else if (skillLog.nodeId) {
          const { data: existing } = await supabase
            .from('skill_node_progress').select('xp, status')
            .eq('user_id', user.id).eq('skill_subject', subject).eq('benchmark_id', skillLog.nodeId)
            .maybeSingle();
          const nextXp = (existing?.xp ?? 0) + Math.max(0, Math.round(skillLog.durationMin * 10));
          const curSt  = existing?.status as string | undefined;
          await supabase.from('skill_node_progress').upsert({
            user_id: user.id, skill_subject: subject, benchmark_id: skillLog.nodeId,
            status: (!curSt || curSt === 'locked') ? 'in-progress' : curSt,
            xp: nextXp, updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,skill_subject,benchmark_id' });
        }
      }

      // 2. Study session
      if (studyMod && studyData && !studyLog.skip) {
        const subject = studyData.subject.trim().toLowerCase();
        const { error: insErr } = await supabase.from('skill_sessions').insert({
          user_id: user.id, skill_subject: subject,
          duration_min: studyLog.durationMin, notes: studyLog.notes.trim() || null,
          benchmark_id: studyLog.nodeId || null,
        });
        if (insErr) errors.push(`Study: ${insErr.message}`);
        else if (studyLog.nodeId) {
          const { data: existing } = await supabase
            .from('skill_node_progress').select('xp, status')
            .eq('user_id', user.id).eq('skill_subject', subject).eq('benchmark_id', studyLog.nodeId)
            .maybeSingle();
          const nextXp = (existing?.xp ?? 0) + Math.max(0, Math.round(studyLog.durationMin * 10));
          const curSt  = existing?.status as string | undefined;
          await supabase.from('skill_node_progress').upsert({
            user_id: user.id, skill_subject: subject, benchmark_id: studyLog.nodeId,
            status: (!curSt || curSt === 'locked') ? 'in-progress' : curSt,
            xp: nextXp, updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,skill_subject,benchmark_id' });
        }
      }

      // 3. Workout sets
      if (workoutMod && workoutData && todayExercises.length > 0) {
        const setsToInsert = [];
        for (const [exercise, sets] of Object.entries(workoutLog.exerciseLogs)) {
          for (let si = 0; si < sets.length; si++) {
            const s = sets[si];
            if (s.weight || s.reps) {
              setsToInsert.push({
                user_id: user.id, logged_date: todayYmd, exercise, set_number: si + 1,
                weight_kg: s.weight ? parseFloat(s.weight) : null,
                reps:      s.reps   ? parseInt(s.reps, 10) : null,
                notes:     workoutLog.notes.trim() || null,
              });
            }
          }
        }
        if (setsToInsert.length > 0) {
          await supabase.from('workout_logs').delete().eq('user_id', user.id).eq('logged_date', todayYmd);
          const { error: workoutErr } = await supabase.from('workout_logs').insert(setsToInsert);
          if (workoutErr && !workoutErr.message.includes('relation') && !workoutErr.message.includes('does not exist')) {
            errors.push(`Workout: ${workoutErr.message}`);
          }
        }
      }

      // 4. Daily commit
      const completedHabitIds = Object.entries(habitChecked).filter(([, done]) => done).map(([id]) => id);
      const { error: commitErr } = await supabase.from('daily_commits').upsert({
        user_id: user.id, date: todayYmd, completed_habits: completedHabitIds,
      }, { onConflict: 'user_id,date' });
      if (commitErr) errors.push(`Commit: ${commitErr.message}`);

      if (errors.length > 0) { setError(errors.join(' · ')); setSaving(false); return; }

      qc.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
      qc.invalidateQueries({ queryKey: ['skill-progress'] });
      qc.invalidateQueries({ queryKey: ['workout-history', user.id] });

      const completedHabitCount = Object.values(habitChecked).filter(Boolean).length;
      setSummary({
        habits: { done: completedHabitCount, total: plan.habits.length },
        skill: (skillMod && skillData && !skillLog.skip)
          ? { durationMin: skillLog.durationMin, subject: skillData.subject }
          : undefined,
        study: (studyMod && studyData && !studyLog.skip)
          ? { durationMin: studyLog.durationMin, subject: studyData.subject }
          : undefined,
        workout: (workoutMod && workoutData && todayExercises.length > 0)
          ? { dayName: today.dayName, exerciseCount: todayExercises.length }
          : undefined,
        nutrition: (nutritionMod && nutritionData && !nutritionLog.skip && nutritionLog.adherence)
          ? { adherence: nutritionLog.adherence, context: nutritionLog.context }
          : undefined,
      });
      if (storageKey) sessionStorage.removeItem(storageKey);
      setSuccess(true);

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
      setSaving(false);
    }
  };

  const sortedModules = [...plan.modules].sort((a, b) => a.order - b.order);
  let sectionIdx = 0;

  // Derived done states for sections
  const workoutDone    = todayExercises.length === 0 ||
    Object.values(workoutLog.exerciseLogs).reduce((a, s) => a + s.filter(x => x.weight || x.reps).length, 0) > 0;
  const habitsDoneCount = Object.values(habitChecked).filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink }}>
      <style>{`
        .ci-toggle-btn { transition: background 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out; }
        .ci-toggle-btn:not(:disabled):hover { border-color: var(--folio-stone); }
        .ci-day-btn { transition: background 0.12s ease-out; }
        .ci-day-btn:not(.ci-day-active):hover { background: var(--folio-tint); }
        .ci-text-btn { transition: color 0.12s ease-out; }
        .ci-text-btn:hover { color: var(--folio-ink) !important; }
        .ci-habit-btn { transition: background 0.15s ease-out; }
        .ci-habit-btn:hover { background: var(--folio-tint); }
        .ci-main-btn:not(:disabled):hover { opacity: 0.82; }
        .ci-dashboard-btn { transition: background 0.15s ease-out; }
        .ci-dashboard-btn:hover { background: var(--folio-tint); }
        @media (prefers-reduced-motion: reduce) {
          .ci-toggle-btn, .ci-day-btn, .ci-text-btn, .ci-habit-btn, .ci-main-btn, .ci-dashboard-btn { transition: none !important; }
        }
      `}</style>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main style={{ paddingTop: 56, maxWidth: 720, margin: '0 auto', padding: '56px 32px 120px' }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 32, paddingBottom: 20, borderBottom: `1px solid ${T.ink}`, marginBottom: 28 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 6 }}>
            Daily Commit
          </div>
          <h1 style={{ fontFamily: T.serifD, fontSize: 36, color: T.ink, margin: 0, lineHeight: 1.05 }}>
            {todayStr}
          </h1>
          {alreadyCommitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <div style={{ width: 6, height: 6, background: T.positive }} />
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.positive, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Already committed today — re-logging will update
              </span>
            </div>
          )}
          {restored && !alreadyCommitted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Resuming earlier session
              </span>
              <button type="button" onClick={handleStartFresh}
                className="ci-text-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em', textDecoration: 'underline', textUnderlineOffset: 2, padding: 0 }}>
                Start fresh ×
              </button>
            </div>
          )}
        </div>

        {/* ── Error banner ───────────────────────────────────────────────── */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', border: `1px solid ${T.negative}`, background: T.tint, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.negative }}>{error}</span>
            <button
              type="button"
              onClick={handleCommit}
              disabled={saving}
              style={{ background: 'none', border: `1px solid ${T.negative}`, padding: '4px 12px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: T.mono, fontSize: 10, color: T.negative, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Module sections ────────────────────────────────────────────── */}
        {sortedModules.map(mod => {
          sectionIdx++;
          const idx = sectionIdx;

          if (mod.type === 'workout' && workoutData) {
            const isRest = todayExercises.length === 0;
            return (
              <SectionShell key={mod.id} index={idx} type="workout" title={mod.title}
                subtitle={isRest ? `No exercises for ${workoutDayName}` : `${workoutData.focus} · ${workoutDayName}`}
                done={workoutDone}>
                <WorkoutSection
                  data={workoutData}
                  dayName={workoutDayName}
                  todayName={today.dayName}
                  log={workoutLog}
                  onChange={setWorkoutLog}
                  onDayChange={handleWorkoutDayChange}
                />
              </SectionShell>
            );
          }

          if (mod.type === 'skill' && skillData) {
            return (
              <SectionShell key={mod.id} index={idx} type="skill" title={mod.title}
                subtitle={skillData.subject}
                done={!skillLog.skip && skillLog.durationMin > 0}>
                <PracticeSection
                  subject={skillData.subject} nodes={skillData.nodes as ModuleNode[]}
                  log={skillLog} onChange={setSkillLog}
                  ratingLabel="Session quality (1 = poor · 5 = excellent)"
                />
              </SectionShell>
            );
          }

          if (mod.type === 'study' && studyData) {
            return (
              <SectionShell key={mod.id} index={idx} type="study" title={mod.title}
                subtitle={`${studyData.subject} · goal ${studyData.dailyGoalMin}min`}
                done={!studyLog.skip && studyLog.durationMin > 0}>
                <PracticeSection
                  subject={studyData.subject} nodes={studyData.nodes as ModuleNode[]}
                  log={studyLog} onChange={setStudyLog}
                  ratingLabel="Confidence after session (1 = confused · 5 = solid)"
                />
              </SectionShell>
            );
          }

          if (mod.type === 'nutrition' && nutritionData) {
            return (
              <SectionShell key={mod.id} index={idx} type="nutrition" title={mod.title}
                done={!nutritionLog.skip && nutritionLog.adherence !== null}>
                <NutritionSection data={nutritionData} log={nutritionLog} onChange={setNutritionLog} />
              </SectionShell>
            );
          }

          return null;
        })}

        {/* ── Habits section ─────────────────────────────────────────────── */}
        {plan.habits.length > 0 && (
          <SectionShell
            index={sectionIdx + 1} type="habits" title="Daily Habits"
            subtitle={`${plan.habits.length} habits in plan`}
            done={habitsDoneCount > 0}
          >
            <HabitsSection
              habits={plan.habits}
              checked={habitChecked}
              onChange={(id, val) => setHabitChecked(p => ({ ...p, [id]: val }))}
            />
          </SectionShell>
        )}
      </main>

      {/* ── Sticky commit bar ──────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        borderTop: `1px solid ${T.rule}`, background: T.surface,
        padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <button
          type="button" onClick={() => router.push('/dashboard')}
          className="ci-text-btn"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <X style={{ width: 14, height: 14 }} /> Cancel
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.06em' }}>
            {habitsDoneCount}/{plan.habits.length} habits
            {skillMod && !skillLog.skip  ? ` · ${skillLog.durationMin}min skill`  : ''}
            {studyMod && !studyLog.skip  ? ` · ${studyLog.durationMin}min study`  : ''}
          </div>
          <button
            type="button" onClick={handleCommit} disabled={saving || success}
            className="ci-main-btn"
            style={{
              padding: '12px 32px',
              background: saving || success ? T.tint : T.ink,
              color:      saving || success ? T.stone : T.surface,
              border: 'none', cursor: saving || success ? 'not-allowed' : 'pointer',
              fontFamily: T.mono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
              transition: 'background 0.15s ease-out, opacity 0.15s ease-out',
            }}
          >
            {saving ? 'Saving…' : alreadyCommitted ? 'Update Commit' : 'Commit Day'}
          </button>
        </div>
      </div>

      {/* ── Success overlay ────────────────────────────────────────────────── */}
      {success && summary && (
        <div style={{
          position: 'fixed', inset: 0, background: T.surface, zIndex: 100,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px',
        }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, border: `1px solid ${T.positive}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check style={{ width: 20, height: 20, color: T.positive }} />
              </div>
              <div>
                <div style={{ fontFamily: T.serifD, fontSize: 28, color: T.ink, lineHeight: 1.1 }}>Day committed.</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginTop: 4 }}>
                  {todayStr}
                </div>
              </div>
            </div>

            {/* Summary items */}
            <div style={{ borderTop: `1px solid ${T.rule}` }}>
              {summary.workout && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Training</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink }}>{summary.workout.exerciseCount} exercise{summary.workout.exerciseCount !== 1 ? 's' : ''} · {summary.workout.dayName}</span>
                </div>
              )}
              {summary.skill && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Skill</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink }}>{summary.skill.durationMin}min · {summary.skill.subject}</span>
                </div>
              )}
              {summary.study && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Study</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.ink }}>{summary.study.durationMin}min · {summary.study.subject}</span>
                </div>
              )}
              {summary.nutrition && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nutrition</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: summary.nutrition.adherence === 'hit' ? T.positive : summary.nutrition.adherence === 'missed' ? T.negative : T.ink, textTransform: 'uppercase' }}>
                    {summary.nutrition.adherence} · {summary.nutrition.context === 'wfh' ? 'Home' : 'Office'}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.rule}` }}>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Habits</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: summary.habits.done === summary.habits.total && summary.habits.total > 0 ? T.positive : T.ink }}>
                  {summary.habits.done} / {summary.habits.total}
                </span>
              </div>
            </div>

            <button type="button" onClick={() => router.push('/dashboard')}
              className="ci-dashboard-btn"
              style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', border: `1px solid ${T.ink}`, background: 'transparent', cursor: 'pointer', fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink }}>
              Go to dashboard →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommitPage() {
  return <CommitPageContent />;
}
