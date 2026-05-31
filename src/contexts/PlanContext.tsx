'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { usePlanParser } from '@/hooks/usePlanParser';
import { buildDashboardViewModel, DashboardViewModel } from '@/lib/viewModels';
import type { AestheticOSPlan } from '@/types/schema';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SignOutButton from '@/components/auth/SignOutButton';

type PlanContextType = {
  plan:   AestheticOSPlan;
  planId: string;
  vm:     DashboardViewModel;
};

const PlanContext = createContext<PlanContextType | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId   = user?.id || null;
  const userName =
    (user?.email ? user.email.split('@')[0] : null) ||
    user?.user_metadata?.full_name ||
    'OPERATOR';

  const { data: parsed, isLoading, error } = usePlanParser(userId || '');

  const vm = useMemo(() => {
    if (!parsed) return null;
    return buildDashboardViewModel(parsed.plan, { userName });
  }, [parsed, userName]);

  const folioLoadingStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--folio-surface)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    color: 'var(--folio-stone)',
  };

  if (authLoading) {
    return (
      <div style={folioLoadingStyle}>
        <Loader2 style={{ width: 20, height: 20, color: 'var(--folio-stone)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--folio-stone)' }}>
          FOLIO
        </span>
      </div>
    );
  }

  // Not logged in — AuthGuard handles the redirect; pass through so public pages render.
  if (!userId) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div style={folioLoadingStyle}>
        <Loader2 style={{ width: 20, height: 20, color: 'var(--folio-stone)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--folio-stone)' }}>
          Loading plan…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...folioLoadingStyle, alignItems: 'flex-start', padding: '0 48px' }}>
        <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--folio-negative)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--folio-negative)', maxWidth: 500 }}>
          ERROR_FETCHING_PROTOCOL: {error.message}
        </div>
      </div>
    );
  }

  if (!parsed) {
    return (
      <div style={folioLoadingStyle}>
        <div style={{ textAlign: 'center', border: '1px solid var(--folio-rule)', padding: '48px 56px', maxWidth: 440, background: 'var(--folio-surface)' }}>
          <div style={{ fontFamily: 'var(--font-serif-display)', fontSize: 28, color: 'var(--folio-ink)', lineHeight: 1.1, marginBottom: 16 }}>
            No active plan.
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--folio-stone)', letterSpacing: '0.06em', lineHeight: 1.6, marginBottom: 0 }}>
            You&apos;re in the system — but no plan is bound yet.
            <br />Build one to get started.
          </p>
          <div style={{ height: 1, background: 'var(--folio-rule)', margin: '24px 0' }} />
          <a
            href="/builder"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: 'var(--folio-ink)',
              color: 'var(--folio-surface)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            Build a Plan
          </a>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PlanContext.Provider value={{ plan: parsed.plan, planId: parsed.id, vm: vm! }}>
      {children}
    </PlanContext.Provider>
  );
}

export function useDashboardVM() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('useDashboardVM must be used within PlanProvider');
  return ctx.vm;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx.plan;
}

export function usePlanSafe() {
  return useContext(PlanContext)?.plan ?? null;
}

export function usePlanId() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlanId must be used within PlanProvider');
  return ctx.planId;
}
