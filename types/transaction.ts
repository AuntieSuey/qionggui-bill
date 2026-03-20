export type TransactionSource = 'manual' | 'ai' | 'ocr' | 'rule';

export interface Transaction {
  id: string;
  amount: number; // 金额，单位为分（避免浮点数问题）
  description: string;
  category: string;
  type: 'expense' | 'income';
  date: string; // ISO 8601格式
  createdAt: string;
  updatedAt: string;
  merchant?: string; // 商家名称（OCR识别）
  imageUrl?: string; // 小票/截图URL
  source: TransactionSource;
  tags?: string[];
  notes?: string;
}

export interface TransactionForm {
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  date: string;
  merchant?: string;
  imageUrl?: string;
  source: TransactionSource;
  tags?: string[];
  notes?: string;
}
