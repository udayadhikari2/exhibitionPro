import { NextRequest, NextResponse } from 'next/server';
import { getTeams, createTeam } from '@/services/team';
import { getEventById } from '@/services/event';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const myTeams = searchParams.get('myTeams') === 'true';

    const user = await getSessionUser();
    const createdBy = myTeams && user ? user.id : undefined;

    const teams = await getTeams({
      eventId,
      categoryId,
      status,
      search,
      createdBy,
    });

    return NextResponse.json({ teams });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Sign in required to register' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, categoryId, teamName, name } = body;

    const finalTeamName = teamName || name || body.title;
    if (!eventId || !categoryId || !finalTeamName) {
      return NextResponse.json(
        { error: 'Missing required registration fields (eventId, categoryId, teamName)' },
        { status: 400 }
      );
    }

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Exhibition/event not found' }, { status: 404 });
    }

    // Admins can create in any state, students when open or draft testing
    if (
      event.status !== 'REGISTRATION_OPEN' &&
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'EVENT_ADMIN' &&
      event.status !== 'DRAFT'
    ) {
      return NextResponse.json(
        { error: `Registration is not open for this event (current status: ${event.status})` },
        { status: 400 }
      );
    }

    const newTeam = await createTeam(
      {
        ...body,
        teamName: finalTeamName,
        teamLeader: body.teamLeader || {
          name: user.name,
          email: user.email,
          userId: user.id,
        },
      },
      user.id
    );

    return NextResponse.json({ success: true, team: newTeam }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to register team' }, { status: 500 });
  }
}
