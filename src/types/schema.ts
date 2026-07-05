// ─── Node metric configuration ──────────────────────────────────────────────
// Determines what numeric value is tracked per node.
// Skill modules track BPM (performance); Study modules track Confidence (1–5).

export type NodeMetricConfig =
  | { type: "bpm"; label: string; target: number } // e.g. "Target BPM: 120"
  | { type: "confidence"; label: string; max: 5 } // Confidence level 1–5
  | { type: "count"; label: string; target?: number } // Generic numeric
  | { type: "none" }; // Binary (no metric)

// ─── Status progressions ────────────────────────────────────────────────────
// Stored as plain text in DB — each module type uses its own progression.

export type SkillNodeStatus = "locked" | "in-progress" | "clean";
export type StudyNodeStatus =
  "locked" | "read" | "summarized" | "built-poc" | "mastered";
export type NodeStatus = SkillNodeStatus | StudyNodeStatus;

// ─── Unified node ───────────────────────────────────────────────────────────
// Both SkillModule and StudyModule use this. The metric field distinguishes them.

export type ModuleNode = {
  id: string;
  title: string;
  type: string; // 'technique' | 'milestone' | 'concept' | 'project' etc.
  metric: NodeMetricConfig;
};

// Backward-compat alias — existing code referencing SkillBenchmark still works.
export type SkillBenchmark = ModuleNode;

// ─── Plan metadata ──────────────────────────────────────────────────────────

export type PlanMetadata = {
  title?: string; // Short display name, e.g. "Summer Shred" — falls back to goal if absent
  goal: string;
  level: "beginner" | "intermediate" | "advanced";
  version: number;
  planType: string; // LLM-detected label, e.g. "Fitness + Skill", "Study Focus"
};

// ─── Habits ─────────────────────────────────────────────────────────────────

export type Habit = {
  id: string;
  name: string;
  category: "fitness" | "skill" | "lifestyle" | "study" | "health";
};

// ─── Module data shapes ──────────────────────────────────────────────────────

export type WorkoutModuleData = {
  focus: string;
  dayFocus?: Record<string, string>; // Per-day session label, e.g. { Monday: "PULL — 35 min" }
  split: Record<string, string[]>;
};

export type SkillModuleData = {
  subject: string;
  nodes: ModuleNode[]; // metric.type === 'bpm'
};

export type StudyModuleData = {
  subject: string;
  nodes: ModuleNode[]; // metric.type === 'confidence'
  dailyGoalMin: number;
};

export type NutritionModuleData = {
  wfo: string;
  wfh: string;
  notes: string;
};

// ─── Discriminated union ─────────────────────────────────────────────────────
// TypeScript narrows mod.data type based on mod.type — no casting needed.

export type PlanModule =
  | {
      id: string;
      type: "workout";
      title: string;
      order: number;
      data: WorkoutModuleData;
    }
  | {
      id: string;
      type: "skill";
      title: string;
      order: number;
      data: SkillModuleData;
    }
  | {
      id: string;
      type: "study";
      title: string;
      order: number;
      data: StudyModuleData;
    }
  | {
      id: string;
      type: "nutrition";
      title: string;
      order: number;
      data: NutritionModuleData;
    };

// ─── Root plan type ──────────────────────────────────────────────────────────

export type AestheticOSPlan = {
  metadata: PlanMetadata;
  habits: Habit[];
  modules: PlanModule[];
};

// ─── Pages (freeform blocks) ─────────────────────────────────────────────────
// Independent of AestheticOSPlan — lives in its own `pages` table, not in
// plan_json. Each block carries its own client-generated `id` so it can be
// targeted for edit/delete/reorder without positional indexing.

export type TextBlock = {
  id: string;
  type: "text";
  content: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ChecklistBlock = {
  id: string;
  type: "checklist";
  items: ChecklistItem[];
};

export type TableBlockData = {
  id: string;
  type: "table";
  columns: string[];
  rows: string[][];
};

export type TrackerEntry = {
  date: string; // YYYY-MM-DD
  value: number;
};

export type TrackerBlockData = {
  id: string;
  type: "tracker";
  label: string;
  unit: string;
  entries: TrackerEntry[];
};

export type Block =
  TextBlock | ChecklistBlock | TableBlockData | TrackerBlockData;

export type Page = {
  id: string;
  title: string;
  icon?: string;
  blocks: Block[];
  order: number;
};
