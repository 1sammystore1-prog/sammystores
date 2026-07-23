import Coupon from '@/models/Coupon';
import Transaction from '@/models/Transaction';

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: any;
  discountAmount?: number;
}

// Validates a coupon code against a cart total and the requesting user's
// redemption history. Does NOT mutate anything - call redeemCoupon()
// separately once the order this discount applies to has actually succeeded.
export async function validateCoupon(
  code: string,
  userId: string,
  cartTotal: number
): Promise<CouponValidationResult> {
  if (!code || !code.trim()) {
    return { valid: false, error: 'Coupon code required' };
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code' };
  }
  if (!coupon.active) {
    return { valid: false, error: 'This coupon is no longer active' };
  }
  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, error: 'This coupon has expired' };
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }

  if (coupon.perUserLimit !== null) {
    const userRedemptions = await Transaction.countDocuments({
      userId,
      type: 'coupon_discount',
      'metadata.couponCode': coupon.code,
    });
    if (userRedemptions >= coupon.perUserLimit) {
      return { valid: false, error: 'You have already used this coupon' };
    }
  }

  let discountAmount =
    coupon.type === 'percent' ? (cartTotal * coupon.value) / 100 : coupon.value;

  if (coupon.type === 'percent' && coupon.maxDiscount) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }
  discountAmount = Math.min(discountAmount, cartTotal);
  discountAmount = Math.round(discountAmount);

  if (discountAmount <= 0) {
    return { valid: false, error: 'This coupon does not apply to your cart' };
  }

  return { valid: true, coupon, discountAmount };
}

// Atomically increments usedCount, but ONLY if usageLimit is still
// unlimited or not yet reached - condition and increment happen in a
// single database operation, so two simultaneous redemptions of the very
// last available use can't both slip through (the same pattern used for
// every wallet-balance debit elsewhere in this app). Returns false if the
// limit had already been hit by the time this ran, so the caller knows
// NOT to actually grant the discount it already computed.
export async function markCouponRedeemed(couponId: string): Promise<boolean> {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  return !!updated;
}
