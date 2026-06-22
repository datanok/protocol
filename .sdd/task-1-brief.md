# Task 1 Brief: Add FolioInput and FolioTextarea to FolioUI

## Context
You are implementing Task 1 of 10 in a UI/UX polish pass for a Next.js app called Folio — a personal life OS. This task adds two shared form primitive components to the existing shared UI file.

## Requirements (verbatim from plan)

**File to modify:** `src/components/ui/FolioUI.tsx`

Replace the entire file with:

```tsx
// Shared primitive components. Use className from globals.css @layer utilities
// so the inline style clutter doesn't repeat in every page file.
import { T } from '@/lib/tokens';

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="folio-label">{children}</div>;
}

export function LabelXS({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="folio-label" style={style}>{children}</div>;
}

export function Hr({ ink }: { ink?: boolean }) {
  return <div className={ink ? 'folio-hr-ink' : 'folio-hr'} />;
}

export function FolioInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        background: T.tint, border: `1px solid ${T.rule}`, outline: 'none',
        padding: '7px 10px', fontFamily: T.mono, fontSize: 12, color: T.ink,
        width: '100%', boxSizing: 'border-box', textAlign: 'center',
        ...props.style,
      }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = T.accent; props.onFocus?.(e); }}
      onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = T.rule;   props.onBlur?.(e);  }}
    />
  );
}

export function FolioTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%', background: T.tint, border: `1px solid ${T.rule}`,
        outline: 'none', padding: '10px 12px', fontFamily: T.mono, fontSize: 11,
        color: T.ink, resize: 'none', boxSizing: 'border-box', lineHeight: 1.6,
        ...props.style,
      }}
      onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = T.accent; props.onFocus?.(e); }}
      onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor = T.rule;   props.onBlur?.(e);  }}
    />
  );
}
```

## Verification
Run `npm run build` — must pass with no new errors.

## Commit message
`feat: add FolioInput and FolioTextarea to shared UI`

## Report
Write your full report to `.sdd/task-1-report.md`.
Return ONLY: status (DONE/BLOCKED/NEEDS_CONTEXT), the commit hash, one-line test summary, and any concerns.
