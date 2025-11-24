import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Star, Award, TrendingUp, User as UserIcon, Calendar, MessageSquare, Edit2, Trash2, Plus, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { UserProfileLink } from "@/components/UserProfileLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { HexagonTendencyChart } from "@/components/HexagonTendencyChart";
import { Slider } from "@/components/ui/slider";

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
  // Hexagon tendency charts - Social Personality
  empathy: number | null;
  angerManagement: number | null;
  cooperation: number | null;
  selfConfidence: number | null;
  acceptingCriticism: number | null;
  listening: number | null;
  // Hexagon tendency charts - Skills & Abilities
  problemSolving: number | null;
  creativity: number | null;
  memoryFocus: number | null;
  planningOrganization: number | null;
  communicationExpression: number | null;
  leadershipInitiative: number | null;
  // Hexagon tendency charts - Interests
  artisticCreative: number | null;
  athleticPhysical: number | null;
  technicalTech: number | null;
  linguisticReading: number | null;
  socialHumanitarian: number | null;
  naturalEnvironmental: number | null;
  // Hobbies
  hobbies: string[] | null;
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

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:userId");
  const userId = params?.userId;
  const [editingProfile, setEditingProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editingHexagon, setEditingHexagon] = useState<"social" | "skills" | "interests" | null>(null);
  const [hexagonValues, setHexagonValues] = useState<Record<string, number>>({});
  const [addingHobby, setAddingHobby] = useState(false);
  const [newHobby, setNewHobby] = useState("");
  const { toast } = useToast();

  const { data: user, isLoading, isFetching } = useQuery<User>({
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

  const handleEditHexagon = (type: "social" | "skills" | "interests") => {
    if (!user) return;
    
    const metricKeys = {
      social: ["empathy", "angerManagement", "cooperation", "selfConfidence", "acceptingCriticism", "listening"],
      skills: ["problemSolving", "creativity", "memoryFocus", "planningOrganization", "communicationExpression", "leadershipInitiative"],
      interests: ["artisticCreative", "athleticPhysical", "technicalTech", "linguisticReading", "socialHumanitarian", "naturalEnvironmental"],
    };
    
    const initialValues: Record<string, number> = {};
    metricKeys[type].forEach((key) => {
      initialValues[key] = (user as any)[key] ?? 4;
    });
    
    setHexagonValues(initialValues);
    setEditingHexagon(type);
  };

  const updateHexagonMutation = useMutation({
    mutationFn: async (data: Record<string, number>) => {
      return await apiRequest("PATCH", `/api/users/${currentUser?.id}/hexagon`, data);
    },
    onSuccess: () => {
      toast({
        title: "Tendency chart updated",
        description: "Your hexagon tendency chart has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}`] });
      setEditingHexagon(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update chart",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHobbiesMutation = useMutation({
    mutationFn: async (hobbies: string[]) => {
      return await apiRequest("PATCH", `/api/users/${currentUser?.id}/hobbies`, { hobbies });
    },
    onSuccess: () => {
      toast({
        title: "Hobbies updated",
        description: "Your hobbies have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUser?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update hobbies",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddHobby = () => {
    if (!user || !currentUser || !newHobby.trim() || updateHobbiesMutation.isPending || isFetching) return;
    
    const currentHobbies = user.hobbies || [];
    
    if (currentHobbies.length >= 5) {
      toast({
        title: "Maximum hobbies reached",
        description: "You can only add up to 5 hobbies",
        variant: "destructive",
      });
      return;
    }
    
    if (newHobby.trim().length > 50) {
      toast({
        title: "Hobby too long",
        description: "Each hobby must be 50 characters or less",
        variant: "destructive",
      });
      return;
    }
    
    const updatedHobbies = [...currentHobbies, newHobby.trim()];
    updateHobbiesMutation.mutate(updatedHobbies);
    setNewHobby("");
    setAddingHobby(false);
  };

  const handleDeleteHobby = (index: number) => {
    if (!user || !currentUser || updateHobbiesMutation.isPending || isFetching) return;
    
    const currentHobbies = user.hobbies || [];
    const updatedHobbies = currentHobbies.filter((_, i) => i !== index);
    updateHobbiesMutation.mutate(updatedHobbies);
  };

  const handleSaveHexagon = () => {
    if (!editingHexagon) return;
    
    const metricKeys = {
      social: ["empathy", "angerManagement", "cooperation", "selfConfidence", "acceptingCriticism", "listening"],
      skills: ["problemSolving", "creativity", "memoryFocus", "planningOrganization", "communicationExpression", "leadershipInitiative"],
      interests: ["artisticCreative", "athleticPhysical", "technicalTech", "linguisticReading", "socialHumanitarian", "naturalEnvironmental"],
    };
    
    const validKeys = metricKeys[editingHexagon];
    const filteredValues: Record<string, number> = {};
    validKeys.forEach(key => {
      filteredValues[key] = hexagonValues[key] ?? 4;
    });
    
    const total = Object.values(filteredValues).reduce((sum, v) => sum + v, 0);
    const hasInvalid = Object.values(filteredValues).some((v) => v < 0 || v > 10);
    
    if (total !== 33) {
      toast({
        title: "Invalid distribution",
        description: `You must distribute exactly 33 points. Current total: ${total}`,
        variant: "destructive",
      });
      return;
    }
    
    if (hasInvalid) {
      toast({
        title: "Invalid values",
        description: "Each metric must be between 0 and 10",
        variant: "destructive",
      });
      return;
    }
    
    updateHexagonMutation.mutate(filteredValues);
  };

  const hexagonMetricLabels = {
    social: {
      empathy: "التعاطف (Empathy)",
      angerManagement: "إدارة الغضب (Anger Management)",
      cooperation: "التعاون (Cooperation)",
      selfConfidence: "الثقة بالنفس (Self Confidence)",
      acceptingCriticism: "تقبل النقد (Accepting Criticism)",
      listening: "الاستماع (Listening)",
    },
    skills: {
      problemSolving: "حل المشكلات (Problem Solving)",
      creativity: "الإبداع (Creativity)",
      memoryFocus: "الذاكرة والتركيز (Memory & Focus)",
      planningOrganization: "التخطيط والتنظيم (Planning & Organization)",
      communicationExpression: "التواصل والتعبير (Communication & Expression)",
      leadershipInitiative: "القيادة والمبادرة (Leadership & Initiative)",
    },
    interests: {
      artisticCreative: "الفن والإبداع (Artistic & Creative)",
      athleticPhysical: "الرياضة واللياقة (Athletic & Physical)",
      technicalTech: "التقنية والحاسوب (Technical & Tech)",
      linguisticReading: "اللغة والقراءة (Linguistic & Reading)",
      socialHumanitarian: "الاجتماعي والإنساني (Social & Humanitarian)",
      naturalEnvironmental: "الطبيعة والبيئة (Natural & Environmental)",
    },
  };

  const currentHexagonLabels = editingHexagon ? hexagonMetricLabels[editingHexagon] : {};
  
  const currentMetricKeys = editingHexagon ? {
    social: ["empathy", "angerManagement", "cooperation", "selfConfidence", "acceptingCriticism", "listening"],
    skills: ["problemSolving", "creativity", "memoryFocus", "planningOrganization", "communicationExpression", "leadershipInitiative"],
    interests: ["artisticCreative", "athleticPhysical", "technicalTech", "linguisticReading", "socialHumanitarian", "naturalEnvironmental"],
  }[editingHexagon] : [];
  
  const currentTotal = currentMetricKeys.reduce((sum, k) => sum + (hexagonValues[k] ?? 0), 0);

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <HexagonTendencyChart
              title="Social Personality"
              description="Interpersonal traits and social skills"
              metrics={[
                { metric: "empathy", arabicLabel: "التعاطف", value: user.empathy || 4, max: 10 },
                { metric: "angerManagement", arabicLabel: "إدارة الغضب", value: user.angerManagement || 4, max: 10 },
                { metric: "cooperation", arabicLabel: "التعاون", value: user.cooperation || 4, max: 10 },
                { metric: "selfConfidence", arabicLabel: "الثقة بالنفس", value: user.selfConfidence || 4, max: 10 },
                { metric: "acceptingCriticism", arabicLabel: "تقبل النقد", value: user.acceptingCriticism || 4, max: 10 },
                { metric: "listening", arabicLabel: "الاستماع", value: user.listening || 4, max: 10 },
              ]}
              color="hsl(var(--chart-1))"
              isOwnProfile={isOwnProfile}
              onEdit={() => handleEditHexagon("social")}
            />
            
            <HexagonTendencyChart
              title="Skills & Abilities"
              description="Cognitive and practical capabilities"
              metrics={[
                { metric: "problemSolving", arabicLabel: "حل المشكلات", value: user.problemSolving || 4, max: 10 },
                { metric: "creativity", arabicLabel: "الإبداع", value: user.creativity || 4, max: 10 },
                { metric: "memoryFocus", arabicLabel: "الذاكرة والتركيز", value: user.memoryFocus || 4, max: 10 },
                { metric: "planningOrganization", arabicLabel: "التخطيط والتنظيم", value: user.planningOrganization || 4, max: 10 },
                { metric: "communicationExpression", arabicLabel: "التواصل والتعبير", value: user.communicationExpression || 4, max: 10 },
                { metric: "leadershipInitiative", arabicLabel: "القيادة والمبادرة", value: user.leadershipInitiative || 4, max: 10 },
              ]}
              color="hsl(var(--chart-2))"
              isOwnProfile={isOwnProfile}
              onEdit={() => handleEditHexagon("skills")}
            />
            
            <HexagonTendencyChart
              title="Interests"
              description="Hobbies and personal preferences"
              metrics={[
                { metric: "artisticCreative", arabicLabel: "الفن والإبداع", value: user.artisticCreative || 4, max: 10 },
                { metric: "athleticPhysical", arabicLabel: "الرياضة واللياقة", value: user.athleticPhysical || 4, max: 10 },
                { metric: "technicalTech", arabicLabel: "التقنية والحاسوب", value: user.technicalTech || 4, max: 10 },
                { metric: "linguisticReading", arabicLabel: "اللغة والقراءة", value: user.linguisticReading || 4, max: 10 },
                { metric: "socialHumanitarian", arabicLabel: "الاجتماعي والإنساني", value: user.socialHumanitarian || 4, max: 10 },
                { metric: "naturalEnvironmental", arabicLabel: "الطبيعة والبيئة", value: user.naturalEnvironmental || 4, max: 10 },
              ]}
              color="hsl(var(--chart-3))"
              isOwnProfile={isOwnProfile}
              onEdit={() => handleEditHexagon("interests")}
            />
          </div>
        )}

        {user.role === "student" && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Hobbies & Interests</h3>
                <p className="text-sm text-muted-foreground">
                  Share up to 5 hobbies or activities you enjoy
                </p>
              </div>
              {isOwnProfile && (user.hobbies?.length || 0) < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingHobby(true)}
                  disabled={updateHobbiesMutation.isPending || isFetching}
                  data-testid="button-add-hobby"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hobby
                </Button>
              )}
            </div>

            {(!user.hobbies || user.hobbies.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                {isOwnProfile 
                  ? "You haven't added any hobbies yet. Click 'Add Hobby' to get started!"
                  : "No hobbies added yet."}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.hobbies.map((hobby, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/50 rounded-full text-sm"
                    data-testid={`hobby-${index}`}
                  >
                    <span>{hobby}</span>
                    {isOwnProfile && (
                      <button
                        onClick={() => handleDeleteHobby(index)}
                        disabled={updateHobbiesMutation.isPending || isFetching}
                        className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid={`button-delete-hobby-${index}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
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

      <Dialog open={editingHexagon !== null} onOpenChange={() => setEditingHexagon(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-edit-hexagon">
          <DialogHeader>
            <DialogTitle>
              Edit {editingHexagon === "social" ? "Social Personality" : editingHexagon === "skills" ? "Skills & Abilities" : "Interests"} Hexagon
            </DialogTitle>
            <DialogDescription>
              Distribute 33 points across the 6 metrics. Each metric can have a maximum of 10 points.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {Object.entries(currentHexagonLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{label}</label>
                  <span className="text-sm font-bold text-primary">{hexagonValues[key] || 0}/10</span>
                </div>
                <Slider
                  value={[hexagonValues[key] ?? 0]}
                  onValueChange={(vals) => setHexagonValues({ ...hexagonValues, [key]: Math.floor(vals[0]) })}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                  data-testid={`slider-${key}`}
                />
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="font-medium">Total Points Used:</span>
              <span className={`text-lg font-bold ${currentTotal !== 24 ? "text-destructive" : "text-green-600 dark:text-green-500"}`}>
                {currentTotal}/24
              </span>
            </div>
            
            {currentTotal !== 24 && (
              <div className={`p-3 rounded-md text-sm ${currentTotal > 24 ? "bg-destructive/10 text-destructive" : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500"}`}>
                {currentTotal > 24 
                  ? "⚠️ You have exceeded the limit. Please reduce some values."
                  : `⚠️ You need to use exactly 24 points. Add ${24 - currentTotal} more point${24 - currentTotal === 1 ? "" : "s"}.`
                }
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingHexagon(null)}
              data-testid="button-cancel-hexagon-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveHexagon}
              disabled={updateHexagonMutation.isPending || currentTotal !== 24}
              data-testid="button-save-hexagon"
            >
              {updateHexagonMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addingHobby} onOpenChange={setAddingHobby}>
        <DialogContent data-testid="dialog-add-hobby">
          <DialogHeader>
            <DialogTitle>Add New Hobby</DialogTitle>
            <DialogDescription>
              Share an activity or interest you enjoy (max 50 characters)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="hobby" className="text-sm font-medium">Hobby</label>
              <Input
                id="hobby"
                placeholder="e.g., Playing guitar, Reading sci-fi, Cooking"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                maxLength={50}
                data-testid="input-new-hobby"
              />
              <p className="text-xs text-muted-foreground">
                {newHobby.length}/50 characters
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setAddingHobby(false);
                setNewHobby("");
              }}
              data-testid="button-cancel-hobby"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddHobby}
              disabled={updateHobbiesMutation.isPending || !newHobby.trim()}
              data-testid="button-save-hobby"
            >
              {updateHobbiesMutation.isPending ? "Adding..." : "Add Hobby"}
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
