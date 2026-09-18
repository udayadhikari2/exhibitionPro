import {
  DEMO_USERS,
  DEMO_EVENTS,
  DEMO_CATEGORIES,
  DEMO_CRITERIA,
  DEMO_TEAMS,
  DEMO_ASSIGNMENTS,
  DEMO_EVALUATIONS,
  DEMO_VISITOR_FEEDBACK,
} from './seed-data';
import {
  IUser,
  IEvent,
  ICategory,
  IEvaluationCriterion,
  ITeam,
  IAssignment,
  IEvaluation,
  IVisitorFeedback,
  EventStatus,
  EVENT_STATUS_FLOW,
  TeamStatus,
  IEventResult,
} from './types';
import { connectDB } from './db';
import * as models from './models';

// In-Memory store that persists across hot-reloads via global

declare global {
  // eslint-disable-next-line no-var
  var portalMemoryStore: {
    users: IUser[];
    events: IEvent[];
    categories: ICategory[];
    criteria: IEvaluationCriterion[];
    teams: ITeam[];
    assignments: IAssignment[];
    evaluations: IEvaluation[];
    feedback: IVisitorFeedback[];
    eventResults: IEventResult[];
    initialized: boolean;
  } | undefined;
}

export function getMemoryStore() {
  if (!global.portalMemoryStore) {
    global.portalMemoryStore = {
      users: JSON.parse(JSON.stringify(DEMO_USERS)),
      events: JSON.parse(JSON.stringify(DEMO_EVENTS)),
      categories: JSON.parse(JSON.stringify(DEMO_CATEGORIES)),
      criteria: JSON.parse(JSON.stringify(DEMO_CRITERIA)),
      teams: JSON.parse(JSON.stringify(DEMO_TEAMS)),
      assignments: JSON.parse(JSON.stringify(DEMO_ASSIGNMENTS)),
      evaluations: JSON.parse(JSON.stringify(DEMO_EVALUATIONS)),
      feedback: JSON.parse(JSON.stringify(DEMO_VISITOR_FEEDBACK)),
      eventResults: [],
      initialized: true,
    };
  }
  return global.portalMemoryStore;
}

// Ensure store is populated on first import
getMemoryStore();



// ----------------- USER SERVICES -----------------
export async function getUserByEmail(email: string): Promise<IUser | null> {
  const store = getMemoryStore();
  const normalized = email.toLowerCase().trim();
  const candidates = [normalized];
  if (normalized === 'admin.exhibition.com') candidates.push('admin@exhibition.com');
  if (normalized === 'admin@exhibition.com') candidates.push('admin.exhibition.com');
  return store.users.find((u) => candidates.includes(u.email.toLowerCase())) || null;
}

export async function authenticateUser(email: string, passwordPlain: string): Promise<IUser | null> {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash || (user.isActive === false)) return null;
  const bcrypt = require('bcryptjs');
  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) return null;

  return user;
}

export async function getUserById(id: string): Promise<IUser | null> {
  const store = getMemoryStore();
  return store.users.find((u) => u._id === id) || null;
}

export async function getAllEvaluators(): Promise<IUser[]> {
  const store = getMemoryStore();
  return store.users.filter((u) => u.role === 'EVALUATOR' && u.isActive);
}

export async function getAllUsers(): Promise<IUser[]> {
  const store = getMemoryStore();
  return store.users;
}

export async function createUser(data: Omit<IUser, '_id' | 'createdAt'>): Promise<IUser> {
  const store = getMemoryStore();
  const newUser: IUser = {
    ...data,
    _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
  };
  store.users.push(newUser);
  return newUser;
}

// ----------------- EVENT SERVICES -----------------
export async function getEvents(): Promise<IEvent[]> {
  const store = getMemoryStore();
  return store.events;
}

export async function getEventById(id: string): Promise<IEvent | null> {
  const store = getMemoryStore();
  return store.events.find((e) => e._id === id || e.slug === id) || null;
}

export async function createEvent(data: Omit<IEvent, '_id' | 'createdAt'>): Promise<IEvent> {
  const store = getMemoryStore();
  const newEvent: IEvent = {
    ...data,
    _id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.events.unshift(newEvent);
  return newEvent;
}

export async function updateEvent(id: string, update: Partial<IEvent>): Promise<IEvent | null> {
  const store = getMemoryStore();
  const index = store.events.findIndex((e) => e._id === id);
  if (index === -1) return null;
  store.events[index] = { ...store.events[index], ...update };
  return store.events[index];
}

export async function updateEventStatus(id: string, newStatus: EventStatus): Promise<{ success: boolean; event?: IEvent; error?: string }> {
  const store = getMemoryStore();
  const event = store.events.find((e) => e._id === id);
  if (!event) return { success: false, error: 'Event not found' };

  const currentIndex = EVENT_STATUS_FLOW.indexOf(event.status);
  const targetIndex = EVENT_STATUS_FLOW.indexOf(newStatus);

  if (targetIndex === -1) {
    return { success: false, error: `Invalid status: ${newStatus}` };
  }

  // We allow forward progression or jumping one stage back for revisions
  event.status = newStatus;
  return { success: true, event };
}

// ----------------- CATEGORY SERVICES -----------------
export async function getCategoriesByEvent(eventId: string): Promise<ICategory[]> {
  const store = getMemoryStore();
  return store.categories.filter((c) => c.eventId === eventId);
}

export async function createCategory(data: Omit<ICategory, '_id'>): Promise<ICategory> {
  const store = getMemoryStore();
  const newCat: ICategory = {
    ...data,
    _id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  store.categories.push(newCat);
  return newCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const store = getMemoryStore();
  const initLen = store.categories.length;
  store.categories = store.categories.filter((c) => c._id !== id);
  return store.categories.length < initLen;
}

// ----------------- EVALUATION CRITERIA SERVICES -----------------
export async function getCriteriaByEvent(eventId: string): Promise<IEvaluationCriterion[]> {
  const store = getMemoryStore();
  return store.criteria
    .filter((c) => c.eventId === eventId)
    .sort((a, b) => a.order - b.order);
}

export async function saveCriterion(data: Omit<IEvaluationCriterion, '_id'> & { _id?: string }): Promise<IEvaluationCriterion> {
  const store = getMemoryStore();
  if (data._id) {
    const idx = store.criteria.findIndex((c) => c._id === data._id);
    if (idx !== -1) {
      store.criteria[idx] = { ...store.criteria[idx], ...data } as IEvaluationCriterion;
      return store.criteria[idx];
    }
  }
  const newCrit: IEvaluationCriterion = {
    ...data,
    _id: `crit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
  };
  store.criteria.push(newCrit);
  return newCrit;
}

export async function deleteCriterion(id: string): Promise<boolean> {
  const store = getMemoryStore();
  const initLen = store.criteria.length;
  store.criteria = store.criteria.filter((c) => c._id !== id);
  return store.criteria.length < initLen;
}

// ----------------- TEAM SERVICES -----------------
export async function getTeamsByEvent(eventId: string): Promise<ITeam[]> {
  const store = getMemoryStore();
  return store.teams.filter((t) => t.eventId === eventId);
}

export async function getTeamById(id: string): Promise<ITeam | null> {
  const store = getMemoryStore();
  return store.teams.find((t) => t._id === id || t.teamCode === id) || null;
}

export async function getTeamsByLeader(userId: string): Promise<ITeam[]> {
  const store = getMemoryStore();
  return store.teams.filter((t) => t.teamLeaderId === userId);
}

export async function createTeam(data: Omit<ITeam, '_id' | 'createdAt'>): Promise<ITeam> {
  const store = getMemoryStore();
  const newTeam: ITeam = {
    ...data,
    _id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.teams.push(newTeam);
  return newTeam;
}

export async function updateTeam(id: string, update: Partial<ITeam>): Promise<ITeam | null> {
  const store = getMemoryStore();
  const idx = store.teams.findIndex((t) => t._id === id);
  if (idx === -1) return null;
  store.teams[idx] = { ...store.teams[idx], ...update };
  return store.teams[idx];
}

export async function updateTeamStatus(id: string, status: TeamStatus, remarks?: string): Promise<ITeam | null> {
  const store = getMemoryStore();
  const team = store.teams.find((t) => t._id === id);
  if (!team) return null;
  team.status = status;
  if (remarks !== undefined) team.correctionRemarks = remarks;
  return team;
}

export async function assignTeamStall(id: string, tableNumber: string): Promise<ITeam | null> {
  const store = getMemoryStore();
  const team = store.teams.find((t) => t._id === id);
  if (!team) return null;
  team.tableNumber = tableNumber;
  return team;
}

// ----------------- ASSIGNMENT SERVICES -----------------
export async function getAssignmentsByEvent(eventId: string): Promise<IAssignment[]> {
  const store = getMemoryStore();
  return store.assignments.filter((a) => a.eventId === eventId);
}

export async function getAssignmentsByEvaluator(evaluatorId: string, eventId?: string): Promise<IAssignment[]> {
  const store = getMemoryStore();
  return store.assignments.filter((a) => a.evaluatorId === evaluatorId && (!eventId || a.eventId === eventId));
}

export async function isEvaluatorAssigned(evaluatorId: string, teamId: string, eventId: string): Promise<boolean> {
  const store = getMemoryStore();
  return store.assignments.some(
    (a) => a.evaluatorId === evaluatorId && a.teamId === teamId && a.eventId === eventId
  );
}

export async function assignEvaluator(eventId: string, evaluatorId: string, teamId: string): Promise<IAssignment> {
  const store = getMemoryStore();
  const existing = store.assignments.find(
    (a) => a.eventId === eventId && a.evaluatorId === evaluatorId && a.teamId === teamId
  );
  if (existing) return existing;

  const newAsg: IAssignment = {
    _id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId,
    evaluatorId,
    teamId,
    assignedAt: new Date().toISOString(),
  };
  store.assignments.push(newAsg);
  return newAsg;
}

export async function removeAssignment(assignmentId: string): Promise<boolean> {
  const store = getMemoryStore();
  const initLen = store.assignments.length;
  store.assignments = store.assignments.filter((a) => a._id !== assignmentId);
  return store.assignments.length < initLen;
}

// ----------------- EVALUATION SERVICES -----------------
export async function getEvaluation(teamId: string, evaluatorId: string): Promise<IEvaluation | null> {
  const store = getMemoryStore();
  return store.evaluations.find((e) => e.teamId === teamId && e.evaluatorId === evaluatorId) || null;
}

export async function getEvaluationsByTeam(teamId: string): Promise<IEvaluation[]> {
  const store = getMemoryStore();
  return store.evaluations.filter((e) => e.teamId === teamId);
}

export async function getEvaluationsByEvent(eventId: string): Promise<IEvaluation[]> {
  const store = getMemoryStore();
  return store.evaluations.filter((e) => e.eventId === eventId);
}

export async function submitEvaluation(params: {
  eventId: string;
  teamId: string;
  evaluatorId: string;
  scores: { criterionId: string; marks: number; comment?: string }[];
  generalFeedback?: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ success: boolean; evaluation?: IEvaluation; error?: string }> {
  const store = getMemoryStore();

  // 1. Authorization check: Evaluator must be assigned to this team
  const isAssigned = await isEvaluatorAssigned(params.evaluatorId, params.teamId, params.eventId);
  if (!isAssigned) {
    return { success: false, error: 'Forbidden: Evaluator is not assigned to this project' };
  }

  // 2. Fetch Criteria to strictly validate marks bounds
  const criteria = await getCriteriaByEvent(params.eventId);
  const criteriaMap = new Map(criteria.map((c) => [c._id, c]));

  let totalScore = 0;
  let maxPossibleScore = 0;

  const validatedScores: IEvaluation['scores'] = [];

  for (const s of params.scores) {
    const criterion = criteriaMap.get(s.criterionId);
    if (!criterion) {
      return { success: false, error: `Invalid criterion ID: ${s.criterionId}` };
    }
    if (s.marks > criterion.maxMarks) {
      return {
        success: false,
        error: `Marks for "${criterion.name}" (${s.marks}) exceeds maximum allowed (${criterion.maxMarks})`,
      };
    }
    if (s.marks < criterion.minMarks) {
      return {
        success: false,
        error: `Marks for "${criterion.name}" (${s.marks}) cannot be less than ${criterion.minMarks}`,
      };
    }

    validatedScores.push({
      criterionId: s.criterionId,
      criterionName: criterion.name,
      marks: s.marks,
      maxMarks: criterion.maxMarks,
      comment: s.comment || '',
    });

    totalScore += s.marks;
    maxPossibleScore += criterion.maxMarks;
  }

  // Check if evaluation already exists
  const existingIdx = store.evaluations.findIndex(
    (e) => e.teamId === params.teamId && e.evaluatorId === params.evaluatorId
  );

  const auditEntry = {
    action: 'SUBMISSION',
    timestamp: new Date().toISOString(),
    ip: params.ip,
    userAgent: params.userAgent,
  };

  if (existingIdx !== -1) {
    if (store.evaluations[existingIdx].isLocked) {
      return { success: false, error: 'Evaluation is locked. Admin override required to modify.' };
    }

    store.evaluations[existingIdx] = {
      ...store.evaluations[existingIdx],
      scores: validatedScores,
      totalScore,
      maxPossibleScore,
      generalFeedback: params.generalFeedback || '',
      isLocked: true, // Immediately locked upon submission
      submittedAt: new Date().toISOString(),
      auditTrail: [...(store.evaluations[existingIdx].auditTrail || []), auditEntry],
    };
    return { success: true, evaluation: store.evaluations[existingIdx] };
  }

  const newEval: IEvaluation = {
    _id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId: params.eventId,
    teamId: params.teamId,
    evaluatorId: params.evaluatorId,
    scores: validatedScores,
    totalScore,
    maxPossibleScore,
    generalFeedback: params.generalFeedback || '',
    isLocked: true,
    submittedAt: new Date().toISOString(),
    auditTrail: [auditEntry],
  };

  store.evaluations.push(newEval);
  return { success: true, evaluation: newEval };
}

export async function unlockEvaluation(evaluationId: string, adminId: string): Promise<boolean> {
  const store = getMemoryStore();
  const evaluation = store.evaluations.find((e) => e._id === evaluationId);
  if (!evaluation) return false;
  evaluation.isLocked = false;
  if (!evaluation.auditTrail) evaluation.auditTrail = [];
  evaluation.auditTrail.push({
    action: `UNLOCKED_BY_ADMIN_${adminId}`,
    timestamp: new Date().toISOString(),
  });
  return true;

}

// ----------------- RESULT AGGREGATION SERVICES -----------------
export interface ITeamResult {
  teamId: string;
  teamCode: string;
  title: string;
  categoryId: string;
  categoryName: string;
  tableNumber: string;
  evaluationsCount: number;
  assignedCount: number;
  averageScore: number;
  maxScore: number;
  percentage: number;
  rankInCategory: number;
  rankOverall: number;
}

export async function calculateEventResults(eventId: string): Promise<ITeamResult[]> {
  const store = getMemoryStore();
  const teams = store.teams.filter((t) => t.eventId === eventId && t.status === 'APPROVED');
  const categories = store.categories.filter((c) => c.eventId === eventId);
  const categoryMap = new Map(categories.map((c) => [c._id, c.name]));
  const evaluations = store.evaluations.filter((e) => e.eventId === eventId);
  const assignments = store.assignments.filter((a) => a.eventId === eventId);

  const results: ITeamResult[] = teams.map((team) => {
    const teamEvals = evaluations.filter((e) => e.teamId === team._id);
    const teamAssigns = assignments.filter((a) => a.teamId === team._id);

    let avgScore = 0;
    let maxPossible = 100;

    if (teamEvals.length > 0) {
      const sum = teamEvals.reduce((acc, curr) => acc + curr.totalScore, 0);
      avgScore = Number((sum / teamEvals.length).toFixed(2));
      maxPossible = teamEvals[0].maxPossibleScore || 100;
    }

    const percentage = maxPossible > 0 ? Number(((avgScore / maxPossible) * 100).toFixed(1)) : 0;

    return {
      teamId: team._id,
      teamCode: team.teamCode,
      title: team.project?.title || team.title || 'Untitled Project',
      categoryId: team.categoryId,
      categoryName: categoryMap.get(team.categoryId) || 'General',
      tableNumber: team.tableNumber || 'N/A',
      evaluationsCount: teamEvals.length,
      assignedCount: teamAssigns.length,
      averageScore: avgScore,
      maxScore: maxPossible,
      percentage,
      rankInCategory: 0,
      rankOverall: 0,
    };
  });

  // Calculate Overall Ranks (highest average score first)
  results.sort((a, b) => b.averageScore - a.averageScore);
  results.forEach((r, idx) => {
    r.rankOverall = idx + 1;
  });

  // Calculate Category Ranks
  const catGroups: { [catId: string]: ITeamResult[] } = {};
  results.forEach((r) => {
    if (!catGroups[r.categoryId]) catGroups[r.categoryId] = [];
    catGroups[r.categoryId].push(r);
  });

  Object.values(catGroups).forEach((group) => {
    group.sort((a, b) => b.averageScore - a.averageScore);
    group.forEach((r, idx) => {
      r.rankInCategory = idx + 1;
    });
  });

  return results;
}

// ----------------- VISITOR FEEDBACK SERVICES -----------------
export async function submitVisitorFeedback(data: Omit<IVisitorFeedback, '_id' | 'createdAt'>): Promise<IVisitorFeedback> {
  const store = getMemoryStore();
  const feedback: IVisitorFeedback = {
    ...data,
    _id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  store.feedback.push(feedback);
  return feedback;
}

export async function getFeedbackByTeam(teamId: string): Promise<IVisitorFeedback[]> {
  const store = getMemoryStore();
  return store.feedback.filter((f) => f.teamId === teamId);
}

export async function getFeedbackByEvent(eventId: string): Promise<IVisitorFeedback[]> {
  const store = getMemoryStore();
  return store.feedback.filter((f) => f.eventId === eventId);
}
