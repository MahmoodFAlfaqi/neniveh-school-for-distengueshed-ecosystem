import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/contexts/theme";
import { Moon, Sun, Key, Globe, FileText, Monitor, Lock } from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n, type Language } from "@/lib/i18n";

function ChangePasswordCard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const mutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/auth/change-password", { currentPassword, newPassword }),
    onSuccess: () => {
      toast({ title: t("password.done") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({ title: t("password.failed"), description: error.message,variant: "destructive" });
    },
  });

  return (
    <Card data-testid="card-change-password">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" aria-hidden="true" />
          {t("password.title")}
        </CardTitle>
        <CardDescription>{t("password.desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mismatch && newPassword.length >= 8 && currentPassword) mutation.mutate();
          }}
        >
          <div>
            <Label htmlFor="current-password">{t("password.current")}</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="input-current-password"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="new-password">{t("password.new")}</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-testid="input-new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">{t("password.confirm")}</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={mismatch}
                aria-describedby={mismatch ? "password-mismatch" : undefined}
                data-testid="input-confirm-password"
              />
              {mismatch && (
                <p id="password-mismatch" className="text-sm text-destructive mt-1">
                  {t("password.mismatch")}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword || mutation.isPending}
            data-testid="button-change-password"
          >
            {mutation.isPending ? t("password.saving") : t("password.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const { toast } = useToast();
  const { t, language, setLanguage } = useI18n();
  const isVisitor = !user || user.role === "visitor";

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: { language?: string; theme?: string }) => {
      return await apiRequest("PATCH", "/api/users/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: t("settings.saved.title"),
        description: t("settings.saved.desc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("settings.saved.error"),
        variant: "destructive",
      });
    },
  });

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language);
    if (!isVisitor) {
      updatePreferencesMutation.mutate({ language: newLanguage });
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as "light" | "dark" | "system");
    if (!isVisitor) {
      updatePreferencesMutation.mutate({ theme: newTheme });
    }
  };

  const themeLabel = t(`settings.theme.${theme}` as const);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("settings.subtitle")}</p>
      </div>

      {/* Language Settings */}
      <Card data-testid="card-language-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" aria-hidden="true" />
            {t("settings.language.title")} / {language === "ar" ? "Language" : "اللغة"}
          </CardTitle>
          <CardDescription>{t("settings.language.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border">
            <div>
              <Label htmlFor="select-language" className="font-semibold text-sm">{t("settings.language.label")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("settings.language.current", { value: language === "ar" ? "العربية" : "English" })}
              </p>
            </div>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="select-language" className="w-40" data-testid="select-language">
                <SelectValue />
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
      <Card data-testid="card-theme-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="w-5 h-5" aria-hidden="true" />
            ) : theme === "system" ? (
              <Monitor className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Sun className="w-5 h-5" aria-hidden="true" />
            )}
            {t("settings.theme.title")}
          </CardTitle>
          <CardDescription>{t("settings.theme.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-border">
            <div>
              <Label htmlFor="select-theme" className="font-semibold text-sm">{t("settings.theme.label")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("settings.theme.current", { value: themeLabel })}</p>
            </div>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="select-theme" className="w-40" data-testid="select-theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" aria-hidden="true" />
                    {t("settings.theme.light")}
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" aria-hidden="true" />
                    {t("settings.theme.dark")}
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" aria-hidden="true" />
                    {t("settings.theme.system")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!isVisitor && <ChangePasswordCard />}

      {/* Digital Keys */}
      <Card data-testid="card-digital-keys">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" aria-hidden="true" />
            {t("settings.keys.title")}
          </CardTitle>
          <CardDescription>{t("settings.keys.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="default" data-testid="button-manage-keys">
            <Link href="/keys">{t("settings.keys.button")}</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Legal & Terms */}
      <Card data-testid="card-legal-settings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" aria-hidden="true" />
            {t("settings.legal.title")}
          </CardTitle>
          <CardDescription>{t("settings.legal.desc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" data-testid="button-view-legal">
            <Link href="/legal">{t("settings.legal.button")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
