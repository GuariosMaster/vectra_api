import { prisma } from '../../config/database.js';

export async function getSettings() {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function updateSettings(data: Record<string, string>) {
  const ops = Object.entries(data).map(([key, value]) =>
    prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  );
  await prisma.$transaction(ops);
  return getSettings();
}
