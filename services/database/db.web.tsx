// Web平台数据库实现（使用localStorage）
import { isWeb } from '../utils/platform';

export class WebDatabase {
  async runAsync(sql: string, params: any[] = []) {
    console.log('Web DB run:', sql, params);
    return { changes: 0 };
  }

  async getAllAsync(sql: string, params: any[] = []) {
    const key = `qionggui_${sql}_${params.join('_')}`;
    // @ts-ignore
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async getFirstAsync(sql: string, params: any[] = []) {
    const rows = await this.getAllAsync(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async execAsync(sql: string) {
    console.log('Web DB exec:', sql);
  }
}

let webDb: WebDatabase | null = null;

export async function openDatabase(): Promise<WebDatabase> {
  if (!webDb) {
    webDb = new WebDatabase();
  }
  return webDb;
}

export async function closeDatabase(): Promise<void> {
  webDb = null;
}
