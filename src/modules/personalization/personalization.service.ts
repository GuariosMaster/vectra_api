import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { uploadImage } from '../../utils/cloudinary.js';
import { sendEmail, personalizationConfirmationEmail } from '../../utils/email.js';
import type { CreatePersonalizationBody, UpdatePersonalizationBody, PersonalizationQuery } from './personalization.schemas.js';

export async function submitRequest(body: CreatePersonalizationBody, imageBuffer?: Buffer, userId?: string) {
  let referenceImage: string | undefined;

  if (imageBuffer) {
    const { url } = await uploadImage(imageBuffer, 'vectra/personalization');
    referenceImage = url;
  }

  const request = await prisma.personalizationRequest.create({
    data: {
      ...body,
      referenceImage: referenceImage ?? null,
      userId: userId ?? null,
    },
  });

  // Send confirmation email (non-blocking)
  sendEmail({
    to: body.email,
    subject: body.lang === 'ES' ? 'Solicitud de personalización recibida — Vectra 3D' : 'Personalization request received — Vectra 3D',
    html: personalizationConfirmationEmail(body.name, body.lang),
  }).catch(() => {}); // fire-and-forget

  return request;
}

export async function listRequests(query: PersonalizationQuery) {
  const { page, limit, skip } = getPagination({ page: String(query.page), limit: String(query.limit) });

  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.personalizationRequest.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true, firstName: true } } },
    }),
    prisma.personalizationRequest.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getRequest(id: string) {
  const req = await prisma.personalizationRequest.findUnique({
    where: { id },
    include: { user: { select: { email: true, firstName: true } } },
  });
  if (!req) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Request not found');
  return req;
}

export async function updateRequest(id: string, body: UpdatePersonalizationBody) {
  const existing = await prisma.personalizationRequest.findUnique({ where: { id } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Request not found');

  return prisma.personalizationRequest.update({
    where: { id },
    data: {
      ...body,
      quotedPrice: body.quotedPrice !== undefined ? new Decimal(body.quotedPrice) : undefined,
    },
  });
}

export async function deleteRequest(id: string) {
  const existing = await prisma.personalizationRequest.findUnique({ where: { id } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Request not found');
  await prisma.personalizationRequest.delete({ where: { id } });
}
