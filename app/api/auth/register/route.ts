import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    console.log('1. Starting registration...');
    await dbConnect();
    console.log('2. Database connected.');

    const body = await request.json();
    const { name, email, password } = body;
    console.log('3. Received data for:', email);

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Please fill all fields' }, { status: 400 });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const apiKey = 'sammy_' + Math.random().toString(36).substr(2, 9);
    const user = await User.create({ name, email, password, apiKey });
    
    console.log('4. User created successfully:', user.email);

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully!',
      user: { name: user.name, email: user.email } 
    });
  } catch (error: any) {
    console.error('CRITICAL REGISTER ERROR:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
