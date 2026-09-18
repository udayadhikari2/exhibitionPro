import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { EvaluatorAssignment } from '@/models/EvaluatorAssignment';
import { Team } from '@/models/Team';
import { IUser, IEvaluatorWithStats, IAssignment } from '@/types';
import { hashPassword } from '@/lib/auth';

function getMemoryStore() {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore!;
}

export async function getEvaluators(filters?: {
  search?: string;
  status?: string;
  eventId?: string;
}): Promise<IEvaluatorWithStats[]> {
  try {
    await connectToDatabase();

    const query: any = { role: 'EVALUATOR' };
    if (filters?.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }
    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).lean();

    // Query assignments to calculate real-time stats
    const evaluatorIds = users.map((u: any) => u._id.toString());
    const assignmentQuery: any = { evaluatorId: { $in: evaluatorIds } };
    if (filters?.eventId) {
      assignmentQuery.eventId = filters.eventId;
    }

    const assignments = await EvaluatorAssignment.find(assignmentQuery).lean();

    return users.map((u: any) => {
      const userAssignments = assignments.filter((a: any) => a.evaluatorId === u._id.toString());
      const completed = userAssignments.filter((a: any) => a.status === 'COMPLETED').length;
      const pending = userAssignments.filter((a: any) => a.status !== 'COMPLETED').length;

      return {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        avatar: u.avatar,
        institution: u.institution,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        assignedCount: userAssignments.length,
        completedCount: completed,
        pendingCount: pending,
      };
    });
  } catch {
    // Fallback in-memory
    const store = getMemoryStore();
    let evaluators = store.users.filter((u: any) => u.role === 'EVALUATOR');

    if (filters?.status && filters.status !== 'ALL') {
      evaluators = evaluators.filter((u: any) => u.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      evaluators = evaluators.filter(
        (u: any) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q))
      );
    }

    return evaluators.map((u: any) => {
      const userAssignments = (store.assignments || []).filter(
        (a: any) => a.evaluatorId === u._id && (!filters?.eventId || a.eventId === filters.eventId)
      );
      const completed = userAssignments.filter((a: any) => a.status === 'COMPLETED').length;

      return {
        ...u,
        assignedCount: userAssignments.length,
        completedCount: completed,
        pendingCount: userAssignments.length - completed,
      };
    });
  }
}

export async function getEvaluatorById(id: string): Promise<{
  evaluator: IEvaluatorWithStats | null;
  assignments: IAssignment[];
}> {
  try {
    await connectToDatabase();
    const user = await User.findById(id).lean();
    if (!user || user.role !== 'EVALUATOR') {
      return { evaluator: null, assignments: [] };
    }

    const rawAssignments = await EvaluatorAssignment.find({ evaluatorId: id }).lean();
    const teamIds = rawAssignments.map((a: any) => a.teamId);
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamMap = new Map(teams.map((t: any) => [t._id.toString(), t]));

    const assignments: IAssignment[] = rawAssignments.map((a: any) => {
      const team: any = teamMap.get(a.teamId);
      return {
        _id: a._id.toString(),
        eventId: a.eventId,
        evaluatorId: a.evaluatorId,
        teamId: a.teamId,
        assignedAt: a.assignedAt ? a.assignedAt.toISOString() : new Date().toISOString(),
        assignedBy: a.assignedBy || 'Admin',
        status: a.status || 'PENDING',
        teamCode: team?.teamCode || 'N/A',
        teamName: team?.teamName || 'N/A',
        projectTitle: team?.project?.title || team?.title || 'Untitled Project',
        stallNumber: team?.stallNumber || team?.tableNumber || '',
      };
    });

    const completed = assignments.filter((a) => a.status === 'COMPLETED').length;
    const evaluator: IEvaluatorWithStats = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      institution: user.institution,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedCount: assignments.length,
      completedCount: completed,
      pendingCount: assignments.length - completed,
    };

    return { evaluator, assignments };
  } catch {
    const store = getMemoryStore();
    const user = store.users.find((u: any) => u._id === id && u.role === 'EVALUATOR');
    if (!user) return { evaluator: null, assignments: [] };

    const rawAssignments = (store.assignments || []).filter((a: any) => a.evaluatorId === id);
    const assignments: IAssignment[] = rawAssignments.map((a: any) => {
      const team = store.teams.find((t: any) => t._id === a.teamId);
      return {
        _id: a._id,
        eventId: a.eventId,
        evaluatorId: a.evaluatorId,
        teamId: a.teamId,
        assignedAt: a.assignedAt || new Date().toISOString(),
        assignedBy: a.assignedBy || 'Admin',
        status: a.status || 'PENDING',
        teamCode: team?.teamCode || 'N/A',
        teamName: team?.teamName || 'N/A',
        projectTitle: team?.project?.title || team?.title || 'Untitled',
        stallNumber: team?.stallNumber || team?.tableNumber || '',
      };
    });

    const completed = assignments.filter((a) => a.status === 'COMPLETED').length;
    const evaluator: IEvaluatorWithStats = {
      ...user,
      assignedCount: assignments.length,
      completedCount: completed,
      pendingCount: assignments.length - completed,
    };

    return { evaluator, assignments };
  }
}

export async function createEvaluator(data: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  institution?: string;
}): Promise<IUser> {
  const plainPassword = data.password || 'eval123';
  const passwordHash = await hashPassword(plainPassword);

  try {
    await connectToDatabase();
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new Error(`User with email "${data.email}" already exists`);
    }

    const created = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || '',
      passwordHash,
      role: 'EVALUATOR',
      status: 'ACTIVE',
      institution: data.institution?.trim() || '',
    });

    return {
      _id: created._id.toString(),
      name: created.name,
      email: created.email,
      phone: created.phone,
      role: created.role,
      status: created.status,
      institution: created.institution,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      throw err;
    }
    // Fallback in-memory
    const store = getMemoryStore();
    const exists = store.users.some((u: any) => u.email.toLowerCase() === data.email.toLowerCase().trim());
    if (exists) {
      throw new Error(`User with email "${data.email}" already exists`);
    }

    const newUsr: IUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || '',
      passwordHash,
      role: 'EVALUATOR',
      status: 'ACTIVE',
      institution: data.institution?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    store.users.unshift(newUsr);
    return newUsr;
  }
}

export async function updateEvaluator(
  id: string,
  update: {
    name?: string;
    email?: string;
    phone?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    institution?: string;
  }
): Promise<IUser | null> {
  try {
    await connectToDatabase();
    const cleanUpdate: any = {};
    if (update.name !== undefined) cleanUpdate.name = update.name.trim();
    if (update.email !== undefined) cleanUpdate.email = update.email.toLowerCase().trim();
    if (update.phone !== undefined) cleanUpdate.phone = update.phone.trim();
    if (update.status !== undefined) cleanUpdate.status = update.status;
    if (update.institution !== undefined) cleanUpdate.institution = update.institution.trim();

    const updated: any = await User.findByIdAndUpdate(id, cleanUpdate, { new: true }).lean();
    if (!updated) return null;

    return {
      _id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      status: updated.status,
      institution: updated.institution,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  } catch {
    const store = getMemoryStore();
    const idx = store.users.findIndex((u: any) => u._id === id);
    if (idx === -1) return null;

    store.users[idx] = {
      ...store.users[idx],
      ...update,
      updatedAt: new Date().toISOString(),
    };
    return store.users[idx];
  }
}

export async function resetEvaluatorPassword(id: string, newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  const passwordHash = await hashPassword(newPassword);

  try {
    await connectToDatabase();
    const res = await User.findByIdAndUpdate(id, { passwordHash });
    return !!res;
  } catch {
    const store = getMemoryStore();
    const user = store.users.find((u: any) => u._id === id);
    if (!user) return false;
    user.passwordHash = passwordHash;
    return true;
  }
}
