import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DigitalKey } from "@shared/schema";

type Scope = {
  id: string;
  type: "public" | "grade" | "section";
  gradeNumber: number | null;
  sectionName: string | null;
};

type CurrentUser = { role: string; grade: number | null; className: string | null } | null;

/** Mirrors the server rules in storage.hasAccessToScope */
export function canAccessScope(
  scope: Scope | undefined,
  user: CurrentUser | undefined,
  keys: Pick<DigitalKey, "scopeId">[],
): boolean {
  if (!scope) return false;
  if (scope.type === "public") return true;
  if (user?.role === "admin") return true;
  if (scope.type === "grade" && user?.grade != null && scope.gradeNumber === user.grade) return true;
  if (scope.type === "section" && user?.grade != null && scope.sectionName === `${user.grade}-${user.className}`) return true;
  return keys.some((key) => key.scopeId === scope.id);
}

export function useCurrentUserForAccess() {
  return useQuery<CurrentUser>({ queryKey: ["/api/auth/me"] }).data;
}

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
  const user = useCurrentUserForAccess();
  
  return useMemo(() => {
    if (!scopeId) return true; // Global scope or no scope
    const scope = scopes.find(s => s.id === scopeId);
    // Unknown scope (still loading): fall back to the key check
    if (!scope) return keys.some(key => key.scopeId === scopeId);
    return canAccessScope(scope, user, keys);
  }, [keys, scopeId, scopes, user]);
}
