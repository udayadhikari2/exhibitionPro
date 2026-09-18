import { NextRequest, NextResponse } from 'next/server';
import { applyCriteriaPreset, CRITERIA_PRESETS } from '@/services/criteria';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      presets: Object.keys(CRITERIA_PRESETS).map((key) => ({
        key,
        name: `${key} Competition Rubric`,
        criteriaCount: CRITERIA_PRESETS[key].length,
        totalMarks: CRITERIA_PRESETS[key].reduce((sum, item) => sum + item.maxMarks, 0),
        items: CRITERIA_PRESETS[key],
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list presets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, presetKey } = body;

    if (!eventId || !presetKey) {
      return NextResponse.json({ error: 'eventId and presetKey are required' }, { status: 400 });
    }

    const result = await applyCriteriaPreset(eventId, presetKey);
    return NextResponse.json({ success: true, message: `Loaded ${result.added} criteria`, result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to apply preset' }, { status: 500 });
  }
}
