import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Newspaper, Lock } from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Scope } from "@shared/schema";
import { useHasAccessToScope } from "@/hooks/use-digital-keys";

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId?: string;
  credibilityRating: number;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
};

type Event = {
  id: string;
  title: string;
  description: string;
  type: "curricular" | "extracurricular";
  startTime: string;
  endTime: string;
  location?: string;
};

export default function GradeDetail() {
  const { gradeNumber } = useParams();
  const grade = parseInt(gradeNumber || "1");

  // Mock classes for now - in reality, this would come from the database
  const classes = ["A", "B", "C", "D", "E"];

  // Fetch all scopes to find this grade's scope
  const { data: scopes } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  // Find the scope for this grade
  const gradeScope = scopes?.find(s => s.name === `Grade ${grade}`);
  const hasAccess = useHasAccessToScope(gradeScope?.id);

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", gradeScope?.id],
    queryFn: async () => {
      if (!gradeScope?.id) return [];
      const response = await fetch(`/api/posts?scopeId=${gradeScope.id}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
    enabled: !!gradeScope?.id && hasAccess,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", gradeScope?.id],
    queryFn: async () => {
      if (!gradeScope?.id) return [];
      const response = await fetch(`/api/events?scopeId=${gradeScope.id}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !!gradeScope?.id && hasAccess,
  });

  const getGradeName = (num: number) => {
    const names = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth"];
    return names[num - 1] || "Unknown";
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Grade {grade}</h1>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {getGradeName(grade)} Grade
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              News, events, and classes for Grade {grade}
            </p>
          </div>
          <Button variant="outline" asChild data-testid="button-back-to-grades">
            <Link href="/grades">Back to Grades</Link>
          </Button>
        </div>

        {/* Classes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Classes in Grade {grade}
            </CardTitle>
            <CardDescription>
              Select a class to view class-specific news and student profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {classes.map((className) => (
                <Link 
                  key={className} 
                  href={`/grades/${grade}/${className}`}
                  data-testid={`button-class-${grade}-${className}`}
                >
                  <Button 
                    variant="outline" 
                    className="w-full hover-elevate active-elevate-2"
                  >
                    Class {grade}-{className}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* News & Events Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="news" data-testid="tab-grade-news">
              <Newspaper className="w-4 h-4 mr-2" />
              News
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-grade-events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4 mt-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Passcode Required to Post
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Only students with the grade passcode can post news here. Contact your grade representative for access.
                </p>
              </CardContent>
            </Card>

            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.author.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {post.author.role}
                        </Badge>
                        <Badge variant="secondary">
                          Credibility: {post.credibilityRating}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No news posts yet for Grade {grade}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4 mt-6">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Passcode Required to Create Events
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Only students with the grade passcode can create events here. Contact your grade representative for access.
                </p>
              </CardContent>
            </Card>

            {eventsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{event.title}</CardTitle>
                        <Badge variant={event.type === "curricular" ? "default" : "secondary"}>
                          {event.type}
                        </Badge>
                      </div>
                      <CardDescription>
                        {new Date(event.startTime).toLocaleString()}
                        {event.location && ` • ${event.location}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{event.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No events scheduled yet for Grade {grade}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
