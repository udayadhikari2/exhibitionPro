import { NextRequest, NextResponse } from 'next/server';
import { getEvaluators, createEvaluator } from '@/services/evaluator';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const eventId = searchParams.get('eventId') || undefined;

    const evaluators = await getEvaluators({ search, status, eventId });
    return NextResponse.json({ success: true, evaluators });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve evaluators' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, password, institution } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const evaluator = await createEvaluator({
      name,
      email,
      phone,
      password: password || 'eval123',
      institution,
    });

    return NextResponse.json({ success: true, evaluator }, { status: 201 });
  } catch (error: any) {
    const status = error.message && error.message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: error.message || 'Failed to create evaluator' }, { status });
  }
}
