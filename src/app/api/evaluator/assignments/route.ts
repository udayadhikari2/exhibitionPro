import { NextRequest, NextResponse } from 'next/server';
import {
  getAssignmentsByEvaluator,
  getTeamById,
  getEventById,
  getEvaluation,
  getCategoriesByEvent,
} from '@/lib/dataStore';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'EVALUATOR' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Evaluator role required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    // Never trust client evaluator ID. Always use the authenticated session user ID!
    const evaluatorId = user.id;

    const assignments = await getAssignmentsByEvaluator(evaluatorId, eventId || undefined);

    // Fetch team details and evaluation status for each assigned project
    const assignedProjects = await Promise.all(
      assignments.map(async (asg) => {
        const team = await getTeamById(asg.teamId);
        const event = await getEventById(asg.eventId);
        const categories = event ? await getCategoriesByEvent(event._id) : [];
        const category = categories.find((c) => c._id === team?.categoryId);

        // Check if current evaluator has already submitted an evaluation for this team
        const evalRecord = await getEvaluation(asg.teamId, evaluatorId);

        return {
          assignmentId: asg._id,
          eventId: asg.eventId,
          eventTitle: event?.title || 'Unknown Event',
          eventStatus: event?.status || 'DRAFT',
          teamId: asg.teamId,
          teamCode: team?.teamCode || 'N/A',
          title: team?.title || 'Untitled Project',
          abstract: team?.abstract || '',
          techStack: team?.techStack || '',
          tableNumber: team?.tableNumber || 'Pending Allocation',
          categoryName: category?.name || 'General',
          isEvaluated: !!evalRecord && evalRecord.isLocked,
          totalScoreGiven: evalRecord?.totalScore,
          maxScorePossible: evalRecord?.maxPossibleScore,
          submittedAt: evalRecord?.submittedAt,
        };
      })
    );

    return NextResponse.json({ assignments: assignedProjects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
