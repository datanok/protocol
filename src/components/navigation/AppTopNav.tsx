"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Menu,
  X,
  Plus,
  Sun,
  Moon,
  SlidersHorizontal,
} from "lucide-react";
import { useTheme, ACCENTS, type AccentKey } from "@/contexts/ThemeContext";

import { useAuth } from "@/contexts/AuthContext";
import { usePlanSafe } from "@/contexts/PlanContext";
import {
  useUserPlans,
  useInvalidatePlans,
  activatePlan,
} from "@/hooks/useUserPlans";
import SignOutButton from "@/components/auth/SignOutButton";
import { T } from "@/lib/tokens";
import type { PlanModule } from "@/types/schema";

function normalizeSubject(subject: string) {
  return subject.trim().toLowerCase();
}

// ─── Nav link ────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        fontFamily: T.mono,
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase" as const,
        color: active ? T.accent : T.stone,
        textDecoration: active ? "underline" : "none",
        textUnderlineOffset: 3,
        padding: "0 4px",
        whiteSpace: "nowrap" as const,
        transition: "color 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.target as HTMLElement).style.color = T.ink;
      }}
      onMouseLeave={(e) => {
        if (!active) (e.target as HTMLElement).style.color = T.stone;
      }}
    >
      {label}
    </Link>
  );
}

// ─── Plan switcher ────────────────────────────────────────────────────────────

function PlanSwitcher() {
  const { user } = useAuth();
  const plan = usePlanSafe();
  const { data: plans = [] } = useUserPlans(user?.id ?? "");
  const invalidate = useInvalidatePlans();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSwitch = async (planId: string) => {
    if (!user || switching) return;
    setSwitching(planId);
    try {
      await activatePlan(planId, user.id);
      invalidate(user.id);
    } finally {
      setSwitching(null);
      setOpen(false);
    }
  };

  const goal =
    plans.find((p) => p.is_active)?.plan.metadata.goal ??
    plan?.metadata.goal ??
    "";

  return (
    <div ref={ref} style={{ position: "relative" }} className="hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: T.mono,
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: T.stone,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          maxWidth: 220,
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {goal}
        </span>
        <ChevronDown
          style={{
            width: 12,
            height: 12,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
            color: T.stone,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            left: 0,
            width: 300,
            background: T.surface,
            border: `1px solid ${T.rule}`,
            boxShadow: "0 8px 24px rgba(28,23,20,0.10)",
            zIndex: 60,
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              borderBottom: `1px solid ${T.rule}`,
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            {plans.length} plan{plans.length !== 1 ? "s" : ""}
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSwitch(p.id)}
                disabled={p.is_active || !!switching}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  textAlign: "left",
                  background: p.is_active ? T.tint : T.surface,
                  border: "none",
                  borderBottom: `1px solid ${T.rule}`,
                  cursor: p.is_active ? "default" : "pointer",
                  opacity: switching === p.id ? 0.5 : 1,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!p.is_active)
                    (e.currentTarget as HTMLElement).style.background = T.tint;
                }}
                onMouseLeave={(e) => {
                  if (!p.is_active)
                    (e.currentTarget as HTMLElement).style.background =
                      T.surface;
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    flexShrink: 0,
                    marginTop: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.is_active && (
                    <Check style={{ width: 11, height: 11, color: T.accent }} />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: p.is_active ? T.accent : T.ink,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.plan.metadata.goal}
                  </div>
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: T.stone,
                      marginTop: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {p.plan.metadata.level} · {p.plan.modules.length} module
                    {p.plan.modules.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Link
            href="/builder"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 16px",
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.stone,
              textDecoration: "none",
              borderTop: `1px solid ${T.rule}`,
              transition: "color 0.1s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = T.ink)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = T.stone)
            }
          >
            <Plus style={{ width: 11, height: 11 }} />
            New Plan
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel() {
  const { dark, toggleDark, accent, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Appearance"
        style={{
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: `1px solid ${open ? T.stone : "transparent"}`,
          cursor: "pointer",
          color: open ? T.ink : T.stone,
          transition: "color 0.1s, border-color 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = T.ink;
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLElement).style.color = T.stone;
        }}
      >
        <SlidersHorizontal style={{ width: 13, height: 13 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 220,
            background: T.surface,
            border: `1px solid ${T.rule}`,
            boxShadow: "0 8px 24px rgba(28,23,20,0.10)",
            zIndex: 60,
          }}
        >
          {/* Dark mode toggle */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: `1px solid ${T.rule}`,
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 8,
              }}
            >
              Mode
            </div>
            <button
              onClick={toggleDark}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 10px",
                background: T.tint,
                border: `1px solid ${T.rule}`,
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 10,
                color: T.ink,
                letterSpacing: "0.08em",
              }}
            >
              <span>{dark ? "Dark" : "Light"}</span>
              {dark ? (
                <Moon style={{ width: 12, height: 12, color: T.stone }} />
              ) : (
                <Sun style={{ width: 12, height: 12, color: T.stone }} />
              )}
            </button>
          </div>

          {/* Accent swatches */}
          <div style={{ padding: "10px 14px" }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 10,
              }}
            >
              Accent
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                Object.entries(ACCENTS) as [
                  AccentKey,
                  { label: string; hex: string },
                ][]
              ).map(([key, { label, hex }]) => (
                <button
                  key={key}
                  onClick={() => {
                    setAccent(key);
                  }}
                  title={label}
                  style={{
                    width: 36,
                    height: 36,
                    background: hex,
                    border:
                      accent === key
                        ? `2px solid ${T.ink}`
                        : "2px solid transparent",
                    cursor: "pointer",
                    outline: "none",
                    boxShadow: accent === key ? `0 0 0 1px ${hex}` : "none",
                    transition: "border-color 0.1s",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.stone,
                marginTop: 8,
                letterSpacing: "0.06em",
              }}
            >
              {ACCENTS[accent].label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main nav ─────────────────────────────────────────────────────────────────

function findSkillMod(modules: PlanModule[]) {
  return (
    modules.find(
      (m): m is Extract<PlanModule, { type: "skill" }> => m.type === "skill",
    ) ?? null
  );
}

export default function AppTopNav() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const plan = usePlanSafe();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeSkillSubject = useMemo(() => {
    const skillMod = findSkillMod(plan?.modules ?? []);
    return normalizeSubject(skillMod?.data.subject ?? "");
  }, [plan]);

  const skillLabel = useMemo(() => {
    const skillMod = findSkillMod(plan?.modules ?? []);
    return skillMod?.data.subject ?? "Skill";
  }, [plan]);

  const skillHref = `/skills/${activeSkillSubject}`;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      active: pathname === "/dashboard",
    },
    { href: "/commit", label: "Commit", active: pathname === "/commit" },
    { href: "/plan", label: "Plan", active: pathname.startsWith("/plan") },
    {
      href: skillHref,
      label: skillLabel,
      active: pathname.startsWith("/skills"),
    },
    {
      href: "/reports/weekly",
      label: "Reports",
      active: pathname.startsWith("/reports"),
    },
    {
      href: "/pages",
      label: "Pages",
      active: pathname.startsWith("/pages"),
    },
    {
      href: "/builder",
      label: "Builder",
      active: pathname.startsWith("/builder"),
    },
  ];

  const userInitial = (user?.email?.[0] || "F").toUpperCase();

  return (
    <>
      {/* ── Top bar ────────────────────────────────────────────── */}
      <header
        style={{
          width: "100%",
          height: 56,
          background: T.surface,
          borderBottom: `1px solid ${T.rule}`,
        }}
      >
        <div
          style={{
            height: "100%",
            maxWidth: 1600,
            margin: "0 auto",
            padding: "0 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Logo + plan switcher */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              minWidth: 0,
            }}
          >
            <Link
              href="/dashboard"
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: T.ink,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Protocol
            </Link>
            {/* Thin separator */}
            <div
              style={{
                width: 1,
                height: 16,
                background: T.rule,
                flexShrink: 0,
              }}
            />
            <PlanSwitcher />
          </div>

          {/* Desktop nav links */}
          <nav
            className="hidden md:flex"
            style={{ alignItems: "center", gap: 20 }}
          >
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          {/* Settings + user initial */}
          <div
            className="hidden md:flex"
            style={{ alignItems: "center", gap: 10 }}
          >
            <SettingsPanel />
            <div
              style={{
                width: 28,
                height: 28,
                background: T.ink,
                color: T.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>
            <SignOutButton />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              padding: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.stone,
            }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X style={{ width: 20, height: 20 }} />
            ) : (
              <Menu style={{ width: 20, height: 20 }} />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            zIndex: 40,
            background: T.surface,
            borderBottom: `1px solid ${T.rule}`,
          }}
        >
          <nav
            style={{
              maxWidth: 1600,
              margin: "0 auto",
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                onClick={() => setMobileOpen(false)}
              />
            ))}
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: `1px solid ${T.rule}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.stone,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {user?.email?.split("@")[0]}
              </span>
              <SignOutButton />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
