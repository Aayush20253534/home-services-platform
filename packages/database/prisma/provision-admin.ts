import { config } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient, UserRole } from '@prisma/client';

config({ path: resolve(process.cwd(), '../../.env'), override: false, quiet: true });

async function run() {
  const number = process.argv[2];
  if (!number || !/^\+[1-9]\d{7,14}$/.test(number)) {
    throw new Error('Usage: pnpm db:provision-admin +919876543210');
  }
  const db = new PrismaClient();
  try {
    const existing = await db.user.findUnique({ where: { phone: number } });
    if (existing && existing.role !== UserRole.ADMIN) {
      throw new Error('Refusing to upgrade an existing customer/provider account to ADMIN');
    }
    const user = await db.user.upsert({
      where: { phone: number },
      create: { phone: number, role: UserRole.ADMIN },
      update: {},
    });
    console.log(`Provisioned administrator ${user.id}. Phone OTP login is now enabled for this account.`);
  } finally {
    await db.$disconnect();
  }
}
void run().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
