import { connectToDatabase } from '@/lib/mongodb';
import { Evaluation } from '@/models/Evaluation';
import { EvaluatorAssignment } from '@/models/EvaluatorAssignment';
import { Team } from '@/models/Team';
import { Event } from '@/models/Event';
import { Category } from '@/models/Category';
import { User } from '@/models/User';
import { getCriteria } from '@/services/criteria';
import { IEvaluation, ICriterionScore, ITeam, IEvaluationCriterion } from '@/types';

function getMemoryStore() {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore!;
}

// ----------------- EVALUATOR DASHBOARD -----------------
export async function getEvaluatorDashboard(evaluatorId: string) {
  try {
    await connectToDatabase();

    const assignments = await EvaluatorAssignment.find({ evaluatorId }).lean();
    const eventIds = Array.from(new Set(assignments.map((a: any) => a.eventId)));
    const events = await Event.find({ _id: { $in: eventIds } }).lean();

    const evaluations = await Evaluation.find({ evaluatorId }).lean();
    const completed = evaluations.filter((e: any) => e.status === 'SUBMITTED' || e.isLocked).length;

    // Fetch recent 5 assignments with team info
    const teamIds = assignments.slice(0, 5).map((a: any) => a.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t: any) => [t._id.toString(), t]));

    const recentAssignments = assignments.slice(0, 5).map((a: any) => {
      const team: any = teamMap.get(a.teamId);
      const evalRecord = evaluations.find((e: any) => e.teamId === a.teamId);
      return {
        _id: a._id.toString(),
        teamId: a.teamId,
        teamCode: team?.teamCode || 'N/A',
        teamName: team?.teamName || 'N/A',
        projectTitle: team?.project?.title || team?.title || 'Untitled',
        stallNumber: team?.stallNumber || team?.tableNumber || '',
        status: evalRecord?.status === 'SUBMITTED' ? 'COMPLETED' : evalRecord?.status === 'DRAFT' ? 'DRAFT' : 'PENDING',
      };
    });

    return {
      activeEventsCount: events.length,
      assignedCount: assignments.length,
      completedCount: completed,
      pendingCount: assignments.length - completed,
      recentAssignments,
    };
  } catch {
    const store = getMemoryStore();
    const assignments = (store.assignments || []).filter((a: any) => a.evaluatorId === evaluatorId);
    const eventIds = Array.from(new Set(assignments.map((a: any) => a.eventId)));

    const evaluations = (store.evaluations || []).filter((e: any) => e.evaluatorId === evaluatorId);
    const completed = evaluations.filter((e: any) => e.isLocked).length;

    const recentAssignments = assignments.slice(0, 5).map((a: any) => {
      const team = store.teams.find((t: any) => t._id === a.teamId);
      const evalRecord = evaluations.find((e: any) => e.teamId === a.teamId);
      return {
        _id: a._id,
        teamId: a.teamId,
        teamCode: team?.teamCode || 'N/A',
        teamName: team?.teamName || 'N/A',
        projectTitle: team?.project?.title || team?.title || 'Untitled',
        stallNumber: team?.stallNumber || team?.tableNumber || '',
        status: evalRecord?.isLocked ? 'COMPLETED' : evalRecord ? 'DRAFT' : 'PENDING',
      };
    });

    return {
      activeEventsCount: eventIds.length,
      assignedCount: assignments.length,
      completedCount: completed,
      pendingCount: assignments.length - completed,
      recentAssignments,
    };
  }
}

// ----------------- ASSIGNED PROJECTS FOR EVALUATOR -----------------
export async function getAssignedProjectsForEvaluator(
  evaluatorId: string,
  filters?: {
    eventId?: string;
    categoryId?: string;
    status?: string;
  }
) {
  try {
    await connectToDatabase();

    const asgQuery: any = { evaluatorId };
    if (filters?.eventId && filters.eventId !== 'ALL') asgQuery.eventId = filters.eventId;

    const assignments = await EvaluatorAssignment.find(asgQuery).lean();
    const teamIds = assignments.map((a: any) => a.teamId);

    const teamQuery: any = { _id: { $in: teamIds } };
    if (filters?.categoryId && filters.categoryId !== 'ALL') teamQuery.categoryId = filters.categoryId;

    const [teams, categories, events, evaluations] = await Promise.all([
      Team.find(teamQuery).lean(),
      Category.find().lean(),
      Event.find().lean(),
      Evaluation.find({ evaluatorId, teamId: { $in: teamIds } }).lean(),
    ]);

    const catMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]));
    const evtMap = new Map(events.map((e: any) => [e._id.toString(), e.name]));
    const evalMap = new Map(evaluations.map((e: any) => [e.teamId, e]));

    let results = teams.map((team: any) => {
      const evalRecord: any = evalMap.get(team._id.toString());
      let evalStatus: 'PENDING' | 'DRAFT' | 'COMPLETED' = 'PENDING';
      if (evalRecord?.isLocked || evalRecord?.status === 'SUBMITTED') {
        evalStatus = 'COMPLETED';
      } else if (evalRecord?.status === 'DRAFT') {
        evalStatus = 'DRAFT';
      }

      return {
        _id: team._id.toString(),
        teamCode: team.teamCode,
        teamName: team.teamName,
        title: team.project?.title || team.title || 'Untitled Project',
        shortDescription: team.project?.shortDescription || team.abstract || '',
        categoryName: catMap.get(team.categoryId) || 'General',
        categoryId: team.categoryId,
        eventName: evtMap.get(team.eventId) || 'Exhibition',
        eventId: team.eventId,
        stallNumber: team.stallNumber || team.tableNumber || '',
        school: team.school || team.institution || '',
        grade: team.class || team.grade || '',
        membersCount: team.members?.length || 1,
        evalStatus,
        totalScore: evalRecord?.totalScore ?? null,
        maxPossibleScore: evalRecord?.maxPossibleScore ?? null,
        submittedAt: evalRecord?.submittedAt ? evalRecord.submittedAt.toISOString() : null,
      };
    });

    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter((r) => r.evalStatus === filters.status);
    }

    return results;
  } catch {
    const store = getMemoryStore();
    let asgs = (store.assignments || []).filter((a: any) => a.evaluatorId === evaluatorId);
    if (filters?.eventId && filters.eventId !== 'ALL') {
      asgs = asgs.filter((a: any) => a.eventId === filters.eventId);
    }

    const teamIds = new Set(asgs.map((a: any) => a.teamId));
    let teams = (store.teams || []).filter((t: any) => teamIds.has(t._id));

    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      teams = teams.filter((t: any) => t.categoryId === filters.categoryId);
    }

    const catMap = new Map((store.categories || []).map((c: any) => [c._id, c.name]));
    const evtMap = new Map((store.events || []).map((e: any) => [e._id, e.name]));
    const evals = (store.evaluations || []).filter((e: any) => e.evaluatorId === evaluatorId);
    const evalMap = new Map(evals.map((e: any) => [e.teamId, e]));

    let results = teams.map((team: any) => {
      const evalRecord: any = evalMap.get(team._id);
      let evalStatus: 'PENDING' | 'DRAFT' | 'COMPLETED' = 'PENDING';
      if (evalRecord?.isLocked) {
        evalStatus = 'COMPLETED';
      } else if (evalRecord) {
        evalStatus = 'DRAFT';
      }

      return {
        _id: team._id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        title: team.project?.title || team.title || 'Untitled Project',
        shortDescription: team.project?.shortDescription || team.abstract || '',
        categoryName: catMap.get(team.categoryId) || 'General',
        categoryId: team.categoryId,
        eventName: evtMap.get(team.eventId) || 'Exhibition',
        eventId: team.eventId,
        stallNumber: team.stallNumber || team.tableNumber || '',
        school: team.school || team.institution || '',
        grade: team.class || team.grade || '',
        membersCount: team.members?.length || 1,
        evalStatus,
        totalScore: evalRecord?.totalScore ?? null,
        maxPossibleScore: evalRecord?.maxPossibleScore ?? null,
        submittedAt: evalRecord?.submittedAt || null,
      };
    });

    if (filters?.status && filters.status !== 'ALL') {
      results = results.filter((r) => r.evalStatus === filters.status);
    }

    return results;
  }
}

// ----------------- GET PROJECT EVALUATION & STRICT AUTH -----------------
export async function getProjectEvaluation(evaluatorId: string, teamId: string) {
  // CRITICAL SECURITY: Verify evaluator assignment
  let isAssigned = false;
  let eventId = '';

  try {
    await connectToDatabase();
    const asg: any = await EvaluatorAssignment.findOne({ evaluatorId, teamId }).lean();
    if (asg) {

      isAssigned = true;
      eventId = asg.eventId;
    }
  } catch {
    const store = getMemoryStore();
    const asg = (store.assignments || []).find((a: any) => a.evaluatorId === evaluatorId && a.teamId === teamId);
    if (asg) {
      isAssigned = true;
      eventId = asg.eventId;
    }
  }

  if (!isAssigned) {
    const err: any = new Error('Forbidden: You are not assigned to evaluate this project');
    err.statusCode = 403;
    throw err;
  }

  // Fetch Team
  let team: any = null;
  try {
    await connectToDatabase();
    team = await Team.findById(teamId).lean();
  } catch {
    const store = getMemoryStore();
    team = store.teams.find((t: any) => t._id === teamId);
  }

  if (!team) {
    const err: any = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  // Fetch Category & Event
  let categoryName = 'General';
  let eventName = 'Exhibition';
  try {
    await connectToDatabase();
    const [cat, evt] = await Promise.all([
      team.categoryId ? Category.findById(team.categoryId).lean() : null,
      Event.findById(team.eventId).lean(),
    ]);
    if (cat) categoryName = (cat as any).name;
    if (evt) eventName = (evt as any).name;
  } catch {
    const store = getMemoryStore();
    const cat = store.categories.find((c: any) => c._id === team.categoryId);
    const evt = store.events.find((e: any) => e._id === team.eventId);
    if (cat) categoryName = cat.name;
    if (evt) eventName = evt.name;
  }

  // Fetch Dynamic Criteria for this event & category
  const { criteria, totalMaxMarks } = await getCriteria(team.eventId, team.categoryId);

  // Fetch Evaluation for THIS evaluator only (ZERO Peer Mark Exposure)
  let evaluation: any = null;
  try {
    await connectToDatabase();
    evaluation = await Evaluation.findOne({ evaluatorId, teamId }).lean();
  } catch {
    const store = getMemoryStore();
    evaluation = (store.evaluations || []).find((e: any) => e.evaluatorId === evaluatorId && e.teamId === teamId);
  }

  return {
    project: {
      _id: team._id.toString ? team._id.toString() : team._id,
      teamCode: team.teamCode,
      teamName: team.teamName,
      title: team.project?.title || team.title || 'Untitled Project',
      shortDescription: team.project?.shortDescription || team.abstract || '',
      problemStatement: team.project?.problemStatement || '',
      objectives: team.project?.objectives || '',
      methodology: team.project?.methodology || '',
      innovation: team.project?.innovation || '',
      materials: team.project?.materials || '',
      technologyUsed: team.project?.technologyUsed || team.techStack || '',
      files: team.project?.files || [],
      stallNumber: team.stallNumber || team.tableNumber || '',
      school: team.school || team.institution || '',
      grade: team.class || team.grade || '',
      section: team.section || '',
      mentor: team.mentor?.name || team.mentor || '',
      members: team.members || [],
      categoryName,
      eventName,
      eventId: team.eventId,
    },
    criteria: criteria.filter((c) => c.status !== 'INACTIVE'),
    totalMaxMarks,
    evaluation: evaluation
      ? {
          _id: evaluation._id.toString ? evaluation._id.toString() : evaluation._id,
          status: evaluation.status || (evaluation.isLocked ? 'SUBMITTED' : 'DRAFT'),
          scores: evaluation.scores || [],
          totalScore: evaluation.totalScore || 0,
          maxPossibleScore: evaluation.maxPossibleScore || totalMaxMarks,
          generalFeedback: evaluation.generalFeedback || evaluation.comments || '',
          isLocked: Boolean(evaluation.isLocked),
          submittedAt: evaluation.submittedAt ? evaluation.submittedAt.toISOString ? evaluation.submittedAt.toISOString() : evaluation.submittedAt : null,
        }
      : null,
  };
}

// ----------------- SAVE DRAFT EVALUATION -----------------
export async function saveEvaluationDraft(
  evaluatorId: string,
  data: {
    teamId: string;
    scores: { criterionId: string; marks: number; comment?: string }[];
    comments?: string;
    ip?: string;
    userAgent?: string;
  }
) {
  // 1. Verify assignment
  let eventId = '';
  try {
    await connectToDatabase();
    const asg: any = await EvaluatorAssignment.findOne({ evaluatorId, teamId: data.teamId }).lean();
    if (!asg) {
      const err: any = new Error('Forbidden: You are not assigned to evaluate this project');
      err.statusCode = 403;
      throw err;
    }
    eventId = asg.eventId;

  } catch (e: any) {
    if (e.statusCode === 403) throw e;
    const store = getMemoryStore();
    const asg = (store.assignments || []).find((a: any) => a.evaluatorId === evaluatorId && a.teamId === data.teamId);
    if (!asg) {
      const err: any = new Error('Forbidden: You are not assigned to evaluate this project');
      err.statusCode = 403;
      throw err;
    }
    eventId = asg.eventId;
  }

  // 2. Fetch Criteria to populate criterion names
  const { criteria, totalMaxMarks } = await getCriteria(eventId);
  const critMap = new Map(criteria.map((c) => [c._id, c]));

  let totalScore = 0;
  const validatedScores = data.scores.map((s) => {
    const crit = critMap.get(s.criterionId);
    const marks = Number(s.marks) || 0;
    totalScore += marks;
    return {
      criterionId: s.criterionId,
      criterionName: crit?.name || 'Criterion',
      marks,
      maxMarks: crit?.maxMarks || 20,
      comment: s.comment || '',
    };
  });

  try {
    await connectToDatabase();
    const existing = await Evaluation.findOne({ evaluatorId, teamId: data.teamId });
    if (existing && existing.isLocked) {
      const err: any = new Error('This evaluation is locked and submitted. Contact administrator to unlock.');
      err.statusCode = 400;
      throw err;
    }

    const draft = await Evaluation.findOneAndUpdate(
      { evaluatorId, teamId: data.teamId },
      {
        eventId,
        evaluatorId,
        teamId: data.teamId,
        status: 'DRAFT',
        scores: validatedScores,
        totalScore,
        maxPossibleScore: totalMaxMarks,
        generalFeedback: data.comments || '',
        isLocked: false,
      },
      { upsert: true, new: true }
    );

    // Update EvaluatorAssignment to IN_PROGRESS
    await EvaluatorAssignment.findOneAndUpdate(
      { evaluatorId, teamId: data.teamId },
      { status: 'IN_PROGRESS' }
    );

    return draft;
  } catch (err: any) {
    if (err.statusCode) throw err;
    const store = getMemoryStore();
    const existingIdx = (store.evaluations || []).findIndex(
      (e: any) => e.evaluatorId === evaluatorId && e.teamId === data.teamId
    );

    if (existingIdx !== -1 && store.evaluations[existingIdx].isLocked) {
      const e: any = new Error('Evaluation is locked and submitted');
      e.statusCode = 400;
      throw e;
    }

    const draftRecord: any = {
      _id: existingIdx !== -1 ? store.evaluations[existingIdx]._id : `eval_${Date.now()}`,
      eventId,
      evaluatorId,
      teamId: data.teamId,
      status: 'DRAFT',
      scores: validatedScores,
      totalScore,
      maxPossibleScore: totalMaxMarks,
      generalFeedback: data.comments || '',
      isLocked: false,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      store.evaluations[existingIdx] = draftRecord;
    } else {
      store.evaluations.push(draftRecord);
    }

    // Update assignment status
    const asg = (store.assignments || []).find((a: any) => a.evaluatorId === evaluatorId && a.teamId === data.teamId);
    if (asg) asg.status = 'IN_PROGRESS';

    return draftRecord;
  }
}

// ----------------- SUBMIT FINAL EVALUATION & LOCK -----------------
export async function submitEvaluation(
  evaluatorId: string,
  data: {
    teamId: string;
    scores: { criterionId: string; marks: number; comment?: string }[];
    comments?: string;
    ip?: string;
    userAgent?: string;
  }
) {
  // 1. Verify assignment
  let eventId = '';
  try {
    await connectToDatabase();
    const asg: any = await EvaluatorAssignment.findOne({ evaluatorId, teamId: data.teamId }).lean();
    if (!asg) {
      const err: any = new Error('Forbidden: You are not assigned to evaluate this project');
      err.statusCode = 403;
      throw err;
    }
    eventId = asg.eventId;

  } catch (e: any) {
    if (e.statusCode === 403) throw e;
    const store = getMemoryStore();
    const asg = (store.assignments || []).find((a: any) => a.evaluatorId === evaluatorId && a.teamId === data.teamId);
    if (!asg) {
      const err: any = new Error('Forbidden: You are not assigned to evaluate this project');
      err.statusCode = 403;
      throw err;
    }
    eventId = asg.eventId;
  }

  // 2. Fetch Team and Criteria to strictly enforce bounds
  let team: any = null;
  try {
    await connectToDatabase();
    team = await Team.findById(data.teamId).lean();
  } catch {
    const store = getMemoryStore();
    team = store.teams.find((t: any) => t._id === data.teamId);
  }

  const { criteria, totalMaxMarks } = await getCriteria(eventId, team?.categoryId);
  const critMap = new Map(criteria.map((c) => [c._id, c]));

  let totalScore = 0;
  const validatedScores = [];

  for (const s of data.scores) {
    const crit = critMap.get(s.criterionId);
    if (!crit) {
      const err: any = new Error(`Invalid criterion ID: ${s.criterionId}`);
      err.statusCode = 400;
      throw err;
    }

    const marks = Number(s.marks);
    if (isNaN(marks)) {
      const err: any = new Error(`Marks for "${crit.name}" must be a valid number`);
      err.statusCode = 400;
      throw err;
    }
    if (marks > crit.maxMarks) {
      const err: any = new Error(
        `Marks for "${crit.name}" (${marks}) cannot exceed maximum allowed (${crit.maxMarks})`
      );
      err.statusCode = 400;
      throw err;
    }
    if (marks < (crit.minMarks ?? 0)) {
      const err: any = new Error(
        `Marks for "${crit.name}" (${marks}) cannot be less than minimum (${crit.minMarks ?? 0})`
      );
      err.statusCode = 400;
      throw err;
    }

    totalScore += marks;
    validatedScores.push({
      criterionId: s.criterionId,
      criterionName: crit.name,
      marks,
      maxMarks: crit.maxMarks,
      comment: s.comment || '',
    });
  }

  // Ensure mandatory criteria are answered
  const mandatoryCriteria = criteria.filter((c) => c.status !== 'INACTIVE' && (c.required ?? c.isRequired ?? true));
  const scoredCritIds = new Set(data.scores.map((s) => s.criterionId));
  for (const m of mandatoryCriteria) {
    if (!scoredCritIds.has(m._id)) {
      const err: any = new Error(`Mandatory criterion "${m.name}" must be scored before submitting`);
      err.statusCode = 400;
      throw err;
    }
  }

  const auditEntry = {
    action: 'SUBMISSION_FINALIZED',
    timestamp: new Date(),
    ip: data.ip,
    userAgent: data.userAgent,
  };

  try {
    await connectToDatabase();
    const existing = await Evaluation.findOne({ evaluatorId, teamId: data.teamId });
    if (existing && existing.isLocked) {
      const err: any = new Error('This evaluation is already submitted and locked.');
      err.statusCode = 400;
      throw err;
    }

    const evaluation = await Evaluation.findOneAndUpdate(
      { evaluatorId, teamId: data.teamId },
      {
        eventId,
        evaluatorId,
        teamId: data.teamId,
        status: 'SUBMITTED',
        scores: validatedScores,
        totalScore,
        maxPossibleScore: totalMaxMarks,
        generalFeedback: data.comments || '',
        isLocked: true,
        submittedAt: new Date(),
        $push: { auditTrail: auditEntry },
      },
      { upsert: true, new: true }
    );

    // Update EvaluatorAssignment to COMPLETED
    await EvaluatorAssignment.findOneAndUpdate(
      { evaluatorId, teamId: data.teamId },
      { status: 'COMPLETED' }
    );

    return evaluation;
  } catch (err: any) {
    if (err.statusCode) throw err;
    const store = getMemoryStore();
    const existingIdx = (store.evaluations || []).findIndex(
      (e: any) => e.evaluatorId === evaluatorId && e.teamId === data.teamId
    );

    if (existingIdx !== -1 && store.evaluations[existingIdx].isLocked) {
      const e: any = new Error('This evaluation is already submitted and locked.');
      e.statusCode = 400;
      throw e;
    }

    const evalRecord: any = {
      _id: existingIdx !== -1 ? store.evaluations[existingIdx]._id : `eval_${Date.now()}`,
      eventId,
      evaluatorId,
      teamId: data.teamId,
      status: 'SUBMITTED',
      scores: validatedScores,
      totalScore,
      maxPossibleScore: totalMaxMarks,
      generalFeedback: data.comments || '',
      isLocked: true,
      submittedAt: new Date().toISOString(),
      auditTrail: [auditEntry],
    };

    if (existingIdx !== -1) {
      store.evaluations[existingIdx] = evalRecord;
    } else {
      store.evaluations.push(evalRecord);
    }

    const asg = (store.assignments || []).find((a: any) => a.evaluatorId === evaluatorId && a.teamId === data.teamId);
    if (asg) asg.status = 'COMPLETED';

    return evalRecord;
  }
}

// ----------------- ADMIN EVALUATION MONITORING -----------------
export async function getAdminEvaluationOverview(eventId: string, categoryId?: string) {
  try {
    await connectToDatabase();

    const teamQuery: any = { eventId };
    if (categoryId && categoryId !== 'ALL') teamQuery.categoryId = categoryId;

    const [teams, categories, assignments, evaluations, users] = await Promise.all([
      Team.find(teamQuery).sort({ teamCode: 1 }).lean(),
      Category.find({ eventId }).lean(),
      EvaluatorAssignment.find({ eventId }).lean(),
      Evaluation.find({ eventId }).lean(),
      User.find({ role: 'EVALUATOR' }).lean(),
    ]);

    const catMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]));
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const projectProgress = teams.map((team: any) => {
      const teamAsgs = assignments.filter((a: any) => a.teamId === team._id.toString());
      const teamEvals = evaluations.filter((e: any) => e.teamId === team._id.toString());

      const evaluatorsList = teamAsgs.map((asg: any) => {
        const evaluator = userMap.get(asg.evaluatorId);
        const evalRecord: any = teamEvals.find((e: any) => e.evaluatorId === asg.evaluatorId);


        return {
          assignmentId: asg._id.toString(),
          evaluatorId: asg.evaluatorId,
          evaluatorName: evaluator ? (evaluator as any).name : 'Judge',
          status: evalRecord?.isLocked ? 'SUBMITTED' : evalRecord ? 'DRAFT' : 'PENDING',
          evaluationId: evalRecord ? evalRecord._id.toString() : null,
          totalScore: evalRecord ? evalRecord.totalScore : null,
          maxPossibleScore: evalRecord ? evalRecord.maxPossibleScore : null,
          submittedAt: evalRecord?.submittedAt ? evalRecord.submittedAt.toISOString() : null,
          isLocked: Boolean(evalRecord?.isLocked),
        };
      });

      const completedCount = evaluatorsList.filter((ev) => ev.status === 'SUBMITTED').length;
      const submittedScores = evaluatorsList
        .filter((ev) => ev.status === 'SUBMITTED' && ev.totalScore !== null)
        .map((ev) => ev.totalScore!);

      const averageScore =
        submittedScores.length > 0
          ? Number((submittedScores.reduce((a, b) => a + b, 0) / submittedScores.length).toFixed(1))
          : null;

      return {
        teamId: team._id.toString(),
        teamCode: team.teamCode,
        teamName: team.teamName,
        title: team.project?.title || team.title || 'Untitled Project',
        stallNumber: team.stallNumber || team.tableNumber || '',
        categoryName: catMap.get(team.categoryId) || 'General',
        totalAssigned: teamAsgs.length,
        completedCount,
        pendingCount: teamAsgs.length - completedCount,
        averageScore,
        evaluators: evaluatorsList,
      };
    });

    const totalAssignedSlots = assignments.length;
    const totalSubmittedReviews = evaluations.filter((e: any) => e.isLocked).length;

    return {
      totalProjects: teams.length,
      totalAssignedSlots,
      totalSubmittedReviews,
      pendingReviews: totalAssignedSlots - totalSubmittedReviews,
      projects: projectProgress,
    };
  } catch {
    const store = getMemoryStore();
    let teams = store.teams.filter((t: any) => t.eventId === eventId);
    if (categoryId && categoryId !== 'ALL') {
      teams = teams.filter((t: any) => t.categoryId === categoryId);
    }

    const catMap = new Map((store.categories || []).map((c: any) => [c._id, c.name]));
    const asgs = (store.assignments || []).filter((a: any) => a.eventId === eventId);
    const evals = (store.evaluations || []).filter((e: any) => e.eventId === eventId);

    const projectProgress = teams.map((team: any) => {
      const teamAsgs = asgs.filter((a: any) => a.teamId === team._id);
      const evaluatorsList = teamAsgs.map((asg: any) => {
        const user = store.users.find((u: any) => u._id === asg.evaluatorId);
        const evalRecord = evals.find((e: any) => e.evaluatorId === asg.evaluatorId && e.teamId === team._id);

        return {
          assignmentId: asg._id,
          evaluatorId: asg.evaluatorId,
          evaluatorName: user?.name || 'Judge',
          status: evalRecord?.isLocked ? 'SUBMITTED' : evalRecord ? 'DRAFT' : 'PENDING',
          evaluationId: evalRecord?._id || null,
          totalScore: evalRecord?.totalScore ?? null,
          maxPossibleScore: evalRecord?.maxPossibleScore ?? null,
          submittedAt: evalRecord?.submittedAt || null,
          isLocked: Boolean(evalRecord?.isLocked),
        };
      });

      const completedCount = evaluatorsList.filter((ev) => ev.status === 'SUBMITTED').length;
      const submittedScores = evaluatorsList
        .filter((ev) => ev.status === 'SUBMITTED' && ev.totalScore !== null)
        .map((ev) => ev.totalScore!);

      const averageScore =
        submittedScores.length > 0
          ? Number((submittedScores.reduce((a, b) => a + b, 0) / submittedScores.length).toFixed(1))
          : null;

      return {
        teamId: team._id,
        teamCode: team.teamCode,
        teamName: team.teamName,
        title: team.project?.title || team.title || 'Untitled Project',
        stallNumber: team.stallNumber || team.tableNumber || '',
        categoryName: catMap.get(team.categoryId) || 'General',
        totalAssigned: teamAsgs.length,
        completedCount,
        pendingCount: teamAsgs.length - completedCount,
        averageScore,
        evaluators: evaluatorsList,
      };
    });

    const totalAssignedSlots = asgs.length;
    const totalSubmittedReviews = evals.filter((e: any) => e.isLocked).length;

    return {
      totalProjects: teams.length,
      totalAssignedSlots,
      totalSubmittedReviews,
      pendingReviews: totalAssignedSlots - totalSubmittedReviews,
      projects: projectProgress,
    };
  }
}

// ----------------- ADMIN UNLOCK EVALUATION -----------------
export async function adminUnlockEvaluation(
  evaluationId: string,
  adminUser: { id: string; name: string },
  reason?: string
) {
  const auditEntry = {
    action: 'ADMIN_UNLOCKED',
    timestamp: new Date(),
    userId: adminUser.id,
    userName: adminUser.name,
    reason: reason || 'Unlocked by administrator for scoring revisions',
  };

  try {
    await connectToDatabase();
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      throw new Error('Evaluation record not found');
    }

    evaluation.isLocked = false;
    evaluation.status = 'DRAFT';
    evaluation.auditTrail.push(auditEntry as any);
    await evaluation.save();

    // Revert assignment status to IN_PROGRESS
    await EvaluatorAssignment.findOneAndUpdate(
      { evaluatorId: evaluation.evaluatorId, teamId: evaluation.teamId },
      { status: 'IN_PROGRESS' }
    );

    return evaluation;
  } catch (err: any) {
    const store = getMemoryStore();
    const evalRecord = (store.evaluations || []).find((e: any) => e._id === evaluationId);
    if (!evalRecord) throw new Error('Evaluation record not found');

    evalRecord.isLocked = false;
    evalRecord.status = 'DRAFT';
    evalRecord.auditTrail = [
      ...(evalRecord.auditTrail || []),
      {
        ...auditEntry,
        timestamp: auditEntry.timestamp.toISOString(),
      } as any,
    ];


    const asg = (store.assignments || []).find(
      (a: any) => a.evaluatorId === evalRecord.evaluatorId && a.teamId === evalRecord.teamId
    );
    if (asg) asg.status = 'IN_PROGRESS';

    return evalRecord;
  }
}
