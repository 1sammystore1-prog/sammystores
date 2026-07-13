import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICartItem {
  productId: string;
    name: string;
      category?: string;
        unitPrice: number;
          quantity: number;
          }

          export interface ICart extends Document {
            userId: mongoose.Types.ObjectId;
              items: ICartItem[];
                updatedAt: Date;
                }

                const CartItemSchema = new Schema<ICartItem>(
                  {
                      productId: { type: String, required: true },
                          name: { type: String, required: true },
                              category: { type: String },
                                  unitPrice: { type: Number, required: true },
                                      quantity: { type: Number, required: true, min: 1, default: 1 },
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