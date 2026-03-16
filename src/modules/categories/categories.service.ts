import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { nameEs: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategory(data: { slug: string; nameEs: string }) {
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, 'Ya existe una categoría con ese slug');
  return prisma.category.create({
    data: { slug: data.slug, nameEs: data.nameEs, nameEn: data.nameEs },
  });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Categoría no encontrada');
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) throw new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, `No se puede eliminar: ${count} producto(s) usan esta categoría`);
  await prisma.category.delete({ where: { id } });
}
