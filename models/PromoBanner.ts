import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPromoBanner extends Document {
  message: string;
  emoji?: string;
  linkUrl?: string;
  linkLabel?: string;
  // Presets give a quick "festive/sale/ad" look without needing a color
  // picker; 'custom' unlocks the two color fields below for anything
  // more specific (e.g. matching a sponsor's brand colors for an ad).
  theme: 'festive' | 'sale' | 'celebration' | 'ad' | 'custom';
  backgroundColor?: string;
  textColor?: string;
  // Optional scheduling window - lets an admin queue up a New Year
  // banner in advance that only goes live between two dates, without
  // needing to remember to toggle it on/off manually.
  startDate?: Date;
  endDate?: Date;
  active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromoBannerSchema: Schema<IPromoBanner> = new Schema(
  {
    message: { type: String, required: true },
    emoji: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    linkLabel: { type: String, default: '' },
    theme: { type: String, enum: ['festive', 'sale', 'celebration', 'ad', 'custom'], default: 'festive' },
    backgroundColor: { type: String, default: '' },
    textColor: { type: String, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.PromoBanner as Model<IPromoBanner>) ||
  mongoose.model<IPromoBanner>('PromoBanner', PromoBannerSchema);
