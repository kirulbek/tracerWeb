import { getDatabase } from '../config/database.js';
import { ActionCodeBlock, CreateActionCodeBlockInput, UpdateActionCodeBlockInput } from '../models/ActionCodeBlock.js';
import { getActionById } from './actionController.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getCodeBlocksByActionId(actionId: string, userId: string): ActionCodeBlock[] {
  // Проверяем, что action принадлежит пользователю
  const action = getActionById(actionId, userId);
  if (!action) {
    return [];
  }

  const db = getDb();
  const blocks = db.prepare('SELECT * FROM action_code_blocks WHERE action_id = ? ORDER BY order_index').all(actionId) as any[];
  return blocks.map(b => ({
    id: b.id,
    actionId: b.action_id,
    language: b.language,
    codeText: b.code_text,
    collapsible: Boolean(b.collapsible),
    orderIndex: b.order_index
  }));
}

export function getCodeBlockById(id: string, userId: string): ActionCodeBlock | null {
  const db = getDb();
  const block = db.prepare('SELECT * FROM action_code_blocks WHERE id = ?').get(id) as any;
  if (!block) return null;

  // Проверяем, что action принадлежит пользователю
  const action = getActionById(block.action_id, userId);
  if (!action) return null;

  return {
    id: block.id,
    actionId: block.action_id,
    language: block.language,
    codeText: block.code_text,
    collapsible: Boolean(block.collapsible),
    orderIndex: block.order_index
  };
}

export function createCodeBlock(input: CreateActionCodeBlockInput, userId: string): ActionCodeBlock {
  // Проверяем, что action принадлежит пользователю
  const action = getActionById(input.actionId, userId);
  if (!action) {
    throw new Error('Пункт не найден');
  }

  const db = getDb();
  const id = `codeblock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const orderIndex = input.orderIndex ?? 0;

  db.prepare(`
    INSERT INTO action_code_blocks (id, action_id, language, code_text, collapsible, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.actionId,
    input.language,
    input.codeText,
    input.collapsible ? 1 : 0,
    orderIndex
  );

  const block = getCodeBlockById(id, userId);
  if (!block) throw new Error('Ошибка создания блока кода');

  return block;
}

export function updateCodeBlock(id: string, input: UpdateActionCodeBlockInput, userId: string): ActionCodeBlock | null {
  const existing = getCodeBlockById(id, userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.language !== undefined) {
    updates.push('language = ?');
    values.push(input.language);
  }
  if (input.codeText !== undefined) {
    updates.push('code_text = ?');
    values.push(input.codeText);
  }
  if (input.collapsible !== undefined) {
    updates.push('collapsible = ?');
    values.push(input.collapsible ? 1 : 0);
  }
  if (input.orderIndex !== undefined) {
    updates.push('order_index = ?');
    values.push(input.orderIndex);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);
  const db = getDb();
  db.prepare(`UPDATE action_code_blocks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return getCodeBlockById(id, userId);
}

export function deleteCodeBlock(id: string, userId: string): boolean {
  const block = getCodeBlockById(id, userId);
  if (!block) return false;

  const db = getDb();
  const result = db.prepare('DELETE FROM action_code_blocks WHERE id = ?').run(id);
  return result.changes > 0;
}

