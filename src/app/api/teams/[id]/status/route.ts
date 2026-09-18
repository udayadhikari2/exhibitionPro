import { NextRequest, NextResponse } from 'next/server';
import { updateTeamStatus, getTeamById } from '@/services/team';
import { getSessionUser, authorizeRole } from '@/lib/auth';
import { TeamStatus } from '@/types';

export async function POST(
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
    const { status, remarks, stallNumber } = body;

    if (!status) {
      return NextResponse.json({ error: 'Target status is required' }, { status: 400 });
    }

    const team = await getTeamById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const updated = await updateTeamStatus(
      team._id,
      status as TeamStatus,
      remarks,
      stallNumber
    );

    if (!updated) {
      return NextResponse.json({ error: 'Failed to update team status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, team: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Status update failed' }, { status: 500 });
  }
}
