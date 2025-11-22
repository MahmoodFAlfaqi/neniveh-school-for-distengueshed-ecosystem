import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Star, Award, TrendingUp, User as UserIcon, Calendar, MessageSquare, Edit2, Trash2, ChevronDown } from "lucide-react";
import { PeerRatingForm } from "@/components/PeerRatingForm";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { UserProfileLink } from "@/components/UserProfileLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "student" | "admin";
  grade: number | null;
  className: string | null;
  avatarUrl: string | null;
  bio: string | null;
  credibilityScore: number;
  reputationScore: number;
  accountStatus: "active" | "threatened" | "suspended";
  createdAt: string;
  initiativeScore: number | null;
  communicationScore: number | null;
  cooperationScore: number | null;
  kindnessScore: number | null;
  perseveranceScore: number | null;
  fitnessScore: number | null;
  playingSkillsScore: number | null;
  inClassMisconductScore: number | null;
  outClassMisconductScore: number | null;
  literaryScienceScore: number | null;
  naturalScienceScore: number | null;
  electronicScienceScore: number | null;
  confidenceScore: number | null;
  temperScore: number | null;
  cheerfulnessScore: number | null;
};

type StatMetric = {
  key: keyof User;
  label: string;
  arabicLabel: string;
  isInverse?: boolean;
};

type ProfileComment = {
  id: string;
  profileUserId: string;
  content: string;
  rating: number | null;
  createdAt: string;
  authorId: string;
  authorName?: string;
  authorRole?: string;
  authorAvatarUrl?: string | null;
};

const STAT_METRICS: StatMetric[] = [
  { key: "initiativeScore", label: "Initiative", arabicLabel: "المبادرة" },
  { key: "communicationScore", label: "Communication", arabicLabel: "التواصل" },
  { key: "cooperationScore", label: "Cooperation", arabicLabel: "التعاون مع الآخرين" },
  { key: "kindnessScore", label: "Kindness", arabicLabel: "الطيبة" },
  { key: "perseveranceScore", label: "Perseverance", arabicLabel: "الإصرار" },
  { key: "fitnessScore", label: "Fitness", arabicLabel: "اللياقة" },
  { key: "playingSkillsScore", label: "Playing Skills", arabicLabel: "مهارات اللعب" },
  { key: "inClassMisconductScore", label: "In-Class Conduct", arabicLabel: "المشاغبة داخل الصف", isInverse: true },
  { key: "outClassMisconductScore", label: "Out-Class Conduct", arabicLabel: "المشاغبة خارج الصف", isInverse: true },
  { key: "literaryScienceScore", label: "Literary Science", arabicLabel: "العلم الأدبي" },
  { key: "naturalScienceScore", label: "Natural Science", arabicLabel: "العلم الطبيعي" },
  { key: "electronicScienceScore", label: "Electronic Science", arabicLabel: "العلم الإلكتروني" },
  { key: "confidenceScore", label: "Confidence", arabicLabel: "الثقة" },
  { key: "temperScore", label: "Temper", arabicLabel: "الغضب", isInverse: true },
  { key: "cheerfulnessScore", label: "Cheerfulness", arabicLabel: "البشاشة" },
];

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.round(score)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{score.toFixed(1)}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId;
  const [editingProfile, setEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [expandMetrics, setExpandMetrics] = useState(false);
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: userId ? [`/api/users/${userId}`] : ["/api/auth/me"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { bio: string; grade?: number; className?: string }) => {
      return await apiRequest("PATCH", `/api/users/${currentUser?.id}/profile`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}`] });
      setEditingProfile(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    if (user) {
      setEditBio(user.bio || "");
      setEditGrade(user.grade?.toString() || "");
      setEditClassName(user.className || "");
      setEditingProfile(true);
    }
  };

  const handleSaveProfile = () => {
    if (currentUser?.id === user?.id) {
      updateProfileMutation.mutate({
        bio: editBio,
        grade: editGrade ? parseInt(editGrade) : undefined,
        className: editClassName || undefined,
      });
    }
  };

  const [, setLocation] = useLocation();

  const deleteAccountMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "The user account has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      deleteAccountMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <UserIcon className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">User Not Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                The user you're looking for doesn't exist.
              </p>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6 flex-wrap">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold" data-testid="text-profile-name">
                    {user.name}
                  </h1>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                  {user.accountStatus !== "active" && (
                    <Badge variant="destructive">{user.accountStatus}</Badge>
                  )}
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditProfile}
                      data-testid="button-edit-profile"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {currentUser?.role === "admin" && !isOwnProfile && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteAccount(user.id)}
                      disabled={deleteAccountMutation.isPending}
                      data-testid="button-delete-account"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                    </Button>
                  )}
                </div>
                
                <p className="text-muted-foreground mb-2">@{user.username}</p>
                
                {user.grade && user.className && (
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <Badge variant="outline">
                      Grade {user.grade}-{user.className}
                    </Badge>
                  </div>
                )}
                
                {user.bio && (
                  <p className="text-sm mt-3">{user.bio}</p>
                )}
                
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Credibility Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {user.credibilityScore.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Content quality rating (0-100)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Reputation Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {user.reputationScore.toFixed(0)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Overall contribution points
              </p>
            </CardContent>
          </Card>
        </div>

        {user.role === "student" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  Average Performance Rating
                </CardTitle>
                <CardDescription>
                  Overall peer rating across all metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const scores = STAT_METRICS.map((metric) => {
                      let score = user[metric.key] as number | null;
                      // Skip inverse transformation for null/0 scores
                      if (metric.isInverse && score !== null && score !== undefined && score !== 0) {
                        score = 6 - score; // Convert 1->5, 2->4, 3->3, 4->2, 5->1
                      }
                      return score;
                    });
                    const validScores = scores.filter((s) => s !== null && s !== undefined && s !== 0) as number[];
                    const avgScore = validScores.length > 0 
                      ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length 
                      : 3;
                    
                    return (
                      <Star
                        key={i}
                        className={`w-8 h-8 ${
                          i < Math.round(avgScore)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="text-3xl font-bold">
                  {(() => {
                    const scores = STAT_METRICS.map((metric) => {
                      let score = user[metric.key] as number | null;
                      // Skip inverse transformation for null/0 scores
                      if (metric.isInverse && score !== null && score !== undefined && score !== 0) {
                        score = 6 - score;
                      }
                      return score;
                    });
                    const validScores = scores.filter((s) => s !== null && s !== undefined && s !== 0) as number[];
                    const avgScore = validScores.length > 0 
                      ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length 
                      : 3;
                    return avgScore.toFixed(1);
                  })()}
                </div>
                <p className="text-sm text-muted-foreground">out of 5.0</p>
              </CardContent>
            </Card>

            <Card>
              <button
                onClick={() => setExpandMetrics(!expandMetrics)}
                className="w-full hover-elevate active-elevate-2"
                data-testid="button-toggle-metrics"
              >
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-left">
                      <CardTitle>Individual Performance Metrics</CardTitle>
                      <CardDescription>
                        Detailed peer-rated metrics (1-5 stars)
                      </CardDescription>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${expandMetrics ? "rotate-180" : ""}`}
                    />
                  </div>
                </CardHeader>
              </button>
              {expandMetrics && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {STAT_METRICS.map((metric) => {
                      let score = user[metric.key] as number | null;
                      // Inverse misconduct and temper scores for display
                      if (metric.isInverse && score !== null && score !== undefined && score !== 0) {
                        score = 6 - score;
                      }
                      const displayScore = score || 3;
                      
                      return (
                        <div
                          key={metric.key}
                          className="flex items-center justify-between p-2 rounded-lg border"
                          data-testid={`stat-${metric.key}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{metric.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {metric.arabicLabel}
                            </div>
                            {metric.isInverse && (
                              <div className="text-xs text-yellow-600 dark:text-yellow-500">
                                Lower is better (inverted display)
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 ml-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(displayScore)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-xs font-medium">{displayScore.toFixed(1)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          </>
        )}

        {!isOwnProfile && currentUser && (
          <PeerRatingForm
            ratedUserId={user.id}
            ratedUserName={user.name}
            currentUserId={currentUser.id}
          />
        )}

        <ProfileCommentsSection userId={user.id} currentUserId={currentUser?.id} />
      </div>

      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="grade" className="text-sm font-medium">Grade</label>
              <Select value={editGrade} onValueChange={setEditGrade}>
                <SelectTrigger id="grade" data-testid="select-edit-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <SelectItem key={g} value={g.toString()}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="className" className="text-sm font-medium">Class</label>
              <Select value={editClassName} onValueChange={setEditClassName}>
                <SelectTrigger id="className" data-testid="select-edit-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D"].map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium">Bio</label>
              <Textarea
                id="bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-24 resize-none"
                data-testid="textarea-edit-bio"
                maxLength={500}
              />
              <div className="flex justify-end">
                <span className={`text-xs ${editBio.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                  {editBio.length}/500
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingProfile(false)}
              data-testid="button-cancel-profile-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={editBio.length > 500 || updateProfileMutation.isPending}
              data-testid="button-save-profile-edit"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileCommentsSection({ userId, currentUserId }: { userId: string; currentUserId?: string }) {
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  
  const isOwnProfile = userId === currentUserId;
  
  const { data: comments = [], isLoading } = useQuery<ProfileComment[]>({
    queryKey: ["/api/users", userId, "comments"],
    enabled: !!userId,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", `/api/users/${userId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "comments"] });
      setCommentText("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }
    createCommentMutation.mutate(commentText);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments
        </CardTitle>
        <CardDescription>
          {comments.length === 0 ? "No comments yet" : `${comments.length} comment${comments.length === 1 ? "" : "s"}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUserId && !isOwnProfile && (
          <div className="space-y-2">
            <Textarea
              data-testid="input-comment"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button
              data-testid="button-submit-comment"
              onClick={handleSubmitComment}
              disabled={createCommentMutation.isPending || !commentText.trim()}
            >
              {createCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg border"
                data-testid={`comment-${comment.id}`}
              >
                <UserProfileLink
                  userId={comment.authorId}
                  name={comment.authorName || "Unknown User"}
                  avatarUrl={comment.authorAvatarUrl}
                  showAvatar={true}
                  className="items-start"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.authorRole && (
                      <Badge variant="outline" className="text-xs">
                        {comment.authorRole}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm" data-testid={`comment-content-${comment.id}`}>{comment.content}</p>
                  {comment.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({ length: comment.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
