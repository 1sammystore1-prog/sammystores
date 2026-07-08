import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  // Select only necessary fields (no passwords!)
  const users = await User.find().select('name email walletBalance createdAt');
  return NextResponse.json({ success: true, users });
}
