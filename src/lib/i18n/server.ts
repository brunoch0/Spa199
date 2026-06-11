import { cookies } from "next/headers";
import { getDict, type Locale } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value;
  return locale === "ar" || locale === "ko" || locale === "th" ? locale : "en";
}

export async function getServerDict() {
  const locale = await getLocale();
  return { locale, dict: getDict(locale) };
}
