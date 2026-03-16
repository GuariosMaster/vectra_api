import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@vectra.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      firstName: 'Admin',
      lastName: 'Vectra',
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Categories
  const categories = [
    { slug: 'figures', nameEs: 'Figuras', nameEn: 'Figures' },
    { slug: 'miniatures', nameEs: 'Miniaturas', nameEn: 'Miniatures' },
    { slug: 'accessories', nameEs: 'Accesorios', nameEn: 'Accessories' },
    { slug: 'home-decor', nameEs: 'Decoración del hogar', nameEn: 'Home Decor' },
    { slug: 'custom', nameEs: 'Personalizado', nameEn: 'Custom' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ ${categories.length} categories created`);

  // Tags
  const tags = [
    { slug: 'fantasy', nameEs: 'Fantasía', nameEn: 'Fantasy' },
    { slug: 'sci-fi', nameEs: 'Ciencia Ficción', nameEn: 'Sci-Fi' },
    { slug: 'rpg', nameEs: 'RPG', nameEn: 'RPG' },
    { slug: 'painted', nameEs: 'Pintado', nameEn: 'Painted' },
    { slug: 'resin', nameEs: 'Resina', nameEn: 'Resin' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log(`✅ ${tags.length} tags created`);

  // Sample settings
  const settings = [
    { key: 'store_name', value: 'Vectra 3D' },
    { key: 'store_email', value: adminEmail },
    { key: 'store_phone', value: '+54 11 0000-0000' },
    { key: 'shipping_fee', value: '500' },
    { key: 'free_shipping_threshold', value: '5000' },
    { key: 'instagram_url', value: 'https://instagram.com/vectra3d' },
    { key: 'whatsapp_number', value: '+5491100000000' },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`✅ ${settings.length} settings created`);

  // Sample product
  const figuresCat = await prisma.category.findUnique({ where: { slug: 'figures' } });
  if (figuresCat) {
    await prisma.product.upsert({
      where: { slug: 'dragon-guardian' },
      update: {},
      create: {
        slug: 'dragon-guardian',
        nameEs: 'Dragón Guardián',
        nameEn: 'Dragon Guardian',
        shortDescEs: 'Figura de dragón impresa en 3D de alta calidad',
        shortDescEn: 'High quality 3D printed dragon figure',
        descriptionEs: 'Increíble figura de dragón guardián impresa en resina de alta calidad. Perfecta para coleccionistas y jugadores de rol.',
        descriptionEn: 'Amazing guardian dragon figure printed in high quality resin. Perfect for collectors and role players.',
        price: 2500,
        comparePrice: 3000,
        stock: 10,
        inStock: true,
        featured: true,
        material: 'Resina UV',
        dimensions: '15cm x 10cm x 12cm',
        weight: '200g',
        printTime: '8 horas',
        categoryId: figuresCat.id,
      },
    });
    console.log('✅ Sample product created');
  }

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
