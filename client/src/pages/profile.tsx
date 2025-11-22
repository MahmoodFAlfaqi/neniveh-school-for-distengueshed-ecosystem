import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Award, TrendingUp, User as UserIcon, Calendar } from "lucide-react";
import { PeerRatingForm } from "@/components/PeerRatingForm";

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

  const { data: user, isLoading } = useQuery<User>({
    queryKey: userId ? [`/api/users/${userId}`] : ["/api/auth/me"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

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
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Ratings</CardTitle>
              <CardDescription>
                Peer-rated metrics (1-5 stars)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STAT_METRICS.map((metric) => {
                  const score = user[metric.key] as number | null;
                  const displayScore = score || 0;
                  
                  return (
                    <div
                      key={metric.key}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`stat-${metric.key}`}
                    >
                      <div>
                        <div className="font-medium">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {metric.arabicLabel}
                        </div>
                        {metric.isInverse && (
                          <div className="text-xs text-yellow-600 dark:text-yellow-500">
                            Lower is better
                          </div>
                        )}
                      </div>
                      <StarRating score={displayScore} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {!isOwnProfile && currentUser && (
          <PeerRatingForm
            ratedUserId={user.id}
            ratedUserName={user.name}
            currentUserId={currentUser.id}
          />
        )}
      </div>
    </div>
  );
}
