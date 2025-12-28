import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database.js';
import { initAdminUser } from './utils/initAdmin.js';
import { initTemplatesForAdmin } from './utils/initTemplates.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import actionRoutes from './routes/actions.js';
import managerRoutes from './routes/managers.js';
import templateRoutes from './routes/templates.js';
import codeBlockRoutes from './routes/codeBlocks.js';
import screenshotRoutes from './routes/screenshots.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_PATH = process.env.DATABASE_PATH || './data/tracer.db';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Инициализация базы данных
initDatabase(DATABASE_PATH);
console.log('База данных инициализирована');

// Создание администратора при первом запуске
initAdminUser().then(() => {
  // Инициализация предопределенных шаблонов для администратора
  initTemplatesForAdmin().catch(console.error);
}).catch(console.error);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/code-blocks', codeBlockRoutes);
app.use('/api/screenshots', screenshotRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  console.error('Request body:', req.body);
  console.error('Request params:', req.params);
  res.status(500).json({ error: 'Внутренняя ошибка сервера', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`CORS разрешен для: ${CORS_ORIGIN}`);
});

