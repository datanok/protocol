'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

const T = {
  surface: 'var(--folio-surface)',
  ink:     'var(--folio-ink)',
  stone:   'var(--folio-stone)',
  rule:    'var(--folio-rule)',
  accent:  'var(--folio-accent)',
  mono:    'var(--font-mono)',
};

export default function PublicNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      height: 56, background: T.surface, borderBottom: `1px solid ${T.rule}`,
    }}>
      <div style={{
        height: '100%', maxWidth: 1200, margin: '0 auto',
        padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        {/* Logo */}
        <Link
          href={user ? '/dashboard' : '/'}
          style={{
            fontFamily: T.mono, fontSize: 11, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: T.accent, textDecoration: 'none',
          }}
        >
          Protocol
        </Link>

        {/* Center nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link
            href="/templates"
            style={{
              fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
              textTransform: 'uppercase', textDecoration: 'none',
              color: isActive('/templates') ? T.ink : T.stone,
              borderBottom: isActive('/templates') ? `1px solid ${T.ink}` : '1px solid transparent',
              paddingBottom: 2,
            }}
          >
            Templates
          </Link>
        </nav>

        {/* Right */}
        <div>
          {user ? (
            <Link
              href="/dashboard"
              style={{
                height: 32, padding: '0 16px', background: T.ink, color: T.surface,
                fontFamily: T.mono, fontSize: 10, letterSpacing: '0.12em',
                textTransform: 'uppercase', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                height: 32, padding: '0 16px', border: `1px solid ${T.rule}`,
                color: T.stone, fontFamily: T.mono, fontSize: 10,
                letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
