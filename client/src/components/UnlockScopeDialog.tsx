import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Unlock } from "lucide-react";

type UnlockScopeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scopeId: string;
  scopeName: string;
  onSuccess?: () => void;
};

export function UnlockScopeDialog({
  open,
  onOpenChange,
  scopeId,
  scopeName,
  onSuccess,
}: UnlockScopeDialogProps) {
  const [accessCode, setAccessCode] = useState("");
  const { toast } = useToast();

  const unlockMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/keys/unlock", {
        scopeId,
        accessCode: accessCode.trim(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Scope Unlocked!",
        description: `You now have access to post in ${scopeName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setAccessCode("");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error.data?.message || error.message || "Invalid access code. Please try again.";
      toast({
        title: "Unlock Failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter an access code",
        variant: "destructive",
      });
      return;
    }
    unlockMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-unlock-scope">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <DialogTitle data-testid="text-dialog-title">Unlock {scopeName}</DialogTitle>
          </div>
          <DialogDescription data-testid="text-dialog-description">
            This scope is locked. Enter the secret access code to unlock posting
            privileges. Once unlocked, you'll have permanent access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              type="text"
              placeholder="Enter secret code..."
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              disabled={unlockMutation.isPending}
              data-testid="input-access-code"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={unlockMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={unlockMutation.isPending}
              data-testid="button-unlock"
            >
              {unlockMutation.isPending ? (
                "Unlocking..."
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock Scope
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
