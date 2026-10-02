"use client";

import Link from "next/link";
import {
  Dumbbell,
  BookOpen,
  GraduationCap,
  Salad,
  ArrowRight,
} from "lucide-react";
import type { ModuleViewModel } from "@/lib/viewModels";
import type {
  WorkoutModuleData,
  SkillModuleData,
  StudyModuleData,
  NutritionModuleData,
} from "@/types/schema";
import { exerciseName } from "@/lib/exercises";

// ─── Per-type accent colours ──────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { icon: React.ReactNode; accent: string; label: string }
> = {
  workout: {
    icon: <Dumbbell className="w-4 h-4" />,
    accent: "#D4AF37",
    label: "Workout",
  },
  skill: {
    icon: <BookOpen className="w-4 h-4" />,
    accent: "#6B8AFF",
    label: "Skill",
  },
  study: {
    icon: <GraduationCap className="w-4 h-4" />,
    accent: "#9B6BFF",
    label: "Study",
  },
  nutrition: {
    icon: <Salad className="w-4 h-4" />,
    accent: "#2EC27E",
    label: "Nutrition",
  },
};

// ─── Card inner content per module type ───────────────────────────────────────

function WorkoutContent({
  data,
  dayName,
}: {
  data: WorkoutModuleData;
  dayName: string;
}) {
  const todayExercises = data.split[dayName] ?? [];
  const totalExercises = Object.values(data.split).flat().length;
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest">
            Focus
          </div>
          <div className="font-sans font-bold text-[15px] text-text-primary uppercase tracking-tight mt-[2px]">
            {data.focus}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest">
            Today
          </div>
          <div className="font-sans font-bold text-[15px] text-gold uppercase tracking-tight mt-[2px]">
            {todayExercises.length > 0 ? `${todayExercises.length} ex` : "Rest"}
          </div>
        </div>
      </div>
      {todayExercises.length > 0 && (
        <div className="flex flex-wrap gap-[6px] mt-1">
          {todayExercises.slice(0, 4).map((ex, i) => (
            <span
              key={i}
              className="font-mono text-[9px] text-[#4A4A4A] uppercase tracking-wide bg-[#111111] px-2 py-1"
            >
              {exerciseName(ex)}
            </span>
          ))}
          {todayExercises.length > 4 && (
            <span className="font-mono text-[9px] text-[#3A3A3A] uppercase px-2 py-1">
              +{todayExercises.length - 4}
            </span>
          )}
        </div>
      )}
      <div className="font-mono text-[9px] text-[#2A2A2A] uppercase tracking-widest mt-auto">
        {totalExercises} exercises across week
      </div>
    </div>
  );
}

function SkillContent({ data }: { data: SkillModuleData }) {
  const nodeCount = data.nodes.length;
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div>
        <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest">
          Subject
        </div>
        <div className="font-sans font-bold text-[15px] text-text-primary uppercase tracking-tight mt-[2px]">
          {data.subject}
        </div>
      </div>
      <div className="flex gap-4">
        <div>
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest">
            Nodes
          </div>
          <div className="font-mono text-[18px] text-[#6B8AFF] font-bold mt-[2px]">
            {nodeCount}
          </div>
        </div>
      </div>
      {/* Node preview pills */}
      <div className="flex flex-wrap gap-[6px]">
        {data.nodes.slice(0, 3).map((n) => (
          <span
            key={n.id}
            className="font-mono text-[9px] text-[#4A4A4A] uppercase tracking-wide bg-[#111111] px-2 py-1 truncate max-w-[120px]"
          >
            {n.title}
          </span>
        ))}
        {nodeCount > 3 && (
          <span className="font-mono text-[9px] text-[#3A3A3A] uppercase px-2 py-1">
            +{nodeCount - 3}
          </span>
        )}
      </div>
    </div>
  );
}

function StudyContent({ data }: { data: StudyModuleData }) {
  const nodeCount = data.nodes.length;
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest">
            Subject
          </div>
          <div className="font-sans font-bold text-[15px] text-text-primary uppercase tracking-tight mt-[2px]">
            {data.subject}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest">
            Daily Goal
          </div>
          <div className="font-mono text-[15px] text-[#9B6BFF] font-bold mt-[2px]">
            {data.dailyGoalMin}m
          </div>
        </div>
      </div>
      <div>
        <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest mb-1">
          Topics
        </div>
        <div className="flex flex-wrap gap-[6px]">
          {data.nodes.slice(0, 3).map((n) => (
            <span
              key={n.id}
              className="font-mono text-[9px] text-[#4A4A4A] uppercase tracking-wide bg-[#111111] px-2 py-1 truncate max-w-[120px]"
            >
              {n.title}
            </span>
          ))}
          {nodeCount > 3 && (
            <span className="font-mono text-[9px] text-[#3A3A3A] uppercase px-2 py-1">
              +{nodeCount - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function NutritionContent({ data }: { data: NutritionModuleData }) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#0A0A0A] p-3">
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest mb-1">
            Office Days
          </div>
          <div className="font-sans font-semibold text-[12px] text-text-primary leading-tight">
            {data.wfo}
          </div>
        </div>
        <div className="bg-[#0A0A0A] p-3">
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-widest mb-1">
            Home Days
          </div>
          <div className="font-sans font-semibold text-[12px] text-text-primary leading-tight">
            {data.wfh}
          </div>
        </div>
      </div>
      {data.notes && (
        <p className="font-mono text-[10px] text-[#3A3A3A] leading-relaxed line-clamp-2">
          {data.notes}
        </p>
      )}
    </div>
  );
}

// ─── CTA href per module type ─────────────────────────────────────────────────
function getHref(mod: ModuleViewModel): string | null {
  if (mod.type === "workout") return "/commit/workout";
  if (mod.type === "skill") {
    const subject = (mod.data as SkillModuleData).subject.trim().toLowerCase();
    return `/skills/${subject}`;
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ModuleCard({
  mod,
  dayName,
}: {
  mod: ModuleViewModel;
  dayName: string;
}) {
  const cfg = TYPE_CONFIG[mod.type] ?? {
    icon: null,
    accent: "#D4AF37",
    label: mod.type,
  };
  const href = getHref(mod);

  return (
    <div className="bg-surface-l1 border border-[#1E1E1E] flex flex-col h-full relative overflow-hidden">
      {/* Left accent bar in type colour */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: cfg.accent }}
      />

      <div className="pl-5 pr-5 pt-5 pb-4 flex flex-col h-full">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: cfg.accent }}>{cfg.icon}</span>
            <span
              className="font-mono text-[9px] uppercase tracking-[0.2em]"
              style={{ color: cfg.accent }}
            >
              {cfg.label}
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#2A2A2A] uppercase tracking-widest">
            {mod.title}
          </span>
        </div>

        {/* Type-specific body */}
        <div className="flex-1">
          {mod.type === "workout" && (
            <WorkoutContent
              data={mod.data as WorkoutModuleData}
              dayName={dayName}
            />
          )}
          {mod.type === "skill" && (
            <SkillContent data={mod.data as SkillModuleData} />
          )}
          {mod.type === "study" && (
            <StudyContent data={mod.data as StudyModuleData} />
          )}
          {mod.type === "nutrition" && (
            <NutritionContent data={mod.data as NutritionModuleData} />
          )}
        </div>

        {/* CTA */}
        {href && (
          <div className="mt-4 pt-4 border-t border-[#141414]">
            <Link
              href={href}
              className="flex items-center justify-between w-full group"
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest transition-colors group-hover:opacity-80"
                style={{ color: cfg.accent }}
              >
                {mod.type === "workout" ? "Log Session" : "View Progress"}
              </span>
              <ArrowRight
                className="w-3 h-3 transition-transform group-hover:translate-x-1"
                style={{ color: cfg.accent }}
              />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
