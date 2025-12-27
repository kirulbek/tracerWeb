-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Задачи (с user_id)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Ожидание',
  notes TEXT,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Менеджеры (с user_id)
CREATE TABLE IF NOT EXISTS managers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Связь задач и менеджеров
CREATE TABLE IF NOT EXISTS task_managers (
  task_id TEXT NOT NULL,
  manager_id TEXT NOT NULL,
  PRIMARY KEY (task_id, manager_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE CASCADE
);

-- Пункты (через task_id уже связаны с user_id)
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
);

-- Шаблоны (с user_id)
CREATE TABLE IF NOT EXISTS action_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  category TEXT,
  usage_count INTEGER DEFAULT 0,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Блоки кода (через action_id → task_id → user_id)
CREATE TABLE IF NOT EXISTS action_code_blocks (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  language TEXT NOT NULL,
  code_text TEXT NOT NULL,
  collapsible INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
);

-- Скриншоты (через action_id → task_id → user_id)
CREATE TABLE IF NOT EXISTS action_screenshots (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  data_url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE
);


