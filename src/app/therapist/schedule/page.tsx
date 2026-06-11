"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import type { AvailabilitySlot } from "@/lib/types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`); // 07:00–23:00

export default function SchedulePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [daysOff, setDaysOff] = useState<{ id: string; date: string }[]>([]);
  const [offDate, setOffDate] = useState<Date | undefined>();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data: p } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      if (!p) return;
      setProfileId(p.id);
      const [{ data: av }, { data: exc }] = await Promise.all([
        supabase.from("availability_slots").select("*").eq("therapist_id", p.id),
        supabase
          .from("availability_exceptions")
          .select("id, date")
          .eq("therapist_id", p.id)
          .gte("date", new Date().toISOString().slice(0, 10))
          .order("date"),
      ]);
      setSlots(av ?? []);
      setDaysOff(exc ?? []);
    }
    load();
  }, [supabase, router]);

  async function toggleDay(weekday: number, enabled: boolean) {
    if (!profileId) return;
    if (enabled) {
      const { data, error } = await supabase
        .from("availability_slots")
        .insert({ therapist_id: profileId, weekday, start_time: "10:00", end_time: "22:00" })
        .select()
        .single();
      if (error) return toast.error(error.message);
      setSlots((prev) => [...prev, data]);
    } else {
      const ids = slots.filter((s) => s.weekday === weekday).map((s) => s.id);
      const { error } = await supabase.from("availability_slots").delete().in("id", ids);
      if (error) return toast.error(error.message);
      setSlots((prev) => prev.filter((s) => s.weekday !== weekday));
    }
  }

  async function updateWindow(slot: AvailabilitySlot, field: "start_time" | "end_time", value: string) {
    const { error } = await supabase
      .from("availability_slots")
      .update({ [field]: value })
      .eq("id", slot.id);
    if (error) return toast.error(error.message);
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, [field]: value } : s)));
  }

  async function addDayOff() {
    if (!profileId || !offDate) return;
    const dateStr = offDate.toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("availability_exceptions")
      .insert({ therapist_id: profileId, date: dateStr, is_off: true })
      .select("id, date")
      .single();
    if (error) return toast.error(error.message);
    setDaysOff((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    setOffDate(undefined);
    toast.success(`Day off added: ${dateStr}`);
  }

  async function removeDayOff(id: string) {
    const { error } = await supabase.from("availability_exceptions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setDaysOff((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My schedule</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Weekly availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEEKDAYS.map((day, weekday) => {
            const daySlot = slots.find((s) => s.weekday === weekday);
            return (
              <div key={day} className="flex items-center gap-3 rounded-lg border p-3">
                <Switch
                  checked={!!daySlot}
                  onCheckedChange={(v) => toggleDay(weekday, v)}
                />
                <span className="w-24 text-sm font-medium">{day}</span>
                {daySlot ? (
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(daySlot.start_time).slice(0, 5)}
                      onValueChange={(v) => updateWindow(daySlot, "start_time", v)}
                    >
                      <SelectTrigger className="w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-neutral-400">—</span>
                    <Select
                      value={String(daySlot.end_time).slice(0, 5)}
                      onValueChange={(v) => updateWindow(daySlot, "end_time", v)}
                    >
                      <SelectTrigger className="w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <span className="text-sm text-neutral-400">Unavailable</span>
                )}
              </div>
            );
          })}
          <p className="text-xs text-neutral-500">
            Confirmed bookings automatically block their time slot — no double bookings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Days off</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div>
            <Calendar
              mode="single"
              selected={offDate}
              onSelect={setOffDate}
              disabled={{ before: new Date() }}
            />
            <Button
              onClick={addDayOff}
              disabled={!offDate}
              className="mt-2 w-full"
            >
              Add day off
            </Button>
          </div>
          <div className="flex-1 space-y-2">
            {daysOff.length === 0 && (
              <p className="text-sm text-neutral-500">No upcoming days off.</p>
            )}
            {daysOff.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border p-2 text-sm"
              >
                <span>{new Date(d.date).toDateString()}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => removeDayOff(d.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
