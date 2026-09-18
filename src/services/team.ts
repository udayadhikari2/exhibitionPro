import { connectToDatabase } from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { Event } from '@/models/Event';
import { Category } from '@/models/Category';
import { ITeam, TeamStatus, IPublicProject, IProject } from '@/types';
import { DEMO_TEAMS } from '@/lib/seed-data';
import { getPublicStallUrl, getPublicProjectUrl } from '@/lib/qr';

function getFallbackTeams(): ITeam[] {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  const store = global.portalMemoryStore!;
  if (!store.teams) {
    store.teams = (DEMO_TEAMS as unknown as ITeam[]).map((t) => ({
      ...t,
      teamName: t.teamName || (t as any).title || 'Team Alpha',
      teamLeader: t.teamLeader || {
        name: (t as any).members?.[0]?.name || 'Student Leader',
        email: (t as any).members?.[0]?.email || 'student@portal.edu',
        userId: (t as any).teamLeaderId || 'usr_student_1',
      },
      project: t.project || {
        title: (t as any).title || 'Innovative Exhibition Project',
        shortDescription: (t as any).abstract || 'Project description and methodology.',
        technologyUsed: (t as any).techStack || '',
        files: [],
      },
      createdBy: (t as any).teamLeaderId || (t as any).createdBy || 'usr_student_1',
    }));
  }
  return store.teams;
}

export async function generateTeamCode(eventId: string, eventTypeHint?: string): Promise<string> {
  let prefix = 'EXH';
  let year = new Date().getFullYear();

  try {
    await connectToDatabase();
    const event = await Event.findById(eventId).lean();
    if (event) {
      if (event.eventType) {
        prefix = event.eventType.substring(0, 3).toUpperCase().replace(/[^\w]/g, '');
      }
      if (event.startDate) {
        const d = new Date(event.startDate);
        if (!isNaN(d.getFullYear())) year = d.getFullYear();
      }
    }
  } catch {
    if (eventTypeHint) {
      prefix = eventTypeHint.substring(0, 3).toUpperCase().replace(/[^\w]/g, '');
    }
  }

  // Count existing teams for this event
  let count = 1;
  try {
    await connectToDatabase();
    count = (await Team.countDocuments({ eventId })) + 1;
  } catch {
    count = getFallbackTeams().filter((t) => t.eventId === eventId).length + 1;
  }

  const numStr = String(count).padStart(3, '0');
  const candidate = `${prefix}-${year}-${numStr}`;

  return candidate;
}

export async function createTeam(data: Partial<ITeam>, creatorId: string): Promise<ITeam> {
  const teamCode = data.teamCode || (await generateTeamCode(data.eventId || '', 'EXH'));
  const teamName = data.teamName || data.title || 'New Team';
  const qrCodeUrl = getPublicStallUrl(teamCode);

  const teamPayload: Partial<ITeam> = {
    eventId: data.eventId,
    categoryId: data.categoryId,
    teamCode,
    teamName,
    title: data.project?.title || teamName,
    abstract: data.project?.shortDescription || '',
    grade: data.grade || data.class || '',
    class: data.class || data.grade || '',
    section: data.section || '',
    school: data.school || data.institution || '',
    institution: data.institution || data.school || '',
    teamLeader: data.teamLeader || {
      name: 'Team Leader',
      email: 'leader@portal.edu',
      userId: creatorId,
    },
    contact: data.contact || data.teamLeader?.phone || '',
    mentor: data.mentor || { name: '' },
    status: (data.status as TeamStatus) || 'DRAFT',
    stallNumber: data.stallNumber || data.tableNumber || '',
    tableNumber: data.stallNumber || data.tableNumber || '',
    correctionRemarks: data.correctionRemarks || '',
    members: data.members || [],
    project: data.project || {
      title: teamName,
      shortDescription: '',
      files: [],
    },
    qrCodeUrl,
    createdBy: creatorId,
  };

  try {
    await connectToDatabase();
    const created = await Team.create(teamPayload);
    return created.toJSON() as unknown as ITeam;
  } catch (err) {
    // In-memory fallback
  }

  const fallbackTeam: ITeam = {
    ...(teamPayload as ITeam),
    _id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const list = getFallbackTeams();
  list.unshift(fallbackTeam);
  return fallbackTeam;
}

export async function getTeams(options?: {
  eventId?: string;
  categoryId?: string;
  status?: string;
  search?: string;
  createdBy?: string;
}): Promise<ITeam[]> {
  try {
    await connectToDatabase();
    const query: any = {};

    if (options?.eventId) query.eventId = options.eventId;
    if (options?.categoryId) query.categoryId = options.categoryId;
    if (options?.status && options.status !== 'ALL') query.status = options.status;
    if (options?.createdBy) query.createdBy = options.createdBy;

    if (options?.search) {
      query.$or = [
        { teamName: { $regex: options.search, $options: 'i' } },
        { teamCode: { $regex: options.search, $options: 'i' } },
        { 'project.title': { $regex: options.search, $options: 'i' } },
        { school: { $regex: options.search, $options: 'i' } },
        { institution: { $regex: options.search, $options: 'i' } },
        { 'teamLeader.name': { $regex: options.search, $options: 'i' } },
      ];
    }

    const teams = await Team.find(query).sort({ createdAt: -1 }).lean();
    if (teams && teams.length > 0) {
      return teams.map((t) => ({
        ...t,
        _id: t._id.toString(),
        teamName: t.teamName || (t as any).title,
        title: t.project?.title || t.teamName || (t as any).title,
        abstract: t.project?.shortDescription || (t as any).abstract,
        tableNumber: t.stallNumber || (t as any).tableNumber,
        stallNumber: t.stallNumber || (t as any).tableNumber,
        school: t.school || t.institution,
        institution: t.institution || t.school,
        qrCodeUrl: t.qrCodeUrl || getPublicStallUrl(t.teamCode),
      })) as unknown as ITeam[];
    }
  } catch (err) {
    // In-memory fallback
  }

  let list = getFallbackTeams().map((t) => ({
    ...t,
    teamName: t.teamName || (t as any).title,
    title: t.project?.title || t.teamName || (t as any).title,
    abstract: t.project?.shortDescription || (t as any).abstract,
    tableNumber: t.stallNumber || (t as any).tableNumber,
    stallNumber: t.stallNumber || (t as any).tableNumber,
    school: t.school || t.institution,
    institution: t.institution || t.school,
    qrCodeUrl: t.qrCodeUrl || getPublicStallUrl(t.teamCode),
  }));

  if (options?.eventId) list = list.filter((t) => t.eventId === options.eventId);
  if (options?.categoryId) list = list.filter((t) => t.categoryId === options.categoryId);
  if (options?.status && options.status !== 'ALL') list = list.filter((t) => t.status === options.status);
  if (options?.createdBy) list = list.filter((t) => t.createdBy === options.createdBy || t.teamLeader?.userId === options.createdBy);

  if (options?.search) {
    const q = options.search.toLowerCase();
    list = list.filter(
      (t) =>
        t.teamName?.toLowerCase().includes(q) ||
        t.teamCode?.toLowerCase().includes(q) ||
        t.project?.title?.toLowerCase().includes(q) ||
        t.school?.toLowerCase().includes(q) ||
        t.institution?.toLowerCase().includes(q) ||
        t.teamLeader?.name?.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getTeamById(id: string): Promise<ITeam | null> {
  try {
    await connectToDatabase();
    const team = await Team.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { teamCode: id.toUpperCase() }, { _id: id }],
    }).lean();

    if (team) {
      return {
        ...team,
        _id: team._id.toString(),
        teamName: team.teamName || (team as any).title,
        title: team.project?.title || team.teamName || (team as any).title,
        abstract: team.project?.shortDescription || (team as any).abstract,
        tableNumber: team.stallNumber || (team as any).tableNumber,
        stallNumber: team.stallNumber || (team as any).tableNumber,
        school: team.school || team.institution,
        institution: team.institution || team.school,
        qrCodeUrl: team.qrCodeUrl || getPublicStallUrl(team.teamCode),
      } as unknown as ITeam;
    }
  } catch (err) {
    // In-memory fallback
  }

  const found = getFallbackTeams().find((t) => t._id === id || t.teamCode.toUpperCase() === id.toUpperCase());
  if (found) {
    return {
      ...found,
      teamName: found.teamName || (found as any).title,
      title: found.project?.title || found.teamName || (found as any).title,
      abstract: found.project?.shortDescription || (found as any).abstract,
      tableNumber: found.stallNumber || (found as any).tableNumber,
      stallNumber: found.stallNumber || (found as any).tableNumber,
      school: found.school || found.institution,
      institution: found.institution || found.school,
      qrCodeUrl: found.qrCodeUrl || getPublicStallUrl(found.teamCode),
    };
  }
  return null;
}

export async function updateTeam(id: string, data: Partial<ITeam>): Promise<ITeam | null> {
  const updateData = { ...data };
  if (updateData.stallNumber && !updateData.tableNumber) updateData.tableNumber = updateData.stallNumber;
  if (updateData.tableNumber && !updateData.stallNumber) updateData.stallNumber = updateData.tableNumber;
  if (updateData.school && !updateData.institution) updateData.institution = updateData.school;
  if (updateData.institution && !updateData.school) updateData.school = updateData.institution;

  try {
    await connectToDatabase();
    const updated = await Team.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (updated) {
      return {
        ...updated,
        _id: updated._id.toString(),
      } as unknown as ITeam;
    }
  } catch (err) {
    // In-memory fallback
  }

  const list = getFallbackTeams();
  const idx = list.findIndex((t) => t._id === id || t.teamCode === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updateData };
    return list[idx];
  }
  return null;
}

export async function updateTeamStatus(
  id: string,
  status: TeamStatus,
  remarks?: string,
  stallNumber?: string
): Promise<ITeam | null> {
  const updatePayload: Partial<ITeam> = { status };
  if (remarks !== undefined) updatePayload.correctionRemarks = remarks;
  if (stallNumber !== undefined) {
    updatePayload.stallNumber = stallNumber;
    updatePayload.tableNumber = stallNumber;
  }

  const team = await getTeamById(id);
  if (!team) return null;

  if (status === 'APPROVED' && !team.qrCodeUrl) {
    updatePayload.qrCodeUrl = getPublicStallUrl(team.teamCode);
  }

  return updateTeam(team._id, updatePayload);
}

export async function deleteTeam(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await Team.findByIdAndDelete(id);
    if (res) return true;
  } catch (err) {
    // In-memory fallback
  }

  const list = getFallbackTeams();
  const initLen = list.length;
  if (global.portalMemoryStore) {
    global.portalMemoryStore.teams = list.filter((t) => t._id !== id && t.teamCode !== id);
    return global.portalMemoryStore.teams.length < initLen;
  }
  return true;
}

/**
 * Sanitize a team object for public exhibition viewing.
 * Strictly removes student contact info, emails, roll numbers, and evaluation marks.
 */
export function sanitizeTeamForPublic(
  team: ITeam,
  eventSlug: string,
  categoryMap: Map<string, string>
): IPublicProject {
  const project: IProject = team.project || {
    title: (team as any).title || team.teamName,
    shortDescription: (team as any).abstract || 'Innovative exhibition project.',
    technologyUsed: team.techStack || '',
    files: [],
  };

  const projectTitle =
    project.title ||
    (team as any).title ||
    team.teamName ||
    'Exhibition Project';

  const teamName =
    team.teamName ||
    (team as any).title ||
    'Student Innovators';

  const shortDescription =
    project.shortDescription ||
    (team as any).abstract ||
    'Innovative exhibition project presented by student innovators.';

  const images = (project.files || [])
    .filter((f) => f.type === 'image')
    .map((f) => f.url);
  const docs = (project.files || []).filter((f) => f.type === 'pdf' || f.type === 'presentation');

  return {
    id: team._id,
    teamCode: team.teamCode,
    teamName,
    projectTitle,
    shortDescription,
    stallNumber: team.stallNumber || team.tableNumber || '',
    category: {
      id: team.categoryId,
      name: categoryMap.get(team.categoryId) || 'Exhibition Track',
    },
    class: team.class || team.grade || '',
    grade: team.grade || team.class || '',
    section: team.section || '',
    school: team.school || team.institution || '',
    institution: team.institution || team.school || '',
    members: (team.members || []).map((m) => ({
      name: m.name,
      role: m.role || 'Member',
      class: m.class || m.grade || '',
    })),
    mentorName: team.mentor?.name || '',
    mentorDesignation: team.mentor?.designation || '',
    problemStatement: project.problemStatement || '',
    objectives: project.objectives || '',
    methodology: project.methodology || '',
    innovation: project.innovation || '',
    materials: project.materials || '',
    technologyUsed: project.technologyUsed || team.techStack || '',
    expectedOutcome: project.expectedOutcome || '',
    futureScope: project.futureScope || '',
    projectCost: project.projectCost,
    files: project.files || [],
    gallery: project.gallery && project.gallery.length > 0 ? project.gallery : images,
    documents: project.documents && project.documents.length > 0 ? project.documents : docs,
    videoUrl: project.videoUrl || '',
    qrCodeUrl: getPublicProjectUrl(eventSlug, team.teamCode),
  };
}

/**
 * Fetch all approved public projects for an exhibition event.
 */
export async function getPublicProjectsByEvent(
  eventIdOrSlug: string,
  search?: string,
  categoryId?: string
): Promise<{ event: any; categories: any[]; projects: IPublicProject[] } | null> {
  const { getEventBySlug, getEventById } = await import('@/services/event');
  const { getCategoriesByEvent } = await import('@/services/category');

  let eventDoc: any = await getEventBySlug(eventIdOrSlug);
  if (!eventDoc) {
    eventDoc = await getEventById(eventIdOrSlug);
  }

  if (!eventDoc) return null;

  const eventId = eventDoc._id.toString();
  const eventSlug = eventDoc.slug || eventDoc._id.toString();

  // Categories
  const categories = await getCategoriesByEvent(eventId);
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => {
    categoryMap.set(c._id ? c._id.toString() : (c as any).id, c.name);
  });

  // Teams
  let rawTeams: ITeam[] = [];
  try {
    await connectToDatabase();
    const query: any = {
      eventId,
      status: { $in: ['APPROVED', 'SUBMITTED', 'PENDING_APPROVAL'] },
    };
    if (categoryId && categoryId !== 'ALL') {
      query.categoryId = categoryId;
    }
    const docs = await Team.find(query).sort({ stallNumber: 1, teamCode: 1 }).lean();
    rawTeams = docs.map((d) => ({ ...d, _id: d._id.toString() }) as unknown as ITeam);
  } catch {
    // Memory store fallback
  }

  if (rawTeams.length === 0) {
    const list = getFallbackTeams().filter((t) => t.eventId === eventId);
    rawTeams = list.filter((t) =>
      categoryId && categoryId !== 'ALL' ? t.categoryId === categoryId : true
    );
  }

  // Filter out any strictly draft/rejected unless in demo where all are viewable
  let visibleTeams = rawTeams.filter((t) => t.status === 'APPROVED');
  if (visibleTeams.length === 0) {
    visibleTeams = rawTeams;
  }

  let sanitized = visibleTeams.map((t) => sanitizeTeamForPublic(t, eventSlug, categoryMap));

  // Search filter if provided
  if (search && search.trim()) {
    const term = search.toLowerCase().trim();
    sanitized = sanitized.filter(
      (p) =>
        p.projectTitle.toLowerCase().includes(term) ||
        p.teamName.toLowerCase().includes(term) ||
        p.teamCode.toLowerCase().includes(term) ||
        p.category.name.toLowerCase().includes(term) ||
        (p.class && p.class.toLowerCase().includes(term)) ||
        (p.technologyUsed && p.technologyUsed.toLowerCase().includes(term)) ||
        (p.stallNumber && p.stallNumber.toLowerCase().includes(term))
    );
  }

  return {
    event: {
      id: eventDoc._id.toString(),
      name: eventDoc.name || eventDoc.title,
      slug: eventDoc.slug,
      description: eventDoc.description,
      eventType: eventDoc.eventType,
      banner: eventDoc.banner || eventDoc.bannerUrl,
      logo: eventDoc.logo,
      venue: eventDoc.venue,
      startDate: eventDoc.startDate,
      endDate: eventDoc.endDate,
      organizer: eventDoc.organizer,
      contact: eventDoc.contact,
      status: eventDoc.status,
    },
    categories: categories.map((c) => ({
      id: c._id ? c._id.toString() : (c as any).id,
      name: c.name,
      description: c.description,
      order: c.order,
    })),
    projects: sanitized,
  };
}

/**
 * Fetch a single public project by its teamCode within an event.
 */
export async function getPublicProjectByTeamCode(
  eventSlugOrId: string,
  teamCode: string
): Promise<{ event: any; project: IPublicProject } | null> {
  const { getEventBySlug, getEventById } = await import('@/services/event');
  const { getCategoriesByEvent } = await import('@/services/category');

  let eventDoc: any = await getEventBySlug(eventSlugOrId);
  if (!eventDoc) {
    eventDoc = await getEventById(eventSlugOrId);
  }

  if (!eventDoc) return null;

  const eventId = eventDoc._id.toString();
  const eventSlug = eventDoc.slug || eventDoc._id.toString();

  // Find team by teamCode (case-insensitive) or by ID
  let teamDoc: any = null;
  const normalizedCode = teamCode.trim().toUpperCase();

  try {
    await connectToDatabase();
    teamDoc = await Team.findOne({
      eventId,
      $or: [
        { teamCode: new RegExp(`^${normalizedCode}$`, 'i') },
        { _id: teamCode.length === 24 ? teamCode : undefined },
      ],
    }).lean();
  } catch {
    // fallback
  }

  if (!teamDoc) {
    const list = getFallbackTeams().filter((t) => t.eventId === eventId);
    teamDoc = list.find(
      (t) =>
        t.teamCode.toUpperCase() === normalizedCode ||
        t._id === teamCode ||
        t.teamCode === teamCode
    );
  }

  if (!teamDoc) return null;

  // Resolve category
  const categories = await getCategoriesByEvent(eventId);
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => {
    categoryMap.set(c._id ? c._id.toString() : (c as any).id, c.name);
  });

  const team: ITeam = {
    ...teamDoc,
    _id: teamDoc._id ? teamDoc._id.toString() : teamDoc.id,
  };

  const sanitized = sanitizeTeamForPublic(team, eventSlug, categoryMap);

  return {
    event: {
      id: eventDoc._id.toString(),
      name: eventDoc.name || eventDoc.title,
      slug: eventDoc.slug,
      description: eventDoc.description,
      eventType: eventDoc.eventType,
      banner: eventDoc.banner || eventDoc.bannerUrl,
      venue: eventDoc.venue,
      startDate: eventDoc.startDate,
      endDate: eventDoc.endDate,
      organizer: eventDoc.organizer,
      contact: eventDoc.contact,
      status: eventDoc.status,
    },
    project: sanitized,
  };
}
