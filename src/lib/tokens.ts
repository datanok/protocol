// Single source of truth for Folio design tokens.
// All pages import T from here instead of redeclaring it locally.
export const T = {
  surface:  'var(--folio-surface)',
  tint:     'var(--folio-tint)',
  ink:      'var(--folio-ink)',
  stone:    'var(--folio-stone)',
  rule:     'var(--folio-rule)',
  ruleDark: 'var(--folio-rule-dark)',
  accent:   'var(--folio-accent)',
  positive: 'var(--folio-positive)',
  negative: 'var(--folio-negative)',
  mono:     'var(--font-mono)',
  sans:     'var(--font-sans)',
  serifD:   'var(--font-serif-display)',
  // serifT redirects to serifD — DM Serif Text eliminated, 3 typefaces total
  serifT:   'var(--font-serif-display)',
  // Fixed module colors — independent of user accent theme to prevent collision
  moduleColors: {
    workout:   '#C2410C',
    skill:     '#5B7FA6',
    study:     '#7A5C8A',
    nutrition: '#2E7D32',
    habits:    '#C2410C',
  },
} as const;
