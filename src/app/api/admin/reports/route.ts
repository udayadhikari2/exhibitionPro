import { NextRequest, NextResponse } from 'next/server';
import { getMemoryStore } from '@/lib/dataStore';
import { getSessionUser, authorizeRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!authorizeRole(user, ['SUPER_ADMIN', 'EVENT_ADMIN'])) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    const store = getMemoryStore();

    // Filter events
    const allEvents = store.events;
    const selectedEvent = eventId ? allEvents.find((e) => e._id === eventId) || allEvents[0] : allEvents[0];
    const targetEventId = selectedEvent?._id;

    // Filter teams & categories for target event
    const teams = targetEventId
      ? store.teams.filter((t) => t.eventId === targetEventId)
      : store.teams;

    const categories = targetEventId
      ? store.categories.filter((c) => c.eventId === targetEventId)
      : store.categories;

    const evaluations = targetEventId
      ? store.evaluations.filter((ev) => ev.eventId === targetEventId)
      : store.evaluations;

    const evaluators = store.users.filter((u) => u.role === 'EVALUATOR');

    // Calculate score map for teams
    const teamScoreMap = new Map<string, { total: number; count: number }>();
    evaluations.forEach((ev) => {
      const cur = teamScoreMap.get(ev.teamId) || { total: 0, count: 0 };
      cur.total += ev.totalScore;
      cur.count += 1;
      teamScoreMap.set(ev.teamId, cur);
    });

    const teamsWithScore = teams.map((t) => {
      const s = teamScoreMap.get(t._id);
      const avg = s && s.count > 0 ? Math.round((s.total / s.count) * 10) / 10 : 0;
      return {
        ...t,
        averageScore: avg,
        evaluatorCount: s ? s.count : 0,
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    // Categories breakdown
    const categoriesBreakdown = categories.map((cat) => {
      const catTeams = teamsWithScore.filter((t) => t.categoryId === cat._id);
      const scoredTeams = catTeams.filter((t) => t.evaluatorCount > 0);
      const avg = scoredTeams.length > 0
        ? Math.round((scoredTeams.reduce((acc, t) => acc + t.averageScore, 0) / scoredTeams.length) * 10) / 10
        : 0;
      const topScore = scoredTeams.length > 0 ? Math.max(...scoredTeams.map((t) => t.averageScore)) : 0;
      const topTeam = scoredTeams.find((t) => t.averageScore === topScore);

      return {
        categoryId: cat._id,
        categoryName: cat.name,
        totalTeams: catTeams.length,
        evaluatedTeams: scoredTeams.length,
        averageScore: avg,
        topScore,
        topProject: topTeam?.title || 'N/A',
      };
    });

    // Institutional Tally
    const institutionMap = new Map<string, {
      name: string;
      totalTeams: number;
      scores: number[];
      gold: number;
      silver: number;
      bronze: number;
    }>();

    // Assign medals per category
    categories.forEach((cat) => {
      const catRanked = teamsWithScore.filter((t) => t.categoryId === cat._id && t.averageScore > 0);
      catRanked.forEach((t, index) => {
        const instName = (t as any).institution || (t as any).members?.[0]?.gradeOrDept || 'General Academic Division';
        const inst = institutionMap.get(instName) || {
          name: instName,
          totalTeams: 0,
          scores: [] as number[],
          gold: 0,
          silver: 0,
          bronze: 0,
        };
        inst.scores.push(t.averageScore);
        if (index === 0) inst.gold += 1;
        else if (index === 1) inst.silver += 1;
        else if (index === 2) inst.bronze += 1;
        institutionMap.set(instName, inst);
      });
    });

    // Also include teams with 0 evaluations in count
    teams.forEach((t) => {
      const instName = (t as any).institution || (t as any).members?.[0]?.gradeOrDept || 'General Academic Division';
      const inst = institutionMap.get(instName) || {
        name: instName,
        totalTeams: 0,
        scores: [] as number[],
        gold: 0,
        silver: 0,
        bronze: 0,
      };
      inst.totalTeams += 1;
      institutionMap.set(instName, inst);
    });

    const institutionalTally = Array.from(institutionMap.values()).map((inst) => {
      const avg = inst.scores.length > 0
        ? Math.round((inst.scores.reduce((a, b) => a + b, 0) / inst.scores.length) * 10) / 10
        : 0;
      return {
        institution: inst.name,
        totalTeams: inst.totalTeams,
        gold: inst.gold,
        silver: inst.silver,
        bronze: inst.bronze,
        averageScore: avg,
        points: (inst.gold * 3) + (inst.silver * 2) + (inst.bronze * 1),
      };
    }).sort((a, b) => b.points - a.points || b.gold - a.gold || b.averageScore - a.averageScore);

    // Grand totals
    const approvedTeams = teams.filter((t) => t.status === 'APPROVED');
    const scoredTeamsCount = teamsWithScore.filter((t) => t.evaluatorCount > 0).length;
    const overallAvg = scoredTeamsCount > 0
      ? Math.round((teamsWithScore.reduce((a, b) => a + b.averageScore, 0) / scoredTeamsCount) * 10) / 10
      : 0;

    return NextResponse.json({
      selectedEvent,
      allEvents: allEvents.map((e) => ({ _id: e._id, title: e.title, status: e.status })),
      summary: {
        totalEvents: allEvents.length,
        totalTeams: teams.length,
        approvedTeams: approvedTeams.length,
        pendingTeams: teams.filter((t) => t.status === 'SUBMITTED' || t.status === 'PENDING_APPROVAL').length,
        totalEvaluators: evaluators.length,
        totalEvaluations: evaluations.length,
        completedEvaluations: evaluations.filter((ev) => ev.isLocked).length,
        evaluationCoverageRate: teams.length > 0 ? Math.round((scoredTeamsCount / teams.length) * 100) : 0,
        overallAverageScore: overallAvg,
      },
      categoriesBreakdown,
      institutionalTally,
      rankedTeams: teamsWithScore.slice(0, 10).map((t, idx) => ({
        rank: idx + 1,
        teamCode: t.teamCode,
        title: t.title,
        tableNumber: t.tableNumber,
        category: categories.find((c) => c._id === t.categoryId)?.name || 'General',
        averageScore: t.averageScore,
        evaluationsCount: t.evaluatorCount,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
