// Single source of truth for USD -> NGN conversion used across the
// virtual-number feature. Previously this rate (1550) was hardcoded
// separately in both the buy route and the frontend page, so a future
// rate change would silently go out of sync between what the user is
// quoted and what they're actually charged.
export const USD_TO_NGN_RATE = parseFloat(process.env.USD_TO_NGN_RATE || '1550');

export function toNgn(usdPrice: number): number {
  return parseFloat((usdPrice * USD_TO_NGN_RATE).toFixed(2));
}
