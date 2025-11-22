import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/contexts/theme";
import { AppSidebar } from "@/components/app-sidebar";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import NewsPage from "@/pages/news";
import EventsPage from "@/pages/events";
import EventDetailPage from "@/pages/event-detail";
import KeysPage from "@/pages/keys";
import TeachersPage from "@/pages/teachers";
import TeacherDetailPage from "@/pages/teacher-detail";
import SchedulePage from "@/pages/schedule";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import AdminPage from "@/pages/admin";
import GradesPage from "@/pages/grades";
import GradeDetailPage from "@/pages/grade-detail";
import ClassDetailPage from "@/pages/class-detail";
import NotFound from "@/pages/not-found";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-2 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        {() => (
          <AuthenticatedLayout>
            <Home />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/news">
        {() => (
          <AuthenticatedLayout>
            <NewsPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/events/:id">
        {() => (
          <AuthenticatedLayout>
            <EventDetailPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/events">
        {() => (
          <AuthenticatedLayout>
            <EventsPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/keys">
        {() => (
          <AuthenticatedLayout>
            <KeysPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/teachers/:id">
        {() => (
          <AuthenticatedLayout>
            <TeacherDetailPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/teachers">
        {() => (
          <AuthenticatedLayout>
            <TeachersPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/schedule">
        {() => (
          <AuthenticatedLayout>
            <SchedulePage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/profile/:userId">
        {() => (
          <AuthenticatedLayout>
            <ProfilePage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <AuthenticatedLayout>
            <ProfilePage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <AuthenticatedLayout>
            <SettingsPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <AuthenticatedLayout>
            <AdminPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/grades/:gradeNumber/:className">
        {() => (
          <AuthenticatedLayout>
            <ClassDetailPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/grades/:gradeNumber">
        {() => (
          <AuthenticatedLayout>
            <GradeDetailPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route path="/grades">
        {() => (
          <AuthenticatedLayout>
            <GradesPage />
          </AuthenticatedLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
