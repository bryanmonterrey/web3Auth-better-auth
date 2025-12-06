import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";

export function useAuthSession() {
    return useQuery({
        queryKey: ["session"],
        queryFn: async () => {
            const { data } = await authClient.getSession();
            return data;
        },
        staleTime: 1 * 60 * 1000, // 1 minute - balance between freshness and performance
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchInterval: 1000, // Poll every 2 seconds to catch auth state changes
    });
}
