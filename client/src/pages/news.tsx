import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare, Send, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ScopeSelector } from "@/components/ScopeSelector";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  authorName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
};

export default function NewsPage() {
  const { toast } = useToast();
  const [newPost, setNewPost] = useState("");
  const [selectedScope, setSelectedScope] = useState<string | null>(null);

  // Check if user has access to selected scope
  const hasAccess = useHasAccessToScope(selectedScope);

  // Fetch news posts for the selected scope (or all global posts if no scope selected)
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", selectedScope],
    queryFn: async () => {
      const scopeParam = selectedScope === null ? "null" : selectedScope;
      const response = await fetch(`/api/posts?scopeId=${scopeParam}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  // Get current user info
  const { data: user } = useQuery<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
  }>({
    queryKey: ["/api/auth/me"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/posts", {
        content,
        scopeId: selectedScope,
      });
    },
    onSuccess: () => {
      toast({
        title: "Post published",
        description: "Your news has been shared successfully",
      });
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", selectedScope] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      createPostMutation.mutate(newPost);
    }
  };

  const getCredibilityColor = (rating: number) => {
    if (rating >= 75) return "text-green-600 dark:text-green-400";
    if (rating >= 50) return "text-yellow-600 dark:text-yellow-400";
    if (rating >= 25) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Public Square</h1>
          <p className="text-muted-foreground">
            Share news and updates with the entire school community
          </p>
        </div>

        {/* Create Post Card */}
        <Card data-testid="card-create-post">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatarUrl || undefined} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name || "User"}</p>
                <Badge variant="secondary" className="text-xs">
                  {user?.role || "student"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmitPost}>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's happening in our school community?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-24 resize-none border-0 text-base focus-visible:ring-0"
                data-testid="textarea-new-post"
              />
              <Separator />
              <ScopeSelector
                value={selectedScope}
                onChange={setSelectedScope}
                label="Post to"
                placeholder="Select where to post"
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="submit"
                disabled={!newPost.trim() || createPostMutation.isPending || (selectedScope !== null && !hasAccess)}
                data-testid="button-submit-post"
              >
                <Send className="w-4 h-4 mr-2" />
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* News Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Latest News
          </h2>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading news...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No news yet. Be the first to share something!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover-elevate" data-testid={`card-post-${post.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.authorAvatarUrl || undefined} />
                        <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" data-testid={`text-author-${post.id}`}>
                          {post.authorName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="secondary" className="text-xs">
                            {post.authorRole}
                          </Badge>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={getCredibilityColor(post.credibilityRating)}>
                        {post.credibilityRating.toFixed(0)}% credibility
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap" data-testid={`text-content-${post.id}`}>
                    {post.content}
                  </p>
                  {post.mediaUrl && (
                    <div className="mt-4">
                      {post.mediaType === "image" && (
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          className="rounded-md max-h-96 w-full object-cover"
                        />
                      )}
                    </div>
                  )}
                </CardContent>
                <Separator />
                <CardFooter className="py-3 gap-4">
                  <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-like-${post.id}`}>
                    <Heart className="w-4 h-4" />
                    <span>{post.likesCount}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-comment-${post.id}`}>
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount}</span>
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
