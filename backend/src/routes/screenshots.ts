import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getScreenshotsByActionId, getScreenshotById, createScreenshot, updateScreenshot, deleteScreenshot } from '../controllers/screenshotController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/screenshots?actionId=xxx
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const actionId = req.query.actionId as string;

    if (!actionId) {
      return res.status(400).json({ error: 'actionId обязателен' });
    }

    const screenshots = getScreenshotsByActionId(actionId, userId);
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения скриншотов' });
  }
});

// GET /api/screenshots/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const screenshot = getScreenshotById(req.params.id, userId);
    if (!screenshot) {
      return res.status(404).json({ error: 'Скриншот не найден' });
    }
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения скриншота' });
  }
});

// POST /api/screenshots
router.post('/',
  [
    body('actionId').notEmpty().withMessage('actionId обязателен'),
    body('dataUrl').notEmpty().withMessage('dataUrl обязателен')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const screenshot = createScreenshot(req.body, userId);
      res.status(201).json(screenshot);
    } catch (error: any) {
      if (error.message === 'Пункт не найден') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Ошибка создания скриншота' });
    }
  }
);

// PUT /api/screenshots/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const screenshot = updateScreenshot(req.params.id, req.body, userId);
    if (!screenshot) {
      return res.status(404).json({ error: 'Скриншот не найден' });
    }
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления скриншота' });
  }
});

// DELETE /api/screenshots/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = deleteScreenshot(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Скриншот не найден' });
    }
    res.json({ message: 'Скриншот удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления скриншота' });
  }
});

export default router;






