import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Star, Plus, UserPlus, Trash2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { TeacherManagementDialog } from "@/components/TeacherManagementDialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Teacher = {
  id: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  academicAchievements: string[] | null;
};

type TeacherWithStats = {
  teacher: Teacher;
  reviews: any[];
  averageRating: number;
};

export default function TeachersPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const { data: teachers, isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      await apiRequest("DELETE", `/api/admin/teacher/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Success",
        description: "Teacher account has been deleted",
      });
      setTeacherToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher account",
        variant: "destructive",
      });
    },
  });

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setIsManagementOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsManagementOpen(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" data-testid={`star-full-${i}`} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-yellow-400/50 text-yellow-400" data-testid={`star-half-${i}`} />
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-muted-foreground" data-testid={`star-empty-${i}`} />
        );
      }
    }
    return stars;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">Teachers</h1>
          <p className="text-base text-muted-foreground">Browse teacher profiles and student reviews</p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={handleAddTeacher} data-testid="button-add-teacher">
            <Plus className="w-4 h-4 mr-2" />
            Add Teacher
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse" data-testid={`skeleton-teacher-${i}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teachers && teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="hover-elevate cursor-pointer"
              data-testid={`card-teacher-${teacher.id}`}
            >
              <Link href={`/teachers/${teacher.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16" data-testid={`avatar-teacher-${teacher.id}`}>
                      <AvatarImage src={teacher.photoUrl || undefined} alt={teacher.name} />
                      <AvatarFallback>
                        {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 truncate" data-testid={`text-teacher-name-${teacher.id}`}>
                        {teacher.name}
                      </h3>
                      
                      {teacher.academicAchievements && teacher.academicAchievements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {teacher.academicAchievements.slice(0, 2).map((achievement, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                              data-testid={`badge-achievement-${teacher.id}-${idx}`}
                            >
                              {achievement}
                            </Badge>
                          ))}
                          {teacher.academicAchievements.length > 2 && (
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-more-achievements-${teacher.id}`}>
                              +{teacher.academicAchievements.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {teacher.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2" data-testid={`text-description-${teacher.id}`}>
                          {teacher.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-muted-foreground" data-testid={`text-view-reviews-${teacher.id}`}>
                        Click to view reviews
                      </div>
                    </div>
                  </div>
                  
                  {user?.role === "admin" && (
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditTeacher(teacher);
                        }}
                        data-testid={`button-edit-teacher-${teacher.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteTeacher(teacher);
                        }}
                        data-testid={`button-delete-teacher-${teacher.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-no-teachers">No Teachers Yet</h3>
            <p className="text-muted-foreground mb-4">
              {user?.role === "admin" 
                ? "Add the first teacher profile to get started."
                : "Teacher profiles will appear here once they are added."}
            </p>
            {user?.role === "admin" && (
              <Button onClick={handleAddTeacher} data-testid="button-add-first-teacher">
                <Plus className="w-4 h-4 mr-2" />
                Add First Teacher
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <TeacherManagementDialog
        open={isManagementOpen}
        onOpenChange={setIsManagementOpen}
        teacher={selectedTeacher}
      />

      <AlertDialog open={!!teacherToDelete} onOpenChange={(open) => !open && setTeacherToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{teacherToDelete?.name}</strong>? This will permanently remove their account and all associated data including reviews and posts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (teacherToDelete) {
                  deleteMutation.mutate(teacherToDelete.id);
                }
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
