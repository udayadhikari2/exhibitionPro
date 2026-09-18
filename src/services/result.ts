import { connectToDatabase } from '@/lib/mongodb';
import { EventResult } from '@/models/EventResult';
import { Event } from '@/models/Event';
import { Category } from '@/models/Category';
import { Team } from '@/models/Team';
import { EvaluatorAssignment } from '@/models/EvaluatorAssignment';
import { Evaluation } from '@/models/Evaluation';
import { EvaluationCriteria } from '@/models/EvaluationCriteria';
import { User } from '@/models/User';
import {
  IEventResult,
  ITeamResult,
  IEvaluatorScoreSummary,
  ResultStatus,
} from '@/types';

function getMemoryStore() {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore!;
}

// ----------------- CALCULATION HELPER -----------------
export async function computeResults(
  eventId: string,
  customTieBreakOrder?: string[]
): Promise<{
  results: ITeamResult[];
  tieBreakCriteriaOrder: string[];
  totalTeams: number;
  totalEvaluations: number;
}> {
  let event: any;
  let categories: any[] = [];
  let teams: any[] = [];
  let criteria: any[] = [];
  let assignments: any[] = [];
  let evaluations: any[] = [];
  let users: any[] = [];

  try {
    await connectToDatabase();
    event = await Event.findById(eventId).lean();
    if (!event) event = await Event.findOne({ slug: eventId }).lean();
    const actualEventId = event?._id ? event._id.toString() : eventId;

    categories = await Category.find({ eventId: actualEventId }).lean();
    teams = await Team.find({ eventId: actualEventId, status: 'APPROVED' }).lean();
    criteria = await EvaluationCriteria.find({ eventId: actualEventId, isActive: true })
      .sort({ order: 1 })
      .lean();
    assignments = await EvaluatorAssignment.find({ eventId: actualEventId }).lean();
    evaluations = await Evaluation.find({ eventId: actualEventId }).lean();
    users = await User.find({}).select('name email').lean();
  } catch {
    const store = getMemoryStore();
    event =
      (store.events || []).find((e: any) => e._id === eventId || e.slug === eventId) || null;
    const actualEventId = event?._id || eventId;

    categories = (store.categories || []).filter((c: any) => c.eventId === actualEventId);
    teams = (store.teams || []).filter(
      (t: any) => t.eventId === actualEventId && t.status === 'APPROVED'
    );
    criteria = (store.criteria || [])
      .filter((c: any) => c.eventId === actualEventId && c.isActive !== false)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    assignments = (store.assignments || []).filter((a: any) => a.eventId === actualEventId);
    evaluations = (store.evaluations || []).filter((e: any) => e.eventId === actualEventId);
    users = store.users || [];
  }

  const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]));
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u.name || u.email]));

  // Default tie break order if none provided: all active criteria ordered by their sequence
  const tieBreakCriteriaOrder =
    customTieBreakOrder && customTieBreakOrder.length > 0
      ? customTieBreakOrder
      : criteria.map((c: any) => c._id.toString());

  // Only consider locked or submitted evaluations
  const validEvaluations = evaluations.filter(
    (e: any) => e.isLocked || e.status === 'SUBMITTED'
  );

  // Determine maximum possible marks for the event (sum of criteria maxMarks)
  const eventMaxScore = criteria.reduce((sum, c) => sum + (c.maxMarks || 0), 0) || 100;

  // Process raw team results
  const rawResults: ITeamResult[] = teams.map((team: any) => {
    const teamIdStr = team._id.toString();
    const teamEvals = validEvaluations.filter((e: any) => e.teamId === teamIdStr);
    const teamAssigns = assignments.filter((a: any) => a.teamId === teamIdStr);

    let totalScoreSum = 0;
    const tieBreakCriterionSums: Record<string, number> = {};
    const tieBreakCriterionCounts: Record<string, number> = {};

    const evaluatorScores: IEvaluatorScoreSummary[] = teamEvals.map((e: any) => {
      totalScoreSum += e.totalScore || 0;

      const breakdown = (e.scores || []).map((s: any) => {
        const cId = s.criterionId?.toString();
        if (cId) {
          tieBreakCriterionSums[cId] = (tieBreakCriterionSums[cId] || 0) + (s.marks || 0);
          tieBreakCriterionCounts[cId] = (tieBreakCriterionCounts[cId] || 0) + 1;
        }
        return {
          criterionId: cId,
          criterionName: s.criterionName || '',
          marks: s.marks || 0,
        };
      });

      return {
        evaluatorId: e.evaluatorId?.toString(),
        evaluatorName: userMap.get(e.evaluatorId?.toString()) || 'Evaluator',
        totalScore: e.totalScore || 0,
        maxScore: e.maxPossibleScore || eventMaxScore,
        submittedAt: e.submittedAt ? new Date(e.submittedAt).toISOString() : undefined,
        criteriaBreakdown: breakdown,
      };
    });

    const evaluationsCount = teamEvals.length;
    const averageScore =
      evaluationsCount > 0
        ? Number((totalScoreSum / evaluationsCount).toFixed(2))
        : 0;

    const maxPossibleScore =
      teamEvals.length > 0 && teamEvals[0].maxPossibleScore
        ? teamEvals[0].maxPossibleScore
        : eventMaxScore;

    const percentage =
      maxPossibleScore > 0
        ? Number(((averageScore / maxPossibleScore) * 100).toFixed(1))
        : 0;

    const tieBreakScores: Record<string, number> = {};
    for (const [cId, sum] of Object.entries(tieBreakCriterionSums)) {
      const count = tieBreakCriterionCounts[cId] || 1;
      tieBreakScores[cId] = Number((sum / count).toFixed(2));
    }

    return {
      teamId: teamIdStr,
      teamCode: team.teamCode || 'N/A',
      teamName: team.teamName || 'Untitled Team',
      projectTitle: team.project?.title || team.title || 'Untitled Project',
      stallNumber: team.stallNumber || team.tableNumber || '',
      categoryId: team.categoryId ? team.categoryId.toString() : '',
      categoryName: categoryMap.get(team.categoryId ? team.categoryId.toString() : '') || 'General',
      evaluationsCount,
      assignedCount: teamAssigns.length,
      averageScore,
      totalScoreSum,
      maxPossibleScore,
      percentage,
      rankOverall: 0,
      rankInCategory: 0,
      isTied: false,
      tieBreakScores,
      evaluatorScores,
    };
  });

  // ----------------- TIE-BREAKING & RANKING ENGINE -----------------
  // Comparator with tie-breaking criteria chain
  const compareTeams = (a: ITeamResult, b: ITeamResult): number => {
    // Primary: Average score descending
    const scoreDiff = b.averageScore - a.averageScore;
    if (Math.abs(scoreDiff) >= 0.001) {
      return scoreDiff;
    }

    // Tie-breaking by criteria in specified priority order
    for (const critId of tieBreakCriteriaOrder) {
      const scoreA = a.tieBreakScores[critId] || 0;
      const scoreB = b.tieBreakScores[critId] || 0;
      const critDiff = scoreB - scoreA;
      if (Math.abs(critDiff) >= 0.001) {
        return critDiff;
      }
    }

    // Secondary fallback: More completed evaluations ranks higher
    if (b.evaluationsCount !== a.evaluationsCount) {
      return b.evaluationsCount - a.evaluationsCount;
    }

    return 0; // Truly tied
  };

  const areTeamsTied = (a: ITeamResult, b: ITeamResult): boolean => {
    if (Math.abs(a.averageScore - b.averageScore) >= 0.001) return false;
    for (const critId of tieBreakCriteriaOrder) {
      const scoreA = a.tieBreakScores[critId] || 0;
      const scoreB = b.tieBreakScores[critId] || 0;
      if (Math.abs(scoreA - scoreB) >= 0.001) return false;
    }
    return a.evaluationsCount === b.evaluationsCount;
  };

  // 1. Calculate Overall Ranks
  rawResults.sort(compareTeams);

  let currentRank = 1;
  for (let i = 0; i < rawResults.length; i++) {
    if (i > 0) {
      const prev = rawResults[i - 1];
      const curr = rawResults[i];
      if (areTeamsTied(prev, curr)) {
        curr.rankOverall = prev.rankOverall;
        curr.isTied = true;
        prev.isTied = true;
      } else {
        curr.rankOverall = i + 1; // Standard competition ranking (1, 1, 3)
      }
    } else {
      rawResults[0].rankOverall = currentRank;
    }
  }

  // 2. Calculate Category Ranks
  const categoryGroups: { [catId: string]: ITeamResult[] } = {};
  for (const item of rawResults) {
    if (!categoryGroups[item.categoryId]) {
      categoryGroups[item.categoryId] = [];
    }
    categoryGroups[item.categoryId].push(item);
  }

  for (const catId of Object.keys(categoryGroups)) {
    const group = categoryGroups[catId];
    group.sort(compareTeams);
    for (let i = 0; i < group.length; i++) {
      if (i > 0) {
        const prev = group[i - 1];
        const curr = group[i];
        if (areTeamsTied(prev, curr)) {
          curr.rankInCategory = prev.rankInCategory;
        } else {
          curr.rankInCategory = i + 1;
        }
      } else {
        group[0].rankInCategory = 1;
      }
    }
  }

  return {
    results: rawResults,
    tieBreakCriteriaOrder,
    totalTeams: rawResults.length,
    totalEvaluations: validEvaluations.length,
  };
}

// ----------------- RESULT STORAGE & WORKFLOW -----------------

export async function getOrCreateEventResult(
  eventId: string,
  userRole?: string
): Promise<IEventResult> {
  let doc: any = null;

  try {
    await connectToDatabase();
    doc = await EventResult.findOne({ eventId }).lean();
  } catch {
    const store = getMemoryStore();
    doc = (store.eventResults || []).find((r: any) => r.eventId === eventId) || null;
  }

  if (!doc) {
    // Generate initial DRAFT results
    const computed = await computeResults(eventId);
    const newResult: IEventResult = {
      eventId,
      status: 'DRAFT',
      tieBreakCriteriaOrder: computed.tieBreakCriteriaOrder,
      results: computed.results,
      totalTeams: computed.totalTeams,
      totalEvaluations: computed.totalEvaluations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await connectToDatabase();
      const savedDoc = await EventResult.create(newResult);
      doc = savedDoc.toObject();
    } catch {
      const store = getMemoryStore();
      if (!store.eventResults) store.eventResults = [];
      newResult._id = `res_${Date.now()}`;
      store.eventResults.push(newResult);
      doc = newResult;
    }
  }

  // Filter confidentiality if not admin
  return sanitizeResultForRole(doc, userRole);
}

export async function recalculateEventResults(
  eventId: string,
  tieBreakOrder?: string[]
): Promise<IEventResult> {
  const computed = await computeResults(eventId, tieBreakOrder);

  let existing: any = null;
  try {
    await connectToDatabase();
    existing = await EventResult.findOne({ eventId });
  } catch {
    const store = getMemoryStore();
    existing = (store.eventResults || []).find((r: any) => r.eventId === eventId);
  }

  const currentStatus: ResultStatus = existing?.status || 'DRAFT';
  const finalOrder = tieBreakOrder || existing?.tieBreakCriteriaOrder || computed.tieBreakCriteriaOrder;

  const updateData = {
    eventId,
    status: currentStatus,
    tieBreakCriteriaOrder: finalOrder,
    results: computed.results,
    totalTeams: computed.totalTeams,
    totalEvaluations: computed.totalEvaluations,
    updatedAt: new Date(),
  };

  try {
    await connectToDatabase();
    const updated = await EventResult.findOneAndUpdate(
      { eventId },
      { $set: updateData },
      { new: true, upsert: true }
    ).lean();
    return updated as unknown as IEventResult;
  } catch {
    const store = getMemoryStore();
    if (!store.eventResults) store.eventResults = [];
    const idx = store.eventResults.findIndex((r) => r.eventId === eventId);
    const saved: IEventResult = {
      ...updateData,
      _id: existing?._id || `res_${Date.now()}`,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (idx !== -1) {
      store.eventResults[idx] = saved;
    } else {
      store.eventResults.push(saved);
    }
    return saved;
  }
}

export async function updateResultStatus(
  eventId: string,
  targetStatus: ResultStatus,
  adminUser?: { id: string; name: string }
): Promise<{ success: boolean; result?: IEventResult; error?: string }> {
  // Validate allowed status flow
  const allowedTransitions: Record<ResultStatus, ResultStatus[]> = {
    DRAFT: ['REVIEW'],
    REVIEW: ['DRAFT', 'APPROVED'],
    APPROVED: ['REVIEW', 'PUBLISHED'],
    PUBLISHED: ['APPROVED'], // Allow rollback to APPROVED if urgent correction needed
  };

  let currentDoc: any = null;
  try {
    await connectToDatabase();
    currentDoc = await EventResult.findOne({ eventId });
  } catch {
    const store = getMemoryStore();
    currentDoc = (store.eventResults || []).find((r: any) => r.eventId === eventId);
  }

  if (!currentDoc) {
    // If doesn't exist yet, compute draft first
    await recalculateEventResults(eventId);
    return updateResultStatus(eventId, targetStatus, adminUser);
  }

  const currentStatus: ResultStatus = currentDoc.status || 'DRAFT';
  const allowed = allowedTransitions[currentStatus] || [];

  if (!allowed.includes(targetStatus)) {
    return {
      success: false,
      error: `Invalid transition from ${currentStatus} to ${targetStatus}. Allowed: ${allowed.join(', ')}`,
    };
  }

  const updateFields: any = {
    status: targetStatus,
    updatedAt: new Date(),
  };

  if (targetStatus === 'APPROVED') {
    updateFields.approvedAt = new Date();
    updateFields.approvedBy = adminUser?.name || 'Authorized Admin';
  } else if (targetStatus === 'PUBLISHED') {
    updateFields.publishedAt = new Date();
    // Also update Event document status to RESULT_PUBLISHED
    try {
      await connectToDatabase();
      await Event.findByIdAndUpdate(eventId, { status: 'RESULT_PUBLISHED' });
    } catch {
      const store = getMemoryStore();
      const evt = (store.events || []).find((e: any) => e._id === eventId);
      if (evt) evt.status = 'RESULT_PUBLISHED';
    }
  }

  try {
    await connectToDatabase();
    const updated = await EventResult.findOneAndUpdate(
      { eventId },
      { $set: updateFields },
      { new: true }
    ).lean();
    return { success: true, result: updated as unknown as IEventResult };
  } catch {
    const store = getMemoryStore();
    const idx = (store.eventResults || []).findIndex((r) => r.eventId === eventId);
    if (idx !== -1) {
      store.eventResults[idx] = {
        ...store.eventResults[idx],
        ...updateFields,
        approvedAt: updateFields.approvedAt?.toISOString?.() || store.eventResults[idx].approvedAt,
        publishedAt: updateFields.publishedAt?.toISOString?.() || store.eventResults[idx].publishedAt,
      };
      return { success: true, result: store.eventResults[idx] };
    }
    return { success: false, error: 'Result record not found' };
  }
}

// ----------------- SANITIZATION & CONFIDENTIALITY -----------------

export function sanitizeResultForRole(result: IEventResult, userRole?: string): IEventResult {
  const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'EVENT_ADMIN';

  if (isAdmin) {
    return result;
  }

  // Public/Student/Evaluator role:
  // Must NOT expose individual evaluator scores or judge identity breakdowns
  const sanitizedTeams: ITeamResult[] = (result.results || []).map((t) => {
    const { evaluatorScores, ...rest } = t;
    return {
      ...rest,
      evaluatorScores: undefined,
    };
  });

  return {
    ...result,
    results: sanitizedTeams,
  };
}

// ----------------- PUBLIC LEADERBOARD -----------------

export async function getPublicEventResults(slugOrId: string): Promise<{
  isPublished: boolean;
  event?: any;
  result?: IEventResult;
  message?: string;
}> {
  let event: any = null;
  try {
    await connectToDatabase();
    event = await Event.findOne({ $or: [{ _id: slugOrId }, { slug: slugOrId }] }).lean();
  } catch {
    const store = getMemoryStore();
    event =
      (store.events || []).find((e: any) => e._id === slugOrId || e.slug === slugOrId) || null;
  }

  if (!event) {
    return { isPublished: false, message: 'Event not found' };
  }

  const eventId = event._id.toString();
  let resultDoc: any = null;

  try {
    await connectToDatabase();
    resultDoc = await EventResult.findOne({ eventId }).lean();
  } catch {
    const store = getMemoryStore();
    resultDoc = (store.eventResults || []).find((r: any) => r.eventId === eventId) || null;
  }

  if (!resultDoc || resultDoc.status !== 'PUBLISHED') {
    return {
      isPublished: false,
      event: {
        _id: event._id,
        name: event.name,
        slug: event.slug,
        eventType: event.eventType,
        status: event.status,
      },
      message: 'Official results for this event have not been published yet.',
    };
  }

  const sanitized = sanitizeResultForRole(resultDoc as IEventResult, 'PUBLIC');

  return {
    isPublished: true,
    event: {
      _id: event._id,
      name: event.name,
      slug: event.slug,
      eventType: event.eventType,
      venue: event.venue,
      status: event.status,
    },
    result: sanitized,
  };
}
