'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardVM } from '@/contexts/PlanContext';
import { getFirstModule } from '@/lib/viewModels';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import type { WorkoutModuleData } from '@/types/schema';

export default function SystemLogBar() {
  const [time, setTime] = useState('');
  const { user } = useAuth();
  const vm = useDashboardVM();
  const { data } = useDashboardStats(user?.id);

  const workoutFocus = useMemo(() => {
    const mod = getFirstModule(vm.modules, 'workout');
    return (mod?.data as WorkoutModuleData | undefined)?.focus ?? 'REST';
  }, [vm.modules]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateLabel = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
      setTime(`${dateLabel} · ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const marquee = useMemo(() => {
    const streak = data?.commits.streakDays ?? 0;
    const weekly = data?.commits.last7Days ?? 0;
    const lastCommit = data?.commits.lastCommitHoursAgo;
    const focus = workoutFocus;
    const goal = vm.header.goal;
    const commitText = lastCommit === null ? 'no commits recorded' : `last commit ${lastCommit}h ago`;

    return `> ${commitText} · streak: ${streak} days · weekly: ${weekly}/7 · focus: ${String(focus).toLowerCase()} · goal: ${goal}`;
  }, [data?.commits.last7Days, data?.commits.lastCommitHoursAgo, data?.commits.streakDays, workoutFocus, vm.header.goal]);

  return (
    <div className="w-full h-[28px] bg-[#0A0A0A] border-t border-[#161616] flex items-center justify-between px-[64px] fixed bottom-0 left-0 z-50">
      
      {/* Left: Status */}
      <div className="flex items-center gap-2 min-w-[150px]">
        <div className={`w-[6px] h-[6px] ${data?.commits.todayCommitted ? 'bg-[#22C55E]' : 'bg-gold'} animate-blink`} />
        <span className="font-mono text-[10px] text-[#3A3A3A] tracking-wider uppercase">
          {data?.commits.todayCommitted ? 'Committed Today' : 'Pending Commit'}
        </span>
      </div>

      {/* Center: Marquee */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center mx-8 mask-edges">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8">
          <span className="font-mono text-[10px] text-[#2A2A2A]">
            {marquee}
          </span>
          {/* Duplicate for seamless loop */}
          <span className="font-mono text-[10px] text-[#2A2A2A]" aria-hidden="true">
            {marquee}
          </span>
        </div>
      </div>

      {/* Right: Clock */}
      <div className="min-w-[150px] text-right">
        <span className="font-mono text-[10px] text-[#2A2A2A] tracking-widest">{time}</span>
      </div>
    </div>
  );
}
