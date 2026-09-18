import { NextRequest, NextResponse } from 'next/server';
import { getMemoryStore } from '@/lib/dataStore';
import { getSessionUser, authorizeRole } from '@/lib/auth';

function escapeCSV(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const type = searchParams.get('type') || 'results';

    const store = getMemoryStore();
    const event = store.events.find((e) => e._id === eventId) || store.events[0];
    const targetEventId = event?._id;

    const teams = targetEventId
      ? store.teams.filter((t) => t.eventId === targetEventId)
      : store.teams;
    const categories = store.categories;
    const evaluations = targetEventId
      ? store.evaluations.filter((ev) => ev.eventId === targetEventId)
      : store.evaluations;

    let csvContent = '';
    let filename = `exhibition_${type}_export.csv`;

    if (type === 'results') {
      filename = `${event?.slug || 'event'}_official_results.csv`;
      // Calculate averages
      const teamScoreMap = new Map<string, { total: number; count: number }>();
      evaluations.forEach((ev) => {
        const cur = teamScoreMap.get(ev.teamId) || { total: 0, count: 0 };
        cur.total += ev.totalScore;
        cur.count += 1;
        teamScoreMap.set(ev.teamId, cur);
      });

      const ranked = teams.map((t) => {
        const s = teamScoreMap.get(t._id);
        const avg = s && s.count > 0 ? (s.total / s.count).toFixed(2) : '0.00';
        return {
          teamCode: t.teamCode,
          title: t.title,
          category: categories.find((c) => c._id === t.categoryId)?.name || 'General',
          stall: t.tableNumber || 'Unassigned',
          status: t.status,
          evaluators: s ? s.count : 0,
          averageScore: parseFloat(avg),
        };
      }).sort((a, b) => b.averageScore - a.averageScore);

      const headers = ['Rank', 'Team Code', 'Project Title', 'Category', 'Stall Number', 'Evaluators Completed', 'Average Score', 'Status'];
      const rows = ranked.map((r, idx) => [
        idx + 1,
        escapeCSV(r.teamCode),
        escapeCSV(r.title),
        escapeCSV(r.category),
        escapeCSV(r.stall),
        r.evaluators,
        r.averageScore.toFixed(2),
        escapeCSV(r.status),
      ].join(','));

      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (type === 'teams') {
      filename = `${event?.slug || 'event'}_teams_directory.csv`;
      const headers = ['Team Code', 'Project Title', 'Category', 'Stall', 'Status', 'Members Count', 'Team Members Roster', 'Tech Stack'];
      const rows = teams.map((t) => {
        const memberList = (t.members || []).map((m: any) => `${m.name} (${m.role || 'Member'}, ${m.email || ''})`).join('; ');
        const catName = categories.find((c) => c._id === t.categoryId)?.name || 'General';
        return [
          escapeCSV(t.teamCode),
          escapeCSV(t.title),
          escapeCSV(catName),
          escapeCSV(t.tableNumber || 'N/A'),
          escapeCSV(t.status),
          t.members?.length || 0,
          escapeCSV(memberList),
          escapeCSV(t.techStack || 'N/A'),
        ].join(',');
      });
      csvContent = [headers.join(','), ...rows].join('\n');
    } else if (type === 'evaluations') {
      filename = `${event?.slug || 'event'}_evaluations_audit.csv`;
      const headers = ['Evaluation ID', 'Team Code', 'Evaluator ID', 'Total Score', 'Max Score', 'Status', 'Submitted At', 'Remarks'];
      const rows = evaluations.map((ev) => {
        const team = teams.find((t) => t._id === ev.teamId);
        return [
          escapeCSV(ev._id),
          escapeCSV(team?.teamCode || ev.teamId),
          escapeCSV(ev.evaluatorId),
          ev.totalScore,
          ev.maxPossibleScore,
          escapeCSV(ev.isLocked ? 'LOCKED_FINAL' : 'DRAFT'),
          escapeCSV(ev.submittedAt || 'N/A'),
          escapeCSV(ev.generalFeedback || ''),
        ].join(',');
      });
      csvContent = [headers.join(','), ...rows].join('\n');
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
