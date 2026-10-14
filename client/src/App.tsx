import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { ThemeProvider, useTheme } from "@/contexts/theme";
import { AppSidebar } from "@/components/app-sidebar";
import { LanguageProvider, useI18n } from "@/lib/i18n";
import AuthPage from "@/pages/auth";
import NotFound from "@/pages/not-found";

// Pages are split into separate chunks so phones only download what they open
const Home = lazy(() => import("@/pages/home"));
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"));
const NewsPage = lazy(() => import("@/pages/news"));
const EventsPage = lazy(() => import("@/pages/events"));
const EventDetailPage = lazy(() => import("@/pages/event-detail"));
const KeysPage = lazy(() => import("@/pages/keys"));
const TeachersPage = lazy(() => import("@/pages/teachers"));
const TeacherDetailPage = lazy(() => import("@/pages/teacher-detail"));
const SchedulePage = lazy(() => import("@/pages/schedule"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const AdminPage = lazy(() => import("@/pages/admin"));
const GradesPage = lazy(() => import("@/pages/grades"));
const GradeDetailPage = lazy(() => import("@/pages/grade-detail"));
const ClassDetailPage = lazy(() => import("@/pages/class-detail"));
const SupportPage = lazy(() => import("@/pages/support"));
const StudySourcesPage = lazy(() => import("@/pages/study-sources"));
const LegalPage = lazy(() => import("@/pages/legal"));
const AdminReportsPage = lazy(() => import("@/pages/admin-reports"));

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  theme?: "light" | "dark" | "system";
};

// Apply the theme saved on the account once per login (so it follows the user across devices)
function useAccountTheme(user: User | undefined) {
  const { setTheme } = useTheme();
  const appliedFor = useRef<string | null>(null);
  useEffect(() => {
    if (user?.id && user.theme && appliedFor.current !== user.id) {
      appliedFor.current = user.id;
      setTheme(user.theme);
    }
  }, [user?.id, user?.theme, setTheme]);
}

function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50dvh]" role="status" aria-label="Loading">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function AppHeader() {
  const { isMobile, setOpenMobile } = useSidebar();
  const [location] = useLocation();
  const { t } = useI18n();

  // Close the mobile menu after navigating
  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location, isMobile, setOpenMobile]);

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 px-3 md:px-6 h-14 border-b border-border/60 bg-background/95 supports-[backdrop-filter]:md:bg-background/80 supports-[backdrop-filter]:md:backdrop-blur-sm pt-[env(safe-area-inset-top)]">
      <SidebarTrigger className="h-10 w-10" aria-label={t("menu.open")} data-testid="button-menu" />
      <h2 className="font-display text-sm font-semibold text-foreground truncate">{t("app.name")}</h2>
    </header>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });
  useAccountTheme(user);

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-dvh w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AppHeader />
          <main id="main-content" className="flex-1 overflow-y-auto overscroll-contain bg-background pb-[env(safe-area-inset-bottom)]">
            <Suspense fallback={<PageSpinner />}>{children}</Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const protectedRoutes: Array<[string, React.ComponentType]> = [
  ["/", Home],
  ["/news", NewsPage],
  ["/events/:id", EventDetailPage],
  ["/events", EventsPage],
  ["/keys", KeysPage],
  ["/teachers/:id", TeacherDetailPage],
  ["/teachers", TeachersPage],
  ["/schedule", SchedulePage],
  ["/profile/:userId", ProfilePage],
  ["/profile", ProfilePage],
  ["/settings", SettingsPage],
  ["/admin/reports", AdminReportsPage],
  ["/admin", AdminPage],
  ["/grades/:gradeNumber/:className", ClassDetailPage],
  ["/grades/:gradeNumber", GradeDetailPage],
  ["/grades", GradesPage],
  ["/support", SupportPage],
  ["/study-sources", StudySourcesPage],
  ["/legal", LegalPage],
];

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password">
        {() => (
          <Suspense fallback={<PageSpinner />}>
            <ForgotPasswordPage />
          </Suspense>
        )}
      </Route>
      {protectedRoutes.map(([path, Page]) => (
        <Route key={path} path={path}>
          {() => (
            <AuthenticatedLayout>
              <Page />
            </AuthenticatedLayout>
          )}
        </Route>
      ))}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
