'use client';

import Link from 'next/link';
import { usePlan } from '@/contexts/PlanContext';
import AppTopNav from '@/components/navigation/AppTopNav';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { WorkoutModuleData } from '@/types/schema';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toYmd } from '@/lib/utils';
import TrainingWeekGrid from '@/components/reports/TrainingWeekGrid';

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


function DebriefContent() {
  const { user } = useAuth();
  const plan = usePlan();
  const { data: stats } = useDashboardStats(user?.id);

  const now = new Date();

  const dayLabels:  string[] = [];
  const dateLabels: string[] = [];
  const ymdLabels:  string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase());
    dateLabels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase());
    ymdLabels.push(toYmd(d));
  }

  const startYmd = ymdLabels[0]!;
  const endYmd   = ymdLabels[6]!;

  const { data: commitRows } = useQuery({
    queryKey: ['week-commits', user?.id, startYmd, endYmd],
    queryFn:  async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('daily_commits')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', startYmd)
        .lte('date', endYmd);
      if (error) throw error;
      return (data ?? []).map((r: { date: string }) => r.date);
    },
    enabled: !!user?.id,
  });

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
    if (mod.type === 'skill')     return `${mod.data.nodes.length} nodes`;
    if (mod.type === 'study')     return `${mod.data.dailyGoalMin}min/day`;
    if (mod.type === 'nutrition') return 'Active';
    return 'Active';
  }

  const directives = [
    consistency7 >= 80
      ? `${consistency7}% consistency this week — above threshold. Raise training intensity in the next cycle.`
      : consistency7 >= 60
      ? `${consistency7}% this week. Audit the gap days and remove friction from your commit routine.`
      : `${consistency7}% this week. Restore habit anchoring before increasing intensity.`,
    streak > 0
      ? `${streak}-day streak active. Momentum compounds — protect it through the weekend.`
      : 'Streak at zero. Begin the rebuild: one day, then two.',
    delta7 > 0
      ? `Consistency improved +${delta7}pp vs last week. Sustain the trajectory.`
      : delta7 < 0
      ? `Consistency down ${Math.abs(delta7)}pp vs last week. Identify the friction and remove it.`
      : 'Consistency held steady vs last week.',
    plan.modules.length > 0
      ? `${plan.modules.length} module${plan.modules.length !== 1 ? 's' : ''} active. 30-day rate: ${consistency30}%. Review plan coverage if below 70%.`
      : 'No active modules. Configure a plan to begin tracking.',
  ];

  const deltaColor = delta7 > 0 ? T.positive : delta7 < 0 ? T.negative : T.stone;
  const deltaValue = delta7 > 0 ? `+${delta7}pp` : delta7 < 0 ? `${delta7}pp` : '—';

  const statusLabel = consistency7 >= 80 ? 'Optimal' : consistency7 >= 60 ? 'On Track' : 'Below Target';

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main style={{ paddingTop: 56, maxWidth: 1100, margin: '0 auto', padding: '56px 48px 80px' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 36, paddingBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <LabelXS>Weekly Debrief · Week {weekNum}</LabelXS>
            <h1 style={{ fontFamily: T.serifD, fontSize: 40, color: T.ink, margin: '8px 0 0', lineHeight: 1.05 }}>
              {dateLabels[0]} – {dateLabels[6]}
            </h1>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, marginTop: 8 }}>
              {plan.metadata.goal}
            </div>
          </div>
          <Link href="/reports/weekly" style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← Weekly Report
          </Link>
        </div>
        <Hr ink />

        {/* ── Stats row — same 4-col grid as weekly ────────────────── */}
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

        {/* ── Week summary panel ────────────────────────────────────── */}
        <div style={{ display: 'flex', marginBottom: 32 }}>
          <div style={{ width: 4, flexShrink: 0, background: T.accent }} />
          <div style={{ flex: 1, padding: '16px 20px', border: `1px solid ${T.rule}`, borderLeft: 'none' }}>
            <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 4 }}>
                  Committed
                </div>
                <div style={{ fontFamily: T.serifD, fontSize: 24, color: T.ink, lineHeight: 1 }}>
                  {last7}<span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone }}>/7</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 4 }}>
                  Habits
                </div>
                <div style={{ fontFamily: T.serifD, fontSize: 24, color: T.ink, lineHeight: 1 }}>
                  {plan.habits.length}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: T.serifT, fontSize: 14, color: T.stone, lineHeight: 1.6, fontStyle: 'italic' }}>
              {directives[0]}
            </div>
          </div>
        </div>

        {/* ── System directives — all 4, detailed ─────────────────── */}
        <div style={{ border: `1px solid ${T.rule}`, padding: '20px 24px', marginBottom: 32 }}>
          <LabelXS>System Directive</LabelXS>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {directives.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 4, height: 4, flexShrink: 0, background: T.accent, marginTop: 7 }} />
                <div style={{ fontFamily: T.serifT, fontSize: 15, color: T.ink, lineHeight: 1.6 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Week {weekNum} · {statusLabel}
            </span>
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ── Planned schedule — full exercise list, no status guessing */}
        {workoutMod && workoutData && (
          <div style={{ marginBottom: 32 }}>
            <LabelXS>Training — Planned Schedule</LabelXS>
            <div style={{ height: 1, background: T.rule, margin: '8px 0 12px' }} />
            <TrainingWeekGrid
              workoutData={workoutData}
              dayLabels={dayLabels}
              dateLabels={dateLabels}
              ymdLabels={ymdLabels}
              committedDates={commitRows}
            />
          </div>
        )}

        {/* ── Module signals — real data only, no placeholder Delta ── */}
        {plan.modules.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <LabelXS>Module Signals</LabelXS>
            <div style={{ height: 1, background: T.rule, margin: '8px 0 0' }} />
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', background: T.tint, borderBottom: `1px solid ${T.rule}` }}>
              {['Module', 'Type', 'Metric'].map(h => (
                <div key={h} style={{ padding: '8px 16px', fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone }}>
                  {h}
                </div>
              ))}
            </div>
            {plan.modules.map((mod, i) => (
              <div key={mod.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', borderBottom: i < plan.modules.length - 1 ? `1px solid ${T.rule}` : 'none' }}>
                <div style={{ padding: '12px 16px', fontFamily: T.mono, fontSize: 11, color: T.stone, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {mod.title}
                </div>
                <div style={{ padding: '12px 16px', fontFamily: T.mono, fontSize: 11, color: T.ink }}>
                  {mod.type}
                </div>
                <div style={{ padding: '12px 16px', fontFamily: T.mono, fontSize: 11, color: T.ink, textAlign: 'right' }}>
                  {modMetric(mod)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Habits list ───────────────────────────────────────────── */}
        {plan.habits.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <LabelXS>Habits</LabelXS>
            <Hr />
            {plan.habits.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', alignItems: 'baseline', padding: '12px 0', borderBottom: `1px solid ${T.rule}` }}>
                <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, width: 20, flexShrink: 0 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 0, minWidth: 0, marginLeft: 12 }}>
                  <span style={{ fontFamily: T.serifT, fontSize: 15, color: T.ink, flexShrink: 0 }}>
                    <em>{h.name}</em>
                  </span>
                  <div style={{ flex: 1, borderBottom: `1px dotted ${T.ruleDark}`, margin: '0 12px', transform: 'translateY(-4px)' }} />
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
                    {h.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer nav ────────────────────────────────────────────── */}
        <div style={{ paddingTop: 24, borderTop: `1px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/reports/weekly" style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← Weekly Report
          </Link>
          <Link href="/dashboard" style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Dashboard →
          </Link>
        </div>

      </main>
    </div>
  );
}

export default function WeeklyDebriefPage() {
  return <DebriefContent />;
}
