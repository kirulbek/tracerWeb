import { Task, Action, ActionTemplate, ActionCodeBlock, ActionScreenshot, Manager, TaskStatus } from '../types';

let db: any = null;
let isInitialized = false;

async function loadSqlJs() {
  try {
    // В Vite sql.js нужно загружать правильно
    // Используем динамический импорт
    
    // @ts-ignore - sql.js не имеет типов
    const sqlJsModule = await import('sql.js');
    
    // Проверяем все возможные варианты экспорта
    if (sqlJsModule && typeof sqlJsModule === 'object') {
      // Вариант 1: default export может быть функцией
      if (sqlJsModule.default) {
        const defaultExport = sqlJsModule.default;
        if (typeof defaultExport === 'function') {
          console.log('Найден initSqlJs как default функция');
          return defaultExport;
        }
        // Если default - это объект с initSqlJs
        if (defaultExport && typeof defaultExport.initSqlJs === 'function') {
          console.log('Найден initSqlJs внутри default');
          return defaultExport.initSqlJs;
        }
      }
      
      // Вариант 2: именованный экспорт initSqlJs
      if (sqlJsModule.initSqlJs && typeof sqlJsModule.initSqlJs === 'function') {
        console.log('Найден initSqlJs как именованный экспорт');
        return sqlJsModule.initSqlJs;
      }
    }
    
    // Если ничего не найдено, возвращаем null для использования fallback
    console.warn('SQL.js не удалось загрузить, используется LocalStorage');
    return null;
    
  } catch (e) {
    console.error('Ошибка загрузки модуля sql.js:', e);
    return null;
  }
}

export async function initDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    console.log('Загрузка SQL.js...');
    const initSqlJs = await loadSqlJs();
    
    if (!initSqlJs || typeof initSqlJs !== 'function') {
      console.warn('SQL.js не загружен, используется LocalStorage');
      throw new Error('initSqlJs не является функцией, используется LocalStorage');
    }

    // Пробуем инициализировать SQL.js
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        // Используем CDN для WASM файлов
        if (file.endsWith('.wasm')) {
          return `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`;
        }
        return `https://sql.js.org/dist/${file}`;
      }
    }).catch((wasmError: any) => {
      // Подавляем ошибки WebAssembly, так как используем LocalStorage
      console.warn('SQL.js WebAssembly ошибка, используется LocalStorage');
      throw wasmError;
    });

    db = new SQL.Database();
    console.log('SQL.js загружен альтернативным способом');

    // Создание таблиц
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'Ожидание',
        notes TEXT,
        created_at TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS managers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS task_managers (
        task_id TEXT NOT NULL,
        manager_id TEXT NOT NULL,
        PRIMARY KEY (task_id, manager_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS actions (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        name TEXT,
        description TEXT NOT NULL,
        short_description TEXT,
        exclude_from_description INTEGER DEFAULT 0,
        time_hours INTEGER DEFAULT 0,
        time_minutes INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS action_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        text TEXT NOT NULL,
        category TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS action_code_blocks (
        id TEXT PRIMARY KEY,
        action_id TEXT NOT NULL,
        language TEXT NOT NULL,
        code_text TEXT NOT NULL,
        collapsible INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS action_screenshots (
        id TEXT PRIMARY KEY,
        action_id TEXT NOT NULL,
        data_url TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
      )
    `);

    // Добавляем колонку short_description если её нет (для существующих баз)
    try {
      db.run(`ALTER TABLE actions ADD COLUMN short_description TEXT`);
    } catch (e) {
      // Колонка уже существует, игнорируем ошибку
    }

    // Добавляем колонку exclude_from_description если её нет (для существующих баз)
    try {
      db.run(`ALTER TABLE actions ADD COLUMN exclude_from_description INTEGER DEFAULT 0`);
    } catch (e) {
      // Колонка уже существует, игнорируем ошибку
    }

    isInitialized = true;
    console.log('База данных SQL.js инициализирована');
  } catch (error: any) {
    // Подавляем детальные ошибки WebAssembly, так как используем LocalStorage
    if (error?.message?.includes('WebAssembly') || error?.message?.includes('LinkError')) {
      console.warn('SQL.js недоступен, используется LocalStorage (это нормально)');
    } else {
      console.warn('Ошибка инициализации базы данных:', error?.message || error);
    }
    console.log('Переключение на fallback режим (LocalStorage)');
    isInitialized = true; // Помечаем как инициализированную, чтобы использовать fallback
  }
}

export function getDatabase() {
  return db;
}

export function clearDatabase() {
  if (db) {
    db.run('DELETE FROM action_screenshots');
    db.run('DELETE FROM action_code_blocks');
    db.run('DELETE FROM actions');
    db.run('DELETE FROM action_templates');
    db.run('DELETE FROM task_managers');
    db.run('DELETE FROM managers');
    db.run('DELETE FROM tasks');
    console.log('База данных очищена');
  }
}

// Tasks
export function getTasks(): Task[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
  const results: Task[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as TaskStatus,
      notes: row.notes,
      createdAt: new Date(row.created_at)
    });
  }
  stmt.free();
  return results;
}

export function saveTask(task: Task): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO tasks (id, name, description, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [task.id, task.name, task.description || '', task.status, task.notes || '', task.createdAt.toISOString()]
  );
}

export function deleteTask(id: string): void {
  if (!db) return;
  db.run('DELETE FROM tasks WHERE id = ?', [id]);
}

// Managers
export function getManagers(): Manager[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM managers ORDER BY name');
  const results: Manager[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at)
    });
  }
  stmt.free();
  return results;
}

export function saveManager(manager: Manager): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO managers (id, name, created_at) VALUES (?, ?, ?)',
    [manager.id, manager.name, manager.createdAt.toISOString()]
  );
}

export function deleteManager(id: string): void {
  if (!db) return;
  db.run('DELETE FROM managers WHERE id = ?', [id]);
}

export function getManagersByTaskId(taskId: string): Manager[] {
  if (!db) return [];
  const stmt = db.prepare(`
    SELECT m.* FROM managers m
    INNER JOIN task_managers tm ON m.id = tm.manager_id
    WHERE tm.task_id = ?
    ORDER BY m.name
  `);
  stmt.bind([taskId]);
  const results: Manager[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at)
    });
  }
  stmt.free();
  return results;
}

export function setTaskManagers(taskId: string, managerIds: string[]): void {
  if (!db) return;
  db.run('DELETE FROM task_managers WHERE task_id = ?', [taskId]);
  managerIds.forEach(managerId => {
    db.run('INSERT INTO task_managers (task_id, manager_id) VALUES (?, ?)', [taskId, managerId]);
  });
}

// Actions
export function getActions(): Action[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM actions ORDER BY order_index, created_at');
  const results: Action[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      taskId: row.task_id,
      name: row.name,
      description: row.description,
      shortDescription: row.short_description,
      excludeFromDescription: row.exclude_from_description === 1,
      timeHours: row.time_hours,
      timeMinutes: row.time_minutes,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at)
    });
  }
  stmt.free();
  return results;
}

export function getActionsByTaskId(taskId: string): Action[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM actions WHERE task_id = ? ORDER BY order_index, created_at');
  stmt.bind([taskId]);
  const results: Action[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      taskId: row.task_id,
      name: row.name,
      description: row.description,
      shortDescription: row.short_description,
      excludeFromDescription: row.exclude_from_description === 1,
      timeHours: row.time_hours,
      timeMinutes: row.time_minutes,
      orderIndex: row.order_index,
      createdAt: new Date(row.created_at)
    });
  }
  stmt.free();
  return results;
}

export function saveAction(action: Action): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO actions (id, task_id, name, description, short_description, exclude_from_description, time_hours, time_minutes, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      action.id,
      action.taskId,
      action.name || null,
      action.description,
      action.shortDescription || null,
      action.excludeFromDescription ? 1 : 0,
      action.timeHours,
      action.timeMinutes,
      action.orderIndex,
      action.createdAt.toISOString()
    ]
  );
}

export function deleteAction(id: string): void {
  if (!db) return;
  db.run('DELETE FROM actions WHERE id = ?', [id]);
}

// Templates
export function getTemplates(): ActionTemplate[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM action_templates ORDER BY category, name');
  const results: ActionTemplate[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      name: row.name,
      text: row.text,
      category: row.category,
      usageCount: row.usage_count,
      createdAt: new Date(row.created_at)
    });
  }
  stmt.free();
  return results;
}

export function saveTemplate(template: ActionTemplate): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO action_templates (id, name, text, category, usage_count, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [template.id, template.name, template.text, template.category || null, template.usageCount, template.createdAt.toISOString()]
  );
}

export function deleteTemplate(id: string): void {
  if (!db) return;
  db.run('DELETE FROM action_templates WHERE id = ?', [id]);
}

export function incrementTemplateUsage(id: string): void {
  if (!db) return;
  db.run('UPDATE action_templates SET usage_count = usage_count + 1 WHERE id = ?', [id]);
}

// Code Blocks
export function getCodeBlocksByActionId(actionId: string): ActionCodeBlock[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM action_code_blocks WHERE action_id = ? ORDER BY order_index');
  stmt.bind([actionId]);
  const results: ActionCodeBlock[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      actionId: row.action_id,
      language: row.language,
      codeText: row.code_text,
      collapsible: row.collapsible === 1,
      orderIndex: row.order_index
    });
  }
  stmt.free();
  return results;
}

export function saveCodeBlock(codeBlock: ActionCodeBlock): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO action_code_blocks (id, action_id, language, code_text, collapsible, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [codeBlock.id, codeBlock.actionId, codeBlock.language, codeBlock.codeText, codeBlock.collapsible ? 1 : 0, codeBlock.orderIndex]
  );
}

export function deleteCodeBlock(id: string): void {
  if (!db) return;
  db.run('DELETE FROM action_code_blocks WHERE id = ?', [id]);
}

// Screenshots
export function getScreenshotsByActionId(actionId: string): ActionScreenshot[] {
  if (!db) return [];
  const stmt = db.prepare('SELECT * FROM action_screenshots WHERE action_id = ? ORDER BY order_index');
  stmt.bind([actionId]);
  const results: ActionScreenshot[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as any;
    results.push({
      id: row.id,
      actionId: row.action_id,
      dataUrl: row.data_url,
      orderIndex: row.order_index
    });
  }
  stmt.free();
  return results;
}

export function saveScreenshot(screenshot: ActionScreenshot): void {
  if (!db) return;
  db.run(
    'INSERT OR REPLACE INTO action_screenshots (id, action_id, data_url, order_index) VALUES (?, ?, ?, ?)',
    [screenshot.id, screenshot.actionId, screenshot.dataUrl, screenshot.orderIndex]
  );
}

export function deleteScreenshot(id: string): void {
  if (!db) return;
  db.run('DELETE FROM action_screenshots WHERE id = ?', [id]);
}

