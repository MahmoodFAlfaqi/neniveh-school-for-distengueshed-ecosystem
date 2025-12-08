import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DigitalKey } from "@shared/schema";

type Scope = {
  id: string;
  type: "public" | "grade" | "section";
};

export function useDigitalKeys() {
  return useQuery<DigitalKey[]>({
    queryKey: ["/api/keys"],
    staleTime: 0, // Always refetch on invalidation
  });
}

export function useHasAccessToScope(scopeId: string | null | undefined) {
  const { data: keys = [] } = useDigitalKeys();
  const { data: scopes = [] } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });
  
  return useMemo(() => {
    if (!scopeId) return true; // Global scope or no scope
    
    // Public scope is always accessible
    const scope = scopes.find(s => s.id === scopeId);
    if (scope && scope.type === "public") {
      return true;
    }
    
    // For restricted scopes, check if user has a digital key
    return keys.some(key => key.scopeId === scopeId);
  }, [keys, scopeId, scopes]);
}
