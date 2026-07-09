"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createPlan } from "@/actions/planActions";
import { generatePlan } from "@/actions/generatePlanAction";
import { Loader2, Plus, Trash2 } from "lucide-react";

const T = {
  surface: "var(--folio-surface)",
  tint: "var(--folio-tint)",
  ink: "var(--folio-ink)",
  stone: "var(--folio-stone)",
  rule: "var(--folio-rule)",
  accent: "var(--folio-accent)",
  negative: "var(--folio-negative)",
  positive: "var(--folio-positive)",
  mono: "var(--font-mono)",
  serifD: "var(--font-serif-display)",
  serifT: "var(--font-serif-display)",
};

const TYPE_ACCENTS: Record<string, string> = {
  workout: T.accent,
  skill: "#5B7FA6",
  study: "#7A5C8A",
  nutrition: "#2E7D32",
};

// ─── Shared form primitives ───────────────────────────────────────────────────
function FInput({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      {label && (
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
            marginBottom: 6,
          }}
        >
          {label}
          {required && <span style={{ color: T.accent }}> *</span>}
        </div>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "8px 10px",
          fontFamily: T.mono,
          fontSize: 11,
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
    </div>
  );
}

function FSelect({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      {label && (
        <div
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          background: T.tint,
          border: `1px solid ${T.rule}`,
          outline: "none",
          padding: "8px 10px",
          fontFamily: T.mono,
          fontSize: 11,
          color: T.ink,
          boxSizing: "border-box",
          appearance: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ModuleShell({
  type,
  title,
  onRemove,
  children,
}: {
  type: string;
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const accent = TYPE_ACCENTS[type] ?? T.stone;
  return (
    <div
      style={{
        border: `1px solid ${T.rule}`,
        position: "relative",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accent,
        }}
      />
      <div
        style={{
          padding: "12px 16px 10px 20px",
          borderBottom: `1px solid ${T.rule}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{ width: 6, height: 6, background: accent, flexShrink: 0 }}
        />
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
          }}
        >
          {type}
        </span>
        <span
          style={{
            fontFamily: T.serifT,
            fontSize: 15,
            fontStyle: "italic",
            color: T.ink,
            flex: 1,
          }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.stone,
            display: "flex",
            padding: 4,
          }}
        >
          <Trash2 style={{ width: 13, height: 13 }} />
        </button>
      </div>
      <div style={{ padding: "16px 20px" }}>{children}</div>
    </div>
  );
}

// ─── State types ──────────────────────────────────────────────────────────────
type NodeState = {
  id: string;
  title: string;
  type: string;
  metric: { type: string; label?: string; target?: number; max?: number };
};
type WorkoutState = {
  title: string;
  focus: string;
  split: Record<string, string[]>;
};
type SkillState = { title: string; subject: string; nodes: NodeState[] };
type StudyState = {
  title: string;
  subject: string;
  dailyGoalMin: number;
  nodes: NodeState[];
};
type NutritionState = {
  title: string;
  wfo: string;
  wfh: string;
  notes: string;
};
type HabitState = { id: string; name: string; category: string };

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const NODE_TYPES = [
  "milestone",
  "technique",
  "project",
  "concept",
  "drill",
  "performance",
  "chapter",
  "exercise",
  "review",
];
const HABIT_CATS = ["fitness", "skill", "lifestyle", "study", "health"];
const METRIC_TYPES = [
  { value: "none", label: "No metric" },
  { value: "bpm", label: "BPM / tempo" },
  { value: "confidence", label: "Confidence (1–5)" },
  { value: "count", label: "Count / reps" },
];

function uid() {
  return Math.random().toString(36).slice(2, 8);
}
function slug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Node editor row ──────────────────────────────────────────────────────────
function NodeRow({
  node,
  onChange,
  onRemove,
}: {
  node: NodeState;
  onChange: (n: NodeState) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 120px 130px 28px",
        gap: 8,
        alignItems: "start",
        marginBottom: 8,
      }}
    >
      <FInput
        value={node.title}
        onChange={(v) => onChange({ ...node, title: v })}
        placeholder="Node title…"
      />
      <FSelect
        value={node.type}
        onChange={(v) => onChange({ ...node, type: v })}
        options={NODE_TYPES.map((t) => ({ value: t, label: t }))}
      />
      <FSelect
        value={node.metric.type}
        onChange={(v) => {
          const defaults: Record<string, object> = {
            bpm: { type: "bpm", label: "Target BPM", target: 60 },
            confidence: { type: "confidence", label: "Confidence", max: 5 },
            count: { type: "count", label: "Count", target: 10 },
            none: { type: "none" },
          };
          onChange({
            ...node,
            metric: (defaults[v] ?? { type: "none" }) as NodeState["metric"],
          });
        }}
        options={METRIC_TYPES}
      />
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: T.stone,
          padding: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        <Trash2 style={{ width: 11, height: 11 }} />
      </button>
    </div>
  );
}

// ─── Workout split grid ───────────────────────────────────────────────────────
function WorkoutSplitEditor({
  split,
  onChange,
}: {
  split: Record<string, string[]>;
  onChange: (s: Record<string, string[]>) => void;
}) {
  function addExercise(day: string) {
    onChange({ ...split, [day]: [...(split[day] ?? []), ""] });
  }
  function updateExercise(day: string, idx: number, val: string) {
    const arr = [...(split[day] ?? [])];
    arr[idx] = val;
    onChange({ ...split, [day]: arr });
  }
  function removeExercise(day: string, idx: number) {
    onChange({
      ...split,
      [day]: (split[day] ?? []).filter((_, i) => i !== idx),
    });
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: 0,
        border: `1px solid ${T.rule}`,
      }}
    >
      {DAYS.map((day, di) => (
        <div
          key={day}
          style={{ borderRight: di < 6 ? `1px solid ${T.rule}` : "none" }}
        >
          {/* Day header */}
          <div
            style={{
              padding: "6px 8px",
              borderBottom: `1px solid ${T.rule}`,
              background: T.tint,
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 8,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: T.stone,
              }}
            >
              {day.slice(0, 3)}
            </div>
          </div>
          {/* Exercises */}
          <div style={{ padding: 6, minHeight: 64 }}>
            {(split[day] ?? []).map((ex, ei) => (
              <div
                key={ei}
                style={{ display: "flex", gap: 4, marginBottom: 4 }}
              >
                <input
                  value={ex}
                  onChange={(e) => updateExercise(day, ei, e.target.value)}
                  placeholder="Exercise…"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: `1px solid ${T.rule}`,
                    outline: "none",
                    padding: "3px 6px",
                    fontFamily: T.mono,
                    fontSize: 9,
                    color: T.ink,
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    ((e.target as HTMLInputElement).style.borderColor =
                      T.accent)
                  }
                  onBlur={(e) =>
                    ((e.target as HTMLInputElement).style.borderColor = T.rule)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeExercise(day, ei)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.stone,
                    padding: "2px 3px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 style={{ width: 9, height: 9 }} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addExercise(day)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 8,
                color: T.stone,
                display: "flex",
                alignItems: "center",
                gap: 2,
                padding: "2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Plus style={{ width: 8, height: 8 }} /> Add
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Manual builder ───────────────────────────────────────────────────────────
function ManualBuilder({ user }: { user: { id: string } }) {
  const router = useRouter();

  // Metadata
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("beginner");

  // Modules
  const [workout, setWorkout] = useState<WorkoutState | null>(null);
  const [skill, setSkill] = useState<SkillState | null>(null);
  const [study, setStudy] = useState<StudyState | null>(null);
  const [nutrition, setNutrition] = useState<NutritionState | null>(null);

  // Habits
  const [habits, setHabits] = useState<HabitState[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Add module helpers ─────────────────────────────────────────────────────
  function addWorkout() {
    if (!workout)
      setWorkout({
        title: "Training Protocol",
        focus: "",
        split: Object.fromEntries(DAYS.map((d) => [d, []])),
      });
  }
  function addSkill() {
    if (!skill)
      setSkill({ title: "Skill Development", subject: "", nodes: [] });
  }
  function addStudy() {
    if (!study)
      setStudy({
        title: "Study Protocol",
        subject: "",
        dailyGoalMin: 30,
        nodes: [],
      });
  }
  function addNutrition() {
    if (!nutrition)
      setNutrition({
        title: "Nutrition Protocol",
        wfo: "",
        wfh: "",
        notes: "",
      });
  }

  // ── Node helpers ───────────────────────────────────────────────────────────
  function addNode(list: NodeState[]): NodeState[] {
    return [
      ...list,
      { id: uid(), title: "", type: "milestone", metric: { type: "none" } },
    ];
  }
  function updateNode(
    list: NodeState[],
    id: string,
    updated: NodeState,
  ): NodeState[] {
    return list.map((n) => (n.id === id ? updated : n));
  }
  function removeNode(list: NodeState[], id: string): NodeState[] {
    return list.filter((n) => n.id !== id);
  }

  // ── Habit helpers ──────────────────────────────────────────────────────────
  function addHabit() {
    setHabits((h) => [...h, { id: uid(), name: "", category: "lifestyle" }]);
  }
  function removeHabit(id: string) {
    setHabits((h) => h.filter((x) => x.id !== id));
  }
  function updateHabit(id: string, patch: Partial<HabitState>) {
    setHabits((h) => h.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!goal.trim()) {
      setError("Goal is required.");
      return;
    }
    if (!workout && !skill && !study && !nutrition) {
      setError("Add at least one module.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const mods: object[] = [];
      let order = 1;

      if (workout)
        mods.push({
          id: "workout-main",
          type: "workout",
          title: workout.title,
          order: order++,
          data: { focus: workout.focus, split: workout.split },
        });
      if (skill)
        mods.push({
          id: "skill-main",
          type: "skill",
          title: skill.title,
          order: order++,
          data: {
            subject: skill.subject,
            nodes: skill.nodes.map((n) => ({
              id: slug(n.title) || n.id,
              title: n.title,
              type: n.type,
              metric: n.metric,
            })),
          },
        });
      if (study)
        mods.push({
          id: "study-main",
          type: "study",
          title: study.title,
          order: order++,
          data: {
            subject: study.subject,
            dailyGoalMin: study.dailyGoalMin,
            nodes: study.nodes.map((n) => ({
              id: slug(n.title) || n.id,
              title: n.title,
              type: n.type,
              metric: n.metric,
            })),
          },
        });
      if (nutrition)
        mods.push({
          id: "nutrition-main",
          type: "nutrition",
          title: nutrition.title,
          order: order++,
          data: {
            wfo: nutrition.wfo,
            wfh: nutrition.wfh,
            notes: nutrition.notes,
          },
        });

      const planTypes = [
        workout && "workout",
        skill && "skill",
        study && "study",
        nutrition && "nutrition",
      ].filter(Boolean);

      const plan = {
        metadata: {
          ...(title.trim() && { title: title.trim() }),
          goal: goal.trim(),
          level,
          version: 2,
          planType: planTypes.join("+"),
        },
        habits: habits
          .filter((h) => h.name.trim())
          .map((h) => ({
            id: slug(h.name) || h.id,
            name: h.name,
            category: h.category,
          })),
        modules: mods,
      };

      await createPlan(user.id, plan as Record<string, unknown>);
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setLoading(false);
    }
  };

  const hasModules = !!(workout || skill || study || nutrition);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* ── Metadata ───────────────────────────────────────────────────────── */}
      <div style={{ border: `1px solid ${T.rule}`, marginBottom: 12 }}>
        <div
          style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${T.rule}`,
            background: T.tint,
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
            Plan Basics
          </div>
        </div>
        <div style={{ padding: "16px", display: "grid", gap: 12 }}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <FInput
              label="Plan Title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. Summer Shred, Year of Guitar"
            />
            <FSelect
              label="Level"
              value={level}
              onChange={setLevel}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
          </div>
          <FInput
            label="Goal"
            value={goal}
            onChange={setGoal}
            placeholder="e.g. Build muscle and learn Spanish"
            required
          />
        </div>
      </div>

      {/* ── Add module buttons ─────────────────────────────────────────────── */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.stone,
            alignSelf: "center",
          }}
        >
          Add module:
        </span>
        {(
          [
            {
              type: "workout",
              label: "+ Workout",
              disabled: !!workout,
              action: addWorkout,
            },
            {
              type: "skill",
              label: "+ Skill",
              disabled: !!skill,
              action: addSkill,
            },
            {
              type: "study",
              label: "+ Study",
              disabled: !!study,
              action: addStudy,
            },
            {
              type: "nutrition",
              label: "+ Nutrition",
              disabled: !!nutrition,
              action: addNutrition,
            },
          ] as const
        ).map((btn) => (
          <button
            key={btn.type}
            type="button"
            onClick={btn.action}
            disabled={btn.disabled}
            style={{
              padding: "5px 12px",
              border: `1px solid ${btn.disabled ? T.rule : (TYPE_ACCENTS[btn.type] ?? T.rule)}`,
              background: btn.disabled ? T.tint : "transparent",
              color: btn.disabled ? T.stone : TYPE_ACCENTS[btn.type],
              fontFamily: T.mono,
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: btn.disabled ? "not-allowed" : "pointer",
              opacity: btn.disabled ? 0.5 : 1,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ── Workout ────────────────────────────────────────────────────────── */}
      {workout && (
        <ModuleShell
          type="workout"
          title={workout.title}
          onRemove={() => setWorkout(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <FInput
              label="Module title"
              value={workout.title}
              onChange={(v) => setWorkout({ ...workout, title: v })}
              placeholder="Training Protocol"
            />
            <FInput
              label="Training focus"
              value={workout.focus}
              onChange={(v) => setWorkout({ ...workout, focus: v })}
              placeholder="e.g. Hypertrophy, Strength, Calisthenics"
            />
          </div>
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
            Weekly Split
          </div>
          <WorkoutSplitEditor
            split={workout.split}
            onChange={(s) => setWorkout({ ...workout, split: s })}
          />
        </ModuleShell>
      )}

      {/* ── Skill ──────────────────────────────────────────────────────────── */}
      {skill && (
        <ModuleShell
          type="skill"
          title={skill.title}
          onRemove={() => setSkill(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <FInput
              label="Module title"
              value={skill.title}
              onChange={(v) => setSkill({ ...skill, title: v })}
            />
            <FInput
              label="Subject"
              value={skill.subject}
              onChange={(v) => setSkill({ ...skill, subject: v })}
              placeholder="e.g. Guitar, Python, Spanish"
            />
          </div>
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
            Nodes{" "}
            <span style={{ color: T.stone }}>
              — milestones, techniques, projects
            </span>
          </div>
          {/* Column headers */}
          {skill.nodes.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 130px 28px",
                gap: 8,
                marginBottom: 4,
              }}
            >
              {["Title", "Type", "Metric", ""].map((h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: T.mono,
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.stone,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          )}
          {skill.nodes.map((n) => (
            <NodeRow
              key={n.id}
              node={n}
              onChange={(updated) =>
                setSkill({
                  ...skill,
                  nodes: updateNode(skill.nodes, n.id, updated),
                })
              }
              onRemove={() =>
                setSkill({ ...skill, nodes: removeNode(skill.nodes, n.id) })
              }
            />
          ))}
          <button
            type="button"
            onClick={() => setSkill({ ...skill, nodes: addNode(skill.nodes) })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 9,
              color: T.stone,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 0",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Plus style={{ width: 10, height: 10 }} /> Add Node
          </button>
        </ModuleShell>
      )}

      {/* ── Study ──────────────────────────────────────────────────────────── */}
      {study && (
        <ModuleShell
          type="study"
          title={study.title}
          onRemove={() => setStudy(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 120px",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <FInput
              label="Module title"
              value={study.title}
              onChange={(v) => setStudy({ ...study, title: v })}
            />
            <FInput
              label="Subject"
              value={study.subject}
              onChange={(v) => setStudy({ ...study, subject: v })}
              placeholder="e.g. System Design, TypeScript"
            />
            <div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 6,
                }}
              >
                Daily goal (min)
              </div>
              <input
                type="number"
                min={5}
                value={study.dailyGoalMin}
                onChange={(e) =>
                  setStudy({
                    ...study,
                    dailyGoalMin: Math.max(5, Number(e.target.value)),
                  })
                }
                style={{
                  width: "100%",
                  background: T.tint,
                  border: `1px solid ${T.rule}`,
                  outline: "none",
                  padding: "8px 10px",
                  fontFamily: T.mono,
                  fontSize: 11,
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
            </div>
          </div>
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
            Nodes{" "}
            <span style={{ color: T.stone }}>
              — concepts, chapters, projects
            </span>
          </div>
          {study.nodes.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 130px 28px",
                gap: 8,
                marginBottom: 4,
              }}
            >
              {["Title", "Type", "Metric", ""].map((h) => (
                <div
                  key={h}
                  style={{
                    fontFamily: T.mono,
                    fontSize: 8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: T.stone,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
          )}
          {study.nodes.map((n) => (
            <NodeRow
              key={n.id}
              node={n}
              onChange={(updated) =>
                setStudy({
                  ...study,
                  nodes: updateNode(study.nodes, n.id, updated),
                })
              }
              onRemove={() =>
                setStudy({ ...study, nodes: removeNode(study.nodes, n.id) })
              }
            />
          ))}
          <button
            type="button"
            onClick={() => setStudy({ ...study, nodes: addNode(study.nodes) })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 9,
              color: T.stone,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 0",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Plus style={{ width: 10, height: 10 }} /> Add Node
          </button>
        </ModuleShell>
      )}

      {/* ── Nutrition ──────────────────────────────────────────────────────── */}
      {nutrition && (
        <ModuleShell
          type="nutrition"
          title={nutrition.title}
          onRemove={() => setNutrition(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <FInput
              label="Module title"
              value={nutrition.title}
              onChange={(v) => setNutrition({ ...nutrition, title: v })}
            />
            <div />
            <FInput
              label="Office days target"
              value={nutrition.wfo}
              onChange={(v) => setNutrition({ ...nutrition, wfo: v })}
              placeholder="e.g. 2400 kcal, high protein"
            />
            <FInput
              label="Home days target"
              value={nutrition.wfh}
              onChange={(v) => setNutrition({ ...nutrition, wfh: v })}
              placeholder="e.g. 2200 kcal, flexible"
            />
          </div>
          <FInput
            label="Notes / strategy"
            value={nutrition.notes}
            onChange={(v) => setNutrition({ ...nutrition, notes: v })}
            placeholder="Any dietary notes, restrictions, strategies…"
          />
        </ModuleShell>
      )}

      {/* ── Habits ─────────────────────────────────────────────────────────── */}
      <div style={{ border: `1px solid ${T.rule}`, marginBottom: 12 }}>
        <div
          style={{
            padding: "10px 16px",
            borderBottom: habits.length > 0 ? `1px solid ${T.rule}` : "none",
            background: T.tint,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            Habits <span style={{ color: T.stone }}>({habits.length})</span>
          </div>
          <button
            type="button"
            onClick={addHabit}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 9,
              color: T.stone,
              display: "flex",
              alignItems: "center",
              gap: 4,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <Plus style={{ width: 10, height: 10 }} /> Add
          </button>
        </div>
        {habits.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {habits.map((h) => (
              <div
                key={h.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px 28px",
                  gap: 8,
                  alignItems: "start",
                }}
              >
                <FInput
                  value={h.name}
                  onChange={(v) => updateHabit(h.id, { name: v })}
                  placeholder="Habit name…"
                />
                <FSelect
                  value={h.category}
                  onChange={(v) => updateHabit(h.id, { category: v })}
                  options={HABIT_CATS.map((c) => ({ value: c, label: c }))}
                />
                <button
                  type="button"
                  onClick={() => removeHabit(h.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: T.stone,
                    padding: 6,
                    display: "flex",
                    alignItems: "center",
                    marginTop: 1,
                  }}
                >
                  <Trash2 style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Error + Save ───────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            marginBottom: 12,
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 4,
        }}
      >
        <a
          href="/dashboard"
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.stone,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Cancel
        </a>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading || !goal.trim() || !hasModules}
          style={{
            padding: "10px 28px",
            background: loading || !goal.trim() || !hasModules ? T.tint : T.ink,
            color: loading || !goal.trim() || !hasModules ? T.stone : T.surface,
            border: `1px solid ${loading || !goal.trim() || !hasModules ? T.rule : T.ink}`,
            cursor:
              loading || !goal.trim() || !hasModules
                ? "not-allowed"
                : "pointer",
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <Loader2
                style={{
                  width: 12,
                  height: 12,
                  animation: "spin 1s linear infinite",
                }}
              />
              Creating…
            </>
          ) : (
            "Create Plan"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── AI Generator ─────────────────────────────────────────────────────────────
function AIGenerator({
  user,
  accessToken,
}: {
  user: { id: string };
  accessToken: string;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    const result = await generatePlan(user.id, input.trim(), accessToken);
    if (result.ok) {
      window.location.href = "/dashboard";
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${T.rule}`, maxWidth: 640 }}>
      <div
        style={{ padding: "16px 20px", borderBottom: `1px solid ${T.rule}` }}
      >
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
          Generate with AI
        </div>
        <div
          style={{
            fontFamily: T.serifT,
            fontSize: 18,
            fontStyle: "italic",
            color: T.ink,
          }}
        >
          Describe your goals
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: `1px solid ${T.negative}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.negative }}>
            {error}
          </span>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            style={{
              background: "none",
              border: `1px solid ${T.negative}`,
              padding: "4px 12px",
              cursor: "pointer",
              fontFamily: T.mono,
              fontSize: 9,
              color: T.negative,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ padding: "20px" }}>
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
          Your Goals
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          rows={6}
          placeholder="e.g. I want to train 4 days a week for hypertrophy, learn guitar on the side, and track sleep and water as habits. I'd also like to log my daily reading time and keep a list of books to read. Intermediate level, home gym."
          style={{
            width: "100%",
            background: T.tint,
            border: `1px solid ${T.rule}`,
            outline: "none",
            padding: "12px 14px",
            fontFamily: T.mono,
            fontSize: 11,
            color: T.ink,
            resize: "none",
            boxSizing: "border-box",
            lineHeight: 1.6,
            opacity: loading ? 0.5 : 1,
          }}
          onFocus={(e) =>
            ((e.target as HTMLTextAreaElement).style.borderColor = T.accent)
          }
          onBlur={(e) =>
            ((e.target as HTMLTextAreaElement).style.borderColor = T.rule)
          }
        />
      </div>

      <div
        style={{
          padding: "14px 20px",
          borderTop: `1px solid ${T.rule}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <a
          href="/dashboard"
          style={{
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: T.stone,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Cancel
        </a>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 28px",
            background: !loading && input.trim() ? T.ink : T.tint,
            color: !loading && input.trim() ? T.surface : T.stone,
            border: `1px solid ${!loading && input.trim() ? T.ink : T.rule}`,
            cursor: !loading && input.trim() ? "pointer" : "not-allowed",
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? (
            <>
              <Loader2
                style={{
                  width: 12,
                  height: 12,
                  animation: "spin 1s linear infinite",
                }}
              />
              Generating…
            </>
          ) : (
            "Generate Plan →"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  if (!user || !session) {
    router.push("/login");
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.surface,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "48px 24px 80px",
        fontFamily: T.mono,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
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
            Plan Builder
          </div>
          <h1
            style={{
              fontFamily: T.serifD,
              fontSize: 36,
              color: T.ink,
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Build a new plan.
          </h1>
        </div>

        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: 28,
            borderBottom: `1px solid ${T.rule}`,
          }}
        >
          {(
            [
              { key: "manual", label: "Manual" },
              { key: "ai", label: "Generate with AI" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: mode === tab.key ? T.ink : T.stone,
                borderBottom: `2px solid ${mode === tab.key ? T.ink : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "manual" ? (
          <ManualBuilder user={user} />
        ) : (
          <AIGenerator user={user} accessToken={session.access_token} />
        )}
      </div>
    </div>
  );
}
