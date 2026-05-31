'use client';

import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';

export default function ZoneF_VisualScan() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardStats(user?.id);

  const latestUrl = data?.visual.latestImageUrl ?? null;
  const latestLabel = data?.visual.latestLabel ?? '—';

  return (
    <div className="col-span-4 row-span-1 bg-[#0F0F0F] border border-[#1E1E1E]  p-[16px] shadow-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] text-[#3A3A3A] tracking-[0.15em] uppercase">Physique Scan</span>
        <span className="font-mono text-[10px] text-[#4A4A4A] uppercase">{latestLabel}</span>
      </div>

      {/* Image Area */}
      <div className="flex-1 bg-[#141414]  relative overflow-hidden mb-4 border border-[#1E1E1E]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gold" />
          </div>
        ) : latestUrl ? (
          <>
            <img
              src={latestUrl}
              alt="Latest Physique Log"
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        )}
        
        {/* Targeting Overlay Corners */}
        {/* Top Left */}
        <div className="absolute top-[8px] left-[8px] w-[12px] h-[12px] border-t-[1.5px] border-l-[1.5px] border-gold" />
        {/* Top Right */}
        <div className="absolute top-[8px] right-[8px] w-[12px] h-[12px] border-t-[1.5px] border-r-[1.5px] border-gold" />
        {/* Bottom Left */}
        <div className="absolute bottom-[8px] left-[8px] w-[12px] h-[12px] border-b-[1.5px] border-l-[1.5px] border-gold" />
        {/* Bottom Right */}
        <div className="absolute bottom-[8px] right-[8px] w-[12px] h-[12px] border-b-[1.5px] border-r-[1.5px] border-gold" />

        {/* Scan Line */}
        <div className="absolute left-0 right-0 h-[1px] bg-gold/30 shadow-[0_0_8px_rgba(212,175,55,0.4)] animate-scan z-10" />
      </div>

      {/* Bottom Stat Row */}
      <div className="flex items-center justify-between px-2">
        <span className="font-mono text-[10px] text-text-secondary uppercase">{latestUrl ? 'Latest' : 'No scans'}</span>
        <span className="font-mono text-[10px] text-[#2A2A2A]">·</span>
        <span className="font-mono text-[10px] text-[#22C55E] uppercase">{latestUrl ? 'stored' : 'upload'}</span>
        <span className="font-mono text-[10px] text-[#2A2A2A]">·</span>
        <span className="font-mono text-[10px] text-text-secondary uppercase">{latestUrl ? 'visual log' : 'weekly cadence'}</span>
      </div>
    </div>
  );
}
