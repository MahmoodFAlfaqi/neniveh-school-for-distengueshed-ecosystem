import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { UserProfileLink } from "@/components/UserProfileLink";

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  authorCredibilityScore: number;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  authorName: string;
  authorRole: string;
  authorAvatarUrl: string | null;
  author: {
    name: string;
    role: string;
    avatarUrl: string | null;
    averageRating: number | null;
  };
};

export default function PublicSquarePage() {
  // Fetch public posts (no scope restriction)
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "null"],
    queryFn: async () => {
      const response = await fetch(`/api/posts?scopeId=null`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Public Square</h1>
        <p className="text-muted-foreground">
          Community announcements and discussions accessible to everyone
        </p>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                No public announcements yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card
              key={post.id}
              className="hover-elevate transition-all"
              data-testid={`card-post-${post.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={post.author.avatarUrl || ""}
                        alt={post.author.name}
                      />
                      <AvatarFallback>
                        {post.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <UserProfileLink
                        userId={post.authorId}
                        name={post.author.name}
                        className="font-semibold text-foreground hover:underline"
                        data-testid={`link-profile-${post.authorId}`}
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {post.author.role}
                        </Badge>
                        {post.author.averageRating && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>★</span>
                            <span>
                              {post.author.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-foreground whitespace-pre-wrap break-words">
                  {post.content}
                </p>

                {post.mediaUrl && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    {post.mediaType?.startsWith("image") ? (
                      <img
                        src={post.mediaUrl}
                        alt="Post media"
                        className="w-full max-h-96 object-cover"
                        data-testid={`img-post-media-${post.id}`}
                      />
                    ) : post.mediaType?.startsWith("video") ? (
                      <video
                        src={post.mediaUrl}
                        controls
                        className="w-full max-h-96"
                        data-testid={`video-post-media-${post.id}`}
                      />
                    ) : null}
                  </div>
                )}

                {post.credibilityRating && (
                  <div className="text-sm text-muted-foreground">
                    <Badge variant="outline">
                      Credibility: {post.credibilityRating.toFixed(1)}%
                    </Badge>
                  </div>
                )}

                <Separator />

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
                    data-testid={`button-like-${post.id}`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>{post.likesCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
