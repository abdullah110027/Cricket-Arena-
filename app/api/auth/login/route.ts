import { compare } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createSession } from '@/lib/session';
import { UserModel } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });

    await connectToDatabase();
    const user = await UserModel.findOne({ email }).select('+passwordHash');
    if (!user) return NextResponse.json({ error: 'No account found. Please register first.' }, { status: 401 });
    if (!(await compare(password, user.passwordHash))) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });

    const sessionUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
    await createSession(sessionUser);
    return NextResponse.json({ user: sessionUser });
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Unable to sign in at this time.' }, { status: 500 });
  }
}
