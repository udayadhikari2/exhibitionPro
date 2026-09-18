import { connectToDatabase } from '@/lib/mongodb';
import { Event } from '@/models/Event';
import { IEvent, EventStatus, EVENT_STATUS_FLOW } from '@/types';
import { DEMO_EVENTS } from '@/lib/seed-data';

// Helper to generate a slug from event name
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${rand}`;
}

// Validate event status transitions
export function isValidStatusTransition(currentStatus: EventStatus, targetStatus: EventStatus): { valid: boolean; reason?: string } {
  if (currentStatus === targetStatus) return { valid: true };
  if (targetStatus === 'ARCHIVED') return { valid: true }; // Any status can be archived

  const currentIndex = EVENT_STATUS_FLOW.indexOf(currentStatus);
  const targetIndex = EVENT_STATUS_FLOW.indexOf(targetStatus);

  if (targetIndex === -1) {
    return { valid: false, reason: `Unknown target status: ${targetStatus}` };
  }

  // Strictly sequential: forward by 1 step or back by 1 step
  if (targetIndex === currentIndex + 1 || targetIndex === currentIndex - 1) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid transition: cannot change status directly from ${currentStatus} to ${targetStatus}. Must follow sequential progression (${EVENT_STATUS_FLOW[currentIndex]} -> ${EVENT_STATUS_FLOW[currentIndex + 1] || 'COMPLETED'}).`,
  };
}

// In-Memory store fallback cache
function getFallbackEvents(): IEvent[] {
  if (!global.portalMemoryStore) {
    // initialize if needed
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore?.events || (DEMO_EVENTS as unknown as IEvent[]);
}

export async function getAllEvents(options?: {
  status?: string;
  eventType?: string;
  search?: string;
  includeArchived?: boolean;
}): Promise<IEvent[]> {
  try {
    await connectToDatabase();
    const query: any = {};

    if (options?.status) {
      query.status = options.status;
    } else if (!options?.includeArchived) {
      query.status = { $ne: 'ARCHIVED' };
    }

    if (options?.eventType) {
      query.eventType = options.eventType;
    }

    if (options?.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
        { venue: { $regex: options.search, $options: 'i' } },
      ];
    }

    const events = await Event.find(query).sort({ createdAt: -1 }).lean();
    if (events && events.length > 0) {
      return events.map((e) => ({
        ...e,
        name: e.name || (e as any).title,
        title: e.name || (e as any).title,
        banner: e.banner || (e as any).bannerUrl,
        bannerUrl: e.banner || (e as any).bannerUrl,
      })) as unknown as IEvent[];
    }
  } catch (err) {
    // Fallback to in-memory store
  }

  let events = getFallbackEvents().map((e) => ({
    ...e,
    name: e.name || (e as any).title,
    title: e.name || (e as any).title,
    banner: e.banner || (e as any).bannerUrl,
    bannerUrl: e.banner || (e as any).bannerUrl,
  }));

  if (options?.status) {
    events = events.filter((e) => e.status === options.status);
  } else if (!options?.includeArchived) {
    events = events.filter((e) => e.status !== 'ARCHIVED');
  }

  if (options?.eventType) {
    events = events.filter((e) => e.eventType.toLowerCase() === options.eventType!.toLowerCase());
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    events = events.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q)
    );
  }

  return events;
}

export async function getEventById(id: string): Promise<IEvent | null> {
  try {
    await connectToDatabase();
    const event = await Event.findById(id).lean();
    if (event) {
      return {
        ...event,
        name: event.name || (event as any).title,
        title: event.name || (event as any).title,
        banner: event.banner || (event as any).bannerUrl,
        bannerUrl: event.banner || (event as any).bannerUrl,
      } as unknown as IEvent;
    }
  } catch (err) {
    // Fallback
  }

  const fallback = getFallbackEvents().find((e) => e._id === id || e.slug === id);
  if (fallback) {
    return {
      ...fallback,
      name: fallback.name || (fallback as any).title,
      title: fallback.name || (fallback as any).title,
      banner: fallback.banner || (fallback as any).bannerUrl,
      bannerUrl: fallback.banner || (fallback as any).bannerUrl,
    };
  }
  return null;
}

export async function getEventBySlug(slug: string): Promise<IEvent | null> {
  try {
    await connectToDatabase();
    const event = await Event.findOne({ slug: slug.toLowerCase() }).lean();
    if (event) {
      return {
        ...event,
        name: event.name || (event as any).title,
        title: event.name || (event as any).title,
        banner: event.banner || (event as any).bannerUrl,
        bannerUrl: event.banner || (event as any).bannerUrl,
      } as unknown as IEvent;
    }
  } catch (err) {
    // Fallback
  }

  const fallback = getFallbackEvents().find((e) => e.slug === slug || e._id === slug);
  if (fallback) {
    return {
      ...fallback,
      name: fallback.name || (fallback as any).title,
      title: fallback.name || (fallback as any).title,
      banner: fallback.banner || (fallback as any).bannerUrl,
      bannerUrl: fallback.banner || (fallback as any).bannerUrl,
    };
  }
  return null;
}

export async function createEvent(data: Partial<IEvent>, creatorId: string): Promise<IEvent> {
  const name = (data.name || data.title || '').trim();
  const slug = data.slug ? data.slug.toLowerCase().trim() : generateSlug(name);

  const eventPayload: Partial<IEvent> = {
    name,
    title: name,
    slug,
    description: data.description || '',
    eventType: data.eventType || 'Science',
    banner: data.banner || data.bannerUrl || '',
    bannerUrl: data.banner || data.bannerUrl || '',
    logo: data.logo || '',
    venue: data.venue || 'Exhibition Hall',
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || new Date().toISOString(),
    registrationStart: data.registrationStart || '',
    registrationEnd: data.registrationEnd || '',
    organizer: data.organizer || '',
    contact: data.contact || '',
    status: 'DRAFT',
    maxTeamSize: data.maxTeamSize || 4,
    minTeamSize: data.minTeamSize || 1,
    rules: data.rules || '',
    allowPublicFeedback: data.allowPublicFeedback !== false,
    createdBy: creatorId,
  };

  try {
    await connectToDatabase();
    const created = await Event.create(eventPayload);
    return created.toObject() as unknown as IEvent;
  } catch (err) {
    // In-memory fallback
  }

  const newEvent: IEvent = {
    ...(eventPayload as IEvent),
    _id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const store = getFallbackEvents();
  store.unshift(newEvent);
  return newEvent;
}

export async function updateEvent(id: string, data: Partial<IEvent>): Promise<IEvent | null> {
  const updateData = { ...data };
  if (updateData.name && !updateData.title) updateData.title = updateData.name;
  if (updateData.title && !updateData.name) updateData.name = updateData.title;
  if (updateData.banner && !updateData.bannerUrl) updateData.bannerUrl = updateData.banner;
  if (updateData.bannerUrl && !updateData.banner) updateData.banner = updateData.bannerUrl;

  try {
    await connectToDatabase();
    const updated = await Event.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (updated) return updated as unknown as IEvent;
  } catch (err) {
    // In-memory fallback
  }

  const events = getFallbackEvents();
  const idx = events.findIndex((e) => e._id === id);
  if (idx !== -1) {
    events[idx] = { ...events[idx], ...updateData };
    return events[idx];
  }
  return null;
}

export async function archiveEvent(id: string): Promise<IEvent | null> {
  return updateEvent(id, { status: 'ARCHIVED' });
}

export async function changeEventStatus(
  id: string,
  newStatus: EventStatus
): Promise<{ success: boolean; event?: IEvent; error?: string }> {
  const existing = await getEventById(id);
  if (!existing) {
    return { success: false, error: 'Event not found' };
  }

  const validation = isValidStatusTransition(existing.status, newStatus);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const updated = await updateEvent(id, { status: newStatus });
  if (!updated) {
    return { success: false, error: 'Failed to update event status' };
  }

  return { success: true, event: updated };
}
