'use client';

import Link from 'next/link';
import PublicNav from '@/components/navigation/PublicNav';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  surface: 'var(--folio-surface)',
  tint:    'var(--folio-tint)',
  ink:     'var(--folio-ink)',
  stone:   'var(--folio-stone)',
  rule:    'var(--folio-rule)',
  accent:  'var(--folio-accent)',
  mono:    'var(--font-mono)',
  serifD:  'var(--font-serif-display)',
  serifT:  'var(--font-serif-display)',
  sans:    'var(--font-sans)',
} as const;

// ─── Data ─────────────────────────────────────────────────────────────────────
const MODULES = [
  {
    type: 'WORKOUT',
    color: 'var(--folio-accent)',
    headline: 'Train with structure.',
    body: 'Weekly splits, daily sessions, exercise-by-exercise set logging. PRs tracked automatically. Volume charted over 8 weeks.',
    items: ['Push / Pull / Legs split', 'Per-set weight & rep logging', 'Automatic PR detection', 'Weekly volume chart'],
  },
  {
    type: 'SKILL',
    color: '#5B7FA6',
    headline: 'Build any skill.',
    body: 'Node-based learning paths for guitar, coding, language — or anything. XP accrues every session. Progress is visible.',
    items: ['Custom node trees', 'XP per minute of practice', 'Session history + notes', 'Benchmark milestones'],
  },
  {
    type: 'STUDY',
    color: '#7A5C8A',
    headline: 'Study deliberately.',
    body: 'Daily minute targets, subject nodes, reading sessions. Designed for people serious about retention, not just time spent.',
    items: ['Daily goal tracking', 'Unit-based curriculum', 'Session quality rating', 'Streak consistency'],
  },
  {
    type: 'NUTRITION',
    color: '#2E7D32',
    headline: 'Eat for your day.',
    body: 'Separate WFO and WFH meal plans. Macro targets per context. Hit / Partial / Missed logging — no calorie obsession.',
    items: ['WFO + WFH meal plans', 'Per-day macro targets', 'Hit / Partial / Missed log', 'Weekly adherence view'],
  },
];

const HOW = [
  {
    n: '01',
    title: 'Build your protocol',
    body: 'Use the visual plan builder to define your workout split, skill path, study targets, and daily habits. Or describe your goal and generate it with AI.',
  },
  {
    n: '02',
    title: 'Commit every day',
    body: 'One page. Log your sets, practice session, meal adherence, and habits in order. Two minutes. Then close the tab.',
  },
  {
    n: '03',
    title: 'Watch the compound',
    body: "PRs, XP, streaks, volume charts, debrief reports. Everything lives in your protocol. The data shows you what's working.",
  },
];

const TEMPLATES = [
  { title: 'PPL Hypertrophy — 6 Day', type: 'WORKOUT', color: 'var(--folio-accent)', forks: 24, tags: ['gym', 'muscle', 'ppl'] },
  { title: 'Guitar from Zero',         type: 'SKILL',   color: '#5B7FA6',             forks: 18, tags: ['beginner', 'acoustic'] },
  { title: 'Language Immersion',       type: 'STUDY',   color: '#7A5C8A',             forks: 31, tags: ['language', 'daily', 'anki'] },
];

const TICKER = [
  'WORKOUT SPLITS', 'SKILL TREES', 'DAILY COMMITS', 'HABIT STREAKS',
  'PROGRESSIVE OVERLOAD', 'XP SYSTEM', 'NUTRITION TARGETS', 'SESSION LOGS',
  'PR TRACKING', 'WEEKLY REPORTS', 'DEBRIEF ANALYSIS', 'NODE PROGRESS',
];

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 20, height: 1, background: T.accent }} />
      <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', color: T.stone }}>
        {children}
      </span>
    </div>
  );
}

// ─── Hero app mockup ─────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div style={{ border: `1px solid ${T.rule}`, background: T.tint, fontFamily: T.mono }}>
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${T.rule}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: T.surface }}>
        <span style={{ fontSize: 10, color: T.accent, letterSpacing: '0.12em' }}>PROTOCOL</span>
        <span style={{ fontSize: 8, color: T.stone, letterSpacing: '0.1em' }}>DASHBOARD</span>
      </div>

      <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontSize: 8, color: T.stone, letterSpacing: '0.1em', marginBottom: 6 }}>GOAL · ACTIVE PROTOCOL</div>
        <div style={{ fontFamily: T.serifD, fontSize: 16, lineHeight: 1.15, color: T.ink }}>
          Aesthetic physique + guitar<br />in 8 focused weeks.
        </div>
        <div style={{ fontSize: 8, color: T.stone, marginTop: 6, letterSpacing: '0.08em' }}>INTERMEDIATE · 3 MODULES</div>
      </div>

      {[
        { title: 'PPL Aesthetics Split',      color: 'var(--folio-accent)', metric: 'HYPERTROPHY + FAT LOSS' },
        { title: 'Guitar — Zero to Songs',    color: '#5B7FA6',             metric: '9 NODES · GUITAR' },
        { title: 'Aesthetic Cut — 1900 kcal', color: '#2E7D32',             metric: 'WFO + WFH TARGETS' },
      ].map((m, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: `1px solid ${T.rule}`, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: m.color }} />
          <div style={{ flex: 1, paddingLeft: 8 }}>
            <div style={{ fontFamily: T.serifT, fontSize: 12, fontStyle: 'italic', color: T.ink }}>{m.title}</div>
            <div style={{ fontSize: 8, color: T.stone, marginTop: 2, letterSpacing: '0.08em' }}>{m.metric}</div>
          </div>
          <div style={{ fontSize: 9, color: m.color }}>→</div>
        </div>
      ))}

      <div style={{ padding: '9px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 8, color: T.stone, letterSpacing: '0.1em' }}>TODAY — WEDNESDAY</div>
          <div style={{ fontSize: 8, color: T.stone, marginTop: 3 }}>
            <span style={{ color: 'var(--folio-accent)' }}>4</span> / 12 habits
          </div>
        </div>
        <div style={{ fontSize: 8, letterSpacing: '0.1em', background: T.ink, color: T.surface, padding: '4px 10px' }}>
          LOG TODAY →
        </div>
      </div>

      <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${T.rule}` }}>
        <div style={{ fontSize: 8, color: T.stone, letterSpacing: '0.1em', marginBottom: 8 }}>STREAK</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 24 }}>
          {[0.4, 0.6, 1, 0.8, 0.3, 0.7, 1].map((h, i) => (
            <div key={i} style={{ width: 14, height: `${Math.round(h * 24)}px`, background: i === 6 ? 'var(--folio-accent)' : T.ink, opacity: i === 6 ? 1 : 0.25 + h * 0.6 }} />
          ))}
          <div style={{ fontSize: 8, color: T.stone, marginLeft: 8 }}>7 DAY</div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink, fontFamily: T.sans }}>
      <style>{`
        .lp-pad    { max-width: 1100px; margin: 0 auto; padding: 0 48px; }
        .lp-hero   { display: grid; grid-template-columns: 1fr 400px; gap: 64px; align-items: center; }
        .lp-how    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .lp-mods   { display: grid; grid-template-columns: repeat(4, 1fr); }
        .lp-tpls   { display: grid; grid-template-columns: repeat(3, 1fr); }
        .lp-philosophy { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }

        /* Ticker */
        .lp-ticker-inner { display: flex; white-space: nowrap; padding: 10px 0; animation: marquee 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .lp-ticker-inner { animation: none; } }

        /* Hover states */
        .lp-btn-primary  { transition: opacity 0.15s; }
        .lp-btn-primary:hover  { opacity: 0.82; }
        .lp-btn-outline  { transition: border-color 0.15s, color 0.15s; }
        .lp-btn-outline:hover  { border-color: var(--folio-ink) !important; color: var(--folio-ink) !important; }
        .lp-btn-accent   { transition: opacity 0.15s; }
        .lp-btn-accent:hover   { opacity: 0.85; }
        .lp-tpl-card     { transition: background 0.15s; }
        .lp-tpl-card:hover     { background: var(--folio-tint) !important; }
        .lp-footer-link  { transition: color 0.15s; }
        .lp-footer-link:hover  { color: var(--folio-ink) !important; }
        .lp-all-tpls     { transition: color 0.15s; }
        .lp-all-tpls:hover     { color: var(--folio-ink) !important; }

        @media (max-width: 900px) {
          .lp-pad        { padding: 0 20px; }
          .lp-hero       { grid-template-columns: 1fr; gap: 40px; }
          .lp-how        { grid-template-columns: 1fr; }
          .lp-how > div  { border-top: 2px solid var(--folio-accent) !important; border-left: none !important; }
          .lp-mods       { grid-template-columns: repeat(2, 1fr); }
          .lp-mods > div { border-right: 1px solid var(--folio-rule) !important; }
          .lp-mods > div:nth-child(2n) { border-right: none !important; }
          .lp-mods > div { border-bottom: 1px solid var(--folio-rule); }
          .lp-tpls       { grid-template-columns: 1fr; }
          .lp-tpls > div { border-right: none !important; border-bottom: 1px solid var(--folio-rule); }
          .lp-mockup-wrap { max-width: 420px; }
          .lp-hide-sm    { display: none !important; }
          .lp-philosophy { grid-template-columns: 1fr; gap: 48px; }
        }
        @media (max-width: 600px) {
          .lp-mods       { grid-template-columns: 1fr; }
          .lp-mods > div { border-right: none !important; }
        }
      `}</style>

      <PublicNav />

      {/* HERO */}
      <section style={{ paddingTop: 100, paddingBottom: 80, borderBottom: `1px solid ${T.rule}` }}>
        <div className="lp-pad">
          <div className="lp-hero">
            <div>
              <SectionLabel>STRUCTURED PERSONAL PROTOCOL</SectionLabel>
              <h1 style={{ fontFamily: T.serifD, fontSize: 'clamp(52px, 7.5vw, 88px)', lineHeight: 0.97, letterSpacing: '-0.025em', margin: '0 0 28px', textWrap: 'balance' } as React.CSSProperties}>
                The plan<br />
                <em style={{ color: T.accent }}>you actually</em><br />
                follow.
              </h1>
              <p style={{ fontFamily: T.serifT, fontSize: 18, fontStyle: 'italic', color: T.stone, lineHeight: 1.65, maxWidth: 440, margin: '0 0 40px' }}>
                Protocol is a personal operating system — structure your training, skills, nutrition, and daily habits into one protocol built around your real life.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/builder" className="lp-btn-primary" style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', padding: '13px 32px', background: T.ink, color: T.surface, display: 'inline-block' }}>
                  Start Building →
                </Link>
                <Link href="/templates" className="lp-btn-outline" style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none', padding: '13px 32px', border: `1px solid ${T.rule}`, color: T.ink, display: 'inline-block' }}>
                  Browse Templates
                </Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 36, paddingTop: 24, borderTop: `1px solid ${T.rule}` }}>
                {[{ n: '4', label: 'modules' }, { n: '∞', label: 'subjects' }, { n: '1', label: 'daily log' }].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: T.serifD, fontSize: 28, color: T.accent }}>{s.n}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.1em' }}>{s.label.toUpperCase()}</span>
                    {i < 2 && <div style={{ width: 1, height: 20, background: T.rule, marginLeft: 10 }} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-mockup-wrap"><AppMockup /></div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ borderBottom: `1px solid ${T.rule}`, background: T.tint, overflow: 'hidden' }} className="mask-edges">
        <div className="lp-ticker-inner">
          {[...Array(2)].flatMap((_, r) =>
            TICKER.map((t, i) => (
              <span key={`${r}-${i}`} style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.12em', color: T.stone, padding: '0 20px', flexShrink: 0 }}>
                {t}<span style={{ color: T.rule, marginLeft: 16 }}>·</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 0', borderBottom: `1px solid ${T.rule}` }}>
        <div className="lp-pad">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 56 }}>
            <span style={{ fontFamily: T.serifT, fontSize: 28, fontStyle: 'italic' }}>How it works.</span>
            <div style={{ flex: 1, borderBottom: `1px solid ${T.rule}` }} />
            <span className="lp-hide-sm" style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.1em' }}>THREE STEPS</span>
          </div>
          <div className="lp-how">
            {HOW.map((h, i) => (
              <div key={h.n} style={{ paddingLeft: i > 0 ? 40 : 0, paddingRight: i < 2 ? 40 : 0, borderLeft: i > 0 ? `1px solid ${T.rule}` : 'none' }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, letterSpacing: '0.12em', marginBottom: 20, borderTop: `2px solid ${T.accent}`, paddingTop: 16 }}>{h.n}</div>
                <div style={{ fontFamily: T.serifD, fontSize: 24, lineHeight: 1.1, marginBottom: 14 }}>{h.title}</div>
                <div style={{ fontFamily: T.serifT, fontSize: 15, fontStyle: 'italic', color: T.stone, lineHeight: 1.6 }}>{h.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUR MODULES */}
      <section style={{ borderBottom: `1px solid ${T.rule}` }}>
        <div className="lp-pad" style={{ paddingTop: 80, paddingBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ fontFamily: T.serifT, fontSize: 28, fontStyle: 'italic' }}>Four modules.</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}>Any combination. Any goal.</span>
            <div style={{ flex: 1, borderBottom: `1px solid ${T.rule}` }} />
          </div>
        </div>
        <div className="lp-mods" style={{ borderTop: `1px solid ${T.rule}` }}>
          {MODULES.map((m, i) => (
            <div key={m.type} style={{ padding: '36px 32px 40px', borderRight: i < 3 ? `1px solid ${T.rule}` : 'none', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: m.color }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <div style={{ width: 7, height: 7, background: m.color, flexShrink: 0 }} />
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.14em', color: T.stone }}>{m.type}</span>
              </div>
              <div style={{ fontFamily: T.serifD, fontSize: 20, lineHeight: 1.15, marginBottom: 12 }}>{m.headline}</div>
              <div style={{ fontFamily: T.serifT, fontSize: 13, fontStyle: 'italic', color: T.stone, lineHeight: 1.6, marginBottom: 24 }}>{m.body}</div>
              <div>
                {m.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, marginTop: 8, borderTop: `1px solid ${T.rule}` }}>
                    <div style={{ width: 4, height: 4, background: m.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.08em' }}>{item.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section style={{ background: T.ink, borderBottom: `1px solid ${T.rule}`, padding: '96px 0' }}>
        <div className="lp-pad">
          <div className="lp-philosophy">
            <div>
              <div style={{ width: 28, height: 2, background: T.accent, marginBottom: 32 }} />
              <div style={{ fontFamily: T.serifD, fontSize: 'clamp(30px, 4vw, 48px)', color: T.surface, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                "Most people don't fail their goals. They fail their{' '}
                <em style={{ color: T.accent }}>system.</em>"
              </div>
            </div>
            <div>
              <p style={{ fontFamily: T.serifT, fontSize: 17, fontStyle: 'italic', color: T.stone, lineHeight: 1.7, margin: '0 0 28px' }}>
                Willpower is finite. Habits compound. Protocol gives you the structure to turn ambitious goals into daily rituals, logged, tracked, and refined week over week.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {['Plan built around your actual schedule', 'Log in under 2 minutes, every day', 'Weekly debrief shows you what to adjust'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 5, height: 5, background: T.accent, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', color: T.stone, lineHeight: 1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section style={{ padding: '80px 0', borderBottom: `1px solid ${T.rule}` }}>
        <div className="lp-pad">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 48 }}>
            <span style={{ fontFamily: T.serifT, fontSize: 28, fontStyle: 'italic' }}>Community templates.</span>
            <div style={{ flex: 1, borderBottom: `1px solid ${T.rule}` }} />
            <Link href="/templates" className="lp-all-tpls" style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, textDecoration: 'none', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>ALL TEMPLATES →</Link>
          </div>
          <div className="lp-tpls" style={{ border: `1px solid ${T.rule}` }}>
            {TEMPLATES.map((t, i) => (
              <Link key={i} href="/templates" className="lp-tpl-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '28px 24px', borderRight: i < 2 ? `1px solid ${T.rule}` : 'none', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: t.color }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ width: 5, height: 5, background: t.color }} />
                  <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.1em' }}>{t.type}</span>
                </div>
                <div style={{ fontFamily: T.serifT, fontSize: 17, fontStyle: 'italic', color: T.ink, marginBottom: 16, lineHeight: 1.3 }}>{t.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {t.tags.map(tag => (
                      <span key={tag} style={{ fontFamily: T.mono, fontSize: 8, color: T.stone, border: `1px solid ${T.rule}`, padding: '2px 7px', letterSpacing: '0.06em' }}>{tag}</span>
                    ))}
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, whiteSpace: 'nowrap', marginLeft: 8 }}>{t.forks} forks</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '96px 0', borderBottom: `1px solid ${T.rule}` }}>
        <div className="lp-pad" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: T.serifD, fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.02em', margin: '0 0 24px', textWrap: 'balance' } as React.CSSProperties}>
            Start your protocol<br /><em style={{ color: T.accent }}>today.</em>
          </h2>
          <p style={{ fontFamily: T.serifT, fontSize: 16, fontStyle: 'italic', color: T.stone, maxWidth: 400, margin: '0 auto 44px', lineHeight: 1.6 }}>
            Free. No subscription. Build your plan in five minutes, commit daily, see results in eight weeks.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/builder" className="lp-btn-accent" style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', padding: '15px 40px', background: T.accent, color: T.surface, display: 'inline-block' }}>
              Build Your Plan →
            </Link>
            <Link href="/login" className="lp-btn-outline" style={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', padding: '15px 40px', border: `1px solid ${T.rule}`, color: T.ink, display: 'inline-block' }}>
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '32px 0' }}>
        <div className="lp-pad">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontFamily: T.mono, fontSize: 13, letterSpacing: '0.1em', color: T.accent }}>PROTOCOL</div>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
              {[{ href: '/templates', label: 'Templates' }, { href: '/builder', label: 'Builder' }, { href: '/login', label: 'Sign In' }].map(({ href, label }) => (
                <Link key={href} href={href} className="lp-footer-link" style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, textDecoration: 'none', letterSpacing: '0.1em' }}>{label.toUpperCase()}</Link>
              ))}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 9, color: T.stone, letterSpacing: '0.08em' }}>© {new Date().getFullYear()} PROTOCOL</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
