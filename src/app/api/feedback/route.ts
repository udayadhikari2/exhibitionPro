import { NextRequest, NextResponse } from 'next/server';
import { submitVisitorFeedback, getFeedbackByTeam, getFeedbackByEvent, getTeamById } from '@/lib/dataStore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const eventId = searchParams.get('eventId');

    if (teamId) {
      const feedback = await getFeedbackByTeam(teamId);
      return NextResponse.json({ feedback });
    }

    if (eventId) {
      const feedback = await getFeedbackByEvent(eventId);
      return NextResponse.json({ feedback });
    }

    return NextResponse.json({ error: 'teamId or eventId required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { teamId, visitorName, visitorType, rating, comments } = await req.json();

    if (!teamId || !rating || !comments || !visitorName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const fb = await submitVisitorFeedback({
      eventId: team.eventId,
      teamId,
      visitorName,
      visitorType: visitorType || 'Visitor',
      rating: Number(rating),
      comments,
    });

    return NextResponse.json({ success: true, feedback: fb }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
