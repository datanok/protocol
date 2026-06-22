# Task 10 Brief: Mobile page — real data + (plan) layout

## Context
Task 10 of 10. 

The static mobile page at `src/app/mobile/page.tsx` uses hardcoded data. Replace it with a real-data version inside the `(plan)` route group (which provides AuthGuard).

Both paths resolve to `/mobile` — route groups don't add segments.

## Step 1: Delete the old file

Delete: `src/app/mobile/page.tsx`

(Use PowerShell: `Remove-Item "src/app/mobile/page.tsx"`)

After deleting, check if `src/app/mobile/` directory is now empty. If so, delete it too:
`Remove-Item "src/app/mobile" -Recurse`

## Step 2: Create the new file

Create: `src/app/(plan)/mobile/page.tsx`

```tsx
'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { T } from '@/lib/tokens';
import type { WorkoutModuleData, SkillModuleData } from '@/types/schema';

export default function MobileCommandView() {
  const { user } = useAuth();
  const plan = usePlan();
  const { data: stats } = useDashboardStats(user?.id);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  }).toUpperCase();

  const streak           = stats?.commits.streakDays ?? 0;
  const completedIds     = new Set(stats?.commits.completedHabitIds ?? []);
  const habits           = plan.habits;
  const doneCount        = habits.filter(h => completedIds.has(h.id)).length;
  const donePct          = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;

  // Dynamic commit links based on plan modules
  const workoutMod  = plan.modules.find(m => m.type === 'workout');
  const skillMod    = plan.modules.find(m => m.type === 'skill');
  const skillSubject = (skillMod?.data as SkillModuleData | undefined)?.subject ?? '';

  const quickLinks: { label: string; href: string; color: string }[] = [
    ...(workoutMod ? [{ label: 'Log training session', href: '/commit', color: T.moduleColors.workout }] : []),
    { label: 'Full daily commit', href: '/commit', color: T.ink },
  ];

  return (
    <div style={{ background: T.surface, color: T.ink, minHeight: '100vh', fontFamily: T.sans }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: T.surface, borderBottom: `1px solid ${T.rule}`,
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.ink }}>
          FOLIO
        </span>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: `1px solid ${T.rule}` }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent }}>
              {streak}D STREAK
            </span>
          </div>
        )}
      </header>

      <main style={{ padding: '24px 20px 100px', maxWidth: 480, margin: '0 auto' }}>

        {/* Date + progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 6 }}>
            {today}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: T.serifD, fontSize: 48, lineHeight: 1, color: T.ink }}>{donePct}</span>
            <span style={{ fontFamily: T.serifD, fontSize: 24, color: T.accent }}>%</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone, marginLeft: 4 }}>
              Daily alignment
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 3, background: T.rule, width: '100%', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', background: T.ink, transform: `scaleX(${(donePct / 100).toFixed(3)})`, transformOrigin: 'left center', transition: 'transform 0.25s ease-out' }} />
          </div>
        </div>

        {/* Quick commit links */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone, marginBottom: 12 }}>
            Quick commit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {quickLinks.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  padding: '14px 16px',
                  border: `1px solid ${T.rule}`,
                  borderTop: i === 0 ? `1px solid ${T.rule}` : 'none',
                  background: T.surface, color: T.ink, textDecoration: 'none',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: item.color }} />
                <span style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.ink, paddingLeft: 12 }}>
                  {item.label}
                </span>
                <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 12, color: T.stone }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Protocol checklist — real habits */}
        {habits.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone }}>
                Protocol
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: doneCount === habits.length ? T.positive : T.stone }}>
                {doneCount}/{habits.length}
              </div>
            </div>
            <div style={{ border: `1px solid ${T.rule}` }}>
              {habits.map((h, i) => {
                const done = completedIds.has(h.id);
                return (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderBottom: i < habits.length - 1 ? `1px solid ${T.rule}` : 'none',
                      opacity: done ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.ink,
                        textDecoration: done ? 'line-through' : 'none',
                        textDecorationColor: T.stone,
                      }}>
                        {h.name}
                      </div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.stone, marginTop: 2 }}>
                        {h.category}
                      </div>
                    </div>
                    <div style={{
                      width: 24, height: 24, flexShrink: 0,
                      border: `1px solid ${done ? T.positive : T.rule}`,
                      background: done ? T.positive : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {done && <Check style={{ width: 12, height: 12, color: T.surface }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {habits.length === 0 && (
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, textAlign: 'center', padding: '32px 0' }}>
            No habits in current plan.{' '}
            <Link href="/plan" style={{ color: T.accent, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Configure plan →
            </Link>
          </div>
        )}

      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        height: 64, background: T.surface, borderTop: `1px solid ${T.rule}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {[
          { href: '/mobile',                         label: 'Dash',   active: true  },
          { href: '/training',                       label: 'Train',  active: false },
          { href: skillSubject ? `/skills/${skillSubject}` : '/dashboard', label: 'Skills', active: false },
          { href: '/commit',                         label: 'Log',    active: false },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              textDecoration: 'none', minWidth: 56,
            }}
          >
            <div style={{
              width: 24, height: 2,
              background: item.active ? T.accent : 'transparent',
              marginBottom: 6,
            }} />
            <span style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: item.active ? T.ink : T.stone,
            }}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

## Verification
Run `npm run build` — must pass. There must be NO route at `src/app/mobile/page.tsx` after this task.

## Commit message
`feat: mobile page — real data, move to (plan) route group`

## Report
Write to `.sdd/task-10-report.md`.
Return: status, commit hash, build result, concerns.
