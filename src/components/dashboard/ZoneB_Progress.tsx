import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function ZoneB_Progress() {
  const { user } = useAuth();
  const { data, isLoading, error } = useDashboardStats(user?.id);

  if (isLoading) {
    return (
      <div className="col-span-4 row-span-2 bg-surface-l1 border border-[#1E1E1E]  p-[24px] shadow-card flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="col-span-4 row-span-2 bg-surface-l1 border border-[#1E1E1E]  p-[24px] shadow-card flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#3A3A3A] tracking-[0.15em] uppercase">Aesthetic Build</span>
          <span className="font-mono text-[10px] text-error uppercase">Error</span>
        </div>
        <div className="mt-6 font-mono text-[10px] text-text-secondary uppercase">
          Unable to load progress stats.
        </div>
      </div>
    );
  }

  const weeklyPct = data.commits.consistency7Pct;
  const weeklyDays = data.commits.last7Days;
  const monthlyPct = data.commits.consistency30Pct;
  const bestWeek = data.commits.best7ofLast56;
  const delta = data.commits.delta7Days;

  return (
    <div className="col-span-4 row-span-2 bg-surface-l1 border border-[#1E1E1E]  p-[24px] shadow-card flex flex-col h-full justify-between">
      {/* Top Labels */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#3A3A3A] tracking-[0.15em] uppercase">Aesthetic Build</span>
        <span className="font-mono text-[10px] text-[#2A2A2A] uppercase">{data.commits.streakDays}d streak</span>
      </div>

      {/* Main Score */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="flex items-baseline">
          <span className="font-sans font-bold text-[72px] text-text-primary tracking-[-0.04em] leading-none">{weeklyPct}</span>
          <span className="font-sans font-light text-[24px] text-text-secondary leading-none">%</span>
        </div>
        <span className="font-mono text-[10px] text-[#3A3A3A] tracking-[0.12em] mt-2 uppercase">Weekly Consistency</span>
      </div>

      {/* Progress Bars */}
      <div className="flex flex-col gap-2 w-full mt-auto">
        {/* Weekly Bar */}
        <div className="flex flex-col gap-[4px]">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-text-secondary uppercase">This Week</span>
            <span className="font-mono text-[9px] text-gold uppercase">{weeklyDays}/7 Days</span>
          </div>
          <div className="w-full h-[4px] bg-[#1E1E1E]  relative overflow-hidden">
            {/* Fill */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-gold-dim to-gold  shadow-[0_0_8px_rgba(212,175,55,0.4)]"
              style={{ width: `${weeklyPct}%` }}
            />
            {/* Shimmer */}
            <div className="absolute top-0 bottom-0 overflow-hidden " style={{ width: `${weeklyPct}%` }}>
               <div className="w-[20%] h-full bg-white/30 blur-[2px] animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Monthly Bar */}
        <div className="flex flex-col gap-[4px] mt-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-text-secondary uppercase">30 Days</span>
            <span className="font-mono text-[9px] text-text-mono uppercase">{monthlyPct}%</span>
          </div>
          <div className="w-full h-[4px] bg-[#1E1E1E]  relative">
            <div className="absolute left-0 top-0 bottom-0 bg-[#2A2A2A] " style={{ width: `${monthlyPct}%` }}>
               <div className="w-full h-full bg-[#3A3A3A]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-[#1E1E1E]">
        <div className="flex flex-col items-center">
          <span className="font-mono text-[9px] text-text-secondary uppercase mb-1">Best Week</span>
          <span className="font-mono text-[18px] text-text-primary">{bestWeek}/7</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[9px] text-text-secondary uppercase mb-1">Current</span>
          <span className="font-mono text-[18px] text-gold">{weeklyDays}/7</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-mono text-[9px] text-text-secondary uppercase mb-1">Delta</span>
          {delta === 0 ? (
            <div className="flex items-center text-text-secondary">
              <span className="font-mono text-[18px]">0</span>
            </div>
          ) : delta > 0 ? (
            <div className="flex items-center text-[#22C55E]">
              <ArrowUp className="w-3 h-3 mr-[2px]" />
              <span className="font-mono text-[18px]">{delta}</span>
            </div>
          ) : (
            <div className="flex items-center text-[#C0392B]">
              <ArrowDown className="w-3 h-3 mr-[2px]" />
              <span className="font-mono text-[18px]">{Math.abs(delta)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
