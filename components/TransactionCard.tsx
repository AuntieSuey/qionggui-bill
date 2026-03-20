import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';
import { Transaction, Category } from '../types/transaction';
import { formatAmountWithSymbol, formatDateFriendly } from '../utils/dateUtils';
import { getCategoryById } from '../constants/categories';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * 账单卡片组件
 */
export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const category = getCategoryById(transaction.category);
  const isExpense = transaction.type === 'expense';

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.leftSection}>
          <View style={[styles.categoryIcon, { backgroundColor: category?.color || '#ccc' }]}>
            <Text style={styles.categoryEmoji}>
              {getCategoryEmoji(category?.icon)}
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.description} numberOfLines={1}>
              {transaction.description}
            </Text>
            <Text style={styles.meta}>
              {formatDateFriendly(transaction.date)} · {category?.name || '未分类'}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={[
            styles.amount,
            { color: isExpense ? '#FF6B6B' : '#6BCB77' }
          ]}>
            {isExpense ? '-' : '+'}{formatAmountWithSymbol(transaction.amount)}
          </Text>
          <IconButton
            icon="pencil"
            size={20}
            iconColor="#666"
            onPress={() => onEdit(transaction.id)}
            style={styles.editButton}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#FF6B6B"
            onPress={() => onDelete(transaction.id)}
            style={styles.deleteButton}
          />
        </View>
      </Card.Content>
    </Card>
  );
}

/**
 * 根据分类图标返回emoji
 */
function getCategoryEmoji(icon?: string): string {
  const emojiMap: Record<string, string> = {
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎮',
    medical: '💊',
    education: '📚',
    housing: '🏠',
    salary: '💰',
    bonus: '🎁',
    investment: '📈',
    other: '📝',
  };
  return icon ? emojiMap[icon] || '📝' : '📝';
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  infoSection: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: '#999',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  editButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  deleteButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
});
