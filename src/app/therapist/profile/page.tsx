"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { SERVICE_TYPES, DUBAI_AREAS, serviceLabel, formatAED } from "@/lib/constants";
import { AvatarUpload } from "@/components/avatar-upload";
import { PhotoGallery } from "./photo-gallery";
import { ServicePhotoButton } from "./service-photo-button";
import type { Therapist, TherapistService } from "@/lib/types";

export default function TherapistProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [t, setT] = useState<Therapist | null>(null);
  const [services, setServices] = useState<TherapistService[]>([]);
  const [busy, setBusy] = useState(false);

  // new service form
  const [newType, setNewType] = useState("swedish");
  const [newDuration, setNewDuration] = useState("60");
  const [newPrice, setNewPrice] = useState("199");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: p } = await supabase
        .from("profiles")
        .select("id, avatar_url, full_name")
        .eq("auth_id", user.id)
        .single();
      if (!p) return;
      setProfileId(p.id);
      setAvatarUrl(p.avatar_url);
      setFullName(p.full_name);
      const [{ data: th }, { data: sv }] = await Promise.all([
        supabase.from("therapists").select("*").eq("id", p.id).single(),
        supabase.from("therapist_services").select("*").eq("therapist_id", p.id),
      ]);
      setT(th);
      setServices(sv ?? []);
    }
    load();
  }, [supabase, router]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!t || !profileId) return;
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const { error } = await supabase
      .from("therapists")
      .update({
        bio: String(form.get("bio")),
        experience_years: Number(form.get("experience_years")),
        base_area: t.base_area,
        specialties: t.specialties,
        service_areas: t.service_areas,
      })
      .eq("id", profileId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  }

  async function addService() {
    if (!profileId) return;
    const { data, error } = await supabase
      .from("therapist_services")
      .insert({
        therapist_id: profileId,
        service_type: newType,
        duration_min: Number(newDuration),
        price_aed: Number(newPrice),
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setServices((prev) => [...prev, data]);
    toast.success("Service added");
  }

  async function removeService(id: string) {
    const { error } = await supabase.from("therapist_services").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleArrayItem(field: "specialties" | "service_areas", value: string) {
    if (!t) return;
    const arr = t[field];
    setT({
      ...t,
      [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
    });
  }

  if (!t) return <div className="py-20 text-center text-neutral-400">Loading…</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileId && (
            <AvatarUpload
              profileId={profileId}
              avatarUrl={avatarUrl}
              fallback={fullName.slice(0, 1)}
              onUploaded={setAvatarUrl}
              requiresReview
            />
          )}
          {profileId && (
            <PhotoGallery
              therapistId={profileId}
              photos={t.photos}
              onChange={(photos) => setT({ ...t, photos })}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About me</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">Introduction (shown to customers)</Label>
              <Textarea id="bio" name="bio" defaultValue={t.bio} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience_years">Years of experience</Label>
                <Input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min={0}
                  defaultValue={t.experience_years}
                />
              </div>
              <div className="space-y-2">
                <Label>Base area</Label>
                <Select
                  value={t.base_area ?? ""}
                  onValueChange={(v) => setT({ ...t, base_area: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select area" />
                  </SelectTrigger>
                  <SelectContent>
                    {DUBAI_AREAS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-1">
                {SERVICE_TYPES.map((s) => (
                  <Badge
                    key={s.value}
                    variant={t.specialties.includes(s.value) ? "default" : "outline"}
                    className={`cursor-pointer ${t.specialties.includes(s.value) ? "" : ""}`}
                    onClick={() => toggleArrayItem("specialties", s.value)}
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service areas (where you travel to)</Label>
              <div className="flex flex-wrap gap-1">
                {DUBAI_AREAS.map((a) => (
                  <Badge
                    key={a}
                    variant={t.service_areas.includes(a) ? "default" : "outline"}
                    className={`cursor-pointer ${t.service_areas.includes(a) ? "" : ""}`}
                    onClick={() => toggleArrayItem("service_areas", a)}
                  >
                    {a}
                  </Badge>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Services & prices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3">
              {profileId && (
                <ServicePhotoButton
                  serviceId={s.id}
                  therapistId={profileId}
                  photoUrl={s.photo_url}
                  onChange={(url) =>
                    setServices((prev) =>
                      prev.map((x) => (x.id === s.id ? { ...x, photo_url: url } : x))
                    )
                  }
                />
              )}
              <p className="flex-1">
                {serviceLabel(s.service_type)} · {s.duration_min} min ·{" "}
                <span className="font-semibold text-[var(--text-gold)]">{formatAED(s.price_aed)}</span>
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500"
                onClick={() => removeService(s.id)}
              >
                Remove
              </Button>
            </div>
          ))}

          <div className="flex flex-wrap items-end gap-2 rounded-lg bg-neutral-50 p-3">
            <div className="space-y-1">
              <Label className="text-xs">Service</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="w-[140px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration</Label>
              <Select value={newDuration} onValueChange={setNewDuration}>
                <SelectTrigger className="w-[100px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["60", "90", "120"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Price (AED)</Label>
              <Input
                type="number"
                min={50}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-[100px] bg-white"
              />
            </div>
            <Button onClick={addService} variant="outline">
              + Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
