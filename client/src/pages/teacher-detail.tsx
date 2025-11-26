import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

type Teacher = {
  id: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  academicAchievements: string[] | null;
  subjects: string[] | null;
  sections: string[] | null;
  adminNotes: string | null;
};

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  studentId: string;
};

type TeacherWithReviews = {
  teacher: Teacher;
  reviews: Review[];
  averageRating: number;
};

type TeacherFeedback = {
  clarity: number;
  instruction: number;
  communication: number;
  patience: number;
  motivation: number;
  improvement: number;
  notes?: string;
};

type FeedbackStats = {
  averages: {
    clarity: number;
    instruction: number;
    communication: number;
    patience: number;
    motivation: number;
    improvement: number;
  };
  count: number;
};

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { toast } = useToast();

  const [feedback, setFeedback] = useState<TeacherFeedback>({
    clarity: 3,
    instruction: 3,
    communication: 3,
    patience: 3,
    motivation: 3,
    improvement: 3,
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<TeacherWithReviews>({
    queryKey: ["/api/teachers", id],
    enabled: !!id,
  });

  const { data: feedbackStats } = useQuery<FeedbackStats>({
    queryKey: ["/api/teachers", id, "feedback"],
    enabled: !!id && user?.role === "admin",
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: TeacherFeedback) => {
      const result = await apiRequest("POST", `/api/teachers/${id}/feedback`, feedbackData);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", id, "feedback"] });
      setFeedbackDialogOpen(false);
      // Reset form
      setFeedback({
        clarity: 3,
        instruction: 3,
        communication: 3,
        patience: 3,
        motivation: 3,
        improvement: 3,
        notes: "",
      });
    },
    onError: (error: Error) => {
      setFeedbackDialogOpen(false);
      // Extract message from error - could be "409: {...}" or "400: {...}" format
      let errorMsg = "Failed to submit feedback";
      let isInfo = false;
      
      try {
        const match = error.message.match(/(\d+):\s*(.+)$/);
        if (match) {
          const status = match[1];
          const jsonStr = match[2];
          const parsed = JSON.parse(jsonStr);
          errorMsg = parsed.message || errorMsg;
          // 409 is conflict (already submitted) - show as info instead of error
          isInfo = status === "409";
        } else {
          errorMsg = error.message;
        }
      } catch {
        errorMsg = error.message || errorMsg;
      }
      
      toast({
        title: isInfo ? "Feedback" : "Error",
        description: errorMsg,
        variant: isInfo ? "default" : "destructive",
      });
    },
  });

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role === "visitor") {
      toast({
        title: "Login required",
        description: "Please log in to submit feedback",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitFeedbackMutation.mutateAsync(feedback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = interactive 
        ? (hoveredStar !== null ? i <= hoveredStar : i <= count)
        : i <= Math.floor(count);
      const halfFilled = !interactive && i === Math.ceil(count) && count % 1 >= 0.5;

      stars.push(
        <button
          key={i}
          type={interactive ? "button" : undefined}
          onClick={interactive ? () => setRating(i) : undefined}
          onMouseEnter={interactive ? () => setHoveredStar(i) : undefined}
          onMouseLeave={interactive ? () => setHoveredStar(null) : undefined}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}
          disabled={!interactive}
          data-testid={`${interactive ? "button" : "icon"}-star-${i}`}
        >
          <Star
            className={`w-5 h-5 ${
              filled
                ? "fill-yellow-400 text-yellow-400"
                : halfFilled
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-muted" />
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2" data-testid="text-not-found">Teacher Not Found</h2>
            <p className="text-muted-foreground mb-4">The teacher you're looking for doesn't exist.</p>
            <Link href="/teachers">
              <Button variant="outline" data-testid="button-back-to-teachers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Teachers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { teacher, reviews, averageRating } = data;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Link href="/teachers">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teachers
        </Button>
      </Link>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24" data-testid="avatar-teacher">
              <AvatarImage src={teacher.photoUrl || undefined} alt={teacher.name} />
              <AvatarFallback className="text-2xl">
                {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2" data-testid="text-teacher-name">{teacher.name}</h1>
              

              {teacher.subjects && teacher.subjects.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="default" data-testid={`badge-subject-${idx}`}>
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {teacher.sections && teacher.sections.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Classes</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.sections.map((section, idx) => (
                      <Badge key={idx} variant="outline" data-testid={`badge-section-${idx}`}>
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {teacher.academicAchievements && teacher.academicAchievements.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Certificates & Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {teacher.academicAchievements.map((achievement, idx) => (
                      <Badge key={idx} variant="secondary" data-testid={`badge-achievement-${idx}`}>
                        {achievement}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {teacher.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
                  <p className="text-sm leading-relaxed" data-testid="text-description">
                    {teacher.description}
                  </p>
                </div>
              )}

              {user?.role === "admin" && teacher.adminNotes && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md">
                  <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">Admin Notes</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300" data-testid="text-admin-notes">
                    {teacher.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Feedback Hexagon or Rate Button */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Feedback</CardTitle>
          <Button 
            onClick={() => setFeedbackDialogOpen(true)}
            data-testid="button-rate"
          >
            Rate
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              Students can provide detailed feedback about this teacher.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the "Rate" button to submit your feedback.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-feedback">
          <DialogHeader>
            <DialogTitle>Submit Feedback for {teacher.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitFeedback} className="space-y-6">
            {/* Rating Questions */}
            {[
              { key: "clarity", label: "Clarity of Instruction" },
              { key: "instruction", label: "Quality of Instruction" },
              { key: "communication", label: "Communication Skills" },
              { key: "patience", label: "Patience & Understanding" },
              { key: "motivation", label: "Student Motivation" },
              { key: "improvement", label: "Encourages Improvement" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-sm font-medium">{label}</Label>
                <RadioGroup
                  value={feedback[key as keyof TeacherFeedback]?.toString()}
                  onValueChange={(value) =>
                    setFeedback({ ...feedback, [key]: parseInt(value) })
                  }
                  className="flex gap-4"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`${key}-${rating}`} />
                      <Label htmlFor={`${key}-${rating}`} className="cursor-pointer">
                        {rating}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}

            {/* Optional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Share any additional thoughts..."
                value={feedback.notes}
                onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                rows={4}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin-only Feedback Statistics */}
      {user?.role === "admin" && feedbackStats && feedbackStats.count > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Feedback Statistics (Admin Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Based on {feedbackStats.count} feedback submission{feedbackStats.count !== 1 ? "s" : ""}
              </p>
              <div className="w-full h-96 flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={[
                      {
                        name: "Clarity",
                        value: feedbackStats.averages.clarity,
                      },
                      {
                        name: "Instruction",
                        value: feedbackStats.averages.instruction,
                      },
                      {
                        name: "Communication",
                        value: feedbackStats.averages.communication,
                      },
                      {
                        name: "Patience",
                        value: feedbackStats.averages.patience,
                      },
                      {
                        name: "Motivation",
                        value: feedbackStats.averages.motivation,
                      },
                      {
                        name: "Improvement",
                        value: feedbackStats.averages.improvement,
                      },
                    ]}
                    margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                  >
                    <PolarGrid stroke="currentColor" strokeOpacity={0.2} />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      stroke="currentColor"
                      strokeOpacity={0.5}
                    />
                    <PolarRadiusAxis
                      domain={[0, 5]}
                      tick={{ fontSize: 12 }}
                      stroke="currentColor"
                      strokeOpacity={0.5}
                    />
                    <Radar
                      name="Average Rating"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
