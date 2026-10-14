import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export const GRADES = [1, 2, 3, 4, 5, 6];
export const CLASS_LETTERS = ["A", "B", "C", "D", "E"];

const NONE = "none";

type ClassPickerProps = {
  userId: string;
  userName: string;
  grade: number | null;
  className: string | null;
  /** Admins may have no class; students always need one */
  allowNone?: boolean;
  /** Query keys to refresh after saving */
  invalidate: string[][];
};

/**
 * Inline grade + class editor that saves through PATCH /api/admin/users/:userId/class.
 */
export function ClassPicker({ userId, userName, grade, className, allowNone = false, invalidate }: ClassPickerProps) {
  const { toast } = useToast();
  const [draftGrade, setDraftGrade] = useState(grade ? String(grade) : NONE);
  const [draftClass, setDraftClass] = useState(className ?? NONE);

  useEffect(() => {
    setDraftGrade(grade ? String(grade) : NONE);
    setDraftClass(className ?? NONE);
  }, [grade, className]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body =
        draftGrade === NONE
          ? { grade: null, className: null }
          : { grade: parseInt(draftGrade), className: draftClass };
      return (await apiRequest("PATCH", `/api/admin/users/${userId}/class`, body)).json();
    },
    onSuccess: () => {
      toast({ title: "Class updated", description: `${userName} is now in ${draftGrade === NONE ? "no class" : `${draftGrade}-${draftClass}`}.` });
      invalidate.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
    onError: (error: Error) => {
      toast({ title: "Failed to change class", description: error.message, variant: "destructive" });
    },
  });

  const isUnassigned = draftGrade === NONE;
  const isComplete = isUnassigned ? allowNone : draftClass !== NONE;
  const isChanged = draftGrade !== (grade ? String(grade) : NONE) || draftClass !== (className ?? NONE);

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Class for ${userName}`}>
      <Select
        value={draftGrade}
        onValueChange={(value) => {
          setDraftGrade(value);
          if (value === NONE) setDraftClass(NONE);
          else if (draftClass === NONE) setDraftClass("A");
        }}
      >
        <SelectTrigger className="h-10 w-[7.5rem]" aria-label={`Grade for ${userName}`} data-testid={`select-grade-${userId}`}>
          <SelectValue placeholder="Grade" />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value={NONE}>No class</SelectItem>}
          {GRADES.map((g) => (
            <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={draftClass} onValueChange={setDraftClass} disabled={isUnassigned}>
        <SelectTrigger className="h-10 w-[6.5rem]" aria-label={`Class letter for ${userName}`} data-testid={`select-class-${userId}`}>
          <SelectValue placeholder="Class" />
        </SelectTrigger>
        <SelectContent>
          {isUnassigned && <SelectItem value={NONE}>—</SelectItem>}
          {CLASS_LETTERS.map((letter) => (
            <SelectItem key={letter} value={letter}>Class {letter}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        className="h-10"
        onClick={() => mutation.mutate()}
        disabled={!isChanged || !isComplete || mutation.isPending}
        data-testid={`button-save-class-${userId}`}
      >
        {mutation.isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
