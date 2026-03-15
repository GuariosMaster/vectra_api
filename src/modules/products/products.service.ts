import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { uploadImage } from '../../utils/cloudinary.js';
import type { CreateProductBody, UpdateProductBody, ProductQuery } from './products.schemas.js';

const productInclude = {
  category: true,
  images: { orderBy: { order: 'asc' as const } },
  tags: { include: { tag: true } },
};

export async function listProducts(query: ProductQuery) {
  const { page, limit, skip } = getPagination({ page: String(query.page), limit: String(query.limit) });

  const where: Record<string, unknown> = {};
  if (query.category) where.category = { slug: query.category };
  if (query.featured === 'true') where.featured = true;
  if (query.inStock === 'true') where.inStock = true;
  if (query.search) {
    where.OR = [
      { nameEs: { contains: query.search, mode: 'insensitive' } },
      { nameEn: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: productInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });
  if (!product) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Product not found');
  return product;
}

export async function createProduct(body: CreateProductBody, imageBuffers?: Buffer[]) {
  const { tagIds, ...data } = body;

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, 'Slug already exists');

  const product = await prisma.product.create({
    data: {
      ...data,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
    include: productInclude,
  });

  if (imageBuffers?.length) {
    const uploads = await Promise.all(
      imageBuffers.map((buf, i) => uploadImage(buf, 'vectra/products', `${product.id}-${i}`))
    );
    await prisma.productImage.createMany({
      data: uploads.map((u, i) => ({ url: u.url, order: i, productId: product.id })),
    });
  }

  return prisma.product.findUnique({ where: { id: product.id }, include: productInclude });
}

export async function updateProduct(id: string, body: UpdateProductBody, imageBuffers?: Buffer[]) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Product not found');

  const { tagIds, ...data } = body;

  await prisma.product.update({
    where: { id },
    data: {
      ...data,
      price: data.price,
      comparePrice: data.comparePrice ?? undefined,
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId) => ({ tagId })),
        },
      }),
    },
  });

  if (imageBuffers?.length) {
    const uploads = await Promise.all(
      imageBuffers.map((buf, i) => uploadImage(buf, 'vectra/products', `${id}-new-${Date.now()}-${i}`))
    );
    await prisma.productImage.createMany({
      data: uploads.map((u, i) => ({ url: u.url, order: i, productId: id })),
    });
  }

  return prisma.product.findUnique({ where: { id }, include: productInclude });
}

export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Product not found');
  await prisma.product.delete({ where: { id } });
}
