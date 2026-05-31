import type {
  AestheticOSPlan,
  Habit,
  PlanModule,
  WorkoutModuleData,
  SkillModuleData,
  StudyModuleData,
} from '@/types/schema';

// ─── ViewModel types ─────────────────────────────────────────────────────────

/**
 * A directive is what the user should do TODAY for a given module.
 * Workout only produces a directive if today has scheduled exercises.
 */
export type ModuleDirective = {
  moduleId: string;
  type: string;
  title: string;
  subtitle: string;
};

/**
 * Lightweight module representation used by dashboard components.
 * Data is typed as PlanModule['data'] — components cast to the specific type.
 */
export type ModuleViewModel = {
  id: string;
  type: string;
  title: string;
  order: number;
  data: PlanModule['data'];
};

export type DashboardViewModel = {
  header: {
    userName: string;
    goal: string;
    level: string;
    planType: string;
  };
  today: {
    dayName: string;
    habits: Habit[];
    directives: ModuleDirective[];
  };
  modules: ModuleViewModel[];
};

// ─── Builder ─────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export function buildDashboardViewModel(
  plan: AestheticOSPlan,
  opts?: { userName?: string }
): DashboardViewModel {
  const dayName = DAY_NAMES[new Date().getDay()];
  const sorted = [...plan.modules].sort((a, b) => a.order - b.order);

  const directives: ModuleDirective[] = sorted.flatMap((mod): ModuleDirective[] => {
    if (mod.type === 'workout') {
      const d = mod.data as WorkoutModuleData;
      const exercises = d.split[dayName] ?? [];
      if (exercises.length === 0) return [];
      return [{
        moduleId: mod.id, type: 'workout', title: mod.title,
        subtitle: `${dayName} · ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`,
      }];
    }
    if (mod.type === 'skill') {
      const d = mod.data as SkillModuleData;
      return [{ moduleId: mod.id, type: 'skill', title: mod.title, subtitle: d.subject }];
    }
    if (mod.type === 'study') {
      const d = mod.data as StudyModuleData;
      return [{
        moduleId: mod.id, type: 'study', title: mod.title,
        subtitle: `${d.dailyGoalMin}min · ${d.subject}`,
      }];
    }
    return [];
  });

  return {
    header: {
      userName: opts?.userName ?? 'OPERATOR',
      goal: plan.metadata.goal,
      level: plan.metadata.level,
      planType: plan.metadata.planType ?? '',
    },
    today: {
      dayName,
      habits: plan.habits,
      directives,
    },
    modules: sorted.map((mod) => ({
      id: mod.id,
      type: mod.type,
      title: mod.title,
      order: mod.order,
      data: mod.data,
    })),
  };
}

// ─── Module lookup helpers ────────────────────────────────────────────────────

export function getFirstModule(modules: ModuleViewModel[], type: string): ModuleViewModel | undefined {
  return modules.find((m) => m.type === type);
}

export function getAllModules(modules: ModuleViewModel[], type: string): ModuleViewModel[] {
  return modules.filter((m) => m.type === type);
}
