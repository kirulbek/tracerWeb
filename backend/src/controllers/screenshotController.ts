import { getDatabase } from '../config/database.js';
import { ActionScreenshot, CreateActionScreenshotInput, UpdateActionScreenshotInput } from '../models/ActionScreenshot.js';
import { getActionById } from './actionController.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getScreenshotsByActionId(actionId: string, userId: string): ActionScreenshot[] {
  // Проверяем, что action принадлежит пользователю
  const action = getActionById(actionId, userId);
  if (!action) {
    return [];
  }

  const db = getDb();
  const screenshots = db.prepare('SELECT * FROM action_screenshots WHERE action_id = ? ORDER BY order_index').all(actionId) as any[];
  return screenshots.map(s => ({
    id: s.id,
    actionId: s.action_id,
    dataUrl: s.data_url,
    orderIndex: s.order_index
  }));
}

export function getScreenshotById(id: string, userId: string): ActionScreenshot | null {
  const db = getDb();
  const screenshot = db.prepare('SELECT * FROM action_screenshots WHERE id = ?').get(id) as any;
  if (!screenshot) return null;

  // Проверяем, что action принадлежит пользователю
  const action = getActionById(screenshot.action_id, userId);
  if (!action) return null;

  return {
    id: screenshot.id,
    actionId: screenshot.action_id,
    dataUrl: screenshot.data_url,
    orderIndex: screenshot.order_index
  };
}

export function createScreenshot(input: CreateActionScreenshotInput, userId: string): ActionScreenshot {
  // Проверяем, что action принадлежит пользователю
  const action = getActionById(input.actionId, userId);
  if (!action) {
    throw new Error('Пункт не найден');
  }

  const db = getDb();
  const id = `screenshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const orderIndex = input.orderIndex ?? 0;

  db.prepare(`
    INSERT INTO action_screenshots (id, action_id, data_url, order_index)
    VALUES (?, ?, ?, ?)
  `).run(
    id,
    input.actionId,
    input.dataUrl,
    orderIndex
  );

  const screenshot = getScreenshotById(id, userId);
  if (!screenshot) throw new Error('Ошибка создания скриншота');

  return screenshot;
}

export function updateScreenshot(id: string, input: UpdateActionScreenshotInput, userId: string): ActionScreenshot | null {
  const existing = getScreenshotById(id, userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.dataUrl !== undefined) {
    updates.push('data_url = ?');
    values.push(input.dataUrl);
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
  db.prepare(`UPDATE action_screenshots SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return getScreenshotById(id, userId);
}

export function deleteScreenshot(id: string, userId: string): boolean {
  const screenshot = getScreenshotById(id, userId);
  if (!screenshot) return false;

  const db = getDb();
  const result = db.prepare('DELETE FROM action_screenshots WHERE id = ?').run(id);
  return result.changes > 0;
}

