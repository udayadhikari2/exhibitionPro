import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { ISessionUser, UserRole, UserStatus } from '@/types';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'portal_super_secure_jwt_token_2026_exhibition';
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
export const SESSION_COOKIE_NAME = 'portal_session';

// ==================== PASSWORD UTILITIES ====================
export async function hashPassword(plainText: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plainText, saltRounds);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// ==================== SESSION TOKEN MANAGEMENT ====================
export async function signSessionToken(user: ISessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    institution: user.institution,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<ISessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (!payload || !payload.id || !payload.role) {
      return null;
    }
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      status: (payload.status as UserStatus) || 'ACTIVE',
      avatar: payload.avatar as string | undefined,
      institution: payload.institution as string | undefined,
    };
  } catch (err) {
    return null;
  }
}

// ==================== COOKIE ACCESSORS ====================
export async function getSessionUser(): Promise<ISessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie?.value) return null;
  const user = await verifySessionToken(sessionCookie.value);
  if (!user || user.status === 'INACTIVE') {
    return null;
  }
  return user;
}

export async function setSessionCookie(user: ISessionUser): Promise<void> {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// ==================== AUTHORIZATION CHECKS ====================
export function isUserAuthorized(user: ISessionUser | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  if (user.status !== 'ACTIVE') return false;
  if (user.role === 'SUPER_ADMIN') return true; // Super admin has global administrative permission
  return allowedRoles.includes(user.role);
}

export const authorizeRole = isUserAuthorized;

export async function requireAuth(allowedRoles?: UserRole[]): Promise<ISessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (user.status !== 'ACTIVE') {
    throw new Error('ACCOUNT_INACTIVE');
  }
  if (allowedRoles && !isUserAuthorized(user, allowedRoles)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
