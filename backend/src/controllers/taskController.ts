import { getDatabase } from '../config/database.js';
import { Task, CreateTaskInput, UpdateTaskInput } from '../models/Task.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getTasksByUserId(userId: string): Task[] {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC').all(userId) as any[];
  return tasks.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description || undefined,
    status: t.status,
    notes: t.notes || undefined,
    // Если значение null или пустая строка, возвращаем undefined
    blockStartMarker: t.block_start_marker && t.block_start_marker.trim() !== '' ? t.block_start_marker : undefined,
    blockEndMarker: t.block_end_marker && t.block_end_marker.trim() !== '' ? t.block_end_marker : undefined,
    userId: t.user_id,
    createdAt: t.created_at
  }));
}

export function getTaskById(id: string, userId: string): Task | null {
  const db = getDb();
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!task) return null;

  return {
    id: task.id,
    name: task.name,
    description: task.description || undefined,
    status: task.status,
    notes: task.notes || undefined,
    // Если значение null или пустая строка, возвращаем undefined
    blockStartMarker: task.block_start_marker && task.block_start_marker.trim() !== '' ? task.block_start_marker : undefined,
    blockEndMarker: task.block_end_marker && task.block_end_marker.trim() !== '' ? task.block_end_marker : undefined,
    userId: task.user_id,
    createdAt: task.created_at
  };
}

export function createTask(input: CreateTaskInput, userId: string): Task {
  const db = getDb();
  const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const status = input.status || 'Ожидание';

  db.prepare(`
    INSERT INTO tasks (id, name, description, status, notes, block_start_marker, block_end_marker, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    id,
    input.name,
    input.description || null,
    status,
    input.notes || null,
    input.blockStartMarker || null,
    input.blockEndMarker || null,
    userId
  );

  const task = getTaskById(id, userId);
  if (!task) throw new Error('Ошибка создания задачи');

  return task;
}

export function updateTask(id: string, input: UpdateTaskInput, userId: string): Task | null {
  const existing = getTaskById(id, userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description || null);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    values.push(input.status);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes || null);
  }
  if (input.blockStartMarker !== undefined) {
    updates.push('block_start_marker = ?');
    values.push(input.blockStartMarker || null);
  }
  if (input.blockEndMarker !== undefined) {
    updates.push('block_end_marker = ?');
    values.push(input.blockEndMarker || null);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id, userId);
  const db = getDb();
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

  return getTaskById(id, userId);
}

export function deleteTask(id: string, userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

