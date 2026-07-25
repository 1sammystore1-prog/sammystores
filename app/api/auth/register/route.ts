import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const ip = getClientIp(request);
    // Registration is cheap to abuse (spam accounts, enumeration probing),
    // so it gets its own limit separate from login.
    const limit = await checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { name, email, password, ref } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Please fill all fields' }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(String(email))) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (String(password).length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Cryptographically random, not Math.random() - this is handed to the
    // user as their API key, so it needs to be unguessable.
    const apiKey = 'sammy_' + crypto.randomBytes(20).toString('hex');

    // Same pattern as password reset: only the HASH is stored, the raw
    // token only ever exists in the emailed link.
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    // Pass the PLAIN password - the schema's pre('save') hook hashes it
    // exactly once. Hashing it here too would double-hash it, which would
    // make login fail even with the correct password.
    // A bad/unknown ref code should never block signup - just skip linking
    // the referrer rather than failing the whole registration.
    let referredBy = null;
    if (ref && typeof ref === 'string') {
      const referrer = await User.findOne({ referralCode: ref.trim() });
      if (referrer) referredBy = referrer._id;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      apiKey,
      walletBalance: 0,
      referredBy,
      emailVerified: false,
      verificationTokenHash,
      verificationTokenExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const verifyUrl = `${siteUrl}/verify-email?token=${rawVerificationToken}&email=${encodeURIComponent(normalizedEmail)}`;
    sendVerificationEmail({ to: normalizedEmail, verifyUrl }).catch((err) =>
      console.error('Verification email failed to send:', err)
    );

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ 
      error: error.message || 'Server error' 
    }, { status: 500 });
  }
}
