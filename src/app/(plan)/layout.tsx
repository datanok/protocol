import { PlanProvider } from '@/contexts/PlanContext';

export default function PlanGroupLayout({ children }: { children: React.ReactNode }) {
  return <PlanProvider>{children}</PlanProvider>;
}
