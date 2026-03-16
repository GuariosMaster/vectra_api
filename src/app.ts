import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { sendSuccess } from './utils/response.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import productRoutes from './modules/products/products.routes.js';
import categoryRoutes from './modules/categories/categories.routes.js';
import blogRoutes from './modules/blog/blog.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import personalizationRoutes from './modules/personalization/personalization.routes.js';
import userRoutes from './modules/users/users.routes.js';

const app = express();

// ─── Security headers (Helmet) ───────────────────────────────────────────────
// contentSecurityPolicy disabled: this is a JSON API, not an HTML server
app.use(helmet({ contentSecurityPolicy: false }));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate limiting ───────────────────────────────────────────────────────────
const isDev = env.NODE_ENV === 'development';

// Login / register: strict — prevents brute force (5 attempts per 15 min per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => isDev,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 500 req / 15 min — enough for heavy admin use, blocks automated scraping
// The MP webhook (/api/v1/payments/mp/webhook) is also covered but MercadoPago
// sends at most a few webhooks per payment, so 500/15min is never reached.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skip: () => isDev,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth/register', loginLimiter);
app.use('/api', generalLimiter);

// ─── Static uploads (local fallback when Cloudinary is not configured) ───────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health ──────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => sendSuccess(res, { status: 'ok', version: '1.0.0' }));
app.get('/api/v1', (_req, res) => sendSuccess(res, { name: 'Vectra API', version: '1.0.0' }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/blog', blogRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/personalization', personalizationRoutes);
app.use('/api/v1/users', userRoutes);

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
