"use client";

import { createContext, useContext } from "react";
import { type Dict, type Locale, DICTIONARIES } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; dict: Dict }>({
  locale: "en",
  dict: DICTIONARIES.en,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dict: DICTIONARIES[locale] ?? DICTIONARIES.en }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function setLocaleCookie(locale: Locale) {
  document.cookie = `locale=${locale};path=/;max-age=31536000;samesite=lax`;
}
