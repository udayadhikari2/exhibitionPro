import { connectToDatabase } from '@/lib/mongodb';
import { EvaluatorAssignment } from '@/models/EvaluatorAssignment';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Category } from '@/models/Category';
import { IAssignment, AssignmentStatus } from '@/types';

function getMemoryStore() {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore!;
}

export async function getAssignments(filters?: {
  eventId?: string;
  evaluatorId?: string;
  teamId?: string;
  status?: string;
  categoryId?: string;
}): Promise<IAssignment[]> {
  try {
    await connectToDatabase();
    const query: any = {};
    if (filters?.eventId) query.eventId = filters.eventId;
    if (filters?.evaluatorId) query.evaluatorId = filters.evaluatorId;
    if (filters?.teamId) query.teamId = filters.teamId;
    if (filters?.status && filters.status !== 'ALL') query.status = filters.status;

    const rawList = await EvaluatorAssignment.find(query).sort({ createdAt: -1 }).lean();

    // Fetch related users and teams to enrich responses
    const evaluatorIds = Array.from(new Set(rawList.map((a: any) => a.evaluatorId)));
    const teamIds = Array.from(new Set(rawList.map((a: any) => a.teamId)));

    const [evaluators, teams] = await Promise.all([
      User.find({ _id: { $in: evaluatorIds } }).lean(),
      Team.find({ _id: { $in: teamIds } }).lean(),
    ]);

    const evalMap = new Map(evaluators.map((e: any) => [e._id.toString(), e]));
    const teamMap = new Map(teams.map((t: any) => [t._id.toString(), t]));

    const categoryIds = Array.from(new Set(teams.map((t: any) => t.categoryId).filter(Boolean)));
    const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
    const catMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]));

    let results: IAssignment[] = rawList.map((a: any) => {
      const evaluator: any = evalMap.get(a.evaluatorId);
      const team: any = teamMap.get(a.teamId);
      const catName = team?.categoryId ? catMap.get(team.categoryId) || 'General' : 'General';

      return {
        _id: a._id.toString(),
        eventId: a.eventId,
        evaluatorId: a.evaluatorId,
        teamId: a.teamId,
        assignedAt: a.assignedAt ? a.assignedAt.toISOString() : new Date().toISOString(),
        assignedBy: a.assignedBy || 'Admin',
        status: (a.status as AssignmentStatus) || 'PENDING',
        evaluatorName: evaluator?.name || 'Evaluator',
        evaluatorEmail: evaluator?.email || '',
        teamCode: team?.teamCode || 'N/A',
        teamName: team?.teamName || 'N/A',
        projectTitle: team?.project?.title || team?.title || 'Untitled Project',
        stallNumber: team?.stallNumber || team?.tableNumber || '',
        categoryName: catName,
      };
    });

    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      const teamsInCat = new Set(
        teams.filter((t: any) => t.categoryId === filters.categoryId).map((t: any) => t._id.toString())
      );
      results = results.filter((a) => teamsInCat.has(a.teamId));
    }

    return results;
  } catch {
    const store = getMemoryStore();
    let list = store.assignments || [];

    if (filters?.eventId) list = list.filter((a: any) => a.eventId === filters.eventId);
    if (filters?.evaluatorId) list = list.filter((a: any) => a.evaluatorId === filters.evaluatorId);
    if (filters?.teamId) list = list.filter((a: any) => a.teamId === filters.teamId);
    if (filters?.status && filters.status !== 'ALL') list = list.filter((a: any) => a.status === filters.status);

    const catMap = new Map((store.categories || []).map((c: any) => [c._id, c.name]));

    let results: IAssignment[] = list.map((a: any) => {
      const evaluator = store.users.find((u: any) => u._id === a.evaluatorId);
      const team = store.teams.find((t: any) => t._id === a.teamId);
      const catName = team?.categoryId ? catMap.get(team.categoryId) || 'General' : 'General';

      return {
        _id: a._id,
        eventId: a.eventId,
        evaluatorId: a.evaluatorId,
        teamId: a.teamId,
        assignedAt: a.assignedAt || new Date().toISOString(),
        assignedBy: a.assignedBy || 'Admin',
        status: (a.status as AssignmentStatus) || 'PENDING',
        evaluatorName: evaluator?.name || 'Evaluator',
        evaluatorEmail: evaluator?.email || '',
        teamCode: team?.teamCode || 'N/A',
        teamName: team?.teamName || 'N/A',
        projectTitle: team?.project?.title || team?.title || 'Untitled',
        stallNumber: team?.stallNumber || team?.tableNumber || '',
        categoryName: catName,
      };
    });

    if (filters?.categoryId && filters.categoryId !== 'ALL') {
      const teamsInCat = new Set(
        store.teams.filter((t: any) => t.categoryId === filters.categoryId).map((t: any) => t._id)
      );
      results = results.filter((a) => teamsInCat.has(a.teamId));
    }

    return results;
  }
}

export async function createAssignment(data: {
  eventId: string;
  evaluatorId: string;
  teamId: string;
  assignedBy?: string;
}): Promise<IAssignment> {
  try {
    await connectToDatabase();
    const existing = await EvaluatorAssignment.findOne({
      eventId: data.eventId,
      evaluatorId: data.evaluatorId,
      teamId: data.teamId,
    });
    if (existing) {
      return {
        _id: existing._id.toString(),
        eventId: existing.eventId,
        evaluatorId: existing.evaluatorId,
        teamId: existing.teamId,
        assignedAt: existing.assignedAt.toISOString(),
        assignedBy: existing.assignedBy,
        status: existing.status,
      };
    }

    const created = await EvaluatorAssignment.create({
      eventId: data.eventId,
      evaluatorId: data.evaluatorId,
      teamId: data.teamId,
      assignedBy: data.assignedBy || 'Admin',
      status: 'PENDING',
    });

    return {
      _id: created._id.toString(),
      eventId: created.eventId,
      evaluatorId: created.evaluatorId,
      teamId: created.teamId,
      assignedAt: created.assignedAt.toISOString(),
      assignedBy: created.assignedBy,
      status: created.status,
    };
  } catch {
    const store = getMemoryStore();
    if (!store.assignments) store.assignments = [];

    const existing = store.assignments.find(
      (a: any) => a.eventId === data.eventId && a.evaluatorId === data.evaluatorId && a.teamId === data.teamId
    );
    if (existing) return existing;

    const newAsg: IAssignment = {
      _id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: data.eventId,
      evaluatorId: data.evaluatorId,
      teamId: data.teamId,
      assignedAt: new Date().toISOString(),
      assignedBy: data.assignedBy || 'Admin',
      status: 'PENDING',
    };
    store.assignments.unshift(newAsg);
    return newAsg;
  }
}

export async function batchAssignEvaluatorToTeams(
  evaluatorId: string,
  eventId: string,
  teamIds: string[],
  assignedBy?: string
): Promise<{ added: number; assignments: IAssignment[] }> {
  const assignments: IAssignment[] = [];
  let added = 0;

  for (const teamId of teamIds) {
    const asg = await createAssignment({ eventId, evaluatorId, teamId, assignedBy });
    assignments.push(asg);
    added++;
  }

  return { added, assignments };
}

export async function batchAssignTeamsToEvaluators(
  teamId: string,
  eventId: string,
  evaluatorIds: string[],
  assignedBy?: string
): Promise<{ added: number; assignments: IAssignment[] }> {
  const assignments: IAssignment[] = [];
  let added = 0;

  for (const evaluatorId of evaluatorIds) {
    const asg = await createAssignment({ eventId, evaluatorId, teamId, assignedBy });
    assignments.push(asg);
    added++;
  }

  return { added, assignments };
}

export async function deleteAssignment(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await EvaluatorAssignment.findByIdAndDelete(id);
    return !!res;
  } catch {
    const store = getMemoryStore();
    const initLen = (store.assignments || []).length;
    store.assignments = (store.assignments || []).filter((a: any) => a._id !== id);
    return store.assignments.length < initLen;
  }
}
