import mongoose from 'mongoose';
import Transaction from '@/models/Transaction';

// Tiers are based on LIFETIME spend on actual products/services -
// account purchases, SMM orders, and virtual numbers - NOT wallet
// funding itself (funding your wallet isn't "spending", it's just
// moving money in). Each tier's discount is applied automatically at
// checkout, same mechanism as a coupon (a wallet credit-back), so no
// customer ever has to enter a code to get their loyalty discount.
export const LOYALTY_TIERS = [
  { name: 'Bronze', minSpend: 0, discountPercent: 0 },
  { name: 'Silver', minSpend: 25_000, discountPercent: 2 },
  { name: 'Gold', minSpend: 100_000, discountPercent: 4 },
  { name: 'Platinum', minSpend: 250_000, discountPercent: 7 },
] as const;

export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export function getTierForSpend(lifetimeSpend: number): LoyaltyTier {
  let tier: LoyaltyTier = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) {
    if (lifetimeSpend >= t.minSpend) tier = t;
  }
  return tier;
}

export function getNextTier(currentTier: LoyaltyTier): LoyaltyTier | null {
  const idx = LOYALTY_TIERS.findIndex((t) => t.name === currentTier.name);
  return idx >= 0 && idx < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[idx + 1] : null;
}

// Aggregated in the database rather than summed in JS - a user could
// have hundreds of past orders, and this runs on every checkout.
export async function getLifetimeSpend(userId: string): Promise<number> {
  const result = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: { $in: ['account_purchase', 'smm', 'virtual_number'] },
        status: 'success',
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return result[0]?.total ?? 0;
}
