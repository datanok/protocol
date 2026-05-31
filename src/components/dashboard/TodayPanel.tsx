'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dumbbell, BookOpen, GraduationCap, Salad, ChevronRight } from 'lucide-react';
import { useDashboardVM } from '@/contexts/PlanContext';
import type { ModuleDirective } from '@/lib/viewModels';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  workout:   <Dumbbell      className="w-4 h-4" />,
  skill:     <BookOpen      className="w-4 h-4" />,
  study:     <GraduationCap className="w-4 h-4" />,
  nutrition: <Salad         className="w-4 h-4" />,
};

const MODULE_HREFS: Record<string, string> = {
  workout: '/commit/workout',
  skill:   '/skills',
  study:   '/commit/study',
  nutrition: '#',
};

function DirectiveRow({
  directive,
  done,
  onToggle,
  skillSubject,
}: {
  directive: ModuleDirective;
  done: boolean;
  onToggle: () => void;
  skillSubject?: string;
}) {
  const href =
    directive.type === 'skill' && skillSubject
      ? `/skills/${skillSubject.trim().toLowerCase()}`
      : (MODULE_HREFS[directive.type] ?? '#');

  return (
    <div className={`flex items-center gap-4 p-4 transition-all duration-150 border-b border-[#111111] last:border-b-0
      ${done ? 'bg-gold/[0.03]' : 'bg-transparent hover:bg-[#111111]'}`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-150
          ${done
            ? 'bg-gold/10 border border-gold shadow-[0_0_8px_rgba(212,175,55,0.2)]'
            : 'border border-[#2A2A2A] hover:border-gold/60'
          }`}
      >
        {done && <div className="w-2.5 h-2.5 bg-gold" />}
      </button>

      {/* Icon */}
      <div className={`shrink-0 transition-colors ${done ? 'text-gold' : 'text-[#3A3A3A]'}`}>
        {MODULE_ICONS[directive.type] ?? <div className="w-4 h-4" />}
      </div>

      {/* Labels */}
      <div className="flex-1 min-w-0">
        <div className={`font-sans font-semibold text-[13px] uppercase tracking-tight leading-tight truncate
          ${done ? 'text-gold' : 'text-text-primary'}`}>
          {directive.title}
        </div>
        <div className="font-mono text-[10px] text-[#3A3A3A] uppercase tracking-wide truncate mt-[2px]">
          {directive.subtitle}
        </div>
      </div>

      {/* Link */}
      {href !== '#' && (
        <Link
          href={href}
          className="shrink-0 text-[#2A2A2A] hover:text-gold transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export default function TodayPanel() {
  const vm = useDashboardVM();
  const { directives, habits, dayName } = vm.today;

  const skillMod = vm.modules.find(m => m.type === 'skill');
  const skillSubject = skillMod
    ? (skillMod.data as { subject: string }).subject
    : undefined;

  const allItems = [
    ...directives.map(d => ({ id: `dir-${d.moduleId}`, kind: 'directive' as const, directive: d })),
    ...habits.map(h => ({ id: `habit-${h.id}`, kind: 'habit' as const, habit: h })),
  ];

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const completedCount = checked.size;
  const totalCount = allItems.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-surface-l1 border border-[#1E1E1E] flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-[#141414]">
        <div>
          <span className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-[0.2em]">
            Today's Directives
          </span>
          <div className="font-sans font-black text-[15px] uppercase tracking-tight text-text-primary mt-[2px]">
            {dayName}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-gold">{completedCount}/{totalCount}</span>
          <div className="w-[60px] h-[2px] bg-[#1A1A1A] relative overflow-hidden">
            <div
              className="h-full bg-gold absolute left-0 top-0 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Empty state */}
      {allItems.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <span className="font-mono text-[10px] text-[#2A2A2A] uppercase tracking-widest">
            No directives today · Rest day
          </span>
        </div>
      )}

      {/* Module directives */}
      {directives.length > 0 && (
        <div className="shrink-0">
          <div className="px-6 py-2 bg-[#0A0A0A]">
            <span className="font-mono text-[9px] text-[#2A2A2A] uppercase tracking-[0.2em]">Module Directives</span>
          </div>
          {directives.map(d => (
            <DirectiveRow
              key={`dir-${d.moduleId}`}
              directive={d}
              done={checked.has(`dir-${d.moduleId}`)}
              onToggle={() => toggle(`dir-${d.moduleId}`)}
              skillSubject={skillSubject}
            />
          ))}
        </div>
      )}

      {/* Habit directives */}
      {habits.length > 0 && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-6 py-2 bg-[#0A0A0A] shrink-0">
            <span className="font-mono text-[9px] text-[#2A2A2A] uppercase tracking-[0.2em]">Daily Habits</span>
          </div>
          <div className="overflow-y-auto scrollbar-none">
            {habits.map(h => (
              <DirectiveRow
                key={`habit-${h.id}`}
                directive={{
                  moduleId: h.id,
                  type: h.category === 'fitness' ? 'workout' : h.category === 'skill' ? 'skill' : 'nutrition',
                  title: h.name,
                  subtitle: `Category: ${h.category}`,
                }}
                done={checked.has(`habit-${h.id}`)}
                onToggle={() => toggle(`habit-${h.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
