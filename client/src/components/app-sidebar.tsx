import { Home, Calendar, Users, Settings, BookOpen, User, LogOut, Shield, GraduationCap, Newspaper, Heart } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  credibilityScore: number;
  reputationScore: number;
  accountStatus: string;
  avatarUrl?: string;
  bio?: string;
};

const mainNavItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "News",
    url: "/news",
    icon: Newspaper,
  },
  {
    title: "Grades",
    url: "/grades",
    icon: GraduationCap,
  },
  {
    title: "Events",
    url: "/events",
    icon: Calendar,
  },
  {
    title: "Teachers",
    url: "/teachers",
    icon: Users,
  },
  {
    title: "Schedule",
    url: "/schedule",
    icon: BookOpen,
  },
];

const adminNavItems = [
  {
    title: "Admin Management",
    url: "/admin",
    icon: Shield,
  },
];

const bottomNavItems = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Support",
    url: "/support",
    icon: Heart,
  },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out successfully",
      });
      navigate("/auth");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar data-testid="sidebar-main" className="border-r border-border/50">
      <SidebarContent className="space-y-4">
        {/* Logo/Branding */}
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-sm">SC</span>
          </div>
          <div>
            <h1 className="font-bold text-sm">School Community</h1>
            <p className="text-xs text-muted-foreground">Connected & Engaged</p>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-testid={`nav-${item.title.toLowerCase()}`}
                    className={`transition-all ${
                      location === item.url 
                        ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary font-semibold rounded-lg" 
                        : "hover:bg-background/50"
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-2">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                      className={`transition-all ${
                        location === item.url 
                          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 font-semibold rounded-lg" 
                          : "hover:bg-background/50"
                      }`}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-2">Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {bottomNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-testid={`nav-${item.title.toLowerCase()}`}
                    className={`transition-all ${
                      location === item.url 
                        ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary font-semibold rounded-lg" 
                        : "hover:bg-background/50"
                    }`}
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter>
          <div className="flex flex-col gap-3 p-4 border-t border-border/50 rounded-t-lg bg-background/50 dark:bg-background/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {user.role === "admin" && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    ★
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" data-testid="text-username">
                  {user.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[0.65rem]">
                    {user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    {(user.credibilityScore ?? 0).toFixed(0)}⭐
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              data-testid="button-logout"
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover-elevate active-elevate-2 bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
