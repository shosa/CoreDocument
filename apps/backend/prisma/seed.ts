import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create users
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

  const user = await prisma.user.upsert({
    where: { email: 'user@coredocument.com' },
    update: {},
    create: {
      email: 'user@coredocument.com',
      password: await bcrypt.hash('user123', 10),
      name: 'Utente Standard',
      role: 'USER',
    },
  });

  console.log('✅ Users created');

  // Create example documents with realistic data
  const suppliers = [
    'Tessuti_Milano_SRL',
    'Forniture_Industriali_SpA',
    'ABC_Tessuti',
    'XYZ_Materiali',
    'Delta_Logistics',
    'Gamma_Supply',
    'Omega_Forniture',
    'Beta_Tessuti_SRL',
  ];

  const documents = [];
  const now = new Date();

  // Create 30 documents distributed over the last 12 months
  for (let i = 0; i < 30; i++) {
    const monthsAgo = Math.floor(Math.random() * 12);
    const daysAgo = Math.floor(Math.random() * 28);
    const date = new Date(now);
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(date.getDate() - daysAgo);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    const docNumber = `DDT-${year}-${String(i + 1).padStart(3, '0')}`;
    const fileExtension = Math.random() > 0.7 ? 'jpg' : 'pdf';
    const fileName = `${supplier} ${docNumber}.${fileExtension}`;
    const minioKey = `documents/${year}/${month}/${day}/${fileName}`;

    const doc = await prisma.document.create({
      data: {
        filename: fileName,
        minioKey: minioKey,
        supplier: supplier.replace(/_/g, ' '),
        docNumber: docNumber,
        date: date,
        fileSize: Math.floor(Math.random() * 5000000) + 100000, // 100KB - 5MB
        mimeType: fileExtension === 'pdf' ? 'application/pdf' : 'image/jpeg',
        uploadedById: Math.random() > 0.5 ? admin.id : user.id,
      },
    });

    documents.push(doc);
  }

  console.log(`✅ ${documents.length} documents created`);

  // Create some favorites (admin favorites 5 documents, user favorites 3)
  const adminFavorites = documents.slice(0, 5);
  for (const doc of adminFavorites) {
    await prisma.favorite.create({
      data: {
        userId: admin.id,
        documentId: doc.id,
      },
    });
  }

  const userFavorites = documents.slice(10, 13);
  for (const doc of userFavorites) {
    await prisma.favorite.create({
      data: {
        userId: user.id,
        documentId: doc.id,
      },
    });
  }

  console.log('✅ Favorites created');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log('  👤 Admin user:');
  console.log('     Email: admin@coredocument.com');
  console.log('     Password: admin123');
  console.log('     Role: ADMIN');
  console.log('  👤 Standard user:');
  console.log('     Email: user@coredocument.com');
  console.log('     Password: user123');
  console.log('     Role: USER');
  console.log(`  📄 Documents: ${documents.length}`);
  console.log(`  ⭐ Favorites: ${adminFavorites.length + userFavorites.length}`);
  console.log(`  🏢 Suppliers: ${suppliers.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
