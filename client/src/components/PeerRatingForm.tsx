import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, ChevronDown } from "lucide-react";
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
  
  const [expandForm, setExpandForm] = useState(false);

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    METRICS.forEach(metric => {
      initial[metric.key] = 3; // Default to 3 stars
    });
    return initial;
  });

  const [expandedMetrics, setExpandedMetrics] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    METRICS.forEach(metric => {
      initial[metric.key] = false;
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
      <button
        onClick={() => setExpandForm(!expandForm)}
        className="w-full hover-elevate active-elevate-2"
        data-testid="button-toggle-rating-form"
      >
        <CardHeader className="cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex-1 text-left">
              <CardTitle>Rate {ratedUserName}</CardTitle>
              <CardDescription>
                Rate your peer on these 15 performance metrics. Your rating will be anonymous and combined with others.
              </CardDescription>
            </div>
            <ChevronDown 
              className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${expandForm ? "rotate-180" : ""}`}
            />
          </div>
        </CardHeader>
      </button>
      {expandForm && (
        <CardContent className="p-3 pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              {METRICS.map((metric) => (
                <Collapsible
                  key={metric.key}
                  open={expandedMetrics[metric.key]}
                  onOpenChange={(open) =>
                    setExpandedMetrics((prev) => ({ ...prev, [metric.key]: open }))
                  }
                >
                  <CollapsibleTrigger className="w-full text-left" data-testid={`trigger-metric-${metric.key}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover-elevate">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {metric.description}
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedMetrics[metric.key] ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 pb-3 px-3">
                    <div className="flex gap-1 justify-end">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(metric.key, star)}
                          className="hover-elevate active-elevate-2 rounded p-1"
                          data-testid={`button-rate-${metric.key}-${star}`}
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= ratings[metric.key]
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
      )}
    </Card>
  );
}
