import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRole, UserStatus } from '@/types';

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'portal_super_secure_jwt_token_2026_exhibition';
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
const SESSION_COOKIE_NAME = 'portal_session';

interface DecodedSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

async function verifyToken(req: NextRequest): Promise<DecodedSession | null> {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, SECRET_KEY);
    if (!payload.id || !payload.role) return null;
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      status: (payload.status as UserStatus) || 'ACTIVE',
    };
  } catch (err) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected route definitions
  const isAdminRoute = pathname.startsWith('/admin');
  const isEvaluatorRoute = pathname.startsWith('/evaluator');
  const isStudentRoute = pathname.startsWith('/student');
  const isAuthRoute = pathname.startsWith('/login');

  // Verify session
  const user = await verifyToken(req);

  // If user is accessing login while already logged in with active status, redirect to dashboard
  if (isAuthRoute && user && user.status === 'ACTIVE') {
    if (user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    if (user.role === 'EVALUATOR') {
      return NextResponse.redirect(new URL('/evaluator', req.url));
    }
    return NextResponse.redirect(new URL('/student', req.url));
  }

  // Guard /admin/*
  if (isAdminRoute) {
    if (!user) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.status !== 'ACTIVE') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'inactive');
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'EVENT_ADMIN') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Guard /evaluator/*
  if (isEvaluatorRoute) {
    if (!user) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.status !== 'ACTIVE') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'inactive');
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'EVALUATOR' && user.role !== 'SUPER_ADMIN') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Guard /student/*
  if (isStudentRoute) {
    if (!user) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.status !== 'ACTIVE') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'inactive');
      return NextResponse.redirect(loginUrl);
    }
    if (user.role !== 'STUDENT' && user.role !== 'SUPER_ADMIN') {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/evaluator/:path*',
    '/student/:path*',
    '/login',
  ],
};
