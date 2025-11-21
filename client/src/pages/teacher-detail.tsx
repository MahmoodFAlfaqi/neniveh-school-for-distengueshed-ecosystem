import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, ArrowLeft, Send } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Teacher = {
  id: string;
  name: string;
  photoUrl: string | null;
  description: string | null;
  academicAchievements: string[] | null;
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

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const { data, isLoading } = useQuery<TeacherWithReviews>({
    queryKey: ["/api/teachers", id],
    enabled: !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      const res = await apiRequest("POST", `/api/teachers/${id}/reviews`, reviewData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers", id] });
      toast({
        title: "Success",
        description: "Your review has been submitted",
      });
      setComment("");
      setRating(5);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate({ rating, comment: comment.trim() || "" });
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
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1" data-testid="rating-display">
                  {renderStars(averageRating)}
                </div>
                <span className="text-sm text-muted-foreground" data-testid="text-average-rating">
                  {averageRating > 0 ? averageRating.toFixed(1) : "No ratings yet"} 
                  {reviews.length > 0 && ` (${reviews.length} ${reviews.length === 1 ? "review" : "reviews"})`}
                </span>
              </div>

              {teacher.academicAchievements && teacher.academicAchievements.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Academic Achievements</h3>
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
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">About</h3>
                  <p className="text-sm leading-relaxed" data-testid="text-description">
                    {teacher.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.role !== "admin" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle data-testid="text-write-review-title">Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label>Your Rating</Label>
                <div className="flex gap-1 mt-2" onMouseLeave={() => setHoveredStar(null)}>
                  {renderStars(rating, true)}
                </div>
              </div>

              <div>
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this teacher..."
                  rows={4}
                  data-testid="textarea-review-comment"
                />
              </div>

              <Button type="submit" disabled={reviewMutation.isPending} data-testid="button-submit-review">
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-reviews-title">Student Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b last:border-0 pb-4 last:pb-0"
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1" data-testid={`review-rating-${review.id}`}>
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm" data-testid={`review-comment-${review.id}`}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-reviews">
              No reviews yet. Be the first to review this teacher!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
