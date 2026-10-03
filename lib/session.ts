import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { UserModel } from '@/models/User';

const cookieName = 'cricket_arena_session';
const sessionDurationSeconds = 60 * 60 * 24 * 7;

function getSigningKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
  }
  return new TextEncoder().encode(secret);
}

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'OWNER' | 'ADMIN';
};

export async function createSession(user: AuthenticatedUser): Promise<void> {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(getSigningKey());

  cookies().set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionDurationSeconds,
  });
}

export async function clearSession(): Promise<void> {
  cookies().set(cookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSigningKey(), { algorithms: ['HS256'] });
    if (!payload.sub || !Types.ObjectId.isValid(payload.sub)) return null;
    await connectToDatabase();
    const user = await UserModel.findById(payload.sub).select('name email role').lean();
    if (!user) return null;
    return { id: String(user._id), name: user.name, email: user.email, role: user.role };
  } catch {
    return null;
  }
}
