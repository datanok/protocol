import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserPages } from "@/actions/pageActions";
import type { Page } from "@/types/schema";

export function usePages(userId: string, accessToken: string) {
  return useQuery<Page[]>({
    queryKey: ["pages", userId],
    queryFn: () =>
      userId && accessToken
        ? getUserPages(userId, accessToken)
        : Promise.resolve([]),
    enabled: !!userId && !!accessToken,
  });
}

export function useInvalidatePages() {
  const qc = useQueryClient();
  return (userId: string) =>
    qc.invalidateQueries({ queryKey: ["pages", userId] });
}
