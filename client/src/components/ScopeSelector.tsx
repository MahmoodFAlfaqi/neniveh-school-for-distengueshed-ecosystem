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
  type: "public" | "grade" | "section";
  gradeNumber: number | null;
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

  const publicScope = scopes.find((s) => s.type === "public");
  const gradeScopes = scopes.filter((s) => s.type === "grade").sort((a, b) => (a.gradeNumber || 0) - (b.gradeNumber || 0));
  const sectionScopes = scopes.filter((s) => s.type === "section").sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));

  const handleScopeChange = async (newScopeId: string) => {
    const isPublic = newScopeId === "public" || newScopeId === publicScope?.id;
    if (isPublic && publicScope) {
      // For public scope, we pass the actual scope ID so it's treated as a specific scope
      onChange(publicScope.id);
      return;
    }

    const scope = scopes.find((s) => s.id === newScopeId);
    if (!scope) {
      onChange(newScopeId);
      return;
    }

    if (scope.type === "grade" || scope.type === "section") {
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
    if (type === "public") return <Globe className="w-4 h-4" />;
    if (type === "grade") return <GraduationCap className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  const selectedScope = value ? scopes.find((s) => s.id === value) : publicScope;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Select value={value || (publicScope?.id || "")} onValueChange={handleScopeChange}>
          <SelectTrigger data-testid="select-scope">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {/* Public Scope */}
            {publicScope && (
              <SelectItem value={publicScope.id} data-testid="scope-option-public">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span>{publicScope.name}</span>
                </div>
              </SelectItem>
            )}

            {/* Grade Scopes */}
            {gradeScopes.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Grades</div>
                {gradeScopes.map((scope) => (
                  <SelectItem key={scope.id} value={scope.id} data-testid={`scope-option-grade-${scope.gradeNumber}`}>
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
