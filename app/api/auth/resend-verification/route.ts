import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserId } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/email';

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// Requires being logged in (unlike forgot-password, which works for a
// logged-out visitor) - this is "resend MY OWN verification email", so
// there's no user-enumeration concern to design around here, and no need
// for a generic non-revealing response.
export async function POST(request: Request) {
  try {
    await dbConnect();

    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Please log in' }, { status: 401 });
    }

    const limit = await checkRateLimit(`resend-verification:${userId}`, 3, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified !== false) {
      // Covers both true (verified) and undefined (legacy pre-feature
      // account, treated as verified everywhere).
      return NextResponse.json({ success: false, error: 'Your email is already verified.' }, { status: 400 });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.verificationTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    await user.save();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const verifyUrl = `${siteUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    await sendVerificationEmail({ to: user.email, verifyUrl });

    return NextResponse.json({ success: true, message: 'Verification email sent - check your inbox.' });
  } catch (error: any) {
    console.error('Resend verification error:', error.message);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
