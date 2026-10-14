import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export type Language = "en" | "ar";

const en = {
  "app.name": "School Community Ecosystem",
  "app.short": "School Community",
  "app.tagline": "Connected & Engaged",
  "menu.open": "Open navigation menu",
  "nav.section.navigation": "Navigation",
  "nav.section.administration": "Administration",
  "nav.section.account": "Account",
  "nav.home": "Home",
  "nav.news": "News",
  "nav.grades": "Grades",
  "nav.events": "Events",
  "nav.teachers": "Teachers",
  "nav.schedule": "Schedule",
  "nav.studySources": "Study Sources",
  "nav.admin": "Admin Management",
  "nav.reports": "Reports",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.support": "Support",
  "nav.logout": "Logout",
  "nav.loggedOut": "Logged out successfully",
  "role.student": "student",
  "role.admin": "admin",
  "role.teacher": "teacher",
  "role.visitor": "visitor",
  "settings.title": "Settings",
  "settings.subtitle": "Manage your preferences and account settings",
  "settings.language.title": "Language",
  "settings.language.desc": "Choose your preferred language",
  "settings.language.label": "Interface Language",
  "settings.language.current": "Currently: {value}",
  "settings.theme.title": "Theme",
  "settings.theme.desc": "Choose your preferred color scheme",
  "settings.theme.label": "Appearance",
  "settings.theme.current": "Currently using {value} mode",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",
  "settings.keys.title": "Digital Keys",
  "settings.keys.desc": "Manage your access keys and permissions",
  "settings.keys.button": "Manage Keys",
  "settings.legal.title": "Legal & Terms",
  "settings.legal.desc": "View our terms of service and privacy policy",
  "settings.legal.button": "View Terms of Service",
  "settings.saved.title": "Preferences updated",
  "settings.saved.desc": "Your settings have been saved.",
  "settings.saved.error": "Failed to update preferences",
  "password.title": "Change Password",
  "password.desc": "Use at least 8 characters. Other devices that stayed signed in will be signed out.",
  "password.current": "Current password",
  "password.new": "New password",
  "password.confirm": "Repeat new password",
  "password.mismatch": "Passwords don't match",
  "password.save": "Change password",
  "password.saving": "Saving...",
  "password.done": "Password changed",
  "password.failed": "Couldn't change password",
  "common.error": "Error",
  "common.loading": "Loading",
} as const;

export type TranslationKey = keyof typeof en;

const ar: Record<TranslationKey, string> = {
  "app.name": "مجتمع المدرسة",
  "app.short": "مجتمع المدرسة",
  "app.tagline": "متصلون ومتفاعلون",
  "menu.open": "فتح قائمة التنقل",
  "nav.section.navigation": "التنقل",
  "nav.section.administration": "الإدارة",
  "nav.section.account": "الحساب",
  "nav.home": "الرئيسية",
  "nav.news": "الأخبار",
  "nav.grades": "الصفوف",
  "nav.events": "الفعاليات",
  "nav.teachers": "المعلمون",
  "nav.schedule": "الجدول",
  "nav.studySources": "المصادر الدراسية",
  "nav.admin": "إدارة النظام",
  "nav.reports": "البلاغات",
  "nav.profile": "الملف الشخصي",
  "nav.settings": "الإعدادات",
  "nav.support": "الدعم",
  "nav.logout": "تسجيل الخروج",
  "nav.loggedOut": "تم تسجيل الخروج بنجاح",
  "role.student": "طالب",
  "role.admin": "مشرف",
  "role.teacher": "معلم",
  "role.visitor": "زائر",
  "settings.title": "الإعدادات",
  "settings.subtitle": "إدارة تفضيلاتك وإعدادات حسابك",
  "settings.language.title": "اللغة",
  "settings.language.desc": "اختر لغتك المفضلة",
  "settings.language.label": "لغة الواجهة",
  "settings.language.current": "الحالية: {value}",
  "settings.theme.title": "المظهر",
  "settings.theme.desc": "اختر نظام الألوان المفضل",
  "settings.theme.label": "المظهر",
  "settings.theme.current": "الوضع الحالي: {value}",
  "settings.theme.light": "فاتح",
  "settings.theme.dark": "داكن",
  "settings.theme.system": "حسب النظام",
  "settings.keys.title": "المفاتيح الرقمية",
  "settings.keys.desc": "إدارة مفاتيح الوصول والصلاحيات",
  "settings.keys.button": "إدارة المفاتيح",
  "settings.legal.title": "الشروط والأحكام",
  "settings.legal.desc": "عرض شروط الخدمة وسياسة الخصوصية",
  "settings.legal.button": "عرض شروط الخدمة",
  "settings.saved.title": "تم تحديث التفضيلات",
  "settings.saved.desc": "تم حفظ إعداداتك.",
  "settings.saved.error": "تعذّر تحديث التفضيلات",
  "password.title": "تغيير كلمة المرور",
  "password.desc": "استخدم 8 أحرف على الأقل. سيتم تسجيل خروج الأجهزة الأخرى التي بقيت متصلة.",
  "password.current": "كلمة المرور الحالية",
  "password.new": "كلمة المرور الجديدة",
  "password.confirm": "أعد كتابة كلمة المرور الجديدة",
  "password.mismatch": "كلمتا المرور غير متطابقتين",
  "password.save": "تغيير كلمة المرور",
  "password.saving": "جارٍ الحفظ...",
  "password.done": "تم تغيير كلمة المرور",
  "password.failed": "تعذّر تغيير كلمة المرور",
  "common.error": "خطأ",
  "common.loading": "جارٍ التحميل",
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, ar };

type I18nContextType = {
  language: Language;
  dir: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem("language") === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

const ARABIC_FONT_ID = "font-arabic";

function ensureArabicFont() {
  if (document.getElementById(ARABIC_FONT_ID)) return;
  const link = document.createElement("link");
  link.id = ARABIC_FONT_ID;
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400..700&display=swap";
  document.head.appendChild(link);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage);

  // The account's saved language wins once the user is known
  const { data: user } = useQuery<{ language?: Language } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  useEffect(() => {
    if (user?.language === "en" || user?.language === "ar") {
      setLanguageState(user.language);
    }
  }, [user?.language]);

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    try {
      localStorage.setItem("language", language);
    } catch {
      // ignore
    }
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    if (language === "ar") ensureArabicFont();
  }, [language, dir]);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text = dictionaries[language][key] ?? en[key] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replace(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [language],
  );

  const value = useMemo(() => ({ language, dir, setLanguage: setLanguageState, t }), [language, dir, t]) as I18nContextType;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return context;
}
