import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useUser() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  return { user, isLoading, error };
}
