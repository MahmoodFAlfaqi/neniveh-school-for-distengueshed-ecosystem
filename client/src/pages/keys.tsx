import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDigitalKeys } from "@/hooks/use-digital-keys";
import { UnlockScopeDialog } from "@/components/UnlockScopeDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Key } from "lucide-react";
import type { Scope, DigitalKey } from "@shared/schema";

export default function KeysPage() {
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null);

  const { data: scopes = [], isLoading: loadingScopes } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  const { data: keys = [], isLoading: loadingKeys } = useDigitalKeys();

  const hasKey = (scopeId: string) => keys.some((key) => key.scopeId === scopeId);

  const handleUnlockClick = (scope: Scope) => {
    setSelectedScope(scope);
    setUnlockDialogOpen(true);
  };

  const getScopeDisplayName = (scope: Scope) => {
    if (scope.type === "global") return "Public Square (Global)";
    if (scope.type === "stage") return `Grade ${scope.stageLevel}`;
    if (scope.type === "section") return scope.sectionName || "Unknown Section";
    return scope.name;
  };

  const getScopeBadgeType = (scope: Scope) => {
    if (scope.type === "global") return "default";
    if (scope.type === "stage") return "secondary";
    return "outline";
  };

  const globalScope = scopes.find((s) => s.type === "global");
  const stageScopes = scopes.filter((s) => s.type === "stage").sort((a, b) => (a.stageLevel || 0) - (b.stageLevel || 0));
  const sectionScopes = scopes.filter((s) => s.type === "section").sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));

  const isLoading = loadingScopes || loadingKeys;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Key className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Keys & Scopes
            </h1>
            <p className="text-muted-foreground" data-testid="text-page-description">
              Manage your access to different school communities
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading scopes...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {globalScope && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Global Access</h2>
                <ScopeCard
                  scope={globalScope}
                  displayName={getScopeDisplayName(globalScope)}
                  badgeType={getScopeBadgeType(globalScope)}
                  isUnlocked={true}
                  onUnlockClick={() => {}}
                />
              </div>
            )}

            {stageScopes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Grade Levels</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {stageScopes.map((scope) => (
                    <ScopeCard
                      key={scope.id}
                      scope={scope}
                      displayName={getScopeDisplayName(scope)}
                      badgeType={getScopeBadgeType(scope)}
                      isUnlocked={hasKey(scope.id)}
                      onUnlockClick={() => handleUnlockClick(scope)}
                    />
                  ))}
                </div>
              </div>
            )}

            {sectionScopes.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Class Sections</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sectionScopes.map((scope) => (
                    <ScopeCard
                      key={scope.id}
                      scope={scope}
                      displayName={getScopeDisplayName(scope)}
                      badgeType={getScopeBadgeType(scope)}
                      isUnlocked={hasKey(scope.id)}
                      onUnlockClick={() => handleUnlockClick(scope)}
                    />
                  ))}
                </div>
              </div>
            )}

            {scopes.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No scopes available yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {selectedScope && (
        <UnlockScopeDialog
          open={unlockDialogOpen}
          onOpenChange={setUnlockDialogOpen}
          scopeId={selectedScope.id}
          scopeName={getScopeDisplayName(selectedScope)}
          onSuccess={() => {
            setSelectedScope(null);
          }}
        />
      )}
    </div>
  );
}

function ScopeCard({
  scope,
  displayName,
  badgeType,
  isUnlocked,
  onUnlockClick,
}: {
  scope: Scope;
  displayName: string;
  badgeType: "default" | "secondary" | "outline";
  isUnlocked: boolean;
  onUnlockClick: () => void;
}) {
  const isGlobal = scope.type === "global";

  return (
    <Card
      className={isUnlocked ? "border-primary/50" : ""}
      data-testid={`card-scope-${scope.id}`}
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg" data-testid={`text-scope-name-${scope.id}`}>
              {displayName}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge variant={badgeType} className="no-default-hover-elevate">
                {scope.type}
              </Badge>
            </CardDescription>
          </div>
          <div>
            {isUnlocked ? (
              <Unlock className="w-5 h-5 text-primary" data-testid={`icon-unlocked-${scope.id}`} />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" data-testid={`icon-locked-${scope.id}`} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isGlobal ? (
          <p className="text-sm text-muted-foreground" data-testid="text-global-access">
            Everyone has access to the Public Square
          </p>
        ) : isUnlocked ? (
          <div className="flex items-center gap-2 text-sm text-primary">
            <Key className="w-4 h-4" />
            <span data-testid={`text-unlocked-${scope.id}`}>Access granted</span>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={onUnlockClick}
            data-testid={`button-unlock-${scope.id}`}
          >
            <Lock className="w-4 h-4 mr-2" />
            Enter Access Code
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
