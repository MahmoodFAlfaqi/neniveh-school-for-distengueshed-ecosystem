import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DigitalKey } from "@shared/schema";

export function useDigitalKeys() {
  return useQuery<DigitalKey[]>({
    queryKey: ["/api/keys"],
    staleTime: 0, // Always refetch on invalidation
  });
}

export function useHasAccessToScope(scopeId: string | null | undefined) {
  const { data: keys = [] } = useDigitalKeys();
  
  return useMemo(() => {
    if (!scopeId) return true; // Global scope or no scope
    return keys.some(key => key.scopeId === scopeId);
  }, [keys, scopeId]);
}
