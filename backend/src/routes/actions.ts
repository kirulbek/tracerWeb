import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getActionsByTaskId, getActionById, createAction, updateAction, deleteAction } from '../controllers/actionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/actions?taskId=xxx
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const taskId = req.query.taskId as string;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId обязателен' });
    }

    const actions = getActionsByTaskId(taskId, userId);
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения пунктов' });
  }
});

// GET /api/actions/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const action = getActionById(req.params.id, userId);
    if (!action) {
      return res.status(404).json({ error: 'Пункт не найден' });
    }
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения пункта' });
  }
});

// POST /api/actions
router.post('/',
  [
    body('taskId').notEmpty().withMessage('taskId обязателен'),
    body('description').notEmpty().withMessage('Описание обязательно')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const action = createAction(req.body, userId);
      res.status(201).json(action);
    } catch (error: any) {
      if (error.message === 'Задача не найдена') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Ошибка создания пункта' });
    }
  }
);

// PUT /api/actions/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const action = updateAction(req.params.id, req.body, userId);
    if (!action) {
      return res.status(404).json({ error: 'Пункт не найден' });
    }
    res.json(action);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления пункта' });
  }
});

// DELETE /api/actions/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = deleteAction(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Пункт не найден' });
    }
    res.json({ message: 'Пункт удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления пункта' });
  }
});

export default router;






