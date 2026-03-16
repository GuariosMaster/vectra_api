import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import crypto from 'crypto';

function getMpClient() {
  if (!env.MP_ACCESS_TOKEN) {
    throw new AppError(HTTP_STATUS.INTERNAL, ERROR_CODES.INTERNAL_ERROR, 'MercadoPago not configured');
  }
  return new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
}

export async function createMpPreference(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shippingAddr: true },
  });

  if (!order) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Order not found');
  }

  const client = getMpClient();
  const preference = new Preference(client);

  // localhost URLs are not accepted by MercadoPago for back_urls/webhooks
  const isPublic = (url: string) => !url.includes('localhost') && !url.includes('127.0.0.1');
  const frontendIsPublic = isPublic(env.FRONTEND_URL);
  const apiIsPublic = isPublic(env.API_URL);

  const result = await preference.create({
    body: {
      external_reference: order.id,
      items: order.items.map((item) => ({
        id: item.productId,
        title: item.productName,
        unit_price: Number(item.unitPrice),
        quantity: item.quantity,
        currency_id: 'COP',
      })),
      payer: order.shippingAddr
        ? {
            name: order.shippingAddr.firstName,
            surname: order.shippingAddr.lastName,
            email: order.shippingAddr.email,
            phone: { number: order.shippingAddr.phone },
            address: {
              street_name: order.shippingAddr.address,
              zip_code: order.shippingAddr.postalCode,
            },
          }
        : undefined,
      ...(frontendIsPublic && {
        back_urls: {
          success: `${env.FRONTEND_URL}/orders?id=${order.id}&status=success`,
          failure: `${env.FRONTEND_URL}/orders?id=${order.id}&status=failure`,
          pending: `${env.FRONTEND_URL}/orders?id=${order.id}&status=pending`,
        },
        auto_return: 'approved' as const,
      }),
      ...(apiIsPublic && {
        notification_url: `${env.API_URL}/api/v1/payments/mp/webhook`,
      }),
    },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentMethod: 'MERCADOPAGO' },
  });

  // TEST tokens must use sandbox_init_point; PROD tokens use init_point
  const isSandbox = env.MP_ACCESS_TOKEN!.startsWith('TEST-');
  const checkoutUrl = isSandbox ? result.sandbox_init_point! : result.init_point!;

  return { preferenceId: result.id, checkoutUrl };
}

export async function handleMpWebhook(body: Record<string, unknown>, signature: string | undefined) {
  // Validate webhook signature if secret is configured
  if (env.MP_WEBHOOK_SECRET && signature) {
    const expected = crypto
      .createHmac('sha256', env.MP_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest('hex');
    if (signature !== expected) {
      throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Invalid webhook signature');
    }
  }

  const topic = body.type ?? body.topic;
  if (topic !== 'payment') return { processed: false };

  const paymentId = String(
    (body as { data?: { id?: unknown } }).data?.id ?? body.id
  );
  if (!paymentId) return { processed: false };

  const client = getMpClient();
  const paymentClient = new Payment(client);
  const payment = await paymentClient.get({ id: paymentId });

  const orderId = payment.external_reference;
  if (!orderId) return { processed: false };

  const mpStatus = payment.status;
  const paymentStatus = mpStatus === 'approved' ? 'PAID' : mpStatus === 'rejected' ? 'FAILED' : 'PENDING';

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentId: String(paymentId),
      paymentStatus: paymentStatus as 'PAID' | 'FAILED' | 'PENDING',
      ...(paymentStatus === 'PAID' && { status: 'CONFIRMED' }),
    },
  });

  return { processed: true, orderId, paymentStatus };
}
