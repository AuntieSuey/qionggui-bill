// 移动端数据库实现（使用expo-sqlite）
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'qionggui-bill.db';
let db: SQLite.SQLiteDatabase | null = null;

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync(DB_NAME);
  await createTables();
  return db;
}

async function createTables(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
      date TEXT NOT NULL,
      merchant TEXT,
      image_url TEXT,
      source TEXT NOT NULL CHECK (source IN ('manual', 'ai', 'ocr', 'rule')),
      tags TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);

  await seedDefaultCategories();
}

async function seedDefaultCategories(): Promise<void> {
  const defaultCategories = [
    { id: 'food', name: '餐饮', icon: 'food', color: '#FF6B6B', type: 'expense' as const },
    { id: 'transport', name: '交通', icon: 'transport', color: '#4ECDC4', type: 'expense' as const },
    { id: 'shopping', name: '购物', icon: 'shopping', color: '#FFD93D', type: 'expense' as const },
    { id: 'entertainment', name: '娱乐', icon: 'entertainment', color: '#95E1D3', type: 'expense' as const },
    { id: 'medical', name: '医疗', icon: 'medical', color: '#F38181', type: 'expense' as const },
    { id: 'education', name: '教育', icon: 'education', color: '#AA96DA', type: 'expense' as const },
    { id: 'housing', name: '住房', icon: 'housing', color: '#FCBAD3', type: 'expense' as const },
    { id: 'other_expense', name: '其他支出', icon: 'other', color: '#A8A8A8', type: 'expense' as const },
    { id: 'salary', name: '工资', icon: 'salary', color: '#6BCB77', type: 'income' as const },
    { id: 'bonus', name: '奖金', icon: 'bonus', color: '#FFD93D', type: 'income' as const },
    { id: 'investment', name: '理财', icon: 'investment', color: '#4D96FF', type: 'income' as const },
    { id: 'other_income', name: '其他收入', icon: 'other', color: '#A8A8A8', type: 'income' as const },
  ];

  for (const category of defaultCategories) {
    try {
      await db?.runAsync(
        `INSERT OR IGNORE INTO categories (id, name, icon, color, type, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [category.id, category.name, category.icon, category.color, category.type, 1]
      );
    } catch (error) {
      console.warn(`Failed to insert category ${category.id}:`, error);
    }
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
