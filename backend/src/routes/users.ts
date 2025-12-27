import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации и прав администратора
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/users
router.get('/', (req: Request, res: Response) => {
  try {
    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

// POST /api/users
router.post('/',
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

// PUT /api/users/:id
router.put('/:id',
  [
    body('username').optional().trim().notEmpty().withMessage('Имя пользователя не может быть пустым'),
    body('password').optional().isLength({ min: 6 }).withMessage('Пароль должен быть не менее 6 символов')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { username, password, fullName, isAdmin } = req.body;

    try {
      const updated = await updateUser(id, { username, password, fullName, isAdmin });
      if (!updated) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      res.json(updated);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });
      }
      res.status(500).json({ error: 'Ошибка обновления пользователя' });
    }
  }
);

// DELETE /api/users/:id
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  // Нельзя удалить самого себя
  if (id === req.user?.userId) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  try {
    const deleted = deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

export default router;

