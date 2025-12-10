import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

type ReportButtonProps = {
  reportedUserId?: string;
  reportedPostId?: string;
  reportedEventId?: string;
  reportedStudySourceId?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "icon" | "sm" | "default";
};

export function ReportButton({
  reportedUserId,
  reportedPostId,
  reportedEventId,
  reportedStudySourceId,
  variant = "ghost",
  size = "icon",
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const { user } = useUser();

  const reportMutation = useMutation({
    mutationFn: async (data: { reason: string; reportedUserId?: string; reportedPostId?: string; reportedEventId?: string; reportedStudySourceId?: string }) => {
      return await apiRequest("POST", "/api/reports", data);
    },
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe.",
      });
      setOpen(false);
      setReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (reason.trim().length < 5) {
      toast({
        title: "Reason required",
        description: "Please provide a reason with at least 5 characters.",
        variant: "destructive",
      });
      return;
    }

    reportMutation.mutate({
      reason: reason.trim(),
      reportedUserId,
      reportedPostId,
      reportedEventId,
      reportedStudySourceId,
    });
  };

  if (!user || user.role === "visitor") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="text-muted-foreground hover:text-destructive"
          data-testid="button-report"
        >
          <Flag className="w-4 h-4" />
          {size !== "icon" && <span className="ml-1">Report</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe community by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Why are you reporting this?</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe the issue (minimum 5 characters)..."
              className="mt-2"
              rows={4}
              data-testid="input-report-reason"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-report">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reportMutation.isPending || reason.trim().length < 5}
              data-testid="button-submit-report"
            >
              {reportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
