// 简单的基础数据库接口
export interface Database {
  runAsync: (sql: string, params?: any[]) => Promise<{ changes: number }>;
  getAllAsync: (sql: string, params?: any[]) => Promise<any[]>;
  getFirstAsync: (sql: string, params?: any[]) => Promise<any | null>;
  execAsync: (sql: string) => Promise<void>;
}

// localStorage数据库实现（Web和移动端都使用，MVP阶段）
export class LocalStorageDatabase implements Database {
  private storageKey = 'qionggui-bill-data';

  private getData(): any {
    // @ts-ignore
    const data = localStorage.getItem(this.storageKey);
    const result = data ? JSON.parse(data) : { categories: [], transactions: [] };
    console.log('[LocalStorageDB] getData:', result);
    return result;
  }

  private setData(data: any) {
    // @ts-ignore
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number }> {
    console.log('DB run:', sql, params);
    // 简单的INSERT处理
    if (sql.startsWith('INSERT')) {
      const data = this.getData();
      if (sql.includes('categories')) {
        data.categories.push(params[0]);
      } else if (sql.includes('transactions')) {
        data.transactions.push(params[0]);
      }
      this.setData(data);
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  async getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
    const data = this.getData();

    if (sql.includes('categories')) {
      return data.categories || [];
    } else if (sql.includes('transactions')) {
      let transactions = data.transactions || [];

      // 简单的时间范围过滤
      if (params.length >= 2) {
        const [startDate, endDate] = params;
        transactions = transactions.filter((tx: any) => {
          const txDate = new Date(tx.date);
          return txDate >= new Date(startDate) && txDate <= new Date(endDate);
        });
      }

      // 排序
      if (sql.includes('ORDER BY')) {
        transactions.sort((a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }

      return transactions;
    }

    return [];
  }

  async getFirstAsync(sql: string, params: any[] = []): Promise<any | null> {
    const rows = await this.getAllAsync(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execAsync(sql: string): Promise<void> {
    console.log('DB exec:', sql);

    // 处理CREATE TABLE和INDEX
    const data = this.getData();

    if (sql.includes('CREATE TABLE categories')) {
      data.categories = data.categories || [];
    } else if (sql.includes('CREATE TABLE transactions')) {
      data.transactions = data.transactions || [];
    }

    this.setData(data);
  }
}

let dbInstance: LocalStorageDatabase | null = null;

export async function openDatabase(): Promise<Database> {
  console.log('[openDatabase] Opening database...');
  if (!dbInstance) {
    dbInstance = new LocalStorageDatabase();
    console.log('[openDatabase] Created new LocalStorageDatabase instance');
  } else {
    console.log('[openDatabase] Reusing existing instance');
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  console.log('[closeDatabase] Closing database');
  dbInstance = null;
}
