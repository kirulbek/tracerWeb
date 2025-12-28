import { getDatabase } from '../config/database.js';
import { Action, CreateActionInput, UpdateActionInput } from '../models/Action.js';
import { getTaskById } from './taskController.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getActionsByTaskId(taskId: string, userId: string): Action[] {
  // Проверяем, что задача принадлежит пользователю
  const task = getTaskById(taskId, userId);
  if (!task) {
    return [];
  }

  const db = getDb();
  const actions = db.prepare('SELECT * FROM actions WHERE task_id = ? ORDER BY order_index, created_at').all(taskId) as any[];
  return actions.map(a => ({
    id: a.id,
    taskId: a.task_id,
    name: a.name || undefined,
    description: a.description,
    shortDescription: a.short_description || undefined,
    excludeFromDescription: Boolean(a.exclude_from_description),
    timeHours: a.time_hours,
    timeMinutes: a.time_minutes,
    orderIndex: a.order_index,
    createdAt: a.created_at
  }));
}

export function getActionById(id: string, userId: string): Action | null {
  const db = getDb();
  const action = db.prepare('SELECT * FROM actions WHERE id = ?').get(id) as any;
  if (!action) return null;

  // Проверяем, что задача принадлежит пользователю
  const task = getTaskById(action.task_id, userId);
  if (!task) return null;

  return {
    id: action.id,
    taskId: action.task_id,
    name: action.name || undefined,
    description: action.description,
    shortDescription: action.short_description || undefined,
    excludeFromDescription: Boolean(action.exclude_from_description),
    timeHours: action.time_hours,
    timeMinutes: action.time_minutes,
    orderIndex: action.order_index,
    createdAt: action.created_at
  };
}

export function createAction(input: CreateActionInput, userId: string): Action {
  // Проверяем, что задача принадлежит пользователю
  const task = getTaskById(input.taskId, userId);
  if (!task) {
    throw new Error('Задача не найдена');
  }

  const db = getDb();
  const id = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const orderIndex = input.orderIndex ?? 0;
  
  // Используем время клиента, если передано, иначе текущее время сервера
  let createdAt: string;
  if (input.createdAt) {
    // Время клиента приходит в формате "YYYY-MM-DDTHH:MM:SS" (локальное время клиента)
    // Конвертируем в формат SQLite "YYYY-MM-DD HH:MM:SS"
    createdAt = input.createdAt.replace('T', ' ').substring(0, 19);
  } else {
    // Fallback на время сервера, если время клиента не передано
    const serverDate = new Date();
    const year = serverDate.getFullYear();
    const month = String(serverDate.getMonth() + 1).padStart(2, '0');
    const day = String(serverDate.getDate()).padStart(2, '0');
    const hours = String(serverDate.getHours()).padStart(2, '0');
    const minutes = String(serverDate.getMinutes()).padStart(2, '0');
    const seconds = String(serverDate.getSeconds()).padStart(2, '0');
    createdAt = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  db.prepare(`
    INSERT INTO actions (id, task_id, name, description, short_description, exclude_from_description, time_hours, time_minutes, order_index, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.taskId,
    input.name || null,
    input.description || '',
    input.shortDescription || null,
    input.excludeFromDescription ? 1 : 0,
    input.timeHours || 0,
    input.timeMinutes || 0,
    orderIndex,
    createdAt
  );

  const action = getActionById(id, userId);
  if (!action) throw new Error('Ошибка создания пункта');

  return action;
}

export function updateAction(id: string, input: UpdateActionInput, userId: string): Action | null {
  const existing = getActionById(id, userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name || null);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }
  if (input.shortDescription !== undefined) {
    updates.push('short_description = ?');
    values.push(input.shortDescription || null);
  }
  if (input.excludeFromDescription !== undefined) {
    updates.push('exclude_from_description = ?');
    values.push(input.excludeFromDescription ? 1 : 0);
  }
  if (input.timeHours !== undefined) {
    updates.push('time_hours = ?');
    values.push(input.timeHours);
  }
  if (input.timeMinutes !== undefined) {
    updates.push('time_minutes = ?');
    values.push(input.timeMinutes);
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
  db.prepare(`UPDATE actions SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return getActionById(id, userId);
}

export function deleteAction(id: string, userId: string): boolean {
  const action = getActionById(id, userId);
  if (!action) return false;

  const db = getDb();
  const result = db.prepare('DELETE FROM actions WHERE id = ?').run(id);
  return result.changes > 0;
}

