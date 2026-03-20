import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionForm } from '../../types/transaction';
import { openDatabase, Database } from './db';

let db: Database | null = null;

/**
 * 获取数据库实例
 */
async function getDb(): Promise<Database> {
  if (!db) {
    db = await openDatabase();
  }
  return db;
}

/**
 * 账单数据库服务
 */
export const transactionService = {
  /**
   * 创建新账单
   */
  async create(form: TransactionForm): Promise<Transaction> {
    const database = await getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const transaction: Transaction = {
      ...form,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await database.runAsync(
      `INSERT INTO transactions (id, amount, description, category, type, date, merchant, image_url, source, tags, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transaction.id,
        transaction.amount,
        transaction.description,
        transaction.category,
        transaction.type,
        transaction.date,
        transaction.merchant || null,
        transaction.imageUrl || null,
        transaction.source,
        transaction.tags ? JSON.stringify(transaction.tags) : null,
        transaction.notes || null,
        transaction.createdAt,
        transaction.updatedAt,
      ]
    );

    return transaction;
  },

  /**
   * 根据ID查询账单
   */
  async getById(id: string): Promise<Transaction | null> {
    const database = await getDb();
    const rows = await database.getAllAsync(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );
    return rows.length > 0 ? this.mapRowToTransaction(rows[0]) : null;
  },

  /**
   * 查询所有账单（支持分页）
   */
  async getAll(limit?: number, offset?: number): Promise<Transaction[]> {
    const database = await getDb();
    const rows = await database.getAllAsync(
      `SELECT * FROM transactions ORDER BY date DESC, created_at DESC`
    );

    let result = rows.map(row => this.mapRowToTransaction(row));

    if (limit) {
      result = result.slice(offset || 0, limit + (offset || 0));
    }

    return result;
  },

  /**
   * 按日期范围查询账单
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const database = await getDb();
    const rows = await database.getAllAsync(
      `SELECT * FROM transactions WHERE date >= ? AND date <= ?`,
      [startDate, endDate]
    );
    return rows.map(row => this.mapRowToTransaction(row));
  },

  /**
   * 统计时间段内的总额
   */
  async getTotalByDateRange(startDate: string, endDate: string): Promise<{ income: number; expense: number }> {
    const transactions = await this.getByDateRange(startDate, endDate);

    const result = { income: 0, expense: 0 };
    for (const tx of transactions) {
      if (tx.type === 'income') {
        result.income += tx.amount;
      } else {
        result.expense += tx.amount;
      }
    }

    return result;
  },

  /**
   * 统计时间段内各分类的总额
   */
  async getTotalByCategory(startDate: string, endDate: string): Promise<Array<{ category: string; total: number; count: number }>> {
    const transactions = await this.getByDateRange(startDate, endDate);
    const expenseTx = transactions.filter(tx => tx.type === 'expense');

    const categoryMap = new Map<string, { total: number; count: number }>();
    for (const tx of expenseTx) {
      const existing = categoryMap.get(tx.category) || { total: 0, count: 0 };
      categoryMap.set(tx.category, {
        total: existing.total + tx.amount,
        count: existing.count + 1,
      });
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  },

  /**
   * 更新账单
   */
  async update(id: string, form: Partial<TransactionForm>): Promise<Transaction | null> {
    const database = await getDb();
    const existing = await this.getById(id);

    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      ...form,
      updatedAt: new Date().toISOString(),
    };

    // 注意：LocalStorageDatabase没有UPDATE实现，需要删除后重新插入
    await database.runAsync(
      `UPDATE transactions SET amount = ?, description = ?, category = ?, type = ?, date = ?, merchant = ?, image_url = ?, source = ?, tags = ?, notes = ?, updated_at = ? WHERE id = ?`,
      [
        updated.amount,
        updated.description,
        updated.category,
        updated.type,
        updated.date,
        updated.merchant || null,
        updated.imageUrl || null,
        updated.source,
        updated.tags ? JSON.stringify(updated.tags) : null,
        updated.notes || null,
        updated.updatedAt,
        id,
      ]
    );

    return updated;
  },

  /**
   * 删除账单
   */
  async delete(id: string): Promise<boolean> {
    const database = await getDb();
    const result = await database.runAsync(
      `DELETE FROM transactions WHERE id = ?`,
      [id]
    );
    return result.changes > 0;
  },

  /**
   * 查询账单总数
   */
  async count(): Promise<number> {
    const database = await getDb();
    const rows = await database.getAllAsync(
      `SELECT COUNT(*) as count FROM transactions`
    );
    return rows.length;
  },

  /**
   * 将数据库行转换为Transaction对象
   */
  mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      amount: row.amount,
      description: row.description,
      category: row.category,
      type: row.type,
      date: row.date,
      merchant: row.merchant,
      imageUrl: row.image_url,
      source: row.source,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
};
