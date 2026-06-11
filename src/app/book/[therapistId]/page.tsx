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
import { createBookingCheckout } from "@/app/book/actions";
import { useI18n } from "@/lib/i18n";
import { serviceLabel, formatAED, DUBAI_AREAS } from "@/lib/constants";
import type { AvailabilitySlot, Therapist, TherapistService } from "@/lib/types";

type Step = "service" | "time" | "location" | "payment";

export default function BookingPage() {
  const { therapistId } = useParams<{ therapistId: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { dict } = useI18n();

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
  const [isFirstBooking, setIsFirstBooking] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: avail }, { data: busySlots }, { data: exc }] =
        await Promise.all([
          supabase
            .from("therapists")
            .select("*, profile:profiles!therapists_id_fkey(*), services:therapist_services(*)")
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

      // launch promo: 20% off the first booking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: me } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_id", user.id)
          .single();
        if (me) {
          const { count } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", me.id);
          setIsFirstBooking((count ?? 0) === 0);
        }
      }
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

  const promoRate = isFirstBooking ? 0.2 : 0;
  const finalPrice = service
    ? Math.round(Number(service.price_aed) * (1 - promoRate))
    : 0;

  async function confirmBooking() {
    if (!service || !date || !time || !address) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/book/${therapistId}`);
      return;
    }

    const result = await createBookingCheckout({
      therapistId,
      serviceId: service.id,
      bookingDate: date.toISOString().slice(0, 10),
      startTime: time,
      address,
      area: area || null,
      notes: notes || null,
      payMethod,
    });

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    if (result.mode === "stripe" && result.checkoutUrl) {
      window.location.href = result.checkoutUrl; // Stripe-hosted payment page
      return;
    }

    toast.success(dict.bookingRequested);
    router.push(`/bookings/${result.bookingId}`);
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
            className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? "bg-[var(--gold-500)]" : "bg-neutral-200"}`}
          />
        ))}
      </div>

      {step === "service" && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.chooseService}</CardTitle>
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
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition hover:border-[var(--gold-400)] ${service?.id === s.id ? "border-[var(--gold-500)] bg-[var(--gold-50)]" : ""}`}
                >
                  {s.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photo_url}
                      alt={serviceLabel(s.service_type)}
                      className="size-14 shrink-0 rounded-lg border object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{serviceLabel(s.service_type)}</p>
                    <p className="text-sm text-neutral-500">{s.duration_min} min</p>
                  </div>
                  <p className="font-semibold text-[var(--text-gold)]">{formatAED(s.price_aed)}</p>
                </button>
              ))}
          </CardContent>
        </Card>
      )}

      {step === "time" && service && (
        <Card>
          <CardHeader>
            <CardTitle>
              {dict.pickDateTime} — {serviceLabel(service.service_type)} {service.duration_min}{dict.min}
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
                  {dict.availableTimesOn} {date.toLocaleDateString()}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-neutral-500">
                    {dict.noSlotsThisDay}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <Button
                        key={s}
                        variant={time === s ? "default" : "outline"}
                        
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
                {dict.back}
              </Button>
              <Button
                disabled={!date || !time}
                onClick={() => setStep("location")}
               
              >
                {dict.continue}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "location" && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.whereShouldWeCome}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{dict.addressLabel}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Marriott Marina, Room 1204"
              />
            </div>
            <div className="space-y-2">
              <Label>{dict.area}</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={dict.selectArea} />
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
              <Label htmlFor="notes">{dict.visitNotesLabel}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Ask reception for guest access. Prefer medium pressure."
              />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("time")}>
                {dict.back}
              </Button>
              <Button
                disabled={!address.trim()}
                onClick={() => setStep("payment")}
               
              >
                {dict.continue}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "payment" && service && date && time && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.reviewAndPay}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 rounded-lg bg-neutral-50 p-4 text-sm">
              <p>
                <span className="text-neutral-500">{dict.service}:</span>{" "}
                {serviceLabel(service.service_type)} · {service.duration_min} min
              </p>
              <p>
                <span className="text-neutral-500">{dict.when}:</span> {date.toLocaleDateString()} at {time}
              </p>
              <p>
                <span className="text-neutral-500">{dict.where}:</span> {address}
                {area ? ` (${area})` : ""}
              </p>
              {isFirstBooking && (
                <p className="flex justify-between text-[var(--text-gold)]">
                  <span>🎁 {dict.firstBookingPromo}</span>
                  <span>−{formatAED(Number(service.price_aed) - finalPrice)}</span>
                </p>
              )}
              <p className="pt-2 text-base font-semibold">
                {dict.total}:{" "}
                {isFirstBooking && (
                  <span className="me-2 text-sm font-normal text-neutral-400 line-through">
                    {formatAED(service.price_aed)}
                  </span>
                )}
                <span className="text-[var(--text-gold)]">{formatAED(finalPrice)}</span>
              </p>
            </div>

            <RadioGroup value={payMethod} onValueChange={setPayMethod} className="space-y-2">
              {[
                ["card", dict.cardPay],
                ["apple_pay", "Apple Pay"],
                ["google_pay", "Google Pay"],
              ].map(([value, label]) => (
                <Label
                  key={value}
                  htmlFor={`pay-${value}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${payMethod === value ? "border-[var(--gold-500)] bg-[var(--gold-50)]" : ""}`}
                >
                  <RadioGroupItem value={value} id={`pay-${value}`} />
                  {label}
                </Label>
              ))}
            </RadioGroup>

            <p className="text-xs text-neutral-500">
              {dict.cancelPolicyShort}
            </p>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("location")}>
                {dict.back}
              </Button>
              <Button
                disabled={submitting}
                onClick={confirmBooking}
               
              >
                {submitting ? dict.processing : `${dict.pay} ${formatAED(finalPrice)}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
