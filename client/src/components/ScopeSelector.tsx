import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Lock, Globe, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnlockScopeDialog } from "@/components/UnlockScopeDialog";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";

type Scope = {
  id: string;
  name: string;
  type: "global" | "stage" | "section";
  stageLevel: number | null;
  sectionName: string | null;
};

type ScopeSelectorProps = {
  value: string | null;
  onChange: (scopeId: string | null) => void;
  label?: string;
  placeholder?: string;
};

export function ScopeSelector({ value, onChange, label = "Post to", placeholder = "Select scope" }: ScopeSelectorProps) {
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [selectedScopeForUnlock, setSelectedScopeForUnlock] = useState<string | null>(null);

  const { data: scopes = [] } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  const hasAccess = useHasAccessToScope(value);

  const globalScope = scopes.find((s) => s.type === "global");
  const stageScopes = scopes.filter((s) => s.type === "stage").sort((a, b) => (a.stageLevel || 0) - (b.stageLevel || 0));
  const sectionScopes = scopes.filter((s) => s.type === "section").sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));

  const handleScopeChange = async (newScopeId: string) => {
    const isGlobal = newScopeId === "global" || newScopeId === globalScope?.id;
    if (isGlobal) {
      onChange(null);
      return;
    }

    const scope = scopes.find((s) => s.id === newScopeId);
    if (!scope) {
      onChange(newScopeId);
      return;
    }

    if (scope.type === "stage" || scope.type === "section") {
      const response = await fetch(`/api/keys/check/${newScopeId}`);
      const hasKey = response.ok && (await response.json()).hasAccess;
      
      if (hasKey) {
        onChange(newScopeId);
      } else {
        setSelectedScopeForUnlock(newScopeId);
        setShowUnlockDialog(true);
      }
    } else {
      onChange(newScopeId);
    }
  };

  const handleUnlockSuccess = () => {
    if (selectedScopeForUnlock) {
      onChange(selectedScopeForUnlock);
      setSelectedScopeForUnlock(null);
    }
    setShowUnlockDialog(false);
  };

  const handleUnlockCancel = () => {
    setSelectedScopeForUnlock(null);
    setShowUnlockDialog(false);
  };

  const getScopeIcon = (type: string) => {
    if (type === "global") return <Globe className="w-4 h-4" />;
    if (type === "stage") return <GraduationCap className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const selectedScope = value ? scopes.find((s) => s.id === value) : globalScope;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Select value={value || "global"} onValueChange={handleScopeChange}>
          <SelectTrigger data-testid="select-scope">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {/* Global Scope */}
            {globalScope && (
              <SelectItem value="global" data-testid="scope-option-global">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{globalScope.name}</span>
                </div>
              </SelectItem>
            )}

            {/* Grade Scopes */}
            {stageScopes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Grades</div>
                {stageScopes.map((scope) => (
                  <SelectItem key={scope.id} value={scope.id} data-testid={`scope-option-grade-${scope.stageLevel}`}>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>{scope.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}

            {/* Class Scopes */}
            {sectionScopes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Classes</div>
                {sectionScopes.map((scope) => (
                  <SelectItem key={scope.id} value={scope.id} data-testid={`scope-option-class-${scope.sectionName}`}>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{scope.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>

        {value && !hasAccess && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedScopeForUnlock(value);
              setShowUnlockDialog(true);
            }}
            data-testid="button-unlock-scope"
          >
            <Lock className="w-4 h-4 mr-2" />
            Unlock
          </Button>
        )}
      </div>

      {selectedScope && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {getScopeIcon(selectedScope.type)}
          {hasAccess || !value ? (
            <span>Posting to {selectedScope.name}</span>
          ) : (
            <span className="text-orange-600 dark:text-orange-400">
              <Lock className="w-3 h-3 inline mr-1" />
              You need to unlock {selectedScope.name} to post here
            </span>
          )}
        </p>
      )}

      {selectedScopeForUnlock && (
        <UnlockScopeDialog
          scopeId={selectedScopeForUnlock}
          scopeName={scopes.find((s) => s.id === selectedScopeForUnlock)?.name || "this scope"}
          open={showUnlockDialog}
          onOpenChange={(open) => {
            if (!open) handleUnlockCancel();
          }}
          onSuccess={handleUnlockSuccess}
        />
      )}
    </div>
  );
}
