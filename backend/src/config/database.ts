import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

export function initDatabase(databasePath: string): Database.Database {
  // Создать папку для БД, если её нет
  const dbDir = dirname(databasePath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  // Подключиться к БД
  db = new Database(databasePath);
  
  // Включить foreign keys
  db.pragma('foreign_keys = ON');

  // Запустить миграции
  runMigrations();

  return db;
}

export function getDatabase(): Database.Database | null {
  return db;
}

function runMigrations() {
  if (!db) return;

  const migrationsDir = join(__dirname, '../database/migrations');
  
  // Список миграций в порядке выполнения
  const migrations = [
    '001_create_tables.sql',
    '003_add_full_name_to_users.sql'
  ];

  for (const migration of migrations) {
    const migrationPath = join(migrationsDir, migration);
    if (existsSync(migrationPath)) {
      try {
        // Специальная обработка для миграции 003 (добавление full_name)
        if (migration === '003_add_full_name_to_users.sql') {
          // Проверяем, существует ли колонка full_name
          const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
          const hasFullName = tableInfo.some((col: any) => col.name === 'full_name');
          
          if (!hasFullName) {
            db.exec('ALTER TABLE users ADD COLUMN full_name TEXT');
            console.log(`Migration ${migration} executed`);
          } else {
            console.log(`Migration ${migration} skipped (column already exists)`);
          }
        } else {
          const sql = readFileSync(migrationPath, 'utf-8');
          db.exec(sql);
          console.log(`Migration ${migration} executed`);
        }
      } catch (error: any) {
        // Если ошибка связана с дублированием колонки, пропускаем
        if (error.message?.includes('duplicate column') || error.code === 'SQLITE_ERROR') {
          console.log(`Migration ${migration} skipped (column may already exist)`);
        } else {
          throw error;
        }
      }
    }
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}


