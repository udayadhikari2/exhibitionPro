import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.substring(0, eqIdx).trim();
          let val = trimmed.substring(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/exhibition_portal';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Administrator';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin.exhibition.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'exhibition@123';

async function run() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in your .env.local file.');
    process.exit(1);
  }

  console.log(`Connecting to database at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  const UserSchema = new mongoose.Schema(
    {
      name: String,
      email: { type: String, unique: true },
      passwordHash: String,
      role: String,
      status: String,
      institution: String,
    },
    { timestamps: true }
  );

  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'SUPER_ADMIN';
    existing.status = 'ACTIVE';
    existing.name = ADMIN_NAME;
    await existing.save();
    console.log(`✓ SUPER_ADMIN (${ADMIN_EMAIL}) password and role successfully updated!`);
    await mongoose.disconnect();
    process.exit(0);
  }

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase().trim(),
    passwordHash,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    institution: 'Exhibition Steering Committee',
  });

  console.log(`✓ SUPER_ADMIN (${ADMIN_EMAIL}) successfully seeded!`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
