import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@coredocument.com' },
    update: {},
    create: {
      email: 'admin@coredocument.com',
      password: hashedPassword,
      name: 'Admin CoreDocument',
      role: 'ADMIN',
    },
  });

  console.log('✅ Seed completed');
  console.log('Admin user created:');
  console.log('  Email:', admin.email);
  console.log('  Password: admin123');
  console.log('  Role:', admin.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
