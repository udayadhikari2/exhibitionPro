import { connectToDatabase } from '@/lib/mongodb';
import { EvaluationCriteria } from '@/models/EvaluationCriteria';
import { Category } from '@/models/Category';
import { IEvaluationCriterion, CriterionStatus } from '@/types';

function getMemoryStore() {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore!;
}

export const CRITERIA_PRESETS: Record<
  string,
  { name: string; description: string; maxMarks: number; minMarks: number; weight: number }[]
> = {
  Science: [
    {
      name: 'Innovation & Originality',
      description: 'Novelty of concept, creative problem-solving, and unique perspective on scientific challenges.',
      maxMarks: 20,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Scientific Methodology',
      description: 'Systematic inquiry, hypothesis formulation, control variables, and data integrity.',
      maxMarks: 20,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Working Prototype & Execution',
      description: 'Reliability of functional model, engineering build quality, and demonstrable mechanics.',
      maxMarks: 20,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Presentation & Demonstration',
      description: 'Clarity of explanation, quality of visual aids, display booth organization, and verbal defense.',
      maxMarks: 20,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Q&A & Conceptual Mastery',
      description: 'Depth of understanding during judge probing, handling edge cases, and future roadmap.',
      maxMarks: 20,
      minMarks: 0,
      weight: 1,
    },
  ],
  IT: [
    {
      name: 'Software Architecture & Code Quality',
      description: 'Clean code, modular design patterns, maintainability, and proper API design.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'User Experience & Interface',
      description: 'Intuitive navigation, responsiveness, accessibility, and visual polish.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Innovation & Problem Solving',
      description: 'Practicality of the solution, algorithms employed, and real-world applicability.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Security, Scalability & Performance',
      description: 'Authentication safety, data protection, response latency, and database efficiency.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
  ],
  Robotics: [
    {
      name: 'Mechanical & Structural Design',
      description: 'Durability, chassis balance, gear ratios, and material optimization.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Circuitry & Sensor Integration',
      description: 'Wiring hygiene, microcontrollers, sensor calibrations, and power management.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Autonomy & Algorithmic Logic',
      description: 'Autonomous closed-loop navigation, PID tuning, computer vision, and state machines.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Task Performance & Speed',
      description: 'Precision under obstacle runs, payload delivery accuracy, and cycle completion time.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
  ],
  Cultural: [
    {
      name: 'Artistic Mastery & Technique',
      description: 'Execution accuracy, posture, rhythm adherence, vocal timbre, or stroke precision.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Expression & Stage Presence',
      description: 'Emotional resonance, poise, crowd engagement, and communicative dynamism.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Theme Interpretation & Originality',
      description: 'Adherence to festival theme, creative nuances, costume relevance, and cultural authenticity.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
    {
      name: 'Overall Impression & Synchronization',
      description: 'Overall aesthetic impact, timing coordination, and presentation finesse.',
      maxMarks: 25,
      minMarks: 0,
      weight: 1,
    },
  ],
};

export async function getCriteria(
  eventId: string,
  categoryId?: string | null
): Promise<{
  criteria: IEvaluationCriterion[];
  totalMaxMarks: number;
  eventWideCount: number;
  categorySpecificCount: number;
}> {
  try {
    await connectToDatabase();
    const query: any = { eventId };

    if (categoryId && categoryId !== 'ALL') {
      if (categoryId === 'EVENT_WIDE') {
        query.$or = [{ categoryId: null }, { categoryId: { $exists: false } }, { categoryId: '' }];
      } else {
        // Return both event-wide AND this specific category
        query.$or = [
          { categoryId: null },
          { categoryId: { $exists: false } },
          { categoryId: '' },
          { categoryId },
        ];
      }
    }

    const rawList = await EvaluationCriteria.find(query).sort({ order: 1, createdAt: 1 }).lean();

    // Map category names
    const catIds = Array.from(new Set(rawList.map((c: any) => c.categoryId).filter(Boolean)));
    const categories = await Category.find({ _id: { $in: catIds } }).lean();
    const catMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]));

    let eventWideCount = 0;
    let categorySpecificCount = 0;
    let totalMaxMarks = 0;

    const criteria: IEvaluationCriterion[] = rawList.map((c: any) => {
      const isEventWide = !c.categoryId;
      if (isEventWide) {
        eventWideCount++;
      } else {
        categorySpecificCount++;
      }
      if (c.status !== 'INACTIVE') {
        totalMaxMarks += Number(c.maxMarks) || 0;
      }

      return {
        _id: c._id.toString(),
        eventId: c.eventId,
        categoryId: c.categoryId || null,
        categoryName: c.categoryId ? catMap.get(c.categoryId) || 'Category' : 'Event-Wide',
        name: c.name,
        description: c.description || '',
        maxMarks: c.maxMarks,
        minMarks: c.minMarks ?? 0,
        weight: c.weight ?? 1,
        order: c.order ?? 1,
        required: c.required ?? true,
        isRequired: c.required ?? true,
        status: (c.status as CriterionStatus) || 'ACTIVE',
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      };
    });

    return { criteria, totalMaxMarks, eventWideCount, categorySpecificCount };
  } catch {
    const store = getMemoryStore();
    let list = (store.criteria || []).filter((c: any) => c.eventId === eventId);

    if (categoryId && categoryId !== 'ALL') {
      if (categoryId === 'EVENT_WIDE') {
        list = list.filter((c: any) => !c.categoryId);
      } else {
        list = list.filter((c: any) => !c.categoryId || c.categoryId === categoryId);
      }
    }

    list = [...list].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const catMap = new Map((store.categories || []).map((c: any) => [c._id, c.name]));
    let eventWideCount = 0;
    let categorySpecificCount = 0;
    let totalMaxMarks = 0;

    const criteria: IEvaluationCriterion[] = list.map((c: any) => {
      const isEventWide = !c.categoryId;
      if (isEventWide) eventWideCount++;
      else categorySpecificCount++;

      if (c.status !== 'INACTIVE') {
        totalMaxMarks += Number(c.maxMarks) || 0;
      }

      return {
        _id: c._id,
        eventId: c.eventId,
        categoryId: c.categoryId || null,
        categoryName: c.categoryId ? catMap.get(c.categoryId) || 'Category' : 'Event-Wide',
        name: c.name,
        description: c.description || '',
        maxMarks: c.maxMarks,
        minMarks: c.minMarks ?? 0,
        weight: c.weight ?? 1,
        order: c.order ?? 1,
        required: c.required ?? true,
        isRequired: c.required ?? true,
        status: (c.status as CriterionStatus) || 'ACTIVE',
      };
    });

    return { criteria, totalMaxMarks, eventWideCount, categorySpecificCount };
  }
}

export async function createCriterion(data: {
  eventId: string;
  categoryId?: string | null;
  name: string;
  description?: string;
  maxMarks: number;
  minMarks?: number;
  weight?: number;
  order?: number;
  required?: boolean;
}): Promise<IEvaluationCriterion> {
  const minMarks = data.minMarks ?? 0;
  const weight = data.weight ?? 1;
  const required = data.required ?? true;

  try {
    await connectToDatabase();

    let order = data.order;
    if (order === undefined) {
      const last = await EvaluationCriteria.findOne({ eventId: data.eventId }).sort({ order: -1 }).lean();
      order = last && (last as any).order ? (last as any).order + 1 : 1;
    }

    const created = await EvaluationCriteria.create({
      eventId: data.eventId,
      categoryId: data.categoryId || null,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      maxMarks: Number(data.maxMarks),
      minMarks: Number(minMarks),
      weight: Number(weight),
      order: Number(order),
      required,
      status: 'ACTIVE',
    });

    return {
      _id: created._id.toString(),
      eventId: created.eventId,
      categoryId: created.categoryId,
      name: created.name,
      description: created.description,
      maxMarks: created.maxMarks,
      minMarks: created.minMarks,
      weight: created.weight,
      order: created.order,
      required: created.required,
      isRequired: created.required,
      status: created.status,
    };
  } catch {
    const store = getMemoryStore();
    if (!store.criteria) store.criteria = [];

    const existingForEvent = store.criteria.filter((c: any) => c.eventId === data.eventId);
    const order = data.order ?? existingForEvent.length + 1;

    const newCrit: any = {
      _id: `crit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: data.eventId,
      categoryId: data.categoryId || null,
      name: data.name.trim(),
      description: data.description?.trim() || '',
      maxMarks: Number(data.maxMarks),
      minMarks: Number(minMarks),
      weight: Number(weight),
      order: Number(order),
      required,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    store.criteria.push(newCrit);
    return newCrit;
  }
}

export async function updateCriterion(
  id: string,
  update: {
    name?: string;
    description?: string;
    categoryId?: string | null;
    maxMarks?: number;
    minMarks?: number;
    weight?: number;
    order?: number;
    required?: boolean;
    status?: CriterionStatus;
  }
): Promise<IEvaluationCriterion | null> {
  try {
    await connectToDatabase();
    const clean: any = {};
    if (update.name !== undefined) clean.name = update.name.trim();
    if (update.description !== undefined) clean.description = update.description.trim();
    if (update.categoryId !== undefined) clean.categoryId = update.categoryId || null;
    if (update.maxMarks !== undefined) clean.maxMarks = Number(update.maxMarks);
    if (update.minMarks !== undefined) clean.minMarks = Number(update.minMarks);
    if (update.weight !== undefined) clean.weight = Number(update.weight);
    if (update.order !== undefined) clean.order = Number(update.order);
    if (update.required !== undefined) clean.required = update.required;
    if (update.status !== undefined) clean.status = update.status;

    const updated: any = await EvaluationCriteria.findByIdAndUpdate(id, clean, { new: true }).lean();
    if (!updated) return null;

    return {
      _id: updated._id.toString(),
      eventId: (updated as any).eventId,
      categoryId: (updated as any).categoryId,
      name: (updated as any).name,
      description: (updated as any).description,
      maxMarks: (updated as any).maxMarks,
      minMarks: (updated as any).minMarks,
      weight: (updated as any).weight,
      order: (updated as any).order,
      required: (updated as any).required,
      isRequired: (updated as any).required,
      status: (updated as any).status,
    };
  } catch {
    const store = getMemoryStore();
    const idx = (store.criteria || []).findIndex((c: any) => c._id === id);
    if (idx === -1) return null;

    store.criteria[idx] = {
      ...store.criteria[idx],
      ...update,
    };
    return store.criteria[idx];
  }
}

export async function deleteCriterion(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await EvaluationCriteria.findByIdAndDelete(id);
    return !!res;
  } catch {
    const store = getMemoryStore();
    const initLen = (store.criteria || []).length;
    store.criteria = (store.criteria || []).filter((c: any) => c._id !== id);
    return store.criteria.length < initLen;
  }
}

export async function reorderCriteria(eventId: string, orderedIds: string[]): Promise<boolean> {
  try {
    await connectToDatabase();
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, eventId },
        update: { $set: { order: index + 1 } },
      },
    }));
    if (bulkOps.length > 0) {
      await EvaluationCriteria.bulkWrite(bulkOps);
    }
    return true;
  } catch {
    const store = getMemoryStore();
    orderedIds.forEach((id, index) => {
      const crit = (store.criteria || []).find((c: any) => c._id === id);
      if (crit) {
        crit.order = index + 1;
      }
    });
    return true;
  }
}

export async function applyCriteriaPreset(
  eventId: string,
  presetKey: string
): Promise<{ added: number; criteria: IEvaluationCriterion[] }> {
  const preset = CRITERIA_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Preset "${presetKey}" not found`);
  }

  const added: IEvaluationCriterion[] = [];
  let order = 1;

  for (const item of preset) {
    const created = await createCriterion({
      eventId,
      name: item.name,
      description: item.description,
      maxMarks: item.maxMarks,
      minMarks: item.minMarks,
      weight: item.weight,
      order,
    });
    added.push(created);
    order++;
  }

  return { added: added.length, criteria: added };
}
