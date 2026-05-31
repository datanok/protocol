'use client';

import Link from 'next/link';
import { usePlan } from '@/contexts/PlanContext';
import AppTopNav from '@/components/navigation/AppTopNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { WorkoutModuleData } from '@/types/schema';

import { T } from '@/lib/tokens';

function LabelXS({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone }}>
      {children}
    </div>
  );
}

function Hr({ ink }: { ink?: boolean }) {
  return <div style={{ height: 1, background: ink ? T.ink : T.rule, width: '100%' }} />;
}

const DAY_FULL: Record<string, string> = {
  MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
  THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday', SUN: 'Sunday',
};

// Single-pass 7-column grid: each column owns its header + exercises.
// Avoids the two-pass row synchronisation problem.
function TrainingGrid({ workoutData, dayLabels, dateLabels }: {
  workoutData: WorkoutModuleData;
  dayLabels:   string[];   // ['MON', 'TUE', ...]
  dateLabels:  string[];   // ['5 JAN', '6 JAN', ...]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${T.rule}` }}>
      {dayLabels.map((label, i) => {
        const isToday   = i === dayLabels.length - 1;
        const exercises = workoutData.split?.[DAY_FULL[label] ?? label] ?? [];
        const isRest    = exercises.length === 0;

        return (
          <div
            key={i}
            style={{
              borderRight: i < 6 ? `1px solid ${T.rule}` : 'none',
              background: isToday ? T.tint : 'transparent',
              padding: '12px 10px',
              minHeight: 88,
            }}
          >
            {/* Day label */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: isToday ? T.accent : T.stone }}>
                {label}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, marginTop: 1 }}>
                {dateLabels[i]}
              </div>
            </div>

            {/* Exercises */}
            {isRest ? (
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Rest
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {exercises.slice(0, 4).map((ex: string, ei: number) => (
                  <div key={ei} style={{ fontFamily: T.mono, fontSize: 9, color: isToday ? T.ink : T.stone, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.4 }}>
                    {ex}
                  </div>
                ))}
                {exercises.length > 4 && (
                  <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}>
                    +{exercises.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeeklyReportContent() {
  const { user } = useAuth();
  const plan = usePlan();
  const { data: stats } = useDashboardStats(user?.id);

  const now = new Date();

  // Build 7-day window: 6 days ago → today
  const dayLabels:  string[] = [];
  const dateLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
    dateLabels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase());
  }

  const consistency7  = stats?.commits.consistency7Pct  ?? 0;
  const consistency30 = stats?.commits.consistency30Pct ?? 0;
  const streak        = stats?.commits.streakDays        ?? 0;
  const delta7        = stats?.commits.delta7Days        ?? 0;
  const last7         = stats?.commits.last7Days         ?? 0;

  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayOfWeek = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  const workoutMod  = plan.modules.find(m => m.type === 'workout');
  const workoutData = workoutMod?.data as WorkoutModuleData | undefined;

  function modMetric(mod: typeof plan.modules[0]): string {
    if (mod.type === 'workout')   return (mod.data as WorkoutModuleData).focus?.toUpperCase() ?? 'TRAINING';
    if (mod.type === 'skill')     return `${mod.data.nodes.length} NODES`;
    if (mod.type === 'study')     return `${mod.data.dailyGoalMin}MIN/DAY`;
    if (mod.type === 'nutrition') return 'ACTIVE';
    return 'ACTIVE';
  }

  const directive = consistency7 >= 80
    ? `${consistency7}% consistency this week — above target. Raise intensity next cycle.`
    : consistency7 >= 60
    ? `${consistency7}% this week. Identify gap days and remove friction from your routine.`
    : `${consistency7}% this week. Restore habit anchoring before increasing intensity.`;

  const streakLine = streak > 0
    ? ` ${streak}-day streak active — protect it.`
    : ' No active streak. One day at a time.';

  const deltaColor = delta7 > 0 ? T.positive : delta7 < 0 ? T.negative : T.stone;
  const deltaValue = delta7 > 0 ? `+${delta7}pp` : delta7 < 0 ? `${delta7}pp` : '—';

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main style={{ paddingTop: 56, maxWidth: 1100, margin: '0 auto', padding: '56px 48px 80px' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 36, paddingBottom: 24 }}>
          <LabelXS>Weekly Report · Week {weekNum}</LabelXS>
          <h1 style={{ fontFamily: T.serifD, fontSize: 40, color: T.ink, margin: '8px 0 0', lineHeight: 1.05 }}>
            {dateLabels[0]} – {dateLabels[6]}
          </h1>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, marginTop: 8 }}>
            {plan.metadata.goal}
          </div>
        </div>
        <Hr ink />

        {/* ── Stats row — 4 columns, no duplicate numbers in header ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: '0 0 32px' }}>
          {[
            { label: '7-Day',  value: `${consistency7}%`,  sub: `${last7}/7 sessions`,              color: T.accent  },
            { label: '30-Day', value: `${consistency30}%`, sub: 'rolling average',                   color: T.ink     },
            { label: 'Streak', value: `${streak}d`,        sub: streak > 0 ? 'active' : 'no streak', color: T.ink     },
            { label: 'Delta',  value: deltaValue,           sub: 'vs last week',                      color: deltaColor },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${T.rule}`,
              borderRight: i < 3 ? `1px solid ${T.rule}` : 'none',
            }}>
              <LabelXS>{s.label}</LabelXS>
              <div style={{ fontFamily: T.serifD, fontSize: 32, color: s.color, lineHeight: 1, marginTop: 6 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, marginTop: 4, letterSpacing: '0.08em' }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Directive — actionable content before the grids ──────── */}
        <div style={{ border: `1px solid ${T.rule}`, borderLeft: `3px solid ${T.accent}`, padding: '16px 20px', marginBottom: 32 }}>
          <LabelXS>This Week</LabelXS>
          <div style={{ fontFamily: T.serifT, fontSize: 15, color: T.ink, marginTop: 10, lineHeight: 1.6 }}>
            {directive}{streakLine}
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/reports/debrief" style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Full Debrief →
            </Link>
          </div>
        </div>

        {/* ── Training — single-pass column grid ───────────────────── */}
        {workoutMod && workoutData && (
          <div style={{ marginBottom: 32 }}>
            <LabelXS>Training — Planned Schedule</LabelXS>
            <div style={{ height: 1, background: T.rule, margin: '8px 0 12px' }} />
            <TrainingGrid workoutData={workoutData} dayLabels={dayLabels} dateLabels={dateLabels} />
          </div>
        )}

        {/* ── Modules index ─────────────────────────────────────────── */}
        {plan.modules.length > 0 && (
          <div>
            <LabelXS>Modules</LabelXS>
            <Hr />
            {plan.modules.map(mod => (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'baseline', padding: '13px 0', borderBottom: `1px solid ${T.rule}` }}>
                <div style={{ fontFamily: T.serifT, fontSize: 16, color: T.ink, flexShrink: 0 }}>
                  <em>{mod.title}</em>
                </div>
                <div style={{ flex: 1, borderBottom: `1px dotted ${T.ruleDark}`, margin: '0 12px', transform: 'translateY(-4px)' }} />
                <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, whiteSpace: 'nowrap' }}>
                  {modMetric(mod)}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

export default function WeeklyReportPage() {
  return <WeeklyReportContent />;
}
