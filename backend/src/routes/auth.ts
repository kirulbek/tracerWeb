import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { login, createUser, getUserById } from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
    body('password').notEmpty().withMessage('Пароль обязателен')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const result = await login(username, password);
    if (!result) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    res.json(result);
  }
);

// POST /api/auth/register (только для админа)
router.post('/register',
  authenticateToken,
  requireAdmin,
  [
    body('username').trim().notEmpty().withMessage('Имя пользователя обязательно'),
    body('password').isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, fullName, isAdmin } = req.body;

    try {
      const user = await createUser({ username, password, fullName, isAdmin: Boolean(isAdmin) });
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
      }
      res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  const user = getUserById(req.user?.userId || '');
  res.json({
    userId: req.user?.userId,
    username: req.user?.username,
    fullName: user?.fullName,
    isAdmin: req.user?.isAdmin
  });
});

export default router;


