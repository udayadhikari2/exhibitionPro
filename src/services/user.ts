import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { IUser, ISessionUser } from '@/types';
import { verifyPassword } from '@/lib/auth';
import { DEMO_USERS } from '@/lib/seed-data';

// Helper to sanitize user object and omit passwordHash
export function sanitizeUser(user: any): ISessionUser {
  return {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'ACTIVE',
    avatar: user.avatar,
    institution: user.institution,
  };
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  const normalized = email.toLowerCase().trim();
  const searchCandidates = [normalized];
  if (normalized === 'admin.exhibition.com') {
    searchCandidates.push('admin@exhibition.com');
  } else if (normalized === 'admin@exhibition.com') {
    searchCandidates.push('admin.exhibition.com');
  }

  try {
    await connectToDatabase();
    const user = await User.findOne({ email: { $in: searchCandidates } }).lean();
    if (user) return user as unknown as IUser;
  } catch (err) {
    // Fallback to in-memory demo users
  }

  const memoryUsers = global.portalMemoryStore?.users || (DEMO_USERS as unknown as IUser[]);
  const fallback = memoryUsers.find((u: any) =>
    searchCandidates.includes(u.email.toLowerCase())
  );
  if (fallback) {
    return {
      ...fallback,
      status: (fallback as any).status || 'ACTIVE',
      createdAt: (fallback as any).createdAt || new Date(),
    } as IUser;
  }

  return null;
}

export async function findUserById(id: string): Promise<ISessionUser | null> {
  try {
    await connectToDatabase();
    const user = await User.findById(id).lean();
    if (user) return sanitizeUser(user);
  } catch (err) {
    // Fallback to in-memory demo users
  }

  const memoryUsers = global.portalMemoryStore?.users || (DEMO_USERS as unknown as IUser[]);
  const fallback = memoryUsers.find((u: any) => u._id === id);
  if (fallback) {
    return sanitizeUser(fallback);
  }

  return null;
}

export async function authenticateWithCredentials(
  emailPlain: string,
  passwordPlain: string
): Promise<{ success: boolean; user?: ISessionUser; error?: string }> {
  if (!emailPlain || !passwordPlain) {
    return { success: false, error: 'Email and password are required' };
  }

  const user = await findUserByEmail(emailPlain);
  if (!user || !user.passwordHash) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Check account status: ACTIVE / INACTIVE
  if (user.status === 'INACTIVE') {
    return {
      success: false,
      error: 'Account is currently deactivated. Please contact the administrator.',
    };
  }

  const passwordMatch = await verifyPassword(passwordPlain, user.passwordHash);
  if (!passwordMatch) {
    return { success: false, error: 'Invalid email or password' };
  }

  return {
    success: true,
    user: sanitizeUser(user),
  };
}
