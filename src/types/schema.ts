// ─── Node metric configuration ──────────────────────────────────────────────
// Determines what numeric value is tracked per node.
// Skill modules track BPM (performance); Study modules track Confidence (1–5).

export type NodeMetricConfig =
  | { type: 'bpm';        label: string; target: number }   // e.g. "Target BPM: 120"
  | { type: 'confidence'; label: string; max: 5 }            // Confidence level 1–5
  | { type: 'count';      label: string; target?: number }   // Generic numeric
  | { type: 'none' };                                        // Binary (no metric)

// ─── Status progressions ────────────────────────────────────────────────────
// Stored as plain text in DB — each module type uses its own progression.

export type SkillNodeStatus  = 'locked' | 'in-progress' | 'clean';
export type StudyNodeStatus  = 'locked' | 'read' | 'summarized' | 'built-poc' | 'mastered';
export type NodeStatus       = SkillNodeStatus | StudyNodeStatus;

// ─── Unified node ───────────────────────────────────────────────────────────
// Both SkillModule and StudyModule use this. The metric field distinguishes them.

export type ModuleNode = {
  id: string;
  title: string;
  type: string;        // 'technique' | 'milestone' | 'concept' | 'project' etc.
  metric: NodeMetricConfig;
};

// Backward-compat alias — existing code referencing SkillBenchmark still works.
export type SkillBenchmark = ModuleNode;

// ─── Plan metadata ──────────────────────────────────────────────────────────

export type PlanMetadata = {
  goal: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  version: number;
  planType: string;   // LLM-detected label, e.g. "Fitness + Skill", "Study Focus"
};

// ─── Habits ─────────────────────────────────────────────────────────────────

export type Habit = {
  id: string;
  name: string;
  category: 'fitness' | 'skill' | 'lifestyle' | 'study' | 'health';
};

// ─── Module data shapes ──────────────────────────────────────────────────────

export type WorkoutModuleData = {
  split: Record<string, string[]>; // { Monday: ['Bench Press', ...], Tuesday: [], ... }
  focus: string;
};

export type SkillModuleData = {
  subject: string;
  nodes: ModuleNode[];  // metric.type === 'bpm'
};

export type StudyModuleData = {
  subject: string;
  nodes: ModuleNode[];  // metric.type === 'confidence'
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
  | { id: string; type: 'workout';   title: string; order: number; data: WorkoutModuleData }
  | { id: string; type: 'skill';     title: string; order: number; data: SkillModuleData }
  | { id: string; type: 'study';     title: string; order: number; data: StudyModuleData }
  | { id: string; type: 'nutrition'; title: string; order: number; data: NutritionModuleData };

// ─── Root plan type ──────────────────────────────────────────────────────────

export type AestheticOSPlan = {
  metadata: PlanMetadata;
  habits: Habit[];
  modules: PlanModule[];
};
