import { getDatabase } from '../config/database.js';
import { ActionTemplate, CreateActionTemplateInput, UpdateActionTemplateInput } from '../models/ActionTemplate.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getTemplatesByUserId(userId: string): ActionTemplate[] {
  const db = getDb();
  const templates = db.prepare('SELECT * FROM action_templates WHERE user_id = ? ORDER BY category, name').all(userId) as any[];
  return templates.map(t => ({
    id: t.id,
    name: t.name,
    text: t.text,
    category: t.category || undefined,
    usageCount: t.usage_count,
    userId: t.user_id,
    createdAt: t.created_at
  }));
}

export function getTemplateById(id: string, userId: string): ActionTemplate | null {
  const db = getDb();
  const template = db.prepare('SELECT * FROM action_templates WHERE id = ? AND user_id = ?').get(id, userId) as any;
  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    text: template.text,
    category: template.category || undefined,
    usageCount: template.usage_count,
    userId: template.user_id,
    createdAt: template.created_at
  };
}

export function createTemplate(input: CreateActionTemplateInput, userId: string): ActionTemplate {
  const db = getDb();
  const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  db.prepare(`
    INSERT INTO action_templates (id, name, text, category, usage_count, user_id, created_at)
    VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
  `).run(
    id,
    input.name,
    input.text || '',
    input.category || null,
    userId
  );

  const template = getTemplateById(id, userId);
  if (!template) throw new Error('Ошибка создания шаблона');

  return template;
}

export function updateTemplate(id: string, input: UpdateActionTemplateInput, userId: string): ActionTemplate | null {
  const existing = getTemplateById(id, userId);
  if (!existing) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.text !== undefined) {
    updates.push('text = ?');
    values.push(input.text);
  }
  if (input.category !== undefined) {
    updates.push('category = ?');
    values.push(input.category || null);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id, userId);
  const db = getDb();
  db.prepare(`UPDATE action_templates SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);

  return getTemplateById(id, userId);
}

export function deleteTemplate(id: string, userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM action_templates WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes > 0;
}

export function incrementTemplateUsage(id: string, userId: string): void {
  const db = getDb();
  db.prepare('UPDATE action_templates SET usage_count = usage_count + 1 WHERE id = ? AND user_id = ?').run(id, userId);
}

