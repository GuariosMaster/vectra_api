import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from './logger.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      auth: {
        user: 'resend',
        pass: env.RESEND_API_KEY ?? '',
      },
    });
  }
  return transporter;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const t = getTransporter();
    await t.sendMail({ from: env.EMAIL_FROM, ...options });
  } catch (err) {
    logger.error('Email send failed', { error: err });
  }
}

export function personalizationConfirmationEmail(name: string, lang: string): string {
  const isEs = lang === 'ES';
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#7c3aed">${isEs ? 'Solicitud recibida' : 'Request received'}</h1>
      <p>${isEs ? `Hola ${name}, recibimos tu solicitud de personalización. Nos pondremos en contacto contigo pronto con un presupuesto.` : `Hello ${name}, we received your personalization request. We will contact you soon with a quote.`}</p>
      <p style="color:#666">${isEs ? 'Equipo Vectra 3D' : 'Vectra 3D Team'}</p>
    </div>
  `;
}

export function orderConfirmationEmail(orderNumber: string, total: string, lang = 'ES'): string {
  const isEs = lang === 'ES';
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#7c3aed">${isEs ? 'Orden confirmada' : 'Order confirmed'}</h1>
      <p>${isEs ? `Tu orden #${orderNumber} fue confirmada. Total: $${total}` : `Your order #${orderNumber} has been confirmed. Total: $${total}`}</p>
    </div>
  `;
}
