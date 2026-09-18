import { NextRequest, NextResponse } from 'next/server';
import {
  getAssignments,
  createAssignment,
  batchAssignEvaluatorToTeams,
  batchAssignTeamsToEvaluators,
} from '@/services/assignment';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId') || undefined;
    const evaluatorId = searchParams.get('evaluatorId') || undefined;
    const teamId = searchParams.get('teamId') || undefined;
    const status = searchParams.get('status') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const assignments = await getAssignments({ eventId, evaluatorId, teamId, status, categoryId });
    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to retrieve assignments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, evaluatorId, teamId, evaluatorIds, teamIds } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const assignedBy = user?.name || 'Admin';

    // Case 1: 1 Evaluator -> Multiple Teams (teamIds)
    if (evaluatorId && Array.isArray(teamIds) && teamIds.length > 0) {
      const result = await batchAssignEvaluatorToTeams(evaluatorId, eventId, teamIds, assignedBy);
      return NextResponse.json({ success: true, message: `Assigned ${result.added} project(s)`, result }, { status: 201 });
    }

    // Case 2: 1 Team -> Multiple Evaluators (evaluatorIds)
    if (teamId && Array.isArray(evaluatorIds) && evaluatorIds.length > 0) {
      const result = await batchAssignTeamsToEvaluators(teamId, eventId, evaluatorIds, assignedBy);
      return NextResponse.json({ success: true, message: `Assigned ${result.added} evaluator(s)`, result }, { status: 201 });
    }

    // Case 3: Single 1-to-1 assignment
    if (evaluatorId && teamId) {
      const assignment = await createAssignment({ eventId, evaluatorId, teamId, assignedBy });
      return NextResponse.json({ success: true, assignment }, { status: 201 });
    }

    return NextResponse.json({ error: 'Please specify evaluatorId and teamId (or batch arrays)' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process assignment' }, { status: 500 });
  }
}
