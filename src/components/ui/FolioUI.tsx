// Shared primitive components. Use className from globals.css @layer utilities
// so the inline style clutter doesn't repeat in every page file.

export function Label({ children }: { children: React.ReactNode }) {
  return <div className="folio-label">{children}</div>;
}

export function LabelXS({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="folio-label" style={style}>{children}</div>;
}

export function Hr({ ink }: { ink?: boolean }) {
  return <div className={ink ? 'folio-hr-ink' : 'folio-hr'} />;
}
