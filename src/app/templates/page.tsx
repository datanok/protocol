'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GitFork, Loader2 } from 'lucide-react';
import PublicNav from '@/components/navigation/PublicNav';
import { getPublicTemplates } from '@/actions/templateActions';
import type { TemplateCard } from '@/actions/templateActions';
import type { PlanModule } from '@/types/schema';

const T = {
  surface:  'var(--folio-surface)',
  tint:     'var(--folio-tint)',
  ink:      'var(--folio-ink)',
  stone:    'var(--folio-stone)',
  rule:     'var(--folio-rule)',
  accent:   'var(--folio-accent)',
  mono:     'var(--font-mono)',
  serifD:   'var(--font-serif-display)',
  serifT:   'var(--font-serif-display)',
};

const TYPE_ACCENTS: Record<string, string> = {
  workout:   T.accent,
  skill:     '#5B7FA6',
  study:     '#7A5C8A',
  nutrition: '#2E7D32',
};

function TemplateCard({ t }: { t: TemplateCard }) {
  const moduleTypes = [...new Set(t.plan.modules.map((m: PlanModule) => m.type))];
  const accentColor = TYPE_ACCENTS[moduleTypes[0]] ?? T.stone;

  return (
    <Link
      href={`/templates/${t.slug}`}
      style={{
        display: 'block',
        border: `1px solid ${T.rule}`,
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.1s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = T.stone)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = T.rule)}
    >
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentColor }} />

      <div style={{ padding: '16px 16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontFamily: T.serifT, fontSize: 16, fontStyle: 'italic', color: T.ink, margin: 0, lineHeight: 1.3 }}>
          {t.plan.metadata.goal}
        </h3>
        {t.description && (
          <p style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {t.description}
          </p>
        )}
        {/* Module type dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {moduleTypes.map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, background: TYPE_ACCENTS[type] ?? T.stone }} />
              <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone }}>{type}</span>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${T.rule}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone }}>
              {t.plan.metadata.level}
            </span>
            {t.author_username && (
              <>
                <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}>·</span>
                {t.author_accent && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.author_accent, flexShrink: 0 }} />
                )}
                <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.08em', color: T.stone }}>
                  @{t.author_username}
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.stone }}>
            <GitFork style={{ width: 11, height: 11 }} />
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone }}>{t.fork_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TemplatesPage() {
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', sort],
    queryFn:  () => getPublicTemplates({ sort }),
  });

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink }}>
      <PublicNav />

      <main style={{ paddingTop: 56, maxWidth: 1200, margin: '0 auto', padding: '56px 48px 80px' }}>

        {/* Header */}
        <div style={{ paddingTop: 40, paddingBottom: 24, borderBottom: `1px solid ${T.rule}`, marginBottom: 24 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 8 }}>Community Library</div>
          <h1 style={{ fontFamily: T.serifD, fontSize: 44, color: T.ink, margin: 0, lineHeight: 1.05, letterSpacing: '-0.5px' }}>Templates.</h1>
          <p style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, marginTop: 10, lineHeight: 1.6 }}>
            Browse plans built by the community. Fork any template to make it yours.
          </p>
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone }}>Sort:</span>
          {(['newest', 'popular'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                padding: '5px 14px',
                border: `1px solid ${sort === s ? T.ink : T.rule}`,
                background: sort === s ? T.ink : 'transparent',
                color: sort === s ? T.surface : T.stone,
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.1s',
              }}
            >
              {s}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 10, color: T.stone, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 style={{ width: 18, height: 18, color: T.stone, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : templates.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>No templates yet</span>
            <Link href="/builder" style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Be the first to publish one →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {templates.map(t => <TemplateCard key={t.id} t={t} />)}
          </div>
        )}
      </main>
    </div>
  );
}
