# Task 4 Brief: Dashboard — mobile sticky commit CTA

## Context
Task 4 of 10. Modifies `src/app/(plan)/dashboard/page.tsx` (same file as Task 3, which is complete).

On narrow screens (≤820px), the "→ Commit today" link in the hero gets buried. When the user hasn't committed today and there's content, add a sticky bottom bar visible ONLY on mobile showing the commit link.

## Required changes

### Step 1: Add CSS to the style block

In the `<style>` block inside `FolioDashboard` (it's a template literal string), add these two lines at the end (before the closing backtick):

```css
.db-mobile-cta { display: none; }
@media (max-width: 820px) {
  .db-mobile-cta { display: flex !important; }
}
```

### Step 2: Add sticky bar JSX

Just before the closing `</div>` of the outer wrapper div (the last closing `</div>` in the returned JSX), add:

```tsx
{/* Mobile sticky commit bar */}
{!todayCommitted && hasContent && (
  <div className="db-mobile-cta" style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: 56,
    alignItems: 'center', justifyContent: 'center',
    background: T.surface, borderTop: `1px solid ${T.rule}`,
    zIndex: 40,
  }}>
    <Link href="/commit" style={{
      fontFamily: T.mono, fontSize: 10, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: T.accent, textDecoration: 'none',
    }}>
      → Commit today
    </Link>
  </div>
)}
```

Note: `todayCommitted` and `hasContent` are already computed in the component. `Link` is already imported from `next/link`. `T` is already imported.

## Verification
Run `npm run build` — must pass.

## Commit message
`feat: mobile sticky commit CTA on dashboard`

## Report
Write to `.sdd/task-4-report.md`.
Return: status, commit hash, build result, concerns.
