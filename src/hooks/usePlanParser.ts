import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { migrateIfNeeded } from '@/lib/planMigration';
import type { AestheticOSPlan } from '@/types/schema';

export type ParsedPlan = {
  id: string;
  plan: AestheticOSPlan;
};

export function usePlanParser(userId: string) {
  return useQuery<ParsedPlan | null>({
    queryKey: ['plan', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('plans')
        .select('id, plan_json')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data?.plan_json) return null;

      return {
        id:   data.id as string,
        plan: migrateIfNeeded(data.plan_json),
      };
    },
    enabled: !!userId,
    retry: false,
  });
}
