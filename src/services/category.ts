import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/models/Category';
import { ICategory } from '@/types';
import { DEMO_CATEGORIES } from '@/lib/seed-data';

function getFallbackCategories(): ICategory[] {
  if (!global.portalMemoryStore) {
    require('@/lib/dataStore');
  }
  return global.portalMemoryStore?.categories || (DEMO_CATEGORIES as unknown as ICategory[]);
}

export async function getCategoriesByEvent(eventId: string): Promise<ICategory[]> {
  try {
    await connectToDatabase();
    const categories = await Category.find({ eventId }).sort({ order: 1, name: 1 }).lean();
    if (categories && categories.length > 0) {
      return categories as unknown as ICategory[];
    }
  } catch (err) {
    // In-memory fallback
  }

  return getFallbackCategories()
    .filter((c) => c.eventId === eventId)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function createCategory(eventId: string, data: Partial<ICategory>): Promise<ICategory> {
  const categoryPayload: Partial<ICategory> = {
    eventId,
    name: data.name?.trim() || 'New Category',
    description: data.description?.trim() || '',
    code: data.code?.trim() || '',
    order: data.order !== undefined ? Number(data.order) : 0,
    status: data.status || 'ACTIVE',
  };

  try {
    await connectToDatabase();
    const created = await Category.create(categoryPayload);
    return created.toObject() as unknown as ICategory;
  } catch (err) {
    // In-memory fallback
  }

  const newCat: ICategory = {
    ...(categoryPayload as ICategory),
    _id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const list = getFallbackCategories();
  list.push(newCat);
  return newCat;
}

export async function updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
  try {
    await connectToDatabase();
    const updated = await Category.findByIdAndUpdate(id, data, { new: true }).lean();
    if (updated) return updated as unknown as ICategory;
  } catch (err) {
    // In-memory fallback
  }

  const list = getFallbackCategories();
  const idx = list.findIndex((c) => c._id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    return list[idx];
  }
  return null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const res = await Category.findByIdAndDelete(id);
    if (res) return true;
  } catch (err) {
    // In-memory fallback
  }

  const list = getFallbackCategories();
  const initLen = list.length;
  if (global.portalMemoryStore) {
    global.portalMemoryStore.categories = list.filter((c) => c._id !== id);
    return global.portalMemoryStore.categories.length < initLen;
  }
  return true;
}
