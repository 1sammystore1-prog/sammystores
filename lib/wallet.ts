import dbConnect from './mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function deductBalance(userId: string, amount: number, description: string) {
  await dbConnect();
  const user = await User.findById(userId);
  
  if (!user) return { success: false, error: 'User not found' };
  if (user.walletBalance < amount) return { success: false, error: 'Insufficient funds' };

  user.walletBalance -= amount;
  await user.save();

  await Transaction.create({
    userId,
    type: 'number_rental',
    description,
    amount,
    status: 'success'
  });

  return { success: true, newBalance: user.walletBalance };
}
