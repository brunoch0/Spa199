"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { calcRefund } from "@/lib/refund";
import { formatAED, REVIEW_TAGS } from "@/lib/constants";
import type { Booking } from "@/lib/types";

const INQUIRY_REASONS = [
  "Therapist didn't show up",
  "Late arrival",
  "Service quality issue",
  "Payment / refund question",
  "Unprofessional behaviour",
  "Other",
];

export function BookingActions({
  booking,
  hasReview,
  profileId,
}: {
  booking: Booking;
  hasReview: boolean;
  profileId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [inqType, setInqType] = useState<"inquiry" | "report">("inquiry");
  const [inqReason, setInqReason] = useState(INQUIRY_REASONS[0]);
  const [inqDetail, setInqDetail] = useState("");

  const cancellable = ["requested", "confirmed"].includes(booking.status);
  const reviewable = booking.status === "completed" && !hasReview;
  const refund = calcRefund(booking.booking_date, booking.start_time, Number(booking.price_aed));

  async function cancelBooking() {
    setBusy(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancel_reason: "Cancelled by customer",
        refund_amount_aed: refund.refundAed,
      })
      .eq("id", booking.id);

    if (!error) {
      await supabase
        .from("payments")
        .update({
          status: refund.ratePct === 100 ? "refunded" : refund.ratePct > 0 ? "partially_refunded" : "paid",
          refund_amount_aed: refund.refundAed,
        })
        .eq("booking_id", booking.id);
    }

    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(
      refund.refundAed > 0
        ? `Cancelled. ${formatAED(refund.refundAed)} will be refunded.`
        : "Booking cancelled."
    );
    setCancelOpen(false);
    router.refresh();
  }

  async function submitReview() {
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      customer_id: profileId,
      therapist_id: booking.therapist_id,
      rating,
      comment,
      tags,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thanks for your review!");
    setReviewOpen(false);
    router.refresh();
  }

  async function submitInquiry() {
    setBusy(true);
    const { error } = await supabase.from("inquiries").insert({
      booking_id: booking.id,
      reporter_id: profileId,
      type: inqType,
      reason: inqReason,
      detail: inqDetail,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted. Our team will get back to you.");
    setInquiryOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {cancellable && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
              Cancel booking
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel this booking?</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 pt-2">
                  <p>
                    {refund.hoursLeft}h until your session. Based on our policy you will be
                    refunded:
                  </p>
                  <p className="text-lg font-semibold text-emerald-700">
                    {formatAED(refund.refundAed)}{" "}
                    <span className="text-sm font-normal text-neutral-500">
                      ({refund.ratePct}% of {formatAED(booking.price_aed)})
                    </span>
                  </p>
                  <p className="text-xs">
                    100% refund ≥48h before · 50% between 48–24h · no refund &lt;24h.
                    Refunds are processed within 3–5 business days.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCancelOpen(false)}>
                Keep booking
              </Button>
              <Button variant="destructive" disabled={busy} onClick={cancelBooking}>
                {busy ? "Cancelling…" : "Confirm cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {reviewable && (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">Write a review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How was your session?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-center gap-1 text-3xl">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    className={n <= rating ? "text-amber-500" : "text-neutral-300"}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {REVIEW_TAGS.map((t) => (
                  <Badge
                    key={t}
                    variant={tags.includes(t) ? "default" : "outline"}
                    className={`cursor-pointer ${tags.includes(t) ? "bg-emerald-600" : ""}`}
                    onClick={() =>
                      setTags((prev) =>
                        prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                    }
                  >
                    {t}
                  </Badge>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details about your experience…"
              />
            </div>
            <DialogFooter>
              <Button disabled={busy} onClick={submitReview} className="bg-emerald-600 hover:bg-emerald-700">
                {busy ? "Submitting…" : "Submit review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Contact support</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inquiry / Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={inqType} onValueChange={(v) => setInqType(v as "inquiry" | "report")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inquiry">General inquiry</SelectItem>
                  <SelectItem value="report">Report a problem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={inqReason} onValueChange={setInqReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INQUIRY_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={inqDetail}
                onChange={(e) => setInqDetail(e.target.value)}
                placeholder="Tell us what happened…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={busy || !inqDetail.trim()} onClick={submitInquiry}>
              {busy ? "Submitting…" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
