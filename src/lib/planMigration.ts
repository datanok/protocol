/**
 * Transparent migration: converts the old flat schema to the new module-based schema.
 * Runs in usePlanParser on every DB fetch — existing users never notice the change.
 */

import type {
  AestheticOSPlan,
  PlanModule,
  ModuleNode,
  NodeMetricConfig,
} from '@/types/schema';

// Shape of the old (pre-module) plan stored in DB
type OldBenchmark = { id: string; title: string; type: string };
type OldPlan = {
  metadata: {
    goal: string;
    level: string;
    version?: number;
    // Old schema had no planType
  };
  habits: Array<{ id: string; name: string; category: string }>;
  workoutProtocol?: { split: Record<string, string[]>; focus: string } | null;
  skillTree?: { subject: string; benchmarks: OldBenchmark[] } | null;
  nutrition?: { wfo: string; wfh: string; notes: string } | null;
};

function isModuleBased(raw: unknown): raw is AestheticOSPlan {
  return (
    !!raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as Record<string, unknown>).modules)
  );
}

export function migrateIfNeeded(raw: unknown): AestheticOSPlan {
  if (isModuleBased(raw)) return raw;

  const old = raw as OldPlan;

  if (!old || typeof old !== 'object' || !old.metadata) {
    throw new Error(
      'Invalid plan JSON: expected { metadata, habits, modules[] } or a migratable v1 plan. ' +
      `Got keys: ${Object.keys(old ?? {}).join(', ') || '(none)'}`
    );
  }
  const modules: PlanModule[] = [];
  let order = 0;

  if (old.workoutProtocol) {
    modules.push({
      id: 'workout-main',
      type: 'workout',
      title: 'Training Protocol',
      order: order++,
      data: {
        split: old.workoutProtocol.split,
        focus: old.workoutProtocol.focus,
      },
    });
  }

  if (old.skillTree) {
    const defaultMetric: NodeMetricConfig = {
      type: 'bpm',
      label: 'Target BPM',
      target: 120,
    };
    const nodes: ModuleNode[] = (old.skillTree.benchmarks ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      type: b.type,
      metric: defaultMetric,
    }));
    const slug = old.skillTree.subject
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
    modules.push({
      id: `skill-${slug}`,
      type: 'skill',
      title: old.skillTree.subject,
      order: order++,
      data: { subject: old.skillTree.subject, nodes },
    });
  }

  if (old.nutrition) {
    modules.push({
      id: 'nutrition-main',
      type: 'nutrition',
      title: 'Nutrition',
      order: order++,
      data: old.nutrition,
    });
  }

  return {
    metadata: {
      goal: old.metadata.goal,
      level: (old.metadata.level ?? 'beginner') as AestheticOSPlan['metadata']['level'],
      version: old.metadata.version ?? 1,
      planType: 'Migrated Plan',
    },
    habits: (old.habits ?? []) as AestheticOSPlan['habits'],
    modules,
  };
}
