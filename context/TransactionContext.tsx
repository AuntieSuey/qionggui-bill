import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction } from '../types/transaction';
import { transactionService } from '../services/database/TransactionService';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: any) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<any>) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<boolean>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

/**
 * 账单状态管理Provider
 */
export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 刷新账单列表
   */
  const refreshTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[TransactionContext] Refreshing transactions...');
      const data = await transactionService.getAll();
      console.log('[TransactionContext] Got', data.length, 'transactions');
      setTransactions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TransactionContext] Failed to refresh transactions:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加账单
   */
  const addTransaction = async (form: any): Promise<Transaction> => {
    try {
      setError(null);
      console.log('[TransactionContext] Adding transaction:', form);
      const transaction = await transactionService.create(form);
      console.log('[TransactionContext] Created:', transaction.id);
      await refreshTransactions();
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add transaction';
      console.error('[TransactionContext] Failed to add transaction:', err);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * 更新账单
   */
  const updateTransaction = async (id: string, updates: Partial<any>): Promise<Transaction | null> => {
    try {
      setError(null);
      const transaction = await transactionService.update(id, updates);
      if (transaction) {
        await refreshTransactions();
      }
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update transaction';
      console.error('[TransactionContext] Failed to update transaction:', err);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * 删除账单
   */
  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await transactionService.delete(id);
      if (success) {
        await refreshTransactions();
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete transaction';
      console.error('[TransactionContext] Failed to delete transaction:', err);
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * ��据ID获取账单
   */
  const getTransactionById = async (id: string): Promise<Transaction | null> => {
    return await transactionService.getById(id);
  };

  // 初始化加载数据
  useEffect(() => {
    console.log('[TransactionContext] Mounted, starting initial load...');
    refreshTransactions();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        error,
        refreshTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionById,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

/**
 * 使用账单Context的Hook
 */
export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
