"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useI18n, setLocaleCookie } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/i18n/dictionaries";
import { AvatarUpload } from "@/components/avatar-upload";
import type { Profile } from "@/lib/types";

type Prefs = { push: boolean; email: boolean; sms: boolean };

export default function AccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { dict } = useI18n();
  const [profile, setProfile] = useState<(Profile & { notification_prefs: Prefs }) | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login?next=/account");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_id", user.id)
        .single();
      setProfile(data);
    }
    load();
  }, [supabase, router]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: String(form.get("full_name")),
        phone: String(form.get("phone")),
      })
      .eq("id", profile.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Saved ✓");
    router.refresh();
  }

  async function changeLanguage(locale: Locale) {
    if (!profile) return;
    setLocaleCookie(locale);
    setProfile({ ...profile, language: locale });
    await supabase.from("profiles").update({ language: locale }).eq("id", profile.id);
    router.refresh();
  }

  async function togglePref(channel: keyof Prefs, value: boolean) {
    if (!profile) return;
    const prefs = { ...profile.notification_prefs, [channel]: value };
    setProfile({ ...profile, notification_prefs: prefs });
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: prefs })
      .eq("id", profile.id);
    if (error) toast.error(error.message);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!profile) {
    return <div className="py-20 text-center text-neutral-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">{dict.accountSettings}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.profile}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUpload
            profileId={profile.id}
            avatarUrl={profile.avatar_url}
            fallback={profile.full_name.slice(0, 1)}
          />
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{dict.fullName}</Label>
              <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
            </div>
            <div className="space-y-2">
              <Label>{dict.email}</Label>
              <Input value={profile.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{dict.phone}</Label>
              <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
            </div>
            <Button type="submit" disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
              {busy ? dict.saving : dict.saveChanges}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.language}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={profile.language} onValueChange={(v) => changeLanguage(v as Locale)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{dict.notificationChannels}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              ["push", dict.pushNotif],
              ["email", dict.emailNotif],
              ["sms", dict.smsNotif],
            ] as [keyof Prefs, string][]
          ).map(([channel, label]) => (
            <div key={channel} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <Switch
                checked={profile.notification_prefs?.[channel] ?? false}
                onCheckedChange={(v) => togglePref(channel, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-sm text-neutral-600">
            {dict.signedInAs} {profile.email}
          </p>
          <Button variant="outline" onClick={logout}>
            {dict.logout}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
