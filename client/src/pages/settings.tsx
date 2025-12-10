import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/theme";
import { Moon, Sun, Key, Globe, FileText, Monitor } from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { toast } = useToast();

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: { language?: string; theme?: string }) => {
      return await apiRequest("PATCH", "/api/users/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Preferences updated",
        description: "Your settings have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (language: string) => {
    updatePreferencesMutation.mutate({ language });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "light" | "dark" | "system");
    if (user && user.role !== "visitor") {
      updatePreferencesMutation.mutate({ theme: newTheme });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Language Settings */}
        <Card className="hover-elevate" data-testid="card-language-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Language / اللغة
            </CardTitle>
            <CardDescription>
              Choose your preferred language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="font-semibold text-sm">Interface Language</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Currently: {user?.language === "ar" ? "العربية (Arabic)" : "English"}
                </p>
              </div>
              <Select
                value={user?.language || "en"}
                onValueChange={handleLanguageChange}
                disabled={!user || user.role === "visitor"}
              >
                <SelectTrigger className="w-40" data-testid="select-language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="hover-elevate" data-testid="card-theme-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : theme === "system" ? (
                <Monitor className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              Theme
            </CardTitle>
            <CardDescription>
              Choose your preferred color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="font-semibold text-sm">Appearance</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Currently using {theme} mode
                </p>
              </div>
              <Select
                value={theme}
                onValueChange={handleThemeChange}
              >
                <SelectTrigger className="w-40" data-testid="select-theme">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Digital Keys */}
        <Card className="hover-elevate" data-testid="card-digital-keys">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Digital Keys
            </CardTitle>
            <CardDescription>
              Manage your access keys and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/keys">
              <Button variant="default" data-testid="button-manage-keys">
                Manage Keys
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Legal & Terms */}
        <Card className="hover-elevate" data-testid="card-legal-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Legal & Terms
            </CardTitle>
            <CardDescription>
              View our terms of service and privacy policy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/legal">
              <Button variant="outline" data-testid="button-view-legal">
                View Terms of Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
