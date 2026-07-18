// Single source of truth for Protocol design tokens.
// All pages import T from here instead of redeclaring it locally.
export const T = {
  surface: "var(--protocol-surface)",
  tint: "var(--protocol-tint)",
  ink: "var(--protocol-ink)",
  stone: "var(--protocol-stone)",
  rule: "var(--protocol-rule)",
  ruleDark: "var(--protocol-rule-dark)",
  accent: "var(--protocol-accent)",
  positive: "var(--protocol-positive)",
  negative: "var(--protocol-negative)",
  mono: "var(--font-mono)",
  sans: "var(--font-sans)",
  serifD: "var(--font-serif-display)",
  // serifT redirects to serifD — DM Serif Text eliminated, 3 typefaces total
  serifT: "var(--font-serif-display)",
  // Fixed module colors — independent of user accent theme to prevent collision
  moduleColors: {
    workout: "#C2410C",
    skill: "#5B7FA6",
    study: "#7A5C8A",
    nutrition: "#2E7D32",
    habits: "#C2410C",
  },
} as const;
