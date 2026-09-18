import { NextRequest, NextResponse } from 'next/server';
import { getEvaluatorById, updateEvaluator } from '@/services/evaluator';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { evaluator, assignments } = await getEvaluatorById(id);
    if (!evaluator) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, evaluator, assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve evaluator' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateEvaluator(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, evaluator: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update evaluator' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const updated = await updateEvaluator(id, { status: 'INACTIVE' });
    if (!updated) {
      return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Evaluator deactivated', evaluator: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to deactivate evaluator' }, { status: 500 });
  }
}
