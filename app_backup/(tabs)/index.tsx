import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Text, SegmentedButtons, Portal, Modal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactions } from '../context/TransactionContext';
import { Transaction } from '../types/transaction';
import { formatAmount, getDateRangeByName } from '../utils/dateUtils';
import { getAllCategories } from '../constants/categories';

type DateRangeOption = 'today' | 'week' | 'month' | 'custom';

/**
 * 账单列表页面 - 简化版用于诊断
 */
export default function TransactionListScreen() {
  const insets = useSafeAreaInsets();
  const {
    transactions,
    loading,
    refreshTransactions,
    deleteTransaction,
  } = useTransactions();

  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('today');

  console.log('[TransactionList] render:', { transactionsCount: transactions.length, loading });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的账单</Text>
      </View>

      <View style={styles.filterSection}>
        <SegmentedButtons
          value={selectedRange}
          onValueChange={value => setSelectedRange(value as DateRangeOption)}
          buttons={[
            { value: 'today', label: '今天' },
            { value: 'week', label: '本周' },
            { value: 'month', label: '本月' },
            { value: 'custom', label: '自定义' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>收入</Text>
          <Text style={[styles.summaryAmount, { color: '#6BCB77' }]}>
            ¥0.00
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>支出</Text>
          <Text style={[styles.summaryAmount, { color: '#FF6B6B' }]}>
            ¥0.00
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {loading ? '加载中...' : `共 ${transactions.length} 条记录`}
          </Text>
          {transactions.length > 0 && (
            <View style={styles.debugList}>
              {transactions.slice(0, 3).map(tx => (
                <Text key={tx.id} style={styles.debugItem}>
                  {tx.date} | {tx.description} | ¥{formatAmount(tx.amount)}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  segmentedButtons: {
    elevation: 0,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  summarySection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  debugList: {
    marginTop: 20,
    padding: 10,
  },
  debugItem: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});
