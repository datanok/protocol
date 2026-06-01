'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { useDashboardVM, usePlan } from '@/contexts/PlanContext';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { upsertDailyCommit } from '@/actions/commitActions';
import AppTopNav from '@/components/navigation/AppTopNav';
import { supabase } from '@/lib/supabase';
import { T } from '@/lib/tokens';
import type { ModuleViewModel } from '@/lib/viewModels';
import type {
  WorkoutModuleData,
  SkillModuleData,
  StudyModuleData,
  NutritionModuleData,
} from '@/types/schema';

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Eyebrow({ children, dim }: { children: React.ReactNode; dim?: boolean }) {
  return (
    <div style={{
      fontFamily: T.mono,
      fontSize: 10.5,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: dim ? T.stone + '99' : T.stone,
      fontWeight: 500,
    }}>
      {children}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function moduleMetaLine(mod: ModuleViewModel): string {
  switch (mod.type) {
    case 'workout': {
      const d = mod.data as WorkoutModuleData;
      if (!d.focus) return 'Strength training';
      const first = d.focus.split(/[.—]/)[0].trim();
      return first.length > 48 ? first.slice(0, 48) + '…' : first;
    }
    case 'skill': {
      const d = mod.data as SkillModuleData;
      const total = d.nodes?.length ?? 0;
      return total > 0 ? `${total} nodes · ${d.subject}` : d.subject;
    }
    case 'study': {
      const d = mod.data as StudyModuleData;
      const total = d.nodes?.length ?? 0;
      return total > 0 ? `${total} units · ${d.dailyGoalMin} min/day` : `${d.dailyGoalMin} min/day`;
    }
    case 'nutrition': {
      const d = mod.data as NutritionModuleData;
      return d.notes ? d.notes.slice(0, 48) : 'Meal tracking';
    }
    default:
      return '';
  }
}

function moduleTypeLabel(type: string): string {
  const map: Record<string, string> = {
    workout: 'Training', skill: 'Skill', study: 'Study', nutrition: 'Nutrition',
  };
  return map[type] ?? type;
}

function goalFontTier(goal: string) {
  const len = (goal || '').length;
  if (len <= 38)  return { size: 56, lh: 1.04, ls: '-1.5px' };
  if (len <= 64)  return { size: 46, lh: 1.06, ls: '-1.2px' };
  if (len <= 100) return { size: 36, lh: 1.10, ls: '-0.7px' };
  return { size: 28, lh: 1.18, ls: '-0.3px' };
}

// ─── Gloss panel (left column) ────────────────────────────────────────────────

function GlossPanel({
  streak,
  completedHabits,
  totalHabits,
  totalDirectives,
  todayCommitted,
  weekPct,
}: {
  streak: number;
  completedHabits: number;
  totalHabits: number;
  totalDirectives: number;
  todayCommitted: boolean;
  weekPct: number;
}) {
  const completedDirectives = todayCommitted ? totalDirectives : 0;

  return (
    <aside style={{
      padding: '64px 28px 64px 48px',
      borderRight: `1px solid ${T.rule}`,
      position: 'sticky',
      top: 56,
      alignSelf: 'start',
      minHeight: 'calc(100vh - 56px)',
    }}>
      {/* Streak */}
      <Eyebrow>Streak</Eyebrow>
      <div style={{
        fontFamily: T.serifD,
        fontSize: 72,
        lineHeight: 1,
        color: T.accent,
        fontWeight: 400,
        marginTop: 10,
        letterSpacing: '-2px',
      }}>
        {streak}
      </div>
      <div style={{ fontFamily: T.sans, fontSize: 12, color: T.stone, marginTop: 6 }}>
        days unbroken
      </div>

      <div style={{ height: 40 }} />

      {/* Today */}
      <Eyebrow>Today</Eyebrow>
      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        {(totalHabits > 0 ? [
          ['Habits', completedHabits, totalHabits],
        ] : []).concat(totalDirectives > 0 ? [
          ['Directives', completedDirectives, totalDirectives],
        ] : []).map(([k, a, b]) => (
          <div key={String(k)} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: T.serifD, fontSize: 15, fontStyle: 'italic', color: T.stone }}>
              {k}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 12, flexShrink: 0 }}>
              <span style={{ color: T.ink }}>{String(a)}</span>
              <span style={{ color: T.stone }}> / {String(b)}</span>
            </span>
          </div>
        ))}
        {totalHabits === 0 && totalDirectives === 0 && (
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}>Nothing scheduled.</span>
        )}
      </div>

      <div style={{ height: 40 }} />

      {/* This week */}
      <Eyebrow>This week</Eyebrow>
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontFamily: T.serifD, fontSize: 36,
            fontWeight: 400, color: T.ink, letterSpacing: '-1px',
          }}>
            {weekPct}
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 13, color: T.stone }}>%</span>
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 12, color: T.stone, marginTop: 4 }}>
          completion rate
        </div>
      </div>
    </aside>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({ goal, streak, level }: { goal: string; streak: number; level: string }) {
  const tier = goalFontTier(goal);
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <Eyebrow>Active protocol</Eyebrow>
        {(level || streak > 0) && (
          <span style={{
            fontFamily: T.mono, fontSize: 10.5,
            letterSpacing: '0.12em', color: T.stone, opacity: 0.6,
          }}>
            · {level && `${level.toUpperCase()} · `}day {streak}
          </span>
        )}
      </div>
      {/* Reserve height so layout doesn't jump as goal length changes */}
      <div className="db-hero-min" style={{ minHeight: 128, marginTop: 14, display: 'flex', alignItems: 'flex-start' }}>
        <h1 className="db-hero-title" style={{
          fontFamily: T.serifD,
          fontSize: tier.size,
          lineHeight: tier.lh,
          fontWeight: 400,
          letterSpacing: tier.ls,
          color: T.ink,
          margin: 0,
          maxWidth: 640,
        }}>
          {goal}
        </h1>
      </div>
    </section>
  );
}

// ─── Today section ────────────────────────────────────────────────────────────

function TodaySection({
  directives,
}: {
  directives: Array<{ moduleId: string; type: string; title: string; subtitle: string }>;
}) {
  return (
    <section style={{ marginTop: 72 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{
          fontFamily: T.serifD, fontSize: 22, fontWeight: 400,
          fontStyle: 'italic', margin: 0, color: T.ink,
        }}>
          Today
        </h2>
        <Eyebrow>
          {directives.length} directive{directives.length !== 1 ? 's' : ''}
        </Eyebrow>
      </div>
      <div style={{ height: 1, background: T.ruleDark, marginTop: 12 }} />

      {directives.length === 0 ? (
        <div style={{ padding: '24px 0', fontFamily: T.serifD, fontSize: 17, fontStyle: 'italic', color: T.stone }}>
          Rest day — no sessions scheduled.
        </div>
      ) : (
        <div>
          {directives.map((d, i) => (
            <div key={d.moduleId} style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 22px',
              alignItems: 'center',
              gap: 20,
              padding: '20px 0',
              borderBottom: i < directives.length - 1 ? `1px solid ${T.rule}` : 'none',
            }}>
              <span style={{
                fontFamily: T.mono, fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: T.stone,
              }}>
                {moduleTypeLabel(d.type)}
              </span>
              <div style={{
                fontFamily: T.serifD, fontSize: 18, fontWeight: 400,
                color: T.ink, lineHeight: 1.35,
              }}>
                {d.title}
                {d.subtitle && (
                  <span style={{ color: T.stone, fontStyle: 'italic', fontSize: 15 }}> — {d.subtitle}</span>
                )}
              </div>
              {/* Unchecked circle — directive completion not tracked */}
              <div style={{
                width: 13, height: 13,
                border: `1.5px solid ${T.stone}`,
                borderRadius: '50%',
                flexShrink: 0,
              }} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Habits section ───────────────────────────────────────────────────────────

function HabitsSection({
  habits,
  completed,
  saving,
  onToggle,
}: {
  habits: Array<{ id: string; name: string }>;
  completed: Set<string>;
  saving: string | null;
  onToggle: (id: string) => void;
}) {
  if (habits.length === 0) return null;
  const doneCount = habits.filter(h => completed.has(h.id)).length;

  return (
    <section style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{
          fontFamily: T.serifD, fontSize: 22, fontWeight: 400,
          fontStyle: 'italic', margin: 0, color: T.ink,
        }}>
          Habits
        </h2>
        <Eyebrow>{doneCount} of {habits.length}</Eyebrow>
      </div>
      <div style={{ height: 1, background: T.ruleDark, marginTop: 12 }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
        {habits.map((habit) => {
          const done = completed.has(habit.id);
          const loading = saving === habit.id;
          return (
            <button
              key={habit.id}
              onClick={() => onToggle(habit.id)}
              disabled={!!loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                border: `1px solid ${done ? T.ink : T.rule}`,
                background: done ? T.ink : 'transparent',
                color: done ? T.surface : T.stone,
                fontFamily: T.sans, fontSize: 12.5, fontWeight: 500,
                letterSpacing: '0.02em',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.1s ease',
              }}
            >
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: done ? T.surface : T.stone,
                flexShrink: 0,
                opacity: done ? 0.85 : 1,
              }} />
              {habit.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ─── Modules section ──────────────────────────────────────────────────────────

function ModulesSection({
  modules,
  weekPct,
}: {
  modules: ModuleViewModel[];
  weekPct: number;
}) {
  if (modules.length === 0) return null;

  return (
    <section style={{ marginTop: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{
          fontFamily: T.serifD, fontSize: 22, fontWeight: 400,
          fontStyle: 'italic', margin: 0, color: T.ink,
        }}>
          Modules
        </h2>
        <Eyebrow>{modules.length} active</Eyebrow>
      </div>
      <div style={{ height: 1, background: T.ruleDark, marginTop: 12 }} />
      <div>
        {modules.map((mod, i) => {
          const href =
            mod.type === 'workout' ? '/training' :
            mod.type === 'skill' ? `/skills/${(mod.data as SkillModuleData)?.subject?.trim().toLowerCase() ?? ''}` :
            null;
          const meta = moduleMetaLine(mod);

          const inner = (
            <div style={{
              padding: '22px 0',
              borderBottom: i < modules.length - 1 ? `1px solid ${T.rule}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24 }}>
                <div>
                  <div style={{ fontFamily: T.serifD, fontSize: 20, fontWeight: 400, color: T.ink }}>
                    {mod.title}
                  </div>
                  {meta && (
                    <div style={{ fontFamily: T.sans, fontSize: 13, color: T.stone, marginTop: 3 }}>
                      {meta}
                    </div>
                  )}
                </div>
                <div style={{
                  fontFamily: T.mono, fontSize: 13, color: T.stone,
                  flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                }}>
                  {weekPct}%
                </div>
              </div>
              {/* 2px progress bar */}
              <div style={{ position: 'relative', marginTop: 14, height: 2, background: T.rule }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: 2,
                  width: `${weekPct}%`, background: T.ink,
                }} />
              </div>
            </div>
          );

          return (
            <div key={mod.id}>
              {href ? (
                <Link href={href} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  {inner}
                </Link>
              ) : inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Consistency grid ─────────────────────────────────────────────────────────

function ConsistencyGrid({ commitDates }: { commitDates: Set<string> }) {
  const todayStr = toYmd(new Date());

  // Anchor grid to Monday of the current week, going back 4 weeks (28 cells)
  const todayDate = new Date();
  const dow = todayDate.getDay() || 7; // 1=Mon…7=Sun
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - (dow - 1));
  const gridStart = new Date(weekStart);
  gridStart.setDate(weekStart.getDate() - 21);

  const cells: string[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(toYmd(d));
  }

  const keptCount = cells.filter(d => d < todayStr && commitDates.has(d)).length;
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <section style={{ marginTop: 56, marginBottom: 80 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <h2 style={{
          fontFamily: T.serifD, fontSize: 22, fontWeight: 400,
          fontStyle: 'italic', margin: 0, color: T.ink,
        }}>
          Consistency
        </h2>
        <Eyebrow>Last 4 weeks</Eyebrow>
      </div>
      <div style={{ height: 1, background: T.ruleDark, marginTop: 12 }} />

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'flex-start', gap: 36 }}>
        {/* 4×7 grid */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 22px)', gap: 6, marginBottom: 4 }}>
            {dayLabels.map((d, i) => (
              <div key={i} style={{
                fontFamily: T.mono, fontSize: 9.5,
                color: T.stone, textAlign: 'center',
              }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 22px)', gap: 6 }}>
            {cells.map((dateStr) => {
              const isFuture = dateStr > todayStr;
              const isToday  = dateStr === todayStr;
              const isKept   = !isFuture && !isToday && commitDates.has(dateStr);

              let bg     = 'transparent';
              let border = `1px solid ${T.rule}`;
              if (isToday)       { bg = T.accent; border = 'none'; }
              else if (isKept)   { bg = T.ink;    border = 'none'; }
              else if (isFuture) { border = `1px dashed ${T.rule}`; }

              return (
                <div key={dateStr} style={{ width: 22, height: 22, background: bg, border }} />
              );
            })}
          </div>
        </div>

        {/* Legend + coaching insight */}
        <div style={{ flex: 1, paddingTop: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            fontFamily: T.sans, fontSize: 12, color: T.stone, flexWrap: 'wrap',
          }}>
            {[
              { label: 'kept',   bg: T.ink,   border: 'none' },
              { label: 'missed', bg: 'transparent', border: `1px solid ${T.rule}` },
              { label: 'today',  bg: T.accent, border: 'none' },
            ].map(({ label, bg, border }) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, background: bg, border, display: 'inline-block', flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>
          <div style={{
            marginTop: 18,
            paddingLeft: 14,
            borderLeft: `2px solid ${T.accent}`,
            fontFamily: T.serifD,
            fontSize: 15,
            fontStyle: 'italic',
            color: T.stone,
            lineHeight: 1.6,
            maxWidth: 300,
          }}>
            {keptCount} of {cells.filter(d => d < todayStr).length} days committed.
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FolioDashboard() {
  const vm   = useDashboardVM();
  const plan = usePlan();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: stats } = useDashboardStats(user?.id);

  // 28-day commit dates for the consistency grid
  const { data: commitDates = new Set<string>() } = useQuery({
    queryKey: ['commit-dates-28', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 27);
      const { data } = await supabase
        .from('daily_commits')
        .select('date')
        .eq('user_id', user!.id)
        .gte('date', toYmd(since));
      return new Set<string>((data ?? []).map((r: { date: string }) => r.date));
    },
  });

  const streak         = stats?.commits.streakDays ?? 0;
  const weekPct        = stats?.commits.consistency7Pct ?? 0;
  const todayCommitted = stats?.commits.todayCommitted ?? false;

  // Server-derived set — recomputed whenever stats refresh
  const completedHabitIds = stats?.commits.completedHabitIds;
  const serverCompleted = useMemo(
    () => new Set<string>(completedHabitIds ?? []),
    [completedHabitIds],
  );

  // Optimistic override: non-null only during an in-flight save
  const [localOverride, setLocalOverride] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const completed = localOverride ?? serverCompleted;

  async function toggleHabit(habitId: string) {
    if (!user || saving) return;
    const next = new Set(completed);
    if (next.has(habitId)) next.delete(habitId); else next.add(habitId);
    setLocalOverride(next);
    setSaving(habitId);
    try {
      await upsertDailyCommit(user.id, toYmd(new Date()), Array.from(next));
      qc.invalidateQueries({ queryKey: ['dashboard-stats', user.id] });
    } catch {
      setLocalOverride(null);
    } finally {
      setLocalOverride(null);
      setSaving(null);
    }
  }

  const completedHabits = vm.today.habits.filter(h => completed.has(h.id)).length;

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink, fontFamily: T.sans }}>
      <style>{`
        .db-gloss { display: block; }
        .db-body  { padding: 64px 80px 80px 56px; }
        @media (max-width: 820px) {
          .db-gloss           { display: none !important; }
          .db-body            { padding: 32px 24px 64px !important; }
          .db-grid            { grid-template-columns: 1fr !important; }
          .db-today-row       { grid-template-columns: 90px 1fr 22px !important; gap: 12px !important; }
          .db-hero-title      { font-size: clamp(22px, 7vw, 32px) !important; line-height: 1.15 !important; letter-spacing: -0.5px !important; }
          .db-hero-min        { min-height: 0 !important; }
        }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main style={{ paddingTop: 56 }}>
        <div className="db-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr' }}>

          {/* ── Left: Gloss column ───────────────────────────────────── */}
          <div className="db-gloss">
            <GlossPanel
              streak={streak}
              completedHabits={completedHabits}
              totalHabits={vm.today.habits.length}
              totalDirectives={vm.today.directives.length}
              todayCommitted={todayCommitted}
              weekPct={weekPct}
            />
          </div>

          {/* ── Right: Editorial body ─────────────────────────────────── */}
          <div className="db-body">
            <Hero
              goal={plan.metadata.title || plan.metadata.goal || 'No active protocol set.'}
              streak={streak}
              level={plan.metadata.level}
            />
            <TodaySection directives={vm.today.directives} />
            <HabitsSection
              habits={vm.today.habits}
              completed={completed}
              saving={saving}
              onToggle={toggleHabit}
            />
            <ModulesSection modules={vm.modules} weekPct={weekPct} />
            <ConsistencyGrid commitDates={commitDates} />
          </div>

        </div>
      </main>
    </div>
  );
}
