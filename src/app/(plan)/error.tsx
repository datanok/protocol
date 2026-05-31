'use client';

export default function PlanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--folio-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--folio-negative)',
          marginBottom: 12,
        }}>
          Error
        </div>
        <div style={{
          fontFamily: 'var(--font-serif-display)',
          fontSize: 28,
          color: 'var(--folio-ink)',
          lineHeight: 1.1,
          marginBottom: 16,
        }}>
          Something went wrong.
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--folio-stone)',
          lineHeight: 1.6,
          marginBottom: 24,
          padding: '10px 14px',
          borderLeft: '3px solid var(--folio-negative)',
          background: 'var(--folio-tint)',
        }}>
          {error.message}
        </div>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            background: 'var(--folio-ink)',
            color: 'var(--folio-surface)',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
