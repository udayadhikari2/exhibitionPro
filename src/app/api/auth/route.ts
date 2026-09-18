import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithCredentials } from '@/services/user';
import { setSessionCookie, clearSessionCookie, getSessionUser } from '@/lib/auth';

// POST: Log in with credentials
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Both email and password are required' },
        { status: 400 }
      );
    }

    const authResult = await authenticateWithCredentials(email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    await setSessionCookie(authResult.user);

    return NextResponse.json({
      success: true,
      user: authResult.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Sign out
export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Signed out successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: Current session info
export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ user: null });
  }
}
