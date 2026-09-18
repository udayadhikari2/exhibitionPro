import { NextRequest, NextResponse } from 'next/server';
import {
  getAssignmentsByEvent,
  assignEvaluator,
  removeAssignment,
  getEvaluationsByEvent,
} from '@/lib/dataStore';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const assignments = await getAssignmentsByEvent(eventId);
    const evaluations = await getEvaluationsByEvent(eventId);

    // Build assignment map with completion status
    const data = assignments.map((asg) => {
      const isCompleted = evaluations.some(
        (e) => e.teamId === asg.teamId && e.evaluatorId === asg.evaluatorId && e.isLocked
      );
      return {
        ...asg,
        isCompleted,
      };
    });

    return NextResponse.json({ assignments: data, totalCompleted: evaluations.filter(e => e.isLocked).length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { eventId, evaluatorId, teamId } = await req.json();
    if (!eventId || !evaluatorId || !teamId) {
      return NextResponse.json({ error: 'eventId, evaluatorId, and teamId are required' }, { status: 400 });
    }

    const asg = await assignEvaluator(eventId, evaluatorId, teamId);
    return NextResponse.json({ success: true, assignment: asg }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('assignmentId');
    if (!assignmentId) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
    }

    await removeAssignment(assignmentId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
