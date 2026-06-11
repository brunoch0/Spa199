"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { generateSlots } from "@/lib/slots";
import { serviceLabel, formatAED, DUBAI_AREAS } from "@/lib/constants";
import type { AvailabilitySlot, Therapist, TherapistService } from "@/lib/types";

type Step = "service" | "time" | "location" | "payment";

export default function BookingPage() {
  const { therapistId } = useParams<{ therapistId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [busy, setBusy] = useState<{ booking_date: string; start_time: string; end_time: string }[]>([]);
  const [exceptions, setExceptions] = useState<string[]>([]);

  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<TherapistService | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [payMethod, setPayMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: avail }, { data: busySlots }, { data: exc }] =
        await Promise.all([
          supabase
            .from("therapists")
            .select("*, profile:profiles(*), services:therapist_services(*)")
            .eq("id", therapistId)
            .single(),
          supabase.from("availability_slots").select("*").eq("therapist_id", therapistId),
          supabase.from("booked_slots").select("*").eq("therapist_id", therapistId),
          supabase
            .from("availability_exceptions")
            .select("date")
            .eq("therapist_id", therapistId)
            .eq("is_off", true),
        ]);
      setTherapist(t as Therapist);
      setAvailability((avail as AvailabilitySlot[]) ?? []);
      setBusy(busySlots ?? []);
      setExceptions((exc ?? []).map((e: { date: string }) => e.date));
    }
    load();
  }, [supabase, therapistId]);

  const slots = useMemo(() => {
    if (!date || !service) return [];
    const dateStr = date.toISOString().slice(0, 10);
    return generateSlots(
      date,
      service.duration_min,
      availability,
      busy,
      exceptions.includes(dateStr)
    );
  }, [date, service, availability, busy, exceptions]);

  async function confirmBooking() {
    if (!service || !date || !time || !address) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/book/${therapistId}`);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    if (!profile) {
      toast.error("Profile not found. Please log in again.");
      setSubmitting(false);
      return;
    }

    const [h, m] = time.split(":").map(Number);
    const endMin = h * 60 + m + service.duration_min;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: profile.id,
        therapist_id: therapistId,
        service_id: service.id,
        service_type: service.service_type,
        duration_min: service.duration_min,
        price_aed: service.price_aed,
        booking_date: date.toISOString().slice(0, 10),
        start_time: time,
        end_time: endTime,
        address_text: address,
        area: area || null,
        visit_notes: notes || null,
        status: "requested",
      })
      .select("id")
      .single();

    if (error || !booking) {
      toast.error(error?.message ?? "Booking failed");
      setSubmitting(false);
      return;
    }

    // demo payment (real PSP integration comes later)
    const { error: payError } = await supabase.from("payments").insert({
      booking_id: booking.id,
      amount_aed: service.price_aed,
      method: payMethod,
      status: "paid",
    });

    if (payError) {
      toast.error(payError.message);
      setSubmitting(false);
      return;
    }

    toast.success("Booking requested! Your therapist will confirm shortly.");
    router.push(`/bookings/${booking.id}`);
  }

  if (!therapist) {
    return <div className="py-20 text-center text-neutral-400">Loading…</div>;
  }

  const steps: Step[] = ["service", "time", "location", "payment"];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Therapist summary */}
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={therapist.profile?.avatar_url ?? undefined} />
          <AvatarFallback>{therapist.profile?.full_name?.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{therapist.profile?.full_name}</p>
          <p className="text-sm text-neutral-500">
            ★ {Number(therapist.rating_avg).toFixed(1)} · {therapist.base_area}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? "bg-emerald-600" : "bg-neutral-200"}`}
          />
        ))}
      </div>

      {step === "service" && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {therapist.services
              ?.sort((a, b) => Number(a.price_aed) - Number(b.price_aed))
              .map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setService(s);
                    setTime(null);
                    setStep("time");
                  }}
                  className={`flex w-full items-center justify-between rounded-lg border p-4 text-left transition hover:border-emerald-400 ${service?.id === s.id ? "border-emerald-500 bg-emerald-50" : ""}`}
                >
                  <div>
                    <p className="font-medium">{serviceLabel(s.service_type)}</p>
                    <p className="text-sm text-neutral-500">{s.duration_min} min</p>
                  </div>
                  <p className="font-semibold text-emerald-700">{formatAED(s.price_aed)}</p>
                </button>
              ))}
          </CardContent>
        </Card>
      )}

      {step === "time" && service && (
        <Card>
          <CardHeader>
            <CardTitle>
              Pick date & time — {serviceLabel(service.service_type)} {service.duration_min}min
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setTime(null);
                }}
                disabled={{ before: new Date() }}
              />
            </div>
            {date && (
              <div>
                <p className="mb-2 text-sm font-medium">
                  Available times on {date.toLocaleDateString()}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    No available slots this day. Try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <Button
                        key={s}
                        variant={time === s ? "default" : "outline"}
                        className={time === s ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                        onClick={() => setTime(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("service")}>
                ← Back
              </Button>
              <Button
                disabled={!date || !time}
                onClick={() => setStep("location")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "location" && (
        <Card>
          <CardHeader>
            <CardTitle>Where should we come?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address (hotel / building, room or apt number)</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Marriott Marina, Room 1204"
              />
            </div>
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="bg-white">
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
            <div className="space-y-2">
              <Label htmlFor="notes">Visit notes (entrance, parking, preferences…)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ask reception for guest access. Prefer medium pressure."
              />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("time")}>
                ← Back
              </Button>
              <Button
                disabled={!address.trim()}
                onClick={() => setStep("payment")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "payment" && service && date && time && (
        <Card>
          <CardHeader>
            <CardTitle>Review & pay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 rounded-lg bg-neutral-50 p-4 text-sm">
              <p>
                <span className="text-neutral-500">Service:</span>{" "}
                {serviceLabel(service.service_type)} · {service.duration_min} min
              </p>
              <p>
                <span className="text-neutral-500">When:</span> {date.toLocaleDateString()} at {time}
              </p>
              <p>
                <span className="text-neutral-500">Where:</span> {address}
                {area ? ` (${area})` : ""}
              </p>
              <p className="pt-2 text-base font-semibold">
                Total: <span className="text-emerald-700">{formatAED(service.price_aed)}</span>
              </p>
            </div>

            <RadioGroup value={payMethod} onValueChange={setPayMethod} className="space-y-2">
              {[
                ["card", "Credit / Debit card"],
                ["apple_pay", "Apple Pay"],
                ["google_pay", "Google Pay"],
              ].map(([value, label]) => (
                <Label
                  key={value}
                  htmlFor={`pay-${value}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${payMethod === value ? "border-emerald-500 bg-emerald-50" : ""}`}
                >
                  <RadioGroupItem value={value} id={`pay-${value}`} />
                  {label}
                </Label>
              ))}
            </RadioGroup>

            <p className="text-xs text-neutral-500">
              Free cancellation up to 48h before your session. 50% refund between 48–24h.
              Demo mode: no real charge is made.
            </p>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("location")}>
                ← Back
              </Button>
              <Button
                disabled={submitting}
                onClick={confirmBooking}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? "Processing…" : `Pay ${formatAED(service.price_aed)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
