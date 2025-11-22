import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Trophy, TrendingUp, Newspaper, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  name: string;
  role: string;
  credibilityScore: number;
  reputationScore: number;
  accountStatus: string;
};

type Post = {
  id: string;
  content: string;
  authorId: string;
  scopeId: string | null;
  credibilityRating: number;
  createdAt: string;
  author?: {
    name: string;
    role: string;
  };
};

type Event = {
  id: string;
  title: string;
  date: string;
  type: string;
};

export default function Home() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: recentPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const [calendarDate, setCalendarDate] = useState(new Date());

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Calendar logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const days = [];
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [calendarDate]);

  const eventDates = useMemo(() => {
    return events.map(e => new Date(e.date).getDate()).filter(d => !isNaN(d));
  }, [events]);

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1));
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        
        {/* Hero Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your school community updates
          </p>
        </div>

        {/* Stats Grid */}
        {user && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* Profile Card */}
            <Card className="hover-elevate" data-testid="card-user-stats">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="text-sm font-semibold">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" data-testid="text-user-name">{user.name}</p>
                    <Badge variant="secondary" className="mt-0.5 text-[0.65rem]">{user.role}</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                      <span className="text-[0.65rem] font-medium text-muted-foreground">Credibility</span>
                    </div>
                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400" data-testid="text-credibility">
                      {user.credibilityScore.toFixed(0)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[0.65rem] font-medium text-muted-foreground">Reputation</span>
                    </div>
                    <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400" data-testid="text-reputation">
                      {user.reputationScore.toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mini Calendar */}
            <Link href="/schedule" className="md:col-span-2">
              <Card className="hover-elevate active-elevate-2 cursor-pointer h-full" data-testid="card-upcoming-events">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Calendar
                    </h2>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {calendarDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        prevMonth();
                      }}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span className="text-[0.7rem] font-medium">
                      {calendarDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        nextMonth();
                      }}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Compact Calendar Grid */}
                  <div className="grid grid-cols-7 gap-0.5 px-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="text-center text-[0.55rem] font-bold text-muted-foreground py-0.5">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, idx) => (
                      <div
                        key={idx}
                        className={`aspect-square flex items-center justify-center text-[0.6rem] rounded-sm ${
                          day === null 
                            ? '' 
                            : eventDates.includes(day)
                            ? 'bg-primary/40 text-primary font-bold'
                            : 'text-foreground'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* News & Activity Section */}
        <Link href="/news">
          <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-news-preview">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Latest News</h2>
                <span className="text-xs text-muted-foreground ml-auto">
                  {recentPosts.length} posts
                </span>
              </div>

              {recentPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No posts yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {recentPosts.slice(0, 6).map((post: Post) => (
                    <div 
                      key={post.id} 
                      className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 transition-colors group"
                      data-testid={`post-preview-${post.id}`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <Avatar className="w-7 h-7 flex-shrink-0">
                          <AvatarFallback className="text-[0.6rem] font-semibold">
                            {post.author ? getUserInitials(post.author.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {post.author?.name || "Unknown"}
                          </p>
                          {post.author && (
                            <Badge variant="outline" className="text-[0.6rem] mt-0.5">
                              {post.author.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-1 text-[0.65rem] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
