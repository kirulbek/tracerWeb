import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getTasksByUserId, getTaskById, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/tasks
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tasks = getTasksByUserId(userId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения задач' });
  }
});

// GET /api/tasks/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const task = getTaskById(req.params.id, userId);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения задачи' });
  }
});

// POST /api/tasks
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Название задачи обязательно')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const task = createTask(req.body, userId);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания задачи' });
    }
  }
);

// PUT /api/tasks/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const task = updateTask(req.params.id, req.body, userId);
    if (!task) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = deleteTask(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json({ message: 'Задача удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
});

export default router;





