import { prisma } from '../../config/database.js';

export async function listCategories() {
  return prisma.category.findMany({ orderBy: { nameEs: 'asc' } });
}
