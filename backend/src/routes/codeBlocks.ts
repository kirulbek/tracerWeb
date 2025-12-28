import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getCodeBlocksByActionId, getCodeBlockById, createCodeBlock, updateCodeBlock, deleteCodeBlock } from '../controllers/codeBlockController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/code-blocks?actionId=xxx
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const actionId = req.query.actionId as string;

    if (!actionId) {
      return res.status(400).json({ error: 'actionId обязателен' });
    }

    const blocks = getCodeBlocksByActionId(actionId, userId);
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения блоков кода' });
  }
});

// GET /api/code-blocks/:id
router.get('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const block = getCodeBlockById(req.params.id, userId);
    if (!block) {
      return res.status(404).json({ error: 'Блок кода не найден' });
    }
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения блока кода' });
  }
});

// POST /api/code-blocks
router.post('/',
  [
    body('actionId').notEmpty().withMessage('actionId обязателен'),
    body('language').trim().notEmpty().withMessage('Язык обязателен'),
    body('codeText').notEmpty().withMessage('Код обязателен')
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const userId = req.user!.userId;
      const block = createCodeBlock(req.body, userId);
      res.status(201).json(block);
    } catch (error: any) {
      if (error.message === 'Пункт не найден') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Ошибка создания блока кода' });
    }
  }
);

// PUT /api/code-blocks/:id
router.put('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const block = updateCodeBlock(req.params.id, req.body, userId);
    if (!block) {
      return res.status(404).json({ error: 'Блок кода не найден' });
    }
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления блока кода' });
  }
});

// DELETE /api/code-blocks/:id
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const deleted = deleteCodeBlock(req.params.id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Блок кода не найден' });
    }
    res.json({ message: 'Блок кода удален' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления блока кода' });
  }
});

export default router;






