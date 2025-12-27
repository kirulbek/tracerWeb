import { getDatabase } from '../config/database.js';
import bcrypt from 'bcrypt';
import { User, CreateUserInput, UserResponse } from '../models/User.js';
import { generateToken } from '../config/jwt.js';

function getDb() {
  const db = getDatabase();
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    passwordHash: user.password_hash,
    fullName: user.full_name,
    isAdmin: Boolean(user.is_admin),
    createdAt: user.created_at
  };
}

export function getUserByUsername(username: string): User | null {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    passwordHash: user.password_hash,
    fullName: user.full_name,
    isAdmin: Boolean(user.is_admin),
    createdAt: user.created_at
  };
}

export function getAllUsers(): UserResponse[] {
  const db = getDb();
  const users = db.prepare('SELECT id, username, full_name, is_admin, created_at FROM users ORDER BY created_at DESC').all() as any[];
  return users.map(u => ({
    id: u.id,
    username: u.username,
    fullName: u.full_name,
    isAdmin: Boolean(u.is_admin),
    createdAt: u.created_at
  }));
}

export async function createUser(input: CreateUserInput): Promise<UserResponse> {
  const db = getDb();
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const passwordHash = await bcrypt.hash(input.password, 10);
  const isAdmin = input.isAdmin ? 1 : 0;

  db.prepare(`
    INSERT INTO users (id, username, password_hash, full_name, is_admin, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, input.username, passwordHash, input.fullName || null, isAdmin);

  return {
    id,
    username: input.username,
    fullName: input.fullName,
    isAdmin: Boolean(isAdmin),
    createdAt: new Date().toISOString()
  };
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!password || !user.passwordHash) {
    return false;
  }
  return await bcrypt.compare(password, user.passwordHash);
}

export async function updateUser(id: string, input: { username?: string; password?: string; fullName?: string; isAdmin?: boolean }): Promise<UserResponse | null> {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!user) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (input.username !== undefined) {
    updates.push('username = ?');
    values.push(input.username);
  }

  if (input.password !== undefined) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    updates.push('password_hash = ?');
    values.push(passwordHash);
  }

  if (input.fullName !== undefined) {
    updates.push('full_name = ?');
    values.push(input.fullName || null);
  }

  if (input.isAdmin !== undefined) {
    updates.push('is_admin = ?');
    values.push(input.isAdmin ? 1 : 0);
  }

  if (updates.length === 0) {
    // Нет изменений
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      isAdmin: Boolean(user.is_admin),
      createdAt: user.created_at
    };
  }

  values.push(id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  return {
    id: updated.id,
    username: updated.username,
    fullName: updated.full_name,
    isAdmin: Boolean(updated.is_admin),
    createdAt: updated.created_at
  };
}

export function deleteUser(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return result.changes > 0;
}

export async function login(username: string, password: string): Promise<{ token: string; user: UserResponse } | null> {
  if (!username || !password) {
    return null;
  }
  
  const user = getUserByUsername(username);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(user, password);
  if (!isValid) {
    return null;
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    isAdmin: Boolean(user.isAdmin)
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      isAdmin: Boolean(user.isAdmin),
      createdAt: user.createdAt
    }
  };
}

