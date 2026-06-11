import type { AvailabilitySlot } from "./types";

interface BusySlot {
  booking_date: string;
  start_time: string;
  end_time: string;
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// Generate hourly-start slots for a date that fit duration inside availability
// windows and don't overlap existing bookings.
export function generateSlots(
  date: Date,
  durationMin: number,
  availability: AvailabilitySlot[],
  busy: BusySlot[],
  hasException: boolean
): string[] {
  if (hasException) return [];
  const weekday = date.getDay();
  const windows = availability.filter((a) => a.weekday === weekday);
  const dateStr = date.toISOString().slice(0, 10);
  const busyToday = busy.filter((b) => b.booking_date === dateStr);
  const isToday = dateStr === new Date().toISOString().slice(0, 10);
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  const slots: string[] = [];
  for (const w of windows) {
    const open = toMin(w.start_time);
    const close = toMin(w.end_time);
    for (let s = open; s + durationMin <= close; s += 60) {
      if (isToday && s <= nowMin + 120) continue; // 2h lead time
      const e = s + durationMin;
      const overlaps = busyToday.some(
        (b) => s < toMin(b.end_time) && e > toMin(b.start_time)
      );
      if (!overlaps) slots.push(toTime(s));
    }
  }
  return [...new Set(slots)].sort();
}
