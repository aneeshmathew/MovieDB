import { useQuery } from "@tanstack/react-query";
import { sdk } from "@/lib/graphqlClient";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { dashboard } = await sdk.Dashboard();
      return dashboard;
    },
  });
}
