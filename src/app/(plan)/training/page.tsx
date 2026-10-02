"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePlan, useDashboardVM } from "@/contexts/PlanContext";
import AppTopNav from "@/components/navigation/AppTopNav";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutHistory } from "@/hooks/useWorkoutHistory";
import type { WorkoutModuleData, ExerciseEntry } from "@/types/schema";
import { exerciseName } from "@/lib/exercises";

import { T } from "@/lib/tokens";

// ─── Primitives ───────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: T.stone,
      }}
    >
      {children}
    </div>
  );
}

function Hr({ ink }: { ink?: boolean }) {
  return <div style={{ height: 1, background: ink ? T.ink : T.rule }} />;
}

// ─── Weekly split tabs ────────────────────────────────────────────────────────
const DAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function SplitGrid({
  split,
  dayFocus,
  todayName,
}: {
  split: Record<string, ExerciseEntry[]>;
  dayFocus?: Record<string, string>;
  todayName: string;
}) {
  const todayIdx = DAY_FULL.indexOf(todayName);
  const [active, setActive] = useState<number>(todayIdx >= 0 ? todayIdx : 0);

  const exercises = split[DAY_FULL[active]] ?? [];
  const isRest = exercises.length === 0;

  // Parse "Name — prescription" into two parts for cleaner display
  const parsed = exercises.map((ex) => {
    const label = exerciseName(ex);
    const sep = label.indexOf(" — ");
    return sep !== -1
      ? { name: label.slice(0, sep), prescription: label.slice(sep + 3) }
      : { name: label, prescription: "" };
  });

  return (
    <div style={{ border: `1px solid ${T.rule}` }}>
      {/* Day tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          borderBottom: `1px solid ${T.ink}`,
        }}
      >
        {DAY_FULL.map((day, i) => {
          const hasWork = (split[day] ?? []).length > 0;
          const isToday = day === todayName;
          const isActive = i === active;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setActive(i)}
              style={{
                padding: "10px 0",
                background: isActive ? T.ink : isToday ? T.tint : "transparent",
                cursor: "pointer",
                border: "none",
                borderRight: i < 6 ? `1px solid ${T.rule}` : "none",
                borderBottom: isActive
                  ? `2px solid ${T.accent}`
                  : "2px solid transparent",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  color: isActive ? T.surface : isToday ? T.accent : T.stone,
                }}
              >
                {DAY_SHORT[i]}
              </span>
              <span
                style={{
                  width: 4,
                  height: 4,
                  background: hasWork
                    ? isActive
                      ? T.accent
                      : isToday
                        ? T.accent
                        : T.stone
                    : "transparent",
                  flexShrink: 0,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Exercise list for active day */}
      <div style={{ padding: "20px 24px", minHeight: 120 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
              }}
            >
              {DAY_FULL[active]}
              {DAY_FULL[active] === todayName ? " · Today" : ""}
            </span>
            {dayFocus?.[DAY_FULL[active]] && (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  color: T.accent,
                  letterSpacing: "0.08em",
                  marginTop: 3,
                }}
              >
                {dayFocus[DAY_FULL[active]]}
              </div>
            )}
          </div>
          {!isRest && (
            <span style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}>
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isRest ? (
          <div
            style={{
              fontFamily: T.serifD,
              fontSize: 13,
              color: T.stone,
              fontStyle: "italic",
            }}
          >
            Rest day
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {parsed.map(({ name, prescription }, i) => (
              <div
                key={name}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "4px 24px",
                  alignItems: "baseline",
                  padding: "10px 0",
                  borderBottom:
                    i < parsed.length - 1 ? `1px solid ${T.rule}` : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: T.serifT,
                    fontSize: 15,
                    color: T.ink,
                    fontStyle: "italic",
                  }}
                >
                  {name}
                </div>
                {prescription && (
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 9,
                      color: T.stone,
                      letterSpacing: "0.06em",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {prescription}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Volume bar chart ─────────────────────────────────────────────────────────
function VolumeChart({ weeks }: { weeks: { label: string; sets: number }[] }) {
  const max = Math.max(...weeks.map((w) => w.sets), 1);
  const CHART_H = 72;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: CHART_H + 20,
        }}
      >
        {weeks.map((w, i) => {
          const isCurrentWeek = i === weeks.length - 1;
          const barH =
            w.sets > 0 ? Math.max(4, Math.round((w.sets / max) * CHART_H)) : 0;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: CHART_H + 20,
                gap: 4,
              }}
            >
              {w.sets > 0 && (
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 8,
                    color: isCurrentWeek ? T.accent : T.stone,
                    lineHeight: 1,
                  }}
                >
                  {w.sets}
                </div>
              )}
              <div
                style={{
                  width: "100%",
                  height: barH,
                  background: isCurrentWeek ? T.accent : T.ink,
                  opacity: isCurrentWeek ? 1 : 0.25 + (i / weeks.length) * 0.6,
                  transition: "transform 0.3s",
                  transform: `scaleY(${barH > 0 ? 1 : 0})`,
                  transformOrigin: "bottom",
                }}
              />
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 7,
                  color: T.stone,
                  textAlign: "center",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                {w.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Exercise history panel ───────────────────────────────────────────────────
function ExercisePanel({
  exercise,
  history,
}: {
  exercise: string;
  history: ReturnType<typeof useWorkoutHistory>["data"];
}) {
  if (!history) return null;
  const entry = history.byExercise[exercise];

  // Exercise has no logged sets yet
  if (!entry || entry.sessions.length === 0) {
    return (
      <div
        style={{
          padding: "32px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 11,
            color: T.stone,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          No sessions logged yet
        </div>
        <Link
          href="/commit"
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
          Log your first session →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* PR callout */}
      {entry.pr && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "12px 16px",
            background: T.tint,
            border: `1px solid ${T.rule}`,
            marginBottom: 20,
          }}
        >
          <div>
            <Label>Personal Record</Label>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontFamily: T.serifD,
                  fontSize: 32,
                  color: T.accent,
                  lineHeight: 1,
                }}
              >
                {entry.pr.weight_kg}
              </span>
              <span
                style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}
              >
                kg
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 13,
                  color: T.stone,
                  margin: "0 4px",
                }}
              >
                ×
              </span>
              <span
                style={{
                  fontFamily: T.serifD,
                  fontSize: 32,
                  color: T.ink,
                  lineHeight: 1,
                }}
              >
                {entry.pr.reps}
              </span>
              <span
                style={{ fontFamily: T.mono, fontSize: 11, color: T.stone }}
              >
                reps
              </span>
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Label>Total Sets</Label>
            <div
              style={{
                fontFamily: T.serifD,
                fontSize: 28,
                color: T.ink,
                lineHeight: 1,
                marginTop: 4,
              }}
            >
              {entry.totalSets}
            </div>
          </div>
        </div>
      )}

      {/* Session history */}
      <div>
        {entry.sessions.map((session, si) => {
          const dateLabel = new Date(
            session.date + "T12:00:00",
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });
          return (
            <div
              key={session.date}
              style={{
                borderBottom:
                  si < entry.sessions.length - 1
                    ? `1px solid ${T.rule}`
                    : "none",
                paddingBottom: 16,
                marginBottom: 16,
              }}
            >
              {/* Session header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: T.stone,
                  }}
                >
                  {dateLabel}
                </div>
                <div
                  style={{ flex: 1, borderBottom: `1px dotted ${T.ruleDark}` }}
                />
                <div
                  style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}
                >
                  {session.setCount} set{session.setCount !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Set rows — compact table */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 1fr 1fr",
                  gap: "4px 12px",
                }}
              >
                {/* Headers */}
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.stone,
                    textAlign: "center",
                  }}
                >
                  Set
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.stone,
                    textAlign: "center",
                  }}
                >
                  Weight
                </div>
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.stone,
                    textAlign: "center",
                  }}
                >
                  Reps
                </div>
                {/* Data */}
                {session.sets.map((set, idx) => {
                  const isPR =
                    entry.pr &&
                    set.weight_kg === entry.pr.weight_kg &&
                    set.reps === entry.pr.reps;
                  return (
                    <React.Fragment key={idx}>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 12,
                          color: T.accent,
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      >
                        {set.set_number}
                      </div>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 13,
                          color: isPR ? T.accent : T.ink,
                          textAlign: "center",
                          fontWeight: isPR ? 600 : 400,
                        }}
                      >
                        {set.weight_kg != null ? `${set.weight_kg} kg` : "—"}
                      </div>
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 13,
                          color: isPR ? T.accent : T.ink,
                          textAlign: "center",
                          fontWeight: isPR ? 600 : 400,
                        }}
                      >
                        {set.reps != null ? `${set.reps}` : "—"}
                        {isPR && (
                          <span
                            style={{
                              fontFamily: T.mono,
                              fontSize: 8,
                              color: T.accent,
                              marginLeft: 4,
                            }}
                          >
                            PR
                          </span>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Migration notice ─────────────────────────────────────────────────────────
function MigrationNotice() {
  const sql = `-- Run in Supabase SQL Editor
create table if not exists workout_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  logged_date date not null,
  exercise    text not null,
  set_number  int  not null,
  weight_kg   numeric,
  reps        int,
  notes       text,
  created_at  timestamptz default now() not null
);
create index if not exists workout_logs_user_date
  on workout_logs(user_id, logged_date desc);
create index if not exists workout_logs_user_exercise
  on workout_logs(user_id, exercise);
alter table workout_logs enable row level security;
create policy "Users manage own workout logs" on workout_logs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`;

  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <Label>Setup Required</Label>
      <div
        style={{
          fontFamily: T.serifT,
          fontSize: 15,
          color: T.ink,
          marginTop: 8,
          marginBottom: 16,
          lineHeight: 1.6,
        }}
      >
        Workout history needs a <em>workout_logs</em> table in Supabase. Run
        this migration once:
      </div>
      <pre
        style={{
          fontFamily: T.mono,
          fontSize: 10,
          color: T.stone,
          background: T.tint,
          padding: "14px 16px",
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

// ─── Main page content ────────────────────────────────────────────────────────
function TrainingPageContent() {
  const { user } = useAuth();
  const plan = usePlan();
  const { today } = useDashboardVM();

  const workoutMod = plan.modules.find((m) => m.type === "workout");
  const workoutData = workoutMod?.data as WorkoutModuleData | undefined;

  const {
    data: history,
    error: historyError,
    isLoading,
  } = useWorkoutHistory(user?.id);

  // Plan exercises + history exercises (history may include exercises removed from plan)
  const allExercises = useMemo<string[]>(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    if (workoutData) {
      for (const exList of Object.values(workoutData.split)) {
        for (const ex of exList) {
          const name = exerciseName(ex);
          if (!seen.has(name)) {
            seen.add(name);
            out.push(name);
          }
        }
      }
    }
    if (history) {
      for (const ex of history.exercises) {
        if (!seen.has(ex)) {
          seen.add(ex);
          out.push(ex);
        }
      }
    }
    return out;
  }, [workoutData, history]);

  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const activeExercise = selectedExercise || allExercises[0] || "";

  const needsMigration =
    historyError?.message?.includes("relation") ||
    historyError?.message?.includes("does not exist") ||
    historyError?.message?.includes("workout_logs");

  // Stats from history
  const totalSets = history?.totalSets ?? 0;
  const activeDays = history?.activeDays ?? 0;
  const prCount = history
    ? Object.values(history.byExercise).filter((e) => e.pr).length
    : 0;

  // Today's exercises
  const todayExercises = workoutData?.split?.[today.dayName] ?? [];
  const isRestDay = todayExercises.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: T.surface, color: T.ink }}>
      <style>{`
        @media (max-width: 768px) {
          .tr-main      { padding: 56px 16px 64px !important; }
          .tr-header-h1 { font-size: 24px !important; line-height: 1.1 !important; }
          .tr-stats     { grid-template-columns: repeat(2, 1fr) !important; }
          .tr-stats > div:nth-child(2) { border-right: none !important; }
          .tr-stats > div:nth-child(1),
          .tr-stats > div:nth-child(2) { border-bottom: 1px solid ${T.rule}; }
          .tr-cols      { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main
        className="tr-main"
        style={{
          paddingTop: 56,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "56px 48px 80px",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            paddingTop: 36,
            paddingBottom: 24,
            marginBottom: 32,
            borderBottom: `1px solid ${T.ink}`,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Label>Training</Label>
            <h1
              className="tr-header-h1"
              style={{
                fontFamily: T.serifD,
                fontSize: 40,
                color: T.ink,
                margin: "8px 0 0",
                lineHeight: 1.05,
              }}
            >
              {workoutData?.focus ?? "Workout Protocol"}
            </h1>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.stone,
                marginTop: 8,
              }}
            >
              {plan.metadata.level} · {plan.metadata.goal}
            </div>
          </div>
          <Link
            href="/commit"
            style={{
              padding: "10px 20px",
              background: T.ink,
              color: T.surface,
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isRestDay ? "Log Today" : `Log ${today.dayName} →`}
          </Link>
        </div>

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        <div
          className="tr-stats"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: `1px solid ${T.rule}`,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Today",
              value: isRestDay ? "Rest" : `${todayExercises.length} ex.`,
              color: isRestDay ? T.stone : T.ink,
            },
            { label: "Sets (60d)", value: String(totalSets), color: T.ink },
            { label: "Active Days", value: String(activeDays), color: T.ink },
            {
              label: "PRs Tracked",
              value: String(prCount),
              color: prCount > 0 ? T.accent : T.stone,
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "16px 20px",
                borderRight: i < 3 ? `1px solid ${T.rule}` : "none",
              }}
            >
              <Label>{stat.label}</Label>
              <div
                style={{
                  fontFamily: T.serifD,
                  fontSize: 32,
                  color: stat.color,
                  lineHeight: 1,
                  marginTop: 6,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Migration notice ────────────────────────────────────────────── */}
        {needsMigration && <MigrationNotice />}

        {/* ── Weekly split ───────────────────────────────────────────────── */}
        {workoutData && (
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Label>Weekly Split</Label>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  color: T.stone,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {
                  Object.values(workoutData.split).filter((e) => e.length > 0)
                    .length
                }
                /7 training days
              </span>
            </div>
            <SplitGrid
              split={workoutData.split}
              dayFocus={workoutData.dayFocus}
              todayName={today.dayName}
            />
          </div>
        )}

        {/* ── Two-column: exercise history + volume ───────────────────────── */}
        <div
          className="tr-cols"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 32,
            alignItems: "start",
          }}
        >
          {/* Exercise history */}
          <div>
            <Label>Exercise History</Label>
            <Hr />

            {/* Exercise picker */}
            {allExercises.length > 0 ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    margin: "12px 0 20px",
                  }}
                >
                  {allExercises.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setSelectedExercise(ex)}
                      style={{
                        padding: "5px 12px",
                        border: `1px solid ${activeExercise === ex ? T.ink : T.rule}`,
                        background:
                          activeExercise === ex ? T.ink : "transparent",
                        color: activeExercise === ex ? T.surface : T.stone,
                        fontFamily: T.mono,
                        fontSize: 9,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        transition: "all 0.1s",
                      }}
                    >
                      {ex}
                      {history?.byExercise[ex]?.pr && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: activeExercise === ex ? T.surface : T.accent,
                            fontSize: 8,
                          }}
                        >
                          PR
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Selected exercise detail */}
                {activeExercise && (
                  <div>
                    <div
                      style={{
                        fontFamily: T.serifT,
                        fontSize: 20,
                        fontStyle: "italic",
                        color: T.ink,
                        marginBottom: 16,
                      }}
                    >
                      {activeExercise}
                    </div>
                    {isLoading ? (
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 11,
                          color: T.stone,
                          padding: "16px 0",
                        }}
                      >
                        Loading…
                      </div>
                    ) : needsMigration ? (
                      <div
                        style={{
                          fontFamily: T.mono,
                          fontSize: 11,
                          color: T.stone,
                          padding: "16px 0",
                        }}
                      >
                        History unavailable — run migration above.
                      </div>
                    ) : (
                      <ExercisePanel
                        exercise={activeExercise}
                        history={history}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.stone,
                  padding: "24px 0",
                }}
              >
                No exercises in plan. Configure your workout split in{" "}
                <Link
                  href="/plan"
                  style={{
                    color: T.accent,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Plan settings
                </Link>
                .
              </div>
            )}
          </div>

          {/* Right column: volume + PRs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Volume chart */}
            <div>
              <Label>Volume · 8 Weeks</Label>
              <Hr />
              <div style={{ marginTop: 16 }}>
                {!needsMigration &&
                history &&
                history.weeklyVolume.some((w) => w.sets > 0) ? (
                  <VolumeChart weeks={history.weeklyVolume} />
                ) : (
                  <div
                    style={{
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: T.stone,
                      padding: "16px 0",
                    }}
                  >
                    {needsMigration
                      ? "Awaiting migration."
                      : "No data yet — log sessions to see trend."}
                  </div>
                )}
              </div>
            </div>

            {/* PRs summary */}
            {history && prCount > 0 && (
              <div>
                <Label>PRs</Label>
                <Hr />
                <div style={{ marginTop: 0 }}>
                  {Object.values(history.byExercise)
                    .filter((e) => e.pr)
                    .sort(
                      (a, b) => (b.pr?.weight_kg ?? 0) - (a.pr?.weight_kg ?? 0),
                    )
                    .map((entry, i, arr) => (
                      <div
                        key={entry.exercise}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom:
                            i < arr.length - 1 ? `1px solid ${T.rule}` : "none",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: T.mono,
                              fontSize: 9,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              color: T.stone,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {entry.exercise}
                          </div>
                        </div>
                        <div
                          style={{
                            fontFamily: T.mono,
                            fontSize: 11,
                            color: T.accent,
                            flexShrink: 0,
                            marginLeft: 12,
                          }}
                        >
                          {entry.pr!.weight_kg}kg × {entry.pr!.reps}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TrainingPage() {
  return <TrainingPageContent />;
}
