import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Calendar, Newspaper, Lock, ArrowLeft } from "lucide-react";
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

type Student = {
  id: string;
  name: string;
  username: string;
  credibilityScore: number;
  reputationScore: number;
  avatarUrl?: string;
};

export default function ClassDetail() {
  const { gradeNumber, className } = useParams();
  const grade = parseInt(gradeNumber || "1");

  // Fetch all scopes to find this class's scope
  const { data: scopes } = useQuery<Scope[]>({
    queryKey: ["/api/scopes"],
  });

  // Find the scope for this class
  const classScope = scopes?.find(s => s.name === `Class ${grade}-${className}`);
  const hasAccess = useHasAccessToScope(classScope?.id);

  const { data: posts = [], isLoading: postsLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", classScope?.id],
    queryFn: async () => {
      if (!classScope?.id) return [];
      const response = await fetch(`/api/posts?scopeId=${classScope.id}`);
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
    enabled: !!classScope?.id && hasAccess,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", classScope?.id],
    queryFn: async () => {
      if (!classScope?.id) return [];
      const response = await fetch(`/api/events?scopeId=${classScope.id}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: !!classScope?.id && hasAccess,
  });

  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: [`/api/classes/${grade}/${className}/students`],
  });

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Class {grade}-{className}</h1>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Grade {grade}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              News, events, and students in Class {grade}-{className}
            </p>
          </div>
          <Button variant="outline" asChild data-testid="button-back-to-grade">
            <Link href={`/grades/${grade}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Grade {grade}
            </Link>
          </Button>
        </div>

        {/* Students Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Students in Class {grade}-{className}
            </CardTitle>
            <CardDescription>
              View profiles and stats for all students in this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : students && students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.map((student) => (
                  <Card 
                    key={student.id} 
                    className="hover-elevate active-elevate-2 cursor-pointer"
                    data-testid={`card-student-${student.id}`}
                  >
                    <CardHeader className="flex flex-row items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{getUserInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{student.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{student.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            Score: {student.credibilityScore}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No students enrolled in Class {grade}-{className} yet
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* News & Events Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="news" data-testid="tab-class-news">
              <Newspaper className="w-4 h-4 mr-2" />
              Class News
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-class-events">
              <Calendar className="w-4 h-4 mr-2" />
              Class Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4 mt-6">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
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
                    No news posts yet for Class {grade}-{className}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4 mt-6">
            {eventsLoading ? (
              <div className="space-y-4">
                {[1].map((i) => (
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
                    No events scheduled yet for Class {grade}-{className}
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
