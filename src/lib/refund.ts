// Cancellation refund policy:
//  >= 48h before start: 100% refund
//  24-48h before start: 50% refund
//  < 24h before start:  0% refund
export function calcRefund(
  bookingDate: string,
  startTime: string,
  priceAed: number
): { refundAed: number; ratePct: number; hoursLeft: number } {
  const start = new Date(`${bookingDate}T${startTime}`);
  const hoursLeft = (start.getTime() - Date.now()) / 36e5;

  let ratePct = 0;
  if (hoursLeft >= 48) ratePct = 100;
  else if (hoursLeft >= 24) ratePct = 50;

  const refundAed = Math.round((priceAed * ratePct) / 100);
  return { refundAed, ratePct, hoursLeft: Math.max(0, Math.floor(hoursLeft)) };
}
