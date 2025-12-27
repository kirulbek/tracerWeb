import { getDatabase } from '../config/database.js';
import bcrypt from 'bcrypt';
import { getUserByUsername } from '../controllers/userController.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initAdminUser() {
  // Проверяем, есть ли уже админ
  const admin = getUserByUsername('admin');
  if (admin) {
    console.log('Администратор уже существует');
    return;
  }

  // Создаем админа с паролем "admin" (должен быть изменен!)
  const db = getDb();
  const passwordHash = await bcrypt.hash('admin', 10);
  const id = `user-${Date.now()}-admin`;

  db.prepare(`
    INSERT INTO users (id, username, password_hash, is_admin, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(id, 'admin', passwordHash, 1);

  console.log('Создан администратор: username=admin, password=admin');
  console.log('ВНИМАНИЕ: Измените пароль после первого входа!');
}

