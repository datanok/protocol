'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';

export default function VisualVersioning({ userId }: { userId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('visual_logs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visual_logs')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('visual_logs')
        .insert({
          user_id: userId,
          image_url: publicUrl
        });

      if (dbError) throw dbError;

      setLastUpload(publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to save visual log.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-sans font-semibold text-sm uppercase tracking-widest text-foreground/70">
        Visual Versioning
      </h2>
      <div className="bento-card border border-surface-highest flex flex-col items-center justify-center min-h-[200px] gap-4 relative overflow-hidden group">
        
        {lastUpload ? (
          <img src={lastUpload} alt="Latest Log" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
        ) : (
          <ImageIcon className="w-8 h-8 text-surface-highest" />
        )}

        <div className="relative z-10 flex flex-col items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-surface border border-primary text-primary font-mono text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors duration-300">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Encrypting...' : 'Upload Log'}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
          <p className="text-xs font-mono text-foreground/40">SECURE STORAGE // WEEKLY CADENCE</p>
        </div>
      </div>
    </div>
  );
}
