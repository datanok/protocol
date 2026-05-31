'use client';
import { useState } from 'react';
import { useDashboardVM } from '@/contexts/PlanContext';
import { getFirstModule } from '@/lib/viewModels';
import type { NutritionModuleData } from '@/types/schema';

interface ProtocolItem {
  id: string;
  label: string;
  subLabelActive: string;
  subLabelInactive: string;
}

export default function ZoneC_Daily() {
  const vm = useDashboardVM();
  const [items, setItems] = useState<Record<string, boolean>>({});

  const nutritionMod = getFirstModule(vm.modules, 'nutrition');
  const nutritionData = nutritionMod?.data as NutritionModuleData | undefined;

  // Build protocol items from directives + habits
  const protocolItems: ProtocolItem[] = [];

  vm.today.directives.forEach((directive) => {
    protocolItems.push({
      id: `directive-${directive.moduleId}`,
      label: directive.title.toUpperCase(),
      subLabelActive: `${directive.subtitle} · Logged`,
      subLabelInactive: directive.subtitle,
    });
  });

  if (nutritionData && !vm.today.directives.find(d => d.type === 'nutrition')) {
    protocolItems.push({
      id: 'nutrition',
      label: 'NUTRITION',
      subLabelActive: 'Protocol Maintained',
      subLabelInactive: `Target WFO: ${nutritionData.wfo}`,
    });
  }

  vm.today.habits.forEach((habit) => {
    protocolItems.push({
      id: `habit-${habit.id}`,
      label: habit.name.toUpperCase(),
      subLabelActive: `Category: ${habit.category} · Done`,
      subLabelInactive: `Category: ${habit.category} · Pending`,
    });
  });

  const toggleItem = (id: string) => setItems(prev => ({ ...prev, [id]: !prev[id] }));
  const completedCount = Object.values(items).filter(Boolean).length;

  return (
    <div className="col-span-4 row-span-2 bg-surface-l1 border border-[#1E1E1E] p-[24px] shadow-card relative overflow-hidden flex flex-col h-full">
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(to right, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 4px)'
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <span className="font-mono text-[10px] text-[#3A3A3A] tracking-[0.15em] uppercase">Today&apos;s Protocol</span>
          <span className="font-mono text-[10px] text-[#4A4A4A] uppercase">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-[16px] flex-1 overflow-y-auto pr-2 scrollbar-thin">
          {protocolItems.map((item) => {
            const isActive = !!items[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center justify-between w-full group text-left shrink-0"
              >
                <div className="flex items-center gap-4">
                  {/* Custom Checkbox */}
                  <div className={`w-[20px] h-[20px] flex items-center justify-center transition-all duration-150 ease-out relative shrink-0
                    ${isActive ? 'border border-gold bg-gold/10 shadow-[0_0_12px_rgba(212,175,55,0.2)]' : 'border border-[#2A2A2A] bg-surface-l1'}`}
                  >
                    <div className={`w-[10px] h-[10px] bg-gold transition-transform duration-150 ease-out delay-30
                      ${isActive ? 'scale-100' : 'scale-0'}`}
                    />
                  </div>

                  {/* Labels */}
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-sans font-medium text-[14px] text-text-primary truncate">{item.label}</span>
                    <span className="font-mono text-[10px] text-[#3A3A3A] transition-colors duration-150 truncate">
                      {isActive ? item.subLabelActive : item.subLabelInactive}
                    </span>
                  </div>
                </div>

                {/* Status Glyph */}
                <div className="font-mono text-[14px] shrink-0 ml-2">
                  {isActive ? (
                    <span className="text-gold">✓</span>
                  ) : (
                    <span className="text-[#2A2A2A]">—</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Summary */}
        <div className="mt-4 pt-4 border-t border-[#1A1A1A] flex justify-end shrink-0">
          <span className="font-mono text-[11px] text-gold">{completedCount} / {protocolItems.length} COMPLETE</span>
        </div>
      </div>
    </div>
  );
}
