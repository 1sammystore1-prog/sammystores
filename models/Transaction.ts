import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  description: string;
  amount: number;
  status: string;
  metadata?: any;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit', 'withdrawal', 'account_purchase', 'transfer', 'refund', 'manual_fund_request']
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Prevent overwriting the model if it already exists
const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
