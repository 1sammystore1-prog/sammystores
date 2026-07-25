import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const ip = getClientIp(request);
    const limit = await checkRateLimit(`verify-email:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const { email, token } = await request.json();
    if (!email || !token) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      verificationTokenHash: tokenHash,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      // Covers both "wrong/expired token" and "already verified" (token
      // fields get cleared below once used, so a repeat click on the same
      // link correctly lands here too) - the resend page can be used
      // either way.
      return NextResponse.json(
        { success: false, error: 'This verification link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true, message: 'Email verified successfully!' });
  } catch (error: any) {
    console.error('Verify email error:', error.message);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
