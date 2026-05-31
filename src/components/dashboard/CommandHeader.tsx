'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDashboardVM } from '@/contexts/PlanContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end gap-[3px]">
      <span className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-[0.18em]">{label}</span>
      <span className={`font-mono text-[13px] font-bold uppercase tracking-wide ${accent ? 'text-gold' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}

export default function CommandHeader() {
  const vm = useDashboardVM();
  const { user } = useAuth();
  const { data: stats } = useDashboardStats(user?.id);

  const streak = stats?.commits.streakDays ?? 0;
  const consistency = stats?.commits.consistency7Pct ?? 0;
  const todayCommitted = stats?.commits.todayCommitted ?? false;
  const dayName = vm.today.dayName.toUpperCase();
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();

  return (
    <div className="w-full bg-[#0A0A0A] border border-[#1A1A1A] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Left: Identity */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Status pulse */}
        <div className="shrink-0 flex flex-col items-center gap-[6px]">
          <div className={`w-[6px] h-[6px] ${todayCommitted ? 'bg-[#22C55E]' : 'bg-gold'} animate-blink`} />
        </div>

        <div className="min-w-0">
          <div className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-[0.2em] mb-1">Active Protocol</div>
          <h1 className="font-sans font-black text-[18px] md:text-[22px] uppercase tracking-tight text-text-primary leading-none truncate">
            {vm.header.goal}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[9px] text-[#4A4A4A] uppercase tracking-widest">
              {vm.header.planType}
            </span>
            <span className="text-[#2A2A2A] text-[9px]">·</span>
            <span className="font-mono text-[9px] text-[#4A4A4A] uppercase tracking-widest">
              {dayName} · {dateStr}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Quick stats */}
      <div className="flex items-center gap-6 shrink-0">
        <div className="h-8 w-px bg-[#1E1E1E]" />
        <Stat label="Level" value={vm.header.level} />
        <div className="h-8 w-px bg-[#1E1E1E]" />
        <Stat label="Streak" value={`${streak}d`} accent />
        <div className="h-8 w-px bg-[#1E1E1E]" />
        <Stat label="7-Day" value={`${consistency}%`} />
        <div className="h-8 w-px bg-[#1E1E1E]" />
        <div className="flex flex-col items-end gap-[3px]">
          <span className="font-mono text-[9px] text-[#3A3A3A] uppercase tracking-[0.18em]">Status</span>
          <span className={`font-mono text-[11px] uppercase tracking-widest px-2 py-[2px] ${
            todayCommitted
              ? 'text-[#22C55E] bg-[#22C55E]/10'
              : 'text-gold bg-gold/10'
          }`}>
            {todayCommitted ? '✓ committed' : '⬡ pending'}
          </span>
        </div>
      </div>
    </div>
  );
}
