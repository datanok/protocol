import type { WorkoutModuleData, ExerciseEntry } from "@/types/schema";
import { T } from "@/lib/tokens";
import { exerciseName } from "@/lib/exercises";

const DAY_FULL: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

interface TrainingWeekGridProps {
  workoutData: WorkoutModuleData;
  dayLabels: string[]; // e.g. ['MON','TUE',...]
  dateLabels: string[]; // e.g. ['5 JAN','6 JAN',...]  (display)
  ymdLabels?: string[]; // e.g. ['2026-06-16','2026-06-17',...]  (for commit lookup)
  committedDates?: string[]; // YYYY-MM-DD strings for days with a commit
  maxExercises?: number; // truncate; undefined = show all
}

export default function TrainingWeekGrid({
  workoutData,
  dayLabels,
  dateLabels,
  ymdLabels,
  committedDates,
  maxExercises,
}: TrainingWeekGridProps) {
  const commitSet = new Set(committedDates ?? []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        border: `1px solid ${T.rule}`,
      }}
    >
      {dayLabels.map((label, i) => {
        const isToday = i === dayLabels.length - 1;
        const exercises = workoutData.split?.[DAY_FULL[label] ?? label] ?? [];
        const isRest = exercises.length === 0;
        const committed =
          committedDates != null && ymdLabels != null
            ? commitSet.has(ymdLabels[i] ?? "")
            : null;

        return (
          <div
            key={i}
            style={{
              borderRight: i < 6 ? `1px solid ${T.rule}` : "none",
              background: isToday ? T.tint : "transparent",
              padding: "12px 10px",
              minHeight: 88,
            }}
          >
            {/* Commit dot (only when data supplied) */}
            {committed !== null && (
              <div
                style={{
                  width: 4,
                  height: 4,
                  background: committed ? T.positive : T.rule,
                  marginBottom: 6,
                }}
              />
            )}

            {/* Day label */}
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isToday ? T.accent : T.stone,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  color: T.stone,
                  marginTop: 1,
                }}
              >
                {dateLabels[i]}
              </div>
            </div>

            {/* Exercises */}
            {isRest ? (
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  color: T.stone,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Rest
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {(maxExercises != null
                  ? exercises.slice(0, maxExercises)
                  : exercises
                ).map((ex: ExerciseEntry, ei: number) => (
                  <div
                    key={ei}
                    style={{
                      fontFamily: T.mono,
                      fontSize: 9,
                      color: isToday ? T.ink : T.stone,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      lineHeight: 1.4,
                    }}
                  >
                    {exerciseName(ex)}
                  </div>
                ))}
                {maxExercises != null && exercises.length > maxExercises && (
                  <div
                    style={{ fontFamily: T.mono, fontSize: 9, color: T.stone }}
                  >
                    +{exercises.length - maxExercises}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
