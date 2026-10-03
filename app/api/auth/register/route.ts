import { hash } from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { createSession } from '@/lib/session';
import { UserModel } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role === 'OWNER' ? 'OWNER' : body.role === 'USER' || !body.role ? 'USER' : null;

    if (!name || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !role) {
      return NextResponse.json({ error: 'Enter a valid name, email, password (at least 8 characters), and role.' }, { status: 400 });
    }

    await connectToDatabase();
    if (await UserModel.exists({ email })) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const user = await UserModel.create({ name, email, passwordHash, role });
    const sessionUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
    await createSession(sessionUser);
    return NextResponse.json({ user: sessionUser }, { status: 201 });
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Unable to register at this time.' }, { status: 500 });
  }
}
