import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getTemplatesByUserId, getTemplateById, createTemplate, updateTemplate, deleteTemplate, incrementTemplateUsage } from '../controllers/templateController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/templates
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const templates = getTemplatesByUserId(userId);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения шаблонов' });
  }
});

// GET /api/templates/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const template = getTemplateById(req.params.id, userId);
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения шаблона' });
  }
});

// POST /api/templates
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Название шаблона обязательно')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const template = createTemplate(req.body, userId);
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания шаблона' });
    }
  }
);

// PUT /api/templates/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const template = updateTemplate(req.params.id, req.body, userId);
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления шаблона' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = deleteTemplate(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Шаблон не найден' });
    }
    res.json({ message: 'Шаблон удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления шаблона' });
  }
});

// POST /api/templates/:id/increment-usage
router.post('/:id/increment-usage', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    incrementTemplateUsage(req.params.id, userId);
    res.json({ message: 'Счетчик использования увеличен' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления счетчика' });
  }
});

export default router;

