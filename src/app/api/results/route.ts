import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, authorizeRole } from '@/lib/auth';
import { getAllEvents } from '@/services/event';
import { getOrCreateEventResult } from '@/services/result';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const events = await getAllEvents();

    const resultsSummary = await Promise.all(
      events.map(async (event: any) => {
        const eventId = event._id.toString();
        try {
          const res = await getOrCreateEventResult(eventId, user?.role);
          return {

            eventId,
            eventName: event.name,
            eventSlug: event.slug,
            eventType: event.eventType,
            eventStatus: event.status,
            resultStatus: res.status,
            publishedAt: res.publishedAt,
            approvedAt: res.approvedAt,
            approvedBy: res.approvedBy,
            totalTeams: res.totalTeams,
            totalEvaluations: res.totalEvaluations,
            topWinner: res.results?.[0]
              ? {
                  teamCode: res.results[0].teamCode,
                  teamName: res.results[0].teamName,
                  averageScore: res.results[0].averageScore,
                  percentage: res.results[0].percentage,
                }
              : null,
          };
        } catch {
          return {
            eventId,
            eventName: event.name,
            eventSlug: event.slug,
            eventType: event.eventType,
            eventStatus: event.status,
            resultStatus: 'DRAFT',
            totalTeams: 0,
            totalEvaluations: 0,
            topWinner: null,
          };
        }
      })
    );

    return NextResponse.json({ success: true, events: resultsSummary });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list results overview' },
      { status: 500 }
    );
  }
}
