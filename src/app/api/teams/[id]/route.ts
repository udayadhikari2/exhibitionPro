import { NextRequest, NextResponse } from 'next/server';
import { getTeamById, updateTeam, deleteTeam } from '@/services/team';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = await getTeamById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    return NextResponse.json({ team });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch team' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const team = await getTeamById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner =
      team.createdBy === user.id ||
      team.teamLeader?.userId === user.id ||
      (team as any).teamLeaderId === user.id;
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied: Not team owner or admin' }, { status: 403 });
    }

    const body = await req.json();
    const updatePayload = { ...body };

    // If student updates a team that had correction requested, reset to SUBMITTED
    if (
      !isAdmin &&
      (team.status === 'CORRECTION_REQUIRED' || team.status === 'NEEDS_CORRECTION')
    ) {
      updatePayload.status = 'SUBMITTED';
    }

    const updated = await updateTeam(team._id, updatePayload);
    return NextResponse.json({ success: true, team: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update team' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const team = await getTeamById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isOwner =
      team.createdBy === user.id ||
      team.teamLeader?.userId === user.id ||
      (team as any).teamLeaderId === user.id;
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'EVENT_ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const success = await deleteTeam(team._id);
    return NextResponse.json({ success, message: 'Team registration removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete team' }, { status: 500 });
  }
}
