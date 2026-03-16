import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import type { CreateOrderBody, UpdateStatusBody, OrderQuery } from './orders.schemas.js';

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VEC-${ts}-${rand}`;
}

const orderInclude = {
  items: { include: { product: { select: { slug: true, nameEs: true } } } },
  shippingAddr: true,
  user: { select: { email: true, firstName: true, lastName: true } },
};

export async function createOrder(body: CreateOrderBody, userId?: string) {
  // Validate products + stock (accepts slug or UUID as productId)
  const productIds = body.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { OR: [{ id: { in: productIds } }, { slug: { in: productIds } }] },
  });

  if (products.length !== productIds.length) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'One or more products not found');
  }

  // Build map keyed by both id and slug for transparent lookup
  const productMap = new Map<string, (typeof products)[0]>();
  for (const p of products) {
    productMap.set(p.id, p);
    productMap.set(p.slug, p);
  }

  for (const item of body.items) {
    const product = productMap.get(item.productId)!;
    if (product.stock < item.quantity) {
      throw new AppError(
        HTTP_STATUS.UNPROCESSABLE,
        ERROR_CODES.INSUFFICIENT_STOCK,
        `Insufficient stock for product: ${product.nameEs}`
      );
    }
  }

  // Calculate totals (always store the real UUID in productId)
  const itemsData = body.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const unitPrice = Number(product.price);
    const subtotal = unitPrice * item.quantity;
    return {
      productId: product.id,
      productName: product.nameEs,
      unitPrice: new Decimal(unitPrice),
      quantity: item.quantity,
      subtotal: new Decimal(subtotal),
    };
  });

  const subtotal = itemsData.reduce((acc, i) => acc + Number(i.subtotal), 0);
  const total = subtotal; // tax/shipping can be added later

  // Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: userId ?? null,
        guestEmail: body.guestEmail ?? null,
        subtotal: new Decimal(subtotal),
        total: new Decimal(total),
        notes: body.notes ?? null,
        items: { create: itemsData },
        shippingAddr: { create: body.shippingAddress },
      },
      include: orderInclude,
    });

    // Decrement stock (resolve to real UUID via map)
    for (const item of body.items) {
      const product = productMap.get(item.productId)!;
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return o;
  });

  return order;
}

export async function listOrders(query: OrderQuery, userId?: string, isAdmin = false) {
  const { page, limit, skip } = getPagination({ page: String(query.page), limit: String(query.limit) });

  const where: Record<string, unknown> = {};
  if (!isAdmin && userId) where.userId = userId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.order.findMany({ where, include: orderInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.order.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getOrder(id: string, userId?: string, isAdmin = false) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Order not found');
  // Guest orders (userId null) are viewable by anyone who knows the UUID
  if (!isAdmin && order.userId !== null && order.userId !== userId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, 'Access denied');
  }
  return order;
}

export async function updateOrderStatus(id: string, body: UpdateStatusBody) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Order not found');
  return prisma.order.update({ where: { id }, data: { status: body.status }, include: orderInclude });
}
