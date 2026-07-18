"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Share2,
  X,
} from "lucide-react";
import { publishTemplate, getMyProfile } from "@/actions/templateActions";

import { usePlan, usePlanId } from "@/contexts/PlanContext";
import AppTopNav from "@/components/navigation/AppTopNav";
import { useAuth } from "@/contexts/AuthContext";
import { updatePlan, deletePlan } from "@/actions/planActions";
import {
  useUserPlans,
  useInvalidatePlans,
  activatePlan,
} from "@/hooks/useUserPlans";
import type {
  AestheticOSPlan,
  PlanModule,
  WorkoutModuleData,
  SkillModuleData,
  StudyModuleData,
  NutritionModuleData,
  ModuleNode,
  Habit,
} from "@/types/schema";

import { T } from "@/lib/tokens";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function deepClone<V>(v: V): V {
  return JSON.parse(JSON.stringify(v));
}
function slug() {
  return Math.random().toString(36).slice(2, 9);
}

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
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function Hr() {
  return (
    <div
      style={{ height: 1, background: T.rule, width: "100%", margin: "0" }}
    />
  );
}

function ProtocolInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: "transparent",
        borderBottom: `1px solid ${T.rule}`,
        border: "none",
        borderBottomStyle: "solid" as const,
        borderBottomWidth: 1,
        borderBottomColor: T.rule,
        outline: "none",
        fontFamily: mono ? T.mono : T.sans,
        fontSize: mono ? 12 : 14,
        color: T.ink,
        padding: "6px 0",
        boxSizing: "border-box" as const,
      }}
      onFocus={(e) =>
        ((e.target as HTMLInputElement).style.borderBottomColor = T.accent)
      }
      onBlur={(e) =>
        ((e.target as HTMLInputElement).style.borderBottomColor = T.rule)
      }
    />
  );
}

function ProtocolTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
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
        boxSizing: "border-box" as const,
        lineHeight: 1.5,
        transition: "border-color 0.1s",
      }}
      onFocus={(e) =>
        ((e.target as HTMLTextAreaElement).style.borderColor = T.accent)
      }
      onBlur={(e) =>
        ((e.target as HTMLTextAreaElement).style.borderColor = T.rule)
      }
    />
  );
}

function ProtocolSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
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
        cursor: "pointer",
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ─── Section shell (collapsible) ──────────────────────────────────────────────

function SectionShell({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${T.rule}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.ink,
        }}
      >
        <span>{label}</span>
        {open ? (
          <ChevronUp style={{ width: 14, height: 14, color: T.stone }} />
        ) : (
          <ChevronDown style={{ width: 14, height: 14, color: T.stone }} />
        )}
      </button>
      {open && (
        <div
          style={{
            borderTop: `1px solid ${T.rule}`,
            padding: "20px 20px 24px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Module section shell (with type accent line) ─────────────────────────────

function ModuleSectionShell({
  type,
  title,
  children,
}: {
  type: string;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const typeColors: Record<string, string> = {
    workout: T.accent,
    skill: "#5B7FA6",
    study: "#7A5C8A",
    nutrition: "#2E7D32",
  };
  const color = typeColors[type] ?? T.stone;
  return (
    <div style={{ border: `1px solid ${T.rule}`, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: color,
        }}
      />
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "14px 20px 14px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 9,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color,
          }}
        >
          {type}
        </span>
        <span
          style={{
            fontFamily: T.sans,
            fontSize: 14,
            fontWeight: 600,
            color: T.ink,
          }}
        >
          {title}
        </span>
        <span style={{ marginLeft: "auto" }}>
          {open ? (
            <ChevronUp style={{ width: 14, height: 14, color: T.stone }} />
          ) : (
            <ChevronDown style={{ width: 14, height: 14, color: T.stone }} />
          )}
        </span>
      </button>
      {open && (
        <div
          style={{
            borderTop: `1px solid ${T.rule}`,
            padding: "20px 20px 24px 24px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Metadata section ─────────────────────────────────────────────────────────

function MetadataSection({
  plan,
  onChange,
}: {
  plan: AestheticOSPlan;
  onChange: (p: AestheticOSPlan) => void;
}) {
  const set = (key: keyof typeof plan.metadata, val: string) =>
    onChange({ ...plan, metadata: { ...plan.metadata, [key]: val } });
  return (
    <SectionShell label="Plan Metadata">
      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <Label>Plan Title</Label>
          <ProtocolInput
            value={plan.metadata.title ?? ""}
            onChange={(v) => set("title", v)}
            placeholder="e.g. Summer Shred, Year of Guitar"
          />
        </div>
        <div>
          <Label>Goal Statement</Label>
          <ProtocolInput
            value={plan.metadata.goal}
            onChange={(v) => set("goal", v)}
            placeholder="One-sentence primary goal"
          />
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <div>
            <Label>Level</Label>
            <ProtocolSelect
              value={plan.metadata.level}
              onChange={(v) => set("level", v)}
              options={["beginner", "intermediate", "advanced"]}
            />
          </div>
          <div>
            <Label>Plan Type</Label>
            <ProtocolInput
              value={plan.metadata.planType ?? ""}
              onChange={(v) => set("planType", v)}
              placeholder="e.g. Fitness + Skill"
              mono
            />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

// ─── Habits section ───────────────────────────────────────────────────────────

function HabitsSection({
  plan,
  onChange,
}: {
  plan: AestheticOSPlan;
  onChange: (p: AestheticOSPlan) => void;
}) {
  const setHabits = (habits: Habit[]) => onChange({ ...plan, habits });
  const addHabit = () =>
    setHabits([
      ...plan.habits,
      { id: slug(), name: "New Habit", category: "lifestyle" },
    ]);
  const removeHabit = (id: string) =>
    setHabits(plan.habits.filter((h) => h.id !== id));
  const updateHabit = (id: string, key: keyof Habit, val: string) =>
    setHabits(plan.habits.map((h) => (h.id === id ? { ...h, [key]: val } : h)));

  return (
    <SectionShell label={`Habits · ${plan.habits.length}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {plan.habits.map((h, idx) => (
          <div
            key={h.id}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 120px 28px",
              gap: 12,
              alignItems: "center",
              padding: "8px 0",
              borderBottom: `1px solid ${T.rule}`,
            }}
          >
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.stone,
                textAlign: "right",
              }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <input
              value={h.name}
              onChange={(e) => updateHabit(h.id, "name", e.target.value)}
              style={{
                background: "none",
                border: "none",
                borderBottom: `1px solid transparent`,
                outline: "none",
                fontFamily: T.sans,
                fontSize: 13,
                color: T.ink,
                padding: "2px 0",
              }}
              onFocus={(e) =>
                ((e.target as HTMLInputElement).style.borderBottomColor =
                  T.accent)
              }
              onBlur={(e) =>
                ((e.target as HTMLInputElement).style.borderBottomColor =
                  "transparent")
              }
            />
            <select
              value={h.category}
              onChange={(e) => updateHabit(h.id, "category", e.target.value)}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                fontFamily: T.mono,
                fontSize: 10,
                color: T.stone,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              {["fitness", "skill", "lifestyle", "study", "health"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => removeHabit(h.id)}
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
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))}
        <button
          onClick={addHabit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.stone,
            padding: "8px 0",
            marginTop: 4,
          }}
        >
          <Plus style={{ width: 12, height: 12 }} /> Add Habit
        </button>
      </div>
    </SectionShell>
  );
}

// ─── Module editors ───────────────────────────────────────────────────────────

function NodeList({
  nodes,
  onChange,
  metricDefault,
}: {
  nodes: ModuleNode[];
  onChange: (n: ModuleNode[]) => void;
  metricDefault: ModuleNode["metric"];
}) {
  const addNode = () =>
    onChange([
      ...nodes,
      {
        id: slug(),
        title: "New Node",
        type: "milestone",
        metric: metricDefault,
      },
    ]);
  const remove = (id: string) => onChange(nodes.filter((n) => n.id !== id));
  const update = (id: string, key: keyof ModuleNode, val: string) =>
    onChange(nodes.map((n) => (n.id === id ? { ...n, [key]: val } : n)));

  return (
    <div>
      {nodes.map((n, i) => (
        <div
          key={n.id}
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 100px 28px",
            gap: 12,
            alignItems: "center",
            padding: "8px 0",
            borderBottom: `1px solid ${T.rule}`,
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.stone,
              textAlign: "right",
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <input
            value={n.title}
            onChange={(e) => update(n.id, "title", e.target.value)}
            style={{
              background: "none",
              border: "none",
              borderBottom: `1px solid transparent`,
              outline: "none",
              fontFamily: T.sans,
              fontSize: 13,
              color: T.ink,
              padding: "2px 0",
            }}
            onFocus={(e) =>
              ((e.target as HTMLInputElement).style.borderBottomColor =
                T.accent)
            }
            onBlur={(e) =>
              ((e.target as HTMLInputElement).style.borderBottomColor =
                "transparent")
            }
          />
          <select
            value={n.type}
            onChange={(e) => update(n.id, "type", e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              fontFamily: T.mono,
              fontSize: 10,
              color: T.stone,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            {[
              "milestone",
              "technique",
              "concept",
              "project",
              "drill",
              "performance",
              "chapter",
              "exercise",
              "review",
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => remove(n.id)}
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
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ))}
      <button
        onClick={addNode}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: T.mono,
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.stone,
          padding: "8px 0",
          marginTop: 4,
        }}
      >
        <Plus style={{ width: 12, height: 12 }} /> Add Node
      </button>
    </div>
  );
}

function WorkoutEditor({
  data,
  onChange,
}: {
  data: WorkoutModuleData;
  onChange: (d: WorkoutModuleData) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Label>Training Focus</Label>
        <ProtocolInput
          value={data.focus}
          onChange={(v) => onChange({ ...data, focus: v })}
          placeholder="e.g. Hypertrophy"
        />
      </div>
      <div>
        <Label>Weekly Split (one exercise per line)</Label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 8,
          }}
        >
          {WEEK_DAYS.map((day) => (
            <div key={day}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: T.stone,
                  marginBottom: 4,
                }}
              >
                {day}
              </div>
              <ProtocolTextarea
                value={(data.split[day] ?? []).join("\n")}
                onChange={(v) =>
                  onChange({
                    ...data,
                    split: {
                      ...data.split,
                      [day]: v
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
                placeholder="Rest"
                rows={4}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillEditor({
  data,
  onChange,
}: {
  data: SkillModuleData;
  onChange: (d: SkillModuleData) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Label>Subject</Label>
        <ProtocolInput
          value={data.subject}
          onChange={(v) => onChange({ ...data, subject: v })}
          placeholder="e.g. Guitar, Python"
        />
      </div>
      <div>
        <Label>Nodes · {data.nodes.length}</Label>
        <NodeList
          nodes={data.nodes}
          onChange={(n) => onChange({ ...data, nodes: n })}
          metricDefault={{ type: "bpm", label: "Target BPM", target: 120 }}
        />
      </div>
    </div>
  );
}

function StudyEditor({
  data,
  onChange,
}: {
  data: StudyModuleData;
  onChange: (d: StudyModuleData) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 16 }}
      >
        <div>
          <Label>Subject</Label>
          <ProtocolInput
            value={data.subject}
            onChange={(v) => onChange({ ...data, subject: v })}
            placeholder="e.g. System Design"
          />
        </div>
        <div>
          <Label>Daily Goal (min)</Label>
          <input
            type="number"
            min={5}
            max={480}
            value={data.dailyGoalMin}
            onChange={(e) =>
              onChange({ ...data, dailyGoalMin: Number(e.target.value) })
            }
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${T.rule}`,
              outline: "none",
              fontFamily: T.mono,
              fontSize: 20,
              color: T.accent,
              padding: "4px 0",
            }}
          />
        </div>
      </div>
      <div>
        <Label>Nodes · {data.nodes.length}</Label>
        <NodeList
          nodes={data.nodes}
          onChange={(n) => onChange({ ...data, nodes: n })}
          metricDefault={{ type: "confidence", label: "Confidence", max: 5 }}
        />
      </div>
    </div>
  );
}

function NutritionEditor({
  data,
  onChange,
}: {
  data: NutritionModuleData;
  onChange: (d: NutritionModuleData) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <Label>Office Days (WFO)</Label>
        <ProtocolTextarea
          value={data.wfo}
          onChange={(v) => onChange({ ...data, wfo: v })}
          placeholder="2800 kcal · 180g protein"
          rows={3}
        />
      </div>
      <div>
        <Label>Home Days (WFH)</Label>
        <ProtocolTextarea
          value={data.wfh}
          onChange={(v) => onChange({ ...data, wfh: v })}
          placeholder="3000 kcal · 180g protein"
          rows={3}
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Label>Notes</Label>
        <ProtocolTextarea
          value={data.notes}
          onChange={(v) => onChange({ ...data, notes: v })}
          placeholder="Dietary strategies"
          rows={2}
        />
      </div>
    </div>
  );
}

function ModuleSection({
  mod,
  plan,
  onChange,
}: {
  mod: PlanModule;
  plan: AestheticOSPlan;
  onChange: (p: AestheticOSPlan) => void;
}) {
  const updateData = useCallback(
    (newData: PlanModule["data"]) => {
      onChange({
        ...plan,
        modules: plan.modules.map((m) =>
          m.id === mod.id ? ({ ...m, data: newData } as PlanModule) : m,
        ),
      });
    },
    [plan, mod.id, onChange],
  );

  return (
    <ModuleSectionShell type={mod.type} title={mod.title}>
      {mod.type === "workout" && (
        <WorkoutEditor
          data={mod.data as WorkoutModuleData}
          onChange={updateData}
        />
      )}
      {mod.type === "skill" && (
        <SkillEditor data={mod.data as SkillModuleData} onChange={updateData} />
      )}
      {mod.type === "study" && (
        <StudyEditor data={mod.data as StudyModuleData} onChange={updateData} />
      )}
      {mod.type === "nutrition" && (
        <NutritionEditor
          data={mod.data as NutritionModuleData}
          onChange={updateData}
        />
      )}
    </ModuleSectionShell>
  );
}

// ─── Plans panel ──────────────────────────────────────────────────────────────

function PlansPanel() {
  const { user } = useAuth();
  const activePlanId = usePlanId();
  const { data: plans = [], isLoading } = useUserPlans(user?.id ?? "");
  const invalidate = useInvalidatePlans();
  const [switching, setSwitching] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishTarget, setPublishTarget] = useState<AestheticOSPlan | null>(
    null,
  );

  const handleSwitch = async (planId: string) => {
    if (!user || switching || planId === activePlanId) return;
    setSwitching(planId);
    try {
      await activatePlan(planId, user.id);
      invalidate(user.id);
      toast.success("Plan switched");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Switch failed");
    } finally {
      setSwitching(null);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!user || deleting) return;
    if (plans.length === 1) {
      toast.error("You must have at least one plan.");
      return;
    }
    setDeleting(planId);
    try {
      await deletePlan(planId, user.id);
      invalidate(user.id);
      toast.success("Plan deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) return null;

  return (
    <>
      <div style={{ border: `1px solid ${T.rule}`, marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: `1px solid ${T.rule}`,
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            All Plans · {plans.length}
          </span>
          <a
            href="/builder"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.stone,
              textDecoration: "none",
            }}
          >
            <Plus style={{ width: 11, height: 11 }} /> New Plan
          </a>
        </div>
        {plans.map((p) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 20px",
              borderBottom: `1px solid ${T.rule}`,
              background: p.is_active ? T.tint : "transparent",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                flexShrink: 0,
                background: p.is_active ? T.accent : "transparent",
                border: p.is_active ? "none" : `1px solid ${T.rule}`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: p.is_active ? T.accent : T.ink,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.plan.metadata.title || p.plan.metadata.goal}
              </div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 10,
                  color: T.stone,
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                {p.plan.metadata.level} · {p.plan.modules.length} module
                {p.plan.modules.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              {!p.is_active && (
                <button
                  onClick={() => handleSwitch(p.id)}
                  disabled={!!switching}
                  style={{
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
                  {switching === p.id ? "…" : "Activate"}
                </button>
              )}
              <button
                onClick={() => setPublishTarget(p.plan)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.stone,
                }}
              >
                <Share2 style={{ width: 13, height: 13 }} />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                disabled={!!deleting || plans.length === 1}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.stone,
                  opacity: plans.length === 1 ? 0.3 : 1,
                }}
              >
                {deleting === p.id ? (
                  <Loader2
                    style={{
                      width: 13,
                      height: 13,
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <Trash2 style={{ width: 13, height: 13 }} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {publishTarget && (
        <PublishModal
          plan={publishTarget}
          userId={user!.id}
          userEmail={user?.email ?? ""}
          onClose={() => setPublishTarget(null)}
        />
      )}
    </>
  );
}

// ─── Publish modal ────────────────────────────────────────────────────────────

function PublishModal({
  plan,
  userId,
  userEmail,
  onClose,
}: {
  plan: AestheticOSPlan;
  userId: string;
  userEmail: string;
  onClose: () => void;
}) {
  const defaultUsername = userEmail.split("@")[0] ?? "";
  const [title, setTitle] = useState(plan.metadata.title || plan.metadata.goal);
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  useState(() => {
    getMyProfile(userId).then((p) => {
      if (p) {
        setHasProfile(true);
        setUsername(p.username);
      } else {
        setHasProfile(false);
        setUsername(defaultUsername);
      }
    });
  });

  const handlePublish = async () => {
    if (!title.trim() || !username.trim()) return;
    setPublishing(true);
    try {
      const result = await publishTemplate(userId, plan, {
        title,
        description,
        username,
      });
      setPublishedSlug(result.slug);
      toast.success("Template published!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
      setPublishing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,23,20,0.6)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: T.surface,
          border: `1px solid ${T.rule}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            borderBottom: `1px solid ${T.rule}`,
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.ink,
            }}
          >
            Publish Template
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.stone,
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {publishedSlug ? (
          <div
            style={{
              padding: "32px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10,
                color: T.accent,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Published ✓
            </div>
            <a
              href={`/templates/${publishedSlug}`}
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.accent,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              /templates/{publishedSlug}
            </a>
            <button
              onClick={onClose}
              style={{
                marginTop: 12,
                padding: "8px 20px",
                border: `1px solid ${T.rule}`,
                background: "none",
                cursor: "pointer",
                fontFamily: T.mono,
                fontSize: 10,
                color: T.ink,
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {hasProfile === false && (
              <div>
                <Label>Username (public)</Label>
                <ProtocolInput
                  value={username}
                  onChange={(v) =>
                    setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                  }
                  placeholder="your_handle"
                  mono
                />
              </div>
            )}
            <div>
              <Label>Title</Label>
              <ProtocolInput value={title} onChange={setTitle} />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <ProtocolTextarea
                value={description}
                onChange={setDescription}
                placeholder="What makes this plan unique?"
                rows={3}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 12,
                borderTop: `1px solid ${T.rule}`,
              }}
            >
              <button
                onClick={onClose}
                style={{
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
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !title.trim() || !username.trim()}
                style={{
                  padding: "10px 20px",
                  background: T.ink,
                  color: T.surface,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: T.mono,
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity:
                    publishing || !title.trim() || !username.trim() ? 0.4 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {publishing ? (
                  <>
                    <Loader2
                      style={{
                        width: 12,
                        height: 12,
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Publishing…
                  </>
                ) : (
                  "Publish"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Save bar ─────────────────────────────────────────────────────────────────

function SaveBar({
  isDirty,
  saving,
  onSave,
}: {
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: T.surface,
        borderTop: `1px solid ${T.rule}`,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "12px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 6,
              height: 6,
              background: isDirty ? T.accent : T.rule,
            }}
          />
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: T.stone,
            }}
          >
            {isDirty ? "Unsaved changes" : "Saved"}
          </span>
        </div>
        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          style={{
            padding: "10px 28px",
            background: isDirty && !saving ? T.ink : T.tint,
            color: isDirty && !saving ? T.surface : T.stone,
            border: `1px solid ${isDirty && !saving ? T.ink : T.rule}`,
            cursor: isDirty && !saving ? "pointer" : "not-allowed",
            fontFamily: T.mono,
            fontSize: 10,
            letterSpacing: "0.18em",
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
            "Save Plan"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function PlanPageContent() {
  const originalPlan = usePlan();
  const planId = usePlanId();
  const { user } = useAuth();
  const router = useRouter();

  const [draft, setDraft] = useState<AestheticOSPlan>(() =>
    deepClone(originalPlan),
  );
  const [saving, setSaving] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(originalPlan),
    [draft, originalPlan],
  );

  const handleSave = async () => {
    if (!user || !isDirty) return;
    setSaving(true);
    try {
      await updatePlan(planId, user.id, draft);
      toast.success("Plan saved");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  };

  const sortedModules = [...draft.modules].sort((a, b) => a.order - b.order);

  return (
    <div style={{ minHeight: "100vh", background: T.surface, color: T.ink }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <AppTopNav />
      </div>

      <main
        style={{
          paddingTop: 56,
          paddingBottom: 80,
          maxWidth: 1200,
          margin: "0 auto",
          padding: "56px 48px 100px",
        }}
      >
        {/* Page header */}
        <div
          style={{
            padding: "32px 0 24px",
            borderBottom: `1px solid ${T.rule}`,
            marginBottom: 28,
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
            Plan Editor
          </div>
          <h1
            style={{
              fontFamily: T.serifD,
              fontSize: 32,
              color: T.ink,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {draft.metadata.title || draft.metadata.goal || "Your Plan"}
          </h1>
          <p
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.stone,
              marginTop: 8,
            }}
          >
            Edit any section below. Changes are local until you save.
          </p>
        </div>

        {/* Plans panel */}
        <PlansPanel />

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <MetadataSection plan={draft} onChange={setDraft} />
          <HabitsSection plan={draft} onChange={setDraft} />
          {sortedModules.map((mod) => (
            <ModuleSection
              key={mod.id}
              mod={mod}
              plan={draft}
              onChange={setDraft}
            />
          ))}
        </div>
      </main>

      <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} />
    </div>
  );
}

function PlanPageWithKey() {
  const planId = usePlanId();
  return <PlanPageContent key={planId} />;
}

export default function PlanPage() {
  return <PlanPageWithKey />;
}
