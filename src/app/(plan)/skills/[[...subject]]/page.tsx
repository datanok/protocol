"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Loader2 } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/contexts/PlanContext";
import { useSkillProgress } from "@/hooks/useSkillProgress";
import { logSkillSession } from "@/actions/skillActions";
import AppTopNav from "@/components/navigation/AppTopNav";
import type { SkillModuleData, ModuleNode } from "@/types/schema";

import { T } from "@/lib/tokens";

function normalizeSubject(s: string) {
  return s.trim().toLowerCase();
}

// ─── Log Session Modal (Folio-styled) ─────────────────────────────────────────
function LogSessionModal({
  open,
  onClose,
  userId,
  subject,
  nodes,
  defaultNodeId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  subject: string;
  nodes: ModuleNode[];
  defaultNodeId: string | null;
  onSaved: () => void;
}) {
  const [durationMin, setDurationMin] = useState(30);
  const [nodeId, setNodeId] = useState(defaultNodeId ?? "");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await logSkillSession({
        userId,
        subject,
        durationMin,
        nodeId: nodeId || nodes[0]?.id || null,
        notes: notes.trim() || null,
      });
      onSaved();
      onClose();
      setNotes("");
      setDurationMin(30);
      setQuality(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(28,23,20,0.5)",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          background: T.surface,
          border: `1px solid ${T.rule}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${T.rule}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 4,
              }}
            >
              Log Session
            </div>
            <div
              style={{
                fontFamily: T.serifT,
                fontSize: 18,
                fontStyle: "italic",
                color: T.ink,
              }}
            >
              {subject}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.stone,
              padding: 4,
              marginTop: -2,
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px 0" }}>
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                border: `1px solid ${T.negative}`,
                background: T.tint,
                fontFamily: T.mono,
                fontSize: 10,
                color: T.negative,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Duration */}
            <div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 8,
                }}
              >
                Duration (min)
              </div>
              <input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) =>
                  setDurationMin(Math.max(1, Number(e.target.value)))
                }
                style={{
                  width: "100%",
                  background: T.tint,
                  border: `1px solid ${T.rule}`,
                  outline: "none",
                  padding: "8px 10px",
                  fontFamily: T.mono,
                  fontSize: 12,
                  color: T.ink,
                  boxSizing: "border-box",
                }}
                onFocus={(e) =>
                  ((e.target as HTMLInputElement).style.borderColor = T.accent)
                }
                onBlur={(e) =>
                  ((e.target as HTMLInputElement).style.borderColor = T.rule)
                }
              />
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.stone,
                  marginTop: 4,
                }}
              >
                ≈ {durationMin * 10} XP
              </div>
            </div>

            {/* Node */}
            <div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 8,
                }}
              >
                Node / Focus
              </div>
              <div className="sk-select-wrap">
                <select
                  value={nodeId}
                  onChange={(e) => setNodeId(e.target.value)}
                  className="sk-select"
                  style={{
                    width: "100%",
                    background: T.tint,
                    border: `1px solid ${T.rule}`,
                    outline: "none",
                    padding: "8px 28px 8px 10px",
                    fontFamily: T.mono,
                    fontSize: 11,
                    color: T.ink,
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    ((e.target as HTMLSelectElement).style.borderColor =
                      T.accent)
                  }
                  onBlur={(e) =>
                    ((e.target as HTMLSelectElement).style.borderColor = T.rule)
                  }
                >
                  <option value="">(auto)</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quality */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 8,
              }}
            >
              Session quality (1–5)
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuality(n)}
                  className={`sk-quality-btn${n <= quality ? " is-active" : ""}`}
                  style={{
                    width: 36,
                    height: 36,
                    border: `1px solid ${n <= quality ? T.ink : T.rule}`,
                    background: n <= quality ? T.ink : "transparent",
                    cursor: "pointer",
                    fontFamily: T.mono,
                    fontSize: 11,
                    color: n <= quality ? T.surface : T.stone,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 8,
              }}
            >
              Notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What did you practice? Key moments, difficulties, next focus…"
              style={{
                width: "100%",
                background: T.tint,
                border: `1px solid ${T.rule}`,
                outline: "none",
                padding: "8px 10px",
                fontFamily: T.mono,
                fontSize: 11,
                color: T.ink,
                resize: "none",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
              onFocus={(e) =>
                ((e.target as HTMLTextAreaElement).style.borderColor = T.accent)
              }
              onBlur={(e) =>
                ((e.target as HTMLTextAreaElement).style.borderColor = T.rule)
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${T.rule}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            className="sk-btn-ghost"
            style={{
              background: "none",
              border: `1px solid ${T.rule}`,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 10,
              color: T.stone,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="sk-btn-primary"
            style={{
              padding: "8px 24px",
              background: saving ? T.tint : T.ink,
              color: saving ? T.stone : T.surface,
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {saving ? (
              <>
                <Loader2
                  style={{
                    width: 12,
                    height: 12,
                    animation: "spin 1s linear infinite",
                  }}
                />
                Saving…
              </>
            ) : (
              "Log Session"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Migration notice ─────────────────────────────────────────────────────────
function MigrationNotice({ subject }: { subject: string }) {
  const sql = `-- Run in Supabase SQL Editor
create table if not exists skill_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  skill_subject text not null,
  duration_min  int  not null default 0,
  notes         text,
  benchmark_id  text,
  tags          text[],
  occurred_at   timestamptz default now() not null
);
create table if not exists skill_node_progress (
  user_id       uuid references auth.users(id) on delete cascade not null,
  skill_subject text not null,
  benchmark_id  text not null,
  status        text not null default 'in-progress',
  xp            int  not null default 0,
  updated_at    timestamptz default now(),
  completed_at  timestamptz,
  primary key (user_id, skill_subject, benchmark_id)
);
alter table skill_sessions     enable row level security;
alter table skill_node_progress enable row level security;
create policy "Own skill sessions"  on skill_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own node progress"   on skill_node_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        padding: "16px 20px",
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: T.stone,
          marginBottom: 8,
        }}
      >
        Setup Required
      </div>
      <div
        style={{
          fontFamily: T.serifT,
          fontSize: 14,
          color: T.ink,
          lineHeight: 1.6,
          marginBottom: 14,
        }}
      >
        Progress tracking for <em>{subject}</em> needs two tables in Supabase.
        Run this migration once, then your sessions and XP will persist.
      </div>
      <pre
        style={{
          fontFamily: T.mono,
          fontSize: 9,
          color: T.stone,
          background: T.tint,
          padding: "12px 14px",
          border: `1px solid ${T.rule}`,
          overflowX: "auto",
          lineHeight: 1.7,
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {sql}
      </pre>
    </div>
  );
}

// ─── Node status dot ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  completed: T.positive,
  "in-progress": T.accent,
  locked: T.stone,
};

// ─── Main page content ────────────────────────────────────────────────────────
function SkillPageContent() {
  const params = useParams<{ subject?: string[] }>();
  const router = useRouter();
  const { user } = useAuth();
  const plan = usePlan();
  const qc = useQueryClient();
  const [logOpen, setLogOpen] = useState(false);

  const skillMod = plan.modules.find((m) => m.type === "skill");
  const skillData = skillMod?.data as SkillModuleData | undefined;
  const planSubject = normalizeSubject(skillData?.subject ?? "");
  const planNodes = (skillData?.nodes ?? []) as ModuleNode[];

  const urlSubject = useMemo(() => {
    // Optional catch-all: undefined on bare /skills, string[] otherwise
    const s = Array.isArray(params.subject) ? (params.subject[0] ?? "") : "";
    return normalizeSubject(decodeURIComponent(s));
  }, [params.subject]);

  // Auto-redirect bare /skills route or wrong-subject URL
  if (!urlSubject && planSubject) {
    router.replace(`/skills/${planSubject}`);
    return null;
  }

  const isActiveSkill = !urlSubject || urlSubject === planSubject;

  // ── History data (optional — page renders without it) ─────────────────────
  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useSkillProgress({
    userId: user?.id,
    subject: urlSubject || planSubject,
    benchmarks: planNodes,
  });

  const needsMigration =
    !!historyError?.message &&
    (historyError.message.includes("relation") ||
      historyError.message.includes("does not exist") ||
      historyError.message.includes("skill_sessions") ||
      historyError.message.includes("skill_node_progress"));

  // Derive display values — fall back to zeroes when history not loaded yet
  const nodeProgress = history?.nodeProgress ?? {};
  const sessions = history?.sessions ?? [];
  const completionPct = history?.derived.completionPct ?? 0;
  const level = history?.derived.level ?? 1;
  const xpToNextLevel = history?.derived.xpToNextLevel ?? 500;
  const totalXp30 = history?.derived.totalXp30 ?? 0;
  const streakDays = history?.derived.streakDays ?? 0;
  const completed = planNodes.filter(
    (n) => nodeProgress[n.id]?.status === "completed",
  ).length;

  if (!user) return null;

  // ── Wrong skill ────────────────────────────────────────────────────────────
  if (!isActiveSkill) {
    return (
      <div style={{ minHeight: "100vh", background: T.surface }}>
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
        >
          <AppTopNav />
        </div>
        <div
          style={{
            paddingTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              maxWidth: 440,
              width: "100%",
              border: `1px solid ${T.rule}`,
              padding: "28px 32px",
              margin: 24,
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 8,
              }}
            >
              Skill Module
            </div>
            <div
              style={{
                fontFamily: T.serifD,
                fontSize: 28,
                color: T.ink,
                marginBottom: 10,
              }}
            >
              {urlSubject}
            </div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.stone,
                lineHeight: 1.6,
                marginBottom: 20,
              }}
            >
              Not in your current plan. Active skill:{" "}
              <span style={{ color: T.accent }}>
                {skillData?.subject ?? "—"}
              </span>
            </div>
            <button
              onClick={() => router.push(`/skills/${planSubject}`)}
              style={{
                padding: "8px 20px",
                border: `1px solid ${T.ink}`,
                background: "none",
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.ink,
              }}
            >
              Open Active Skill
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No skill module in plan ────────────────────────────────────────────────
  if (!skillData) {
    return (
      <div style={{ minHeight: "100vh", background: T.surface }}>
        <div
          style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
        >
          <AppTopNav />
        </div>
        <div
          style={{
            paddingTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.stone,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              No skill module in current plan
            </div>
            <Link
              href="/plan"
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.accent,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Add one in Plan settings →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Full page ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.surface, color: T.ink }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sk-btn-log:hover    { opacity: 0.85; }
        .sk-btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .sk-btn-ghost:hover:not(:disabled)   { background: var(--folio-tint) !important; }
        .sk-quality-btn:not(.is-active):hover { border-color: var(--folio-stone) !important; background: var(--folio-tint) !important; color: var(--folio-ink) !important; }
        .sk-btn-log, .sk-btn-primary, .sk-btn-ghost, .sk-quality-btn { transition: opacity 0.15s, background 0.15s, border-color 0.15s; }
        .sk-select-wrap { position: relative; }
        .sk-select-wrap::after { content: ''; position: absolute; right: 10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid var(--folio-stone); pointer-events: none; }
        .sk-select { appearance: none; -webkit-appearance: none; }
        @media (max-width: 768px) {
          .sk-main { padding: 56px 16px 64px !important; }
          .sk-h1   { font-size: 28px !important; }
          .sk-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main
        className="sk-main"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 48px 80px" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            paddingTop: 36,
            paddingBottom: 24,
            borderBottom: `1px solid ${T.ink}`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 8,
              }}
            >
              Skill Tree
            </div>
            <h1
              className="sk-h1"
              style={{
                fontFamily: T.serifD,
                fontSize: 40,
                color: T.ink,
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {skillData.subject}
            </h1>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.stone,
                marginTop: 10,
              }}
            >
              {historyLoading ? (
                "Loading…"
              ) : (
                <>
                  Level {level}
                  {" · "}
                  {completed}/{planNodes.length} nodes
                  {" · "}
                  {totalXp30} xp / 30d
                  {" · "}
                  {streakDays > 0 ? `${streakDays}d streak` : "no streak"}
                  {" · "}
                  {xpToNextLevel} xp to Lv.{level + 1}
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setLogOpen(true)}
            className="sk-btn-log"
            style={{
              padding: "10px 20px",
              background: T.ink,
              color: T.surface,
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            Log Session →
          </button>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              height: 2,
              background: T.rule,
              position: "relative",
              marginTop: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: -1,
                width: "100%",
                height: 4,
                background: T.ink,
                transform: `scaleX(${(completionPct / 100).toFixed(3)})`,
                transformOrigin: "left center",
                transition: "transform 0.3s ease-out",
              }}
            />
          </div>
        </div>

        {/* ── Migration notice (if tables missing) ────────────────────────── */}
        {needsMigration && <MigrationNotice subject={skillData.subject} />}

        {/* ── Content grid ──────────────────────────────────────────────── */}
        <div
          className="sk-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}
        >
          {/* Nodes list */}
          <div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 12,
              }}
            >
              Nodes — {planNodes.length} total
            </div>
            <div style={{ height: 1, background: T.rule }} />

            {planNodes.length === 0 ? (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.stone,
                  padding: "24px 0",
                }}
              >
                No nodes defined.{" "}
                <Link
                  href="/plan"
                  style={{
                    color: T.accent,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Edit plan →
                </Link>
              </div>
            ) : historyLoading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 56,
                      borderBottom: `1px solid ${T.rule}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 0",
                      opacity: 0.4 - i * 0.1,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        background: T.rule,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        width: `${120 + i * 40}px`,
                        background: T.rule,
                      }}
                    />
                  </div>
                ))}
              </>
            ) : (
              planNodes.map((node, idx) => {
                const progress = nodeProgress[node.id];
                const status =
                  progress?.status ?? (idx === 0 ? "in-progress" : "locked");
                const isComplete = status === "completed";
                const isActive = status === "in-progress";
                const xp = progress?.xp ?? 0;
                const dotColor = STATUS_COLORS[status] ?? T.stone;

                return (
                  <div
                    key={node.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "16px 0",
                      borderBottom: `1px solid ${T.rule}`,
                      opacity: status === "locked" ? 0.4 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0,
                      }}
                    >
                      {/* Status dot */}
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          flexShrink: 0,
                          background: dotColor,
                          position: "relative",
                        }}
                      >
                        {isComplete && (
                          <Check
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: 8,
                              height: 8,
                              color: T.surface,
                            }}
                          />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: T.sans,
                            fontSize: 14,
                            fontWeight: 500,
                            color: T.ink,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textDecoration: isComplete
                              ? "line-through"
                              : "none",
                            textDecorationColor: T.stone,
                          }}
                        >
                          {node.title}
                        </div>
                        <div
                          style={{
                            fontFamily: T.mono,
                            fontSize: 9,
                            color: T.stone,
                            marginTop: 2,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {node.type}
                          {node.metric?.type !== "none" &&
                            node.metric?.label && (
                              <span style={{ marginLeft: 6 }}>
                                · {node.metric.label}
                                {node.metric.type === "bpm"
                                  ? ` ${node.metric.target} bpm`
                                  : node.metric.type === "count"
                                    ? ` × ${node.metric.target}`
                                    : ""}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 11,
                          color: isActive ? T.accent : T.stone,
                        }}
                      >
                        {xp > 0 ? `${xp} xp` : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 9,
                          color: T.stone,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginTop: 1,
                        }}
                      >
                        {status}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Recent sessions */}
          <div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 12,
              }}
            >
              Recent Sessions
            </div>
            <div style={{ height: 1, background: T.rule }} />

            {historyLoading ? (
              <div
                style={{
                  padding: "20px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Loader2
                  style={{
                    width: 12,
                    height: 12,
                    color: T.stone,
                    animation: "spin 1s linear infinite",
                  }}
                />
                <span
                  style={{ fontFamily: T.mono, fontSize: 10, color: T.stone }}
                >
                  Loading…
                </span>
              </div>
            ) : needsMigration ? (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.stone,
                  padding: "20px 0",
                  lineHeight: 1.6,
                }}
              >
                Sessions will appear here after running the migration above.
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: "20px 0" }}>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 11,
                    color: T.stone,
                    fontStyle: "italic",
                    marginBottom: 12,
                  }}
                >
                  No sessions logged yet.
                </div>
                <button
                  onClick={() => setLogOpen(true)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontFamily: T.mono,
                    fontSize: 10,
                    color: T.accent,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Log your first session →
                </button>
              </div>
            ) : (
              sessions.slice(0, 12).map((s) => {
                const node = planNodes.find((n) => n.id === s.benchmark_id);
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: "14px 0",
                      borderBottom: `1px solid ${T.rule}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: T.stone,
                        }}
                      >
                        {new Date(s.occurred_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                        })}
                        {" · "}
                        {s.duration_min}min
                      </div>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 9,
                          color: T.accent,
                        }}
                      >
                        +{Math.round(s.duration_min * 10)} xp
                      </div>
                    </div>
                    {node && (
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 9,
                          color: T.stone,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 4,
                        }}
                      >
                        {node.title}
                      </div>
                    )}
                    {s.notes && (
                      <div
                        style={{
                          fontFamily: T.sans,
                          fontSize: 13,
                          color: T.ink,
                          lineHeight: 1.5,
                        }}
                      >
                        {s.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Log session modal */}
      {user && (
        <LogSessionModal
          open={logOpen}
          onClose={() => setLogOpen(false)}
          userId={user.id}
          subject={skillData.subject}
          nodes={planNodes}
          defaultNodeId={planNodes[0]?.id ?? null}
          onSaved={() => {
            qc.invalidateQueries({
              queryKey: ["skill-progress", user.id, urlSubject || planSubject],
            });
            setLogOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function SkillSubjectPage() {
  return <SkillPageContent />;
}
