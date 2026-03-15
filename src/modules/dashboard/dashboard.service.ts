import { prisma } from '../../config/database.js';

export async function getDashboardStats() {
  const [
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue,
    recentOrders,
    lowStock,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: 'PAID' },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        items: true,
      },
    }),
    prisma.product.findMany({
      where: { stock: { lte: 5 } },
      select: { id: true, nameEs: true, stock: true, slug: true },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
  ]);

  return {
    totals: {
      products: totalProducts,
      users: totalUsers,
      orders: totalOrders,
      revenue: totalRevenue._sum.total ?? 0,
    },
    recentOrders,
    lowStock,
  };
}
