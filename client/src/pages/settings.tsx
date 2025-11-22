import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/theme";
import { Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Theme Settings */}
        <Card className="hover-elevate" data-testid="card-theme-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
              Theme
            </CardTitle>
            <CardDescription>
              Choose between light and dark mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <Label className="font-semibold text-sm">Night Theme</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Currently using {theme === "dark" ? "dark" : "light"} mode
                </p>
              </div>
              <Button
                onClick={toggleTheme}
                variant="default"
                className="gap-2"
                data-testid="button-toggle-theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Dark Mode
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="hover-elevate" data-testid="card-account-settings">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Additional account settings coming soon...
            </p>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="hover-elevate" data-testid="card-privacy-settings">
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
            <CardDescription>
              Control your privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Privacy and security settings coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
