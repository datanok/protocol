'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { T } from '@/lib/tokens';

const ITEMS = [
  { label: 'Deep Focus', sub: 'Systems Architecture', done: true  },
  { label: 'Training',   sub: 'Strength · Endurance', done: true  },
  { label: 'Guitar',     sub: 'Fingerstyle Technique', done: true  },
  { label: 'Vitamins',   sub: 'Micronutrients',        done: false },
];

const METRICS = [
  { label: 'Pushups', value: '68' },
  { label: 'Pull-ups', value: '24' },
];

export default function MobileCommandView() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  }).toUpperCase();

  const donePct = Math.round((ITEMS.filter(i => i.done).length / ITEMS.length) * 100);
  const doneCount = ITEMS.filter(i => i.done).length;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: `1px solid ${T.rule}` }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.accent }}>
              47D STREAK
            </span>
          </div>
        </div>
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
          <div style={{ height: 3, background: T.rule, width: '100%' }}>
            <div style={{ height: '100%', width: `${donePct}%`, background: T.ink, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Quick commit buttons */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone, marginBottom: 12 }}>
            Quick commit
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Log training session', href: '/commit', color: T.moduleColors.workout },
              { label: 'Log nutrition',         href: '/commit', color: T.moduleColors.nutrition },
              { label: 'Full daily commit',     href: '/commit', color: T.ink },
            ].map((item, i) => (
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

        {/* Metrics */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone, marginBottom: 12 }}>
            Today&apos;s numbers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {METRICS.map(m => (
              <div key={m.label} style={{ padding: 16, background: T.tint, border: `1px solid ${T.rule}` }}>
                <div style={{ fontFamily: T.serifD, fontSize: 36, lineHeight: 1, color: T.ink, marginBottom: 4 }}>{m.value}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol checklist */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.stone }}>
              Protocol
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: doneCount === ITEMS.length ? T.positive : T.stone }}>
              {doneCount}/{ITEMS.length}
            </div>
          </div>
          <div style={{ border: `1px solid ${T.rule}` }}>
            {ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: i < ITEMS.length - 1 ? `1px solid ${T.rule}` : 'none',
                  opacity: item.done ? 0.5 : 1,
                }}
              >
                <div>
                  <div style={{
                    fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.ink,
                    textDecoration: item.done ? 'line-through' : 'none',
                    textDecorationColor: T.stone,
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.stone, marginTop: 2 }}>
                    {item.sub}
                  </div>
                </div>
                <div style={{
                  width: 24, height: 24, flexShrink: 0,
                  border: `1px solid ${item.done ? T.positive : T.rule}`,
                  background: item.done ? T.positive : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.done && <Check style={{ width: 12, height: 12, color: T.surface }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        height: 64, background: T.surface, borderTop: `1px solid ${T.rule}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {[
          { href: '/mobile',    label: 'Dash',     active: true  },
          { href: '/training',  label: 'Train',    active: false },
          { href: '/skills/',   label: 'Skills',   active: false },
          { href: '/commit',    label: 'Log',      active: false },
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
