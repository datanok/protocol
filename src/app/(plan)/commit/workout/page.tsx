"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardVM } from "@/contexts/PlanContext";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstModule } from "@/lib/viewModels";
import type { WorkoutModuleData } from "@/types/schema";
import { saveWorkoutSession } from "@/actions/workoutActions";
import { Check, X, Plus, Minus } from "lucide-react";
import { T } from "@/lib/tokens";
import { exerciseName } from "@/lib/exercises";
import { ExerciseGifThumb } from "@/components/ExerciseGifThumb";

const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type SetLog = { weight: string; reps: string };
type ExerciseLogs = Record<string, SetLog[]>;

export default function WorkoutCommitFlow() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { today, modules } = useDashboardVM();

  const workoutMod = getFirstModule(modules, "workout");
  const workoutData = workoutMod?.data as WorkoutModuleData | undefined;

  // Which day's exercises to show — independent of the log date
  const [selectedDay, setSelectedDay] = useState<string>(today.dayName);

  // Log date — always today by default; user can override to backdate
  const todayYmd = toYmd(new Date());
  const [loggedDate, setLoggedDate] = useState<string>(todayYmd);

  const isBackdated = loggedDate !== todayYmd;
  const exercises = workoutData?.split[selectedDay] ?? [];
  const focus =
    workoutData?.dayFocus?.[selectedDay] ?? workoutData?.focus ?? "Workout";

  const dateLabel = new Date(loggedDate + "T12:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    },
  );

  // Max date = today; min = 7 days back (a week is enough for catch-up)
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toYmd(d);
  })();

  const [logs, setLogs] = useState<ExerciseLogs>(() =>
    Object.fromEntries(
      exercises.map((ex) => [exerciseName(ex), [{ weight: "", reps: "" }]]),
    ),
  );

  // Keep logs in sync whenever the selected day changes
  useEffect(() => {
    setLogs(
      Object.fromEntries(
        (workoutData?.split[selectedDay] ?? []).map((ex) => [
          exerciseName(ex),
          [{ weight: "", reps: "" }],
        ]),
      ),
    );
    // workoutData is stable; only reset when the day tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);
  const [notes, setNotes] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleDayChange(day: string) {
    setSelectedDay(day);
    setError(null);
  }

  const totalSets = Object.values(logs).reduce((a, s) => a + s.length, 0);
  const filledSets = Object.values(logs).reduce(
    (a, s) => a + s.filter((x) => x.weight || x.reps).length,
    0,
  );
  const pct = totalSets > 0 ? Math.round((filledSets / totalSets) * 100) : 0;

  function addSet(ex: string) {
    setLogs((p) => ({ ...p, [ex]: [...p[ex], { weight: "", reps: "" }] }));
  }
  function removeSet(ex: string, idx: number) {
    setLogs((p) => {
      const updated = p[ex].filter((_, i) => i !== idx);
      return {
        ...p,
        [ex]: updated.length ? updated : [{ weight: "", reps: "" }],
      };
    });
  }
  function updateSet(
    ex: string,
    idx: number,
    field: "weight" | "reps",
    value: string,
  ) {
    setLogs((p) => ({
      ...p,
      [ex]: p[ex].map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  async function handleCommit() {
    if (!user) return;
    setIsCommitting(true);
    setError(null);
    try {
      await saveWorkoutSession(user.id, loggedDate, logs, notes);
      qc.invalidateQueries({ queryKey: ["workout-history", user.id] });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save. Try again.",
      );
      setIsCommitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px 80px",
        fontFamily: T.sans,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          border: `1px solid ${T.rule}`,
          background: T.surface,
          display: "flex",
          flexDirection: "column",
          maxHeight: "92vh",
          position: "relative",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "20px 24px 18px",
            borderBottom: `1px solid ${T.rule}`,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 3,
              alignSelf: "stretch",
              background: T.accent,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 4,
              }}
            >
              Workout · {dateLabel}
              {isBackdated && (
                <span style={{ marginLeft: 8, color: T.accent }}>
                  ← backdated
                </span>
              )}
            </div>
            <h1
              style={{
                fontFamily: T.serifD,
                fontSize: 28,
                color: T.ink,
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {focus}
            </h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.stone,
              padding: 4,
              marginTop: -2,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* ── Exercise day selector ── */}
        <div style={{ borderBottom: `1px solid ${T.rule}` }}>
          <div
            style={{
              padding: "8px 24px 0",
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            Exercises from
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {DAY_FULL.map((day, i) => {
              const hasWork = (workoutData?.split[day] ?? []).length > 0;
              const isActive = day === selectedDay;
              const isTodayDay = day === today.dayName;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayChange(day)}
                  style={{
                    padding: "8px 0",
                    background: isActive ? T.ink : "transparent",
                    cursor: "pointer",
                    border: "none",
                    borderRight: i < 6 ? `1px solid ${T.rule}` : "none",
                    borderBottom: isActive
                      ? `3px solid ${T.accent}`
                      : "3px solid transparent",
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
                      letterSpacing: "0.1em",
                      color: isActive
                        ? T.surface
                        : isTodayDay
                          ? T.accent
                          : T.stone,
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
                          : isTodayDay
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
        </div>

        {/* ── Log date (optional override) ── */}
        <div
          style={{
            padding: "10px 24px",
            borderBottom: `1px solid ${T.rule}`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            background: T.tint,
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.stone,
              flexShrink: 0,
            }}
          >
            Log date
          </span>
          <input
            type="date"
            value={loggedDate}
            min={minDate}
            max={todayYmd}
            onChange={(e) => setLoggedDate(e.target.value || todayYmd)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${T.ruleDark}`,
              color: isBackdated ? T.accent : T.stone,
              fontFamily: T.mono,
              fontSize: 11,
              outline: "none",
              cursor: "pointer",
              colorScheme: "dark",
              padding: "2px 4px",
            }}
          />
          {isBackdated && (
            <button
              onClick={() => setLoggedDate(todayYmd)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 9,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: T.stone,
                padding: 0,
                marginLeft: "auto",
              }}
            >
              reset to today
            </button>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div
          style={{
            padding: "10px 24px",
            borderBottom: `1px solid ${T.rule}`,
            display: "flex",
            alignItems: "center",
            gap: 24,
            background: T.tint,
          }}
        >
          {[
            ["Exercises", exercises.length],
            ["Sets", totalSets],
            ["Logged", `${filledSets}/${totalSets}`],
          ].map(([label, val]) => (
            <div key={label as string}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 2,
                }}
              >
                {label}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 14, color: T.ink }}>
                {val}
              </div>
            </div>
          ))}
          <div
            style={{
              flex: 1,
              height: 2,
              background: T.rule,
              position: "relative",
              marginLeft: 8,
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
                transform: `scaleX(${(pct / 100).toFixed(3)})`,
                transformOrigin: "left center",
                transition: "transform 0.25s ease-out",
              }}
            />
          </div>
        </div>

        {/* ── Scrollable exercise list ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "20px 24px 0" }}>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: T.stone,
                marginBottom: 16,
              }}
            >
              Performance Log
            </div>

            {exercises.length === 0 ? (
              <div
                style={{
                  padding: "40px 0",
                  textAlign: "center",
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.stone,
                }}
              >
                No exercises scheduled for {selectedDay}.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {exercises.map((ex, exIdx) => {
                  const name = exerciseName(ex);
                  return (
                    <div
                      key={name}
                      style={{
                        borderBottom: `1px solid ${T.rule}`,
                        paddingBottom: 16,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: T.mono,
                            fontSize: 10,
                            color: T.stone,
                            width: 20,
                            textAlign: "right",
                            flexShrink: 0,
                          }}
                        >
                          {String(exIdx + 1).padStart(2, "0")}
                        </span>
                        <ExerciseGifThumb label={exerciseName(ex)} />
                        <span
                          style={{
                            flex: 1,
                            fontFamily: T.sans,
                            fontSize: 13,
                            fontWeight: 500,
                            color: T.ink,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          {name}
                        </span>
                        <button
                          type="button"
                          onClick={() => addSet(name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: T.mono,
                            fontSize: 10,
                            color: T.stone,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          <Plus style={{ width: 11, height: 11 }} /> Set
                        </button>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "28px 1fr 1fr 24px",
                          gap: 8,
                          padding: "0 0 6px",
                          marginLeft: 30,
                        }}
                      >
                        {["SET", "KG", "REPS", ""].map((h) => (
                          <span
                            key={h}
                            style={{
                              fontFamily: T.mono,
                              fontSize: 9,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: T.stone,
                              textAlign: "center",
                            }}
                          >
                            {h}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          marginLeft: 30,
                        }}
                      >
                        {(logs[name] ?? []).map((set, setIdx) => (
                          <div
                            key={setIdx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "28px 1fr 1fr 24px",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: T.mono,
                                fontSize: 11,
                                color: T.accent,
                                textAlign: "center",
                                fontWeight: 600,
                              }}
                            >
                              {setIdx + 1}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={set.weight}
                              onChange={(e) =>
                                updateSet(
                                  name,
                                  setIdx,
                                  "weight",
                                  e.target.value,
                                )
                              }
                              placeholder="—"
                              style={{
                                background: T.tint,
                                border: `1px solid ${T.rule}`,
                                outline: "none",
                                padding: "6px 4px",
                                fontFamily: T.mono,
                                fontSize: 12,
                                color: T.ink,
                                textAlign: "center",
                                width: "100%",
                                boxSizing: "border-box",
                              }}
                            />
                            <input
                              type="number"
                              min="0"
                              value={set.reps}
                              onChange={(e) =>
                                updateSet(name, setIdx, "reps", e.target.value)
                              }
                              placeholder="—"
                              style={{
                                background: T.tint,
                                border: `1px solid ${T.rule}`,
                                outline: "none",
                                padding: "6px 4px",
                                fontFamily: T.mono,
                                fontSize: 12,
                                color: T.ink,
                                textAlign: "center",
                                width: "100%",
                                boxSizing: "border-box",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeSet(name, setIdx)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: T.stone,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Minus style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ padding: "0 24px 24px" }}>
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
              Session Notes
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{
                width: "100%",
                background: T.tint,
                border: `1px solid ${T.rule}`,
                outline: "none",
                padding: "10px 12px",
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

        {error && (
          <div
            style={{
              padding: "10px 24px",
              background: T.tint,
              borderTop: `1px solid ${T.rule}`,
              fontFamily: T.mono,
              fontSize: 11,
              color: T.negative,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Commit ── */}
        <button
          onClick={handleCommit}
          disabled={isCommitting || success || exercises.length === 0}
          style={{
            width: "100%",
            padding: "16px 0",
            flexShrink: 0,
            background: isCommitting || success ? T.tint : T.ink,
            color: isCommitting || success ? T.stone : T.surface,
            border: "none",
            cursor:
              isCommitting || success || exercises.length === 0
                ? "not-allowed"
                : "pointer",
            fontFamily: T.mono,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            borderTop: `1px solid ${T.rule}`,
            transition: "background 0.15s",
          }}
        >
          {isCommitting ? "Saving…" : "Commit Workout"}
        </button>
      </div>

      {success && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: T.surface,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              border: `1px solid ${T.ink}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check style={{ width: 28, height: 28, color: T.positive }} />
          </div>
          <div style={{ fontFamily: T.serifD, fontSize: 28, color: T.ink }}>
            Workout committed.
          </div>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            {selectedDay !== today.dayName
              ? `${selectedDay}'s exercises · `
              : ""}
            {dateLabel}
          </div>
        </div>
      )}
    </div>
  );
}
