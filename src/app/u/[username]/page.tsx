'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { GitFork, Loader2 } from 'lucide-react';
import PublicNav from '@/components/navigation/PublicNav';
import { getProfile, getTemplatesByUser } from '@/actions/templateActions';
import type { TemplateCard } from '@/actions/templateActions';
import { ACCENTS } from '@/contexts/ThemeContext';
import type { AccentKey } from '@/contexts/ThemeContext';
import type { PlanModule } from '@/types/schema';

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
};

const TYPE_ACCENTS: Record<string, string> = {
  workout:   T.accent,
  skill:     '#5B7FA6',
  study:     '#7A5C8A',
  nutrition: '#2E7D32',
};

function TemplateCardItem({ t }: { t: TemplateCard }) {
  const moduleTypes  = [...new Set(t.plan.modules.map((m: PlanModule) => m.type))];
  const accentColor  = TYPE_ACCENTS[moduleTypes[0]] ?? T.stone;

  return (
    <Link
      href={`/templates/${t.slug}`}
      style={{
        display: 'block', border: `1px solid ${T.rule}`,
        position: 'relative', textDecoration: 'none', color: 'inherit',
        transition: 'border-color 0.1s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = T.stone)}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = T.rule)}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentColor }} />
      <div style={{ padding: '16px 16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontFamily: T.serifT, fontSize: 15, fontStyle: 'italic', color: T.ink, margin: 0, lineHeight: 1.3 }}>
          {t.plan.metadata.goal}
        </h3>
        {t.description && (
          <p style={{ fontFamily: T.mono, fontSize: 10, color: T.stone, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {t.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {moduleTypes.map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 6, height: 6, background: TYPE_ACCENTS[type] ?? T.stone }} />
              <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone }}>{type}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${T.rule}` }}>
          <span style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.stone }}>
            {t.plan.metadata.level}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.stone }}>
            <GitFork style={{ width: 11, height: 11 }} />
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.stone }}>{t.fork_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn:  () => getProfile(username),
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['user-templates', profile?.user_id],
    queryFn:  () => getTemplatesByUser(profile!.user_id),
    enabled:  !!profile,
  });

  if (profileLoading) {
    return (
      <div style={{ minHeight: '100vh', background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PublicNav />
        <Loader2 style={{ width: 18, height: 18, color: T.stone, animation: 'spin 1s linear infinite', marginTop: 56 }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: T.surface }}>
        <PublicNav />
        <div style={{ paddingTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            @{username} not found
          </span>
          <Link href="/templates" style={{ fontFamily: T.mono, fontSize: 10, color: T.accent, textDecoration: 'underline', textUnderlineOffset: 3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← Browse Templates
          </Link>
        </div>
      </div>
    );
  }

  const totalForks    = templates.reduce((sum, t) => sum + t.fork_count, 0);
  const authorAccent  = profile.accent_color
    ? (ACCENTS[profile.accent_color as AccentKey]?.hex ?? T.accent)
    : T.accent;

  return (
    <div style={{ minHeight: '100vh', background: T.surface, color: T.ink }}>
      <PublicNav />

      <main style={{ paddingTop: 56, maxWidth: 1200, margin: '0 auto', padding: '56px 48px 80px' }}>

        {/* Profile header */}
        <div style={{ paddingTop: 40, paddingBottom: 28, borderBottom: `1px solid ${T.rule}`, marginBottom: 32 }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.stone, marginBottom: 8 }}>
            Public Profile
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: authorAccent, flexShrink: 0, marginTop: 4 }} />
            <h1 style={{ fontFamily: T.serifD, fontSize: 40, color: T.ink, margin: 0, lineHeight: 1.05, letterSpacing: '-0.3px' }}>
              @{profile.username}
            </h1>
          </div>
          {profile.bio && (
            <p style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, marginTop: 10, lineHeight: 1.6, maxWidth: 480 }}>
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginTop: 20 }}>
            <div>
              <div style={{ fontFamily: T.serifD, fontSize: 32, color: authorAccent, lineHeight: 1 }}>{templates.length}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.stone, marginTop: 4 }}>Templates</div>
            </div>
            <div style={{ width: 1, height: 40, background: T.rule }} />
            <div>
              <div style={{ fontFamily: T.serifD, fontSize: 32, color: T.ink, lineHeight: 1 }}>{totalForks}</div>
              <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: T.stone, marginTop: 4 }}>Total Forks</div>
            </div>
          </div>
        </div>

        {/* Templates grid */}
        {templatesLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 style={{ width: 18, height: 18, color: T.stone, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : templates.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.stone, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              No published templates yet
            </span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {templates.map(t => (
              <TemplateCardItem key={t.id} t={t} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
