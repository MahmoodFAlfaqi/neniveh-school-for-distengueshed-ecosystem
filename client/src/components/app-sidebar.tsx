import { Home, Calendar, Users, Settings, BookOpen, User, LogOut, Shield, GraduationCap, Newspaper, Heart, FileText, Flag } from "lucide-react";
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
import { useI18n, type TranslationKey } from "@/lib/i18n";

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
    labelKey: "nav.home" as TranslationKey,
    url: "/",
    icon: Home,
  },
  {
    title: "News",
    labelKey: "nav.news" as TranslationKey,
    url: "/news",
    icon: Newspaper,
  },
  {
    title: "Grades",
    labelKey: "nav.grades" as TranslationKey,
    url: "/grades",
    icon: GraduationCap,
  },
  {
    title: "Events",
    labelKey: "nav.events" as TranslationKey,
    url: "/events",
    icon: Calendar,
  },
  {
    title: "Teachers",
    labelKey: "nav.teachers" as TranslationKey,
    url: "/teachers",
    icon: Users,
  },
  {
    title: "Schedule",
    labelKey: "nav.schedule" as TranslationKey,
    url: "/schedule",
    icon: BookOpen,
  },
  {
    title: "Study Sources",
    labelKey: "nav.studySources" as TranslationKey,
    url: "/study-sources",
    icon: FileText,
  },
];

const adminNavItems = [
  {
    title: "Admin Management",
    labelKey: "nav.admin" as TranslationKey,
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Reports",
    labelKey: "nav.reports" as TranslationKey,
    url: "/admin/reports",
    icon: Flag,
  },
];

const bottomNavItems = [
  {
    title: "Profile",
    labelKey: "nav.profile" as TranslationKey,
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    labelKey: "nav.settings" as TranslationKey,
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Support",
    labelKey: "nav.support" as TranslationKey,
    url: "/support",
    icon: Heart,
  },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t, dir } = useI18n();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Drop every cached response so the next person on this device sees nothing of ours
      queryClient.clear();
      toast({
        title: t("nav.loggedOut"),
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
    <Sidebar data-testid="sidebar-main" side={dir === "rtl" ? "right" : "left"} className="border-border/50">
      <SidebarContent className="space-y-4">
        {/* Logo/Branding */}
        <div className="px-4 py-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-sm">SC</span>
          </div>
          <div>
            <h1 className="font-bold text-sm">{t("app.short")}</h1>
            <p className="text-xs text-muted-foreground">{t("app.tagline")}</p>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-2">{t("nav.section.navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems
                .filter((item) => {
                  if (user?.role === "visitor" && item.title === "Schedule") {
                    return false;
                  }
                  return true;
                })
                .map((item) => (
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
                      <Link href={item.url} className="flex items-center gap-3 h-11 md:h-9" aria-current={location === item.url ? "page" : undefined}>
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-2">{t("nav.section.administration")}</SidebarGroupLabel>
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
                      <Link href={item.url} className="flex items-center gap-3 h-11 md:h-9" aria-current={location === item.url ? "page" : undefined}>
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">{t(item.labelKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-2">{t("nav.section.account")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {bottomNavItems
                .filter((item) => {
                  if (user?.role === "visitor" && item.title === "Profile") {
                    return false;
                  }
                  return true;
                })
                .map((item) => (
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
                      <Link href={item.url} className="flex items-center gap-3 h-11 md:h-9" aria-current={location === item.url ? "page" : undefined}>
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">{t(item.labelKey)}</span>
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
                  <div className="absolute -top-1 -end-1 w-4h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
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
                    {t(`role.${user.role}` as TranslationKey)}
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
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
