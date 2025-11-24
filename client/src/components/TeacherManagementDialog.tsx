import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Predefined subjects list
const SUBJECTS = [
  "Math",
  "R.E.",
  "P.E.",
  "Social Studies",
  "Biology",
  "Chemistry",
  "Physics",
  "Arabic",
  "English",
  "French",
  "B.P.C.",
  "Finance",
  "Geology",
  "Computer Science",
  "Arts",
  "Moralism",
  "Library",
] as const;

// Generate all possible sections (1-A through 6-E)
const SECTIONS = Array.from({ length: 6 }, (_, grade) => {
  const gradeNum = grade + 1;
  return Array.from({ length: 5 }, (_, idx) => {
    const section = String.fromCharCode(65 + idx); // A-E
    return `${gradeNum}-${section}`;
  });
}).flat();

type Teacher = {
  id: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  academicAchievements: string[] | null;
  subjects?: string[] | null;
  sections?: string[] | null;
};

type TeacherManagementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: Teacher | null;
};

export function TeacherManagementDialog({
  open,
  onOpenChange,
  teacher,
}: TeacherManagementDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(teacher?.name || "");
  const [photoUrl, setPhotoUrl] = useState(teacher?.photoUrl || "");
  const [description, setDescription] = useState(teacher?.description || "");
  const [achievements, setAchievements] = useState<string[]>(
    teacher?.academicAchievements || []
  );
  const [newAchievement, setNewAchievement] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(
    new Set(teacher?.subjects || [])
  );
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(teacher?.sections || [])
  );

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/teachers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Success",
        description: "Teacher created successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create teacher",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/teachers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Success",
        description: "Teacher updated successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update teacher",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/teachers/${id}`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Success",
        description: "Teacher deleted successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setPhotoUrl("");
    setDescription("");
    setAchievements([]);
    setNewAchievement("");
    setSelectedSubjects(new Set());
    setSelectedSections(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      photoUrl: photoUrl || null,
      description: description || null,
      academicAchievements: achievements.length > 0 ? achievements : null,
      subjects: selectedSubjects.size > 0 ? Array.from(selectedSubjects) : null,
      sections: selectedSections.size > 0 ? Array.from(selectedSections) : null,
    };

    if (teacher) {
      updateMutation.mutate({ id: teacher.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (teacher && confirm(`Are you sure you want to delete ${teacher.name}?`)) {
      deleteMutation.mutate(teacher.id);
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-teacher-management">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {teacher ? "Edit Teacher" : "Add New Teacher"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
                data-testid="input-teacher-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl">Photo URL</Label>
              <Input
                id="photoUrl"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                data-testid="input-teacher-photo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description about the teacher..."
                rows={4}
                data-testid="textarea-teacher-description"
              />
            </div>

            <div className="space-y-2">
              <Label>Academic Achievements</Label>
              <div className="flex gap-2">
                <Input
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="e.g., PhD in Mathematics, Oxford"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAchievement();
                    }
                  }}
                  data-testid="input-new-achievement"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAchievement}
                  data-testid="button-add-achievement"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {achievements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {achievements.map((achievement, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="gap-1"
                      data-testid={`badge-achievement-${index}`}
                    >
                      {achievement}
                      <button
                        type="button"
                        onClick={() => removeAchievement(index)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-achievement-${index}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Subjects Taught</Label>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject}`}
                      checked={selectedSubjects.has(subject)}
                      onCheckedChange={(checked) => {
                        const newSubjects = new Set(selectedSubjects);
                        if (checked) {
                          newSubjects.add(subject);
                        } else {
                          newSubjects.delete(subject);
                        }
                        setSelectedSubjects(newSubjects);
                      }}
                      data-testid={`checkbox-subject-${subject}`}
                    />
                    <Label htmlFor={`subject-${subject}`} className="font-normal cursor-pointer">
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sections Taught</Label>
              <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3">
                {Array.from({ length: 6 }).map((_, gradeIdx) => {
                  const gradeNum = gradeIdx + 1;
                  const gradeSections = SECTIONS.filter((s) => s.startsWith(`${gradeNum}-`));
                  return (
                    <div key={`grade-${gradeNum}`}>
                      <div className="font-semibold text-sm mb-2">Grade {gradeNum}</div>
                      <div className="grid grid-cols-5 gap-2 ml-2">
                        {gradeSections.map((section) => (
                          <div key={section} className="flex items-center space-x-2">
                            <Checkbox
                              id={`section-${section}`}
                              checked={selectedSections.has(section)}
                              onCheckedChange={(checked) => {
                                const newSections = new Set(selectedSections);
                                if (checked) {
                                  newSections.add(section);
                                } else {
                                  newSections.delete(section);
                                }
                                setSelectedSections(newSections);
                              }}
                              data-testid={`checkbox-section-${section}`}
                            />
                            <Label htmlFor={`section-${section}`} className="font-normal cursor-pointer">
                              {section.split("-")[1]}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {teacher && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-teacher"
              >
                Delete Teacher
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-teacher"
            >
              {teacher ? "Update" : "Create"} Teacher
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
