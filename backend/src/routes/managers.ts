import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getManagersByUserId, getManagerById, createManager, updateManager, deleteManager, setTaskManagers, getManagersByTaskId } from '../controllers/managerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/managers
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const managers = getManagersByUserId(userId);
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения менеджеров' });
  }
});

// GET /api/managers/task/:taskId
router.get('/task/:taskId', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const managers = getManagersByTaskId(req.params.taskId, userId);
    res.json(managers);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения менеджеров задачи' });
  }
});

// GET /api/managers/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const manager = getManagerById(req.params.id, userId);
    if (!manager) {
      return res.status(404).json({ error: 'Менеджер не найден' });
    }
    res.json(manager);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения менеджера' });
  }
});

// POST /api/managers
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Имя менеджера обязательно')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const manager = createManager(req.body, userId);
      res.status(201).json(manager);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания менеджера' });
    }
  }
);

// PUT /api/managers/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const manager = updateManager(req.params.id, req.body, userId);
    if (!manager) {
      return res.status(404).json({ error: 'Менеджер не найден' });
    }
    res.json(manager);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления менеджера' });
  }
});

// DELETE /api/managers/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = deleteManager(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Менеджер не найден' });
    }
    res.json({ message: 'Менеджер удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления менеджера' });
  }
});

// POST /api/managers/task/:taskId
router.post('/task/:taskId',
  [
    body('managerIds').isArray().withMessage('managerIds должен быть массивом')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      setTaskManagers(req.params.taskId, req.body.managerIds, userId);
      res.json({ message: 'Менеджеры задачи обновлены' });
    } catch (error: any) {
      if (error.message === 'Задача не найдена') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Ошибка обновления менеджеров задачи' });
    }
  }
);

export default router;

