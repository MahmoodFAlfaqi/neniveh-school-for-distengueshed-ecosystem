import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { z } from "zod";
import { insertPeerRatingSchema } from "@shared/schema";

type RatingFormData = z.infer<typeof insertPeerRatingSchema>;

interface PeerRatingFormProps {
  ratedUserId: string;
  ratedUserName: string;
  currentUserId: string;
}

const METRICS = [
  { key: "initiativeScore", label: "Initiative", description: "Takes charge and starts things" },
  { key: "communicationScore", label: "Communication", description: "Expresses ideas clearly" },
  { key: "cooperationScore", label: "Cooperation", description: "Works well with others" },
  { key: "kindnessScore", label: "Kindness", description: "Shows compassion and empathy" },
  { key: "perseveranceScore", label: "Perseverance", description: "Persists through challenges" },
  { key: "fitnessScore", label: "Physical Fitness", description: "Maintains physical health" },
  { key: "playingSkillsScore", label: "Playing Skills", description: "Athletic and game abilities" },
  { key: "inClassMisconductScore", label: "In-Class Behavior", description: "Lower is better", inverse: true },
  { key: "outClassMisconductScore", label: "Out-of-Class Behavior", description: "Lower is better", inverse: true },
  { key: "literaryScienceScore", label: "Literary Science", description: "Language and humanities" },
  { key: "naturalScienceScore", label: "Natural Science", description: "Biology, chemistry, physics" },
  { key: "electronicScienceScore", label: "Electronic Science", description: "Technology and computing" },
  { key: "confidenceScore", label: "Confidence", description: "Self-assured and positive" },
  { key: "temperScore", label: "Temper Control", description: "Lower is better", inverse: true },
  { key: "cheerfulnessScore", label: "Cheerfulness", description: "Positive and uplifting" },
] as const;

export function PeerRatingForm({ ratedUserId, ratedUserName, currentUserId }: PeerRatingFormProps) {
  const { toast } = useToast();

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    METRICS.forEach(metric => {
      initial[metric.key] = 3; // Default to 3 stars
    });
    return initial;
  });

  // Fetch existing rating
  const { data: existingRating, isLoading: isLoadingRating } = useQuery({
    queryKey: [`/api/users/${ratedUserId}/rating`],
  });

  // Load existing rating into form when data arrives
  useEffect(() => {
    if (!existingRating || typeof existingRating !== 'object') return;
    
    const newRatings: Record<string, number> = {};
    METRICS.forEach(metric => {
      const value = (existingRating as any)[metric.key];
      newRatings[metric.key] = typeof value === 'number' ? value : 3;
    });
    setRatings(newRatings);
  }, [existingRating]);

  const submitRatingMutation = useMutation({
    mutationFn: async (data: RatingFormData) => {
      return await apiRequest("POST", `/api/users/${ratedUserId}/rate`, data);
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: `You have successfully rated ${ratedUserName}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${ratedUserId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${ratedUserId}/rating`] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit rating",
        description: error.message,
      });
    },
  });
  
  // Prevent self-rating (after all hooks are declared)
  if (ratedUserId === currentUserId) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Send only the metric scores - server derives ratedUserId and raterUserId
    const ratingData: any = {};
    
    METRICS.forEach(metric => {
      ratingData[metric.key] = ratings[metric.key];
    });

    submitRatingMutation.mutate(ratingData);
  };

  const setRating = (metricKey: string, value: number) => {
    setRatings(prev => ({ ...prev, [metricKey]: value }));
  };

  if (isLoadingRating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rate {ratedUserName}</CardTitle>
          <CardDescription>Loading your previous rating...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate {ratedUserName}</CardTitle>
        <CardDescription>
          Rate your peer on these 15 performance metrics. Your rating will be anonymous and combined with others.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {METRICS.map((metric) => (
              <div key={metric.key} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{metric.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {metric.description}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(metric.key, star)}
                        className="hover-elevate active-elevate-2 rounded p-1"
                        data-testid={`button-rate-${metric.key}-${star}`}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= ratings[metric.key]
                              ? "fill-primary text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="submit" 
              disabled={submitRatingMutation.isPending}
              data-testid="button-submit-rating"
            >
              {submitRatingMutation.isPending ? "Submitting..." : existingRating ? "Update Rating" : "Submit Rating"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
