'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccentKey = 'vermillion' | 'slate' | 'forest' | 'aubergine' | 'obsidian';

export const ACCENTS: Record<AccentKey, { label: string; hex: string }> = {
  vermillion: { label: 'Vermillion', hex: '#C2410C' },
  slate:      { label: 'Slate',      hex: '#5B7FA6' },
  forest:     { label: 'Forest',     hex: '#2E7D32' },
  aubergine:  { label: 'Aubergine',  hex: '#7A5C8A' },
  obsidian:   { label: 'Obsidian',   hex: '#374151' },
};

interface ThemeCtx {
  dark:       boolean;
  toggleDark: () => void;
  accent:     AccentKey;
  setAccent:  (a: AccentKey) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeCtx>({
  dark:       false,
  toggleDark: () => {},
  accent:     'vermillion',
  setAccent:  async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── DOM helper ───────────────────────────────────────────────────────────────

function applyToDOM(dark: boolean, accent: AccentKey) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme',  dark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-accent', accent);
}

type ProfileKeyColumn = 'user_id' | 'id';
const PROFILE_KEY_COLUMNS: ProfileKeyColumn[] = ['user_id', 'id'];

function isMissingColumn(error: { code?: string; message?: string } | null, column: string) {
  return error?.code === 'PGRST204' && (error.message ?? '').includes(`'${column}'`);
}

async function fetchAccentForUser(userId: string): Promise<AccentKey | null> {
  for (const key of PROFILE_KEY_COLUMNS) {
    const { data, error } = await supabase
      .from('profiles')
      .select('accent_color')
      .eq(key, userId)
      .maybeSingle();

    if (!error) return (data?.accent_color as AccentKey | null) ?? null;
    if (isMissingColumn(error, key)) continue;
    if (isMissingColumn(error, 'accent_color')) return null;
    return null;
  }

  return null;
}

async function persistAccentForUser(userId: string, accent: AccentKey): Promise<void> {
  for (const key of PROFILE_KEY_COLUMNS) {
    const payload =
      key === 'user_id'
        ? { user_id: userId, accent_color: accent }
        : { id: userId, accent_color: accent };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: key });

    if (!error) return;
    if (isMissingColumn(error, key)) continue;
    if (isMissingColumn(error, 'accent_color')) return;
    return;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dark,      setDark]        = useState(false);
  const [accent,    setAccentState] = useState<AccentKey>('vermillion');
  const [hydrated,  setHydrated]    = useState(false);

  // ── Init from localStorage on first client render ─────────────
  useEffect(() => {
    const savedDark   = localStorage.getItem('folio-dark') === 'true';
    const savedAccent = (localStorage.getItem('folio-accent') as AccentKey | null) ?? 'vermillion';
    setDark(savedDark);
    setAccentState(savedAccent);
    applyToDOM(savedDark, savedAccent);
    setHydrated(true);
  }, []);

  // ── Sync accent from Supabase when user logs in ────────────────
  useEffect(() => {
    if (!user || !hydrated) return;
    let cancelled = false;

    void (async () => {
      const a = await fetchAccentForUser(user.id);
      if (!a || cancelled) return;
      setAccentState(a);
      localStorage.setItem('folio-accent', a);
      applyToDOM(dark, a);
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydrated]);

  // ── Handlers ──────────────────────────────────────────────────
  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('folio-dark', String(next));
    applyToDOM(next, accent);
  }

  async function setAccent(a: AccentKey) {
    setAccentState(a);
    localStorage.setItem('folio-accent', a);
    applyToDOM(dark, a);
    if (user) {
      await persistAccentForUser(user.id, a);
    }
  }

  return (
    <ThemeContext.Provider value={{ dark, toggleDark, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
