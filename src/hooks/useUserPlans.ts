import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserPlans, activatePlan, deletePlan } from '@/actions/planActions';
import type { PlanSummary } from '@/actions/planActions';

export type { PlanSummary };

export function useUserPlans(userId: string) {
  return useQuery<PlanSummary[]>({
    queryKey: ['user-plans', userId],
    queryFn: () => (userId ? getUserPlans(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
}

/** Call after activatePlan / deletePlan to refresh both caches. */
export function useInvalidatePlans() {
  const qc = useQueryClient();
  return (userId: string) => {
    qc.invalidateQueries({ queryKey: ['plan',       userId] });
    qc.invalidateQueries({ queryKey: ['user-plans', userId] });
  };
}

export { activatePlan, deletePlan };
