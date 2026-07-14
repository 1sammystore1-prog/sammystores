import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem {
  type: 'account' | 'smm';
  productId: string;
  name: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  link?: string; // required for SMM items - the target URL to deliver the order to
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    type: { type: String, enum: ['account', 'smm'], required: true, default: 'account' },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    link: { type: String },
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart = (mongoose.models.Cart as Model<ICart>) || mongoose.model<ICart>('Cart', CartSchema);
export default Cart;
