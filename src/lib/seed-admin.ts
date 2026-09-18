import bcrypt from 'bcryptjs';
import { User } from '@/models/User';
import { connectToDatabase } from './mongodb';

export async function seedSuperAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Super Administrator';

  if (!adminEmail || !adminPassword) {
    console.warn(
      '[Seed] ADMIN_EMAIL or ADMIN_PASSWORD not configured in environment. Skipping initial admin seed.'
    );
    return null;
  }

  try {
    await connectToDatabase();
    const existing = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existing) {
      return existing;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      institution: 'Exhibition Steering Committee',
    });

    console.log(`[Seed] Initial SUPER_ADMIN account successfully seeded: ${adminEmail}`);
    return newAdmin;
  } catch (err: any) {
    console.error('[Seed] Error seeding initial admin:', err.message);
    return null;
  }
}
