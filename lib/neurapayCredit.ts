import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { sendWalletFundedEmail } from '@/lib/email';

const WELCOME_BONUS_AMOUNT = 500;

/**
 * Credits a user's wallet for a successful NeuraPay virtual-account
 * transfer. Called from BOTH the webhook handler and the manual
 * "check status" endpoint, since either one might see the successful
 * payment first (webhook delivery isn't instant/guaranteed). Safe to
 * call twice for the same reference - only the first call credits
 * anything, thanks to the { status: { $ne: 'success' } } guard below.
 *
 * Unlike Paystack/a hosted-checkout flow, NeuraPay virtual accounts
 * don't have a pre-agreed amount - the customer can transfer whatever
 * they like to the account. So we credit exactly what NeuraPay confirms
 * was received (net of their fees), not whatever the user originally
 * typed into the amount field.
 */
export async function creditNeurapayTransaction(params: {
  reference?: string;
  virtualAccount?: string;
  grossAmount: number;
  netAmount: number;
  providerReference?: string;
}): Promise<{ credited: boolean; alreadyProcessed: boolean; newBalance: number }> {
  const { reference, virtualAccount, grossAmount, netAmount, providerReference } = params;

  // NeuraPay's webhook "reference" field is THEIR internally-generated
  // transaction id (e.g. "TXN-..."), not the reference we sent when
  // creating the virtual account - so we can't reliably look our pending
  // Transaction up by that. The virtual account number is the one value
  // guaranteed to be shared between our records and NeuraPay's, so we
  // match on that first and only fall back to our own reference if for
  // some reason the account number isn't available.
  const txn = virtualAccount
    ? await Transaction.findOne({ 'metadata.accountNumber': virtualAccount, type: 'wallet_fund' })
    : await Transaction.findOne({ activationId: reference, type: 'wallet_fund' });

  if (!txn) {
    throw new Error(
      `No pending wallet_fund transaction for virtualAccount=${virtualAccount} reference=${reference}`
    );
  }

  if (txn.status === 'success') {
    const user = await User.findById(txn.userId);
    return { credited: false, alreadyProcessed: true, newBalance: user?.walletBalance ?? 0 };
  }

  const creditAmount = netAmount > 0 ? netAmount : grossAmount;

  const updatedTxn = await Transaction.findOneAndUpdate(
    { _id: txn._id, status: { $ne: 'success' } },
    {
      $set: {
        status: 'success',
        amount: creditAmount,
        description: `Wallet funding via NeuraPay (₦${creditAmount})`,
        'metadata.providerReference': providerReference,
        'metadata.neurapayReference': reference,
        'metadata.grossAmount': grossAmount,
        'metadata.netAmount': netAmount,
      },
    },
    { new: true }
  );

  if (!updatedTxn) {
    const user = await User.findById(txn.userId);
    return { credited: false, alreadyProcessed: true, newBalance: user?.walletBalance ?? 0 };
  }

  const user = await User.findByIdAndUpdate(
    txn.userId,
    { $inc: { walletBalance: creditAmount } },
    { new: true }
  );

  let finalBalance = user?.walletBalance ?? 0;

  const successfulDepositCount = await Transaction.countDocuments({
    userId: txn.userId,
    type: 'wallet_fund',
    status: 'success',
  });

  if (successfulDepositCount === 1) {
    try {
      await Transaction.create({
        userId: txn.userId,
        type: 'welcome_bonus',
        description: 'Welcome bonus for first deposit',
        amount: WELCOME_BONUS_AMOUNT,
        status: 'success',
        reference: `welcome-bonus-${txn.userId}`,
      });

      const bonusedUser = await User.findByIdAndUpdate(
        txn.userId,
        { $inc: { walletBalance: WELCOME_BONUS_AMOUNT } },
        { new: true }
      );

      finalBalance = bonusedUser?.walletBalance ?? finalBalance;
    } catch (bonusError: any) {
      if (bonusError?.code !== 11000) {
        console.error('Welcome bonus error:', bonusError.message);
      }
    }
  }

  if (user) {
    sendWalletFundedEmail({
      to: user.email,
      amount: creditAmount,
      newBalance: finalBalance,
    }).catch((err) => console.error('Wallet funded email failed:', err));
  }

  return { credited: true, alreadyProcessed: false, newBalance: finalBalance };
}
