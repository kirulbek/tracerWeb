import { getDatabase } from '../config/database.js';
import { Manager, CreateManagerInput, UpdateManagerInput } from '../models/Manager.js';
import { getTaskById } from './taskController.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getManagersByUserId(userId: string): Manager[] {
  const db = getDb();
  const managers = db.prepare('SELECT * FROM managers WHERE user_id = ? ORDER BY name').all(userId) as any[];
  return managers.map(m => ({
    id: m.id,
    name: m.name,
    userId: m.user_id,
    createdAt: m.created_at
  }));
}

export function getManagerById(id: string, userId: string): Manager | null {
  const db = getDb();
  const manager = db.prepare('SELECT * FROM managers WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!manager) return null;

  return {
    id: manager.id,
    name: manager.name,
    userId: manager.user_id,
    createdAt: manager.created_at
  };
}

export function createManager(input: CreateManagerInput, userId: string): Manager {
  const db = getDb();
  const id = `manager-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  db.prepare(`
    INSERT INTO managers (id, name, user_id, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(id, input.name, userId);

  const manager = getManagerById(id, userId);
  if (!manager) throw new Error('Ошибка создания менеджера');

  return manager;
}

export function updateManager(id: string, input: UpdateManagerInput, userId: string): Manager | null {
  const existing = getManagerById(id, userId);
  if (!existing) return null;

  if (input.name !== undefined) {
    const db = getDb();
    db.prepare('UPDATE managers SET name = ? WHERE id = ? AND user_id = ?').run(input.name, id, userId);
  }

  return getManagerById(id, userId);
}

export function deleteManager(id: string, userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM managers WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

export function setTaskManagers(taskId: string, managerIds: string[], userId: string): void {
  // Проверяем, что задача принадлежит пользователю
  const task = getTaskById(taskId, userId);
  if (!task) {
    throw new Error('Задача не найдена');
  }

  const db = getDb();
  // Удаляем старые связи
  db.prepare('DELETE FROM task_managers WHERE task_id = ?').run(taskId);

  // Добавляем новые связи
  const stmt = db.prepare('INSERT INTO task_managers (task_id, manager_id) VALUES (?, ?)');
  for (const managerId of managerIds) {
    // Проверяем, что менеджер принадлежит пользователю
    const manager = getManagerById(managerId, userId);
    if (manager) {
      stmt.run(taskId, managerId);
    }
  }
}

export function getManagersByTaskId(taskId: string, userId: string): Manager[] {
  // Проверяем, что задача принадлежит пользователю
  const task = getTaskById(taskId, userId);
  if (!task) {
    return [];
  }

  const db = getDb();
  const managers = db.prepare(`
    SELECT m.* FROM managers m
    INNER JOIN task_managers tm ON m.id = tm.manager_id
    WHERE tm.task_id = ? AND m.user_id = ?
    ORDER BY m.name
  `).all(taskId, userId) as any[];

  return managers.map(m => ({
    id: m.id,
    name: m.name,
    userId: m.user_id,
    createdAt: m.created_at
  }));
}

