import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactions } from '../context/TransactionContext';
import { formatAmount, getDateRangeByName } from '../utils/dateUtils';
import { getCategoriesByType, getAllCategories } from '../constants/categories';
import { Category } from '../types/category';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * 统计分析页面
 */
export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions();

  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [menuVisible, setMenuVisible] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryStats, setCategoryStats] = useState<Array<{ category: string; name: string; color: string; total: number; count: number }>>([]);

  // 计算统计数据
  useEffect(() => {
    calculateStats();
  }, [transactions, selectedRange]);

  const calculateStats = () => {
    let start: string, end: string;

    switch (selectedRange) {
      case 'week':
        ({ start, end } = getDateRangeByName('week'));
        break;
      case 'month':
        ({ start, end } = getDateRangeByName('month'));
        break;
      case 'year':
        start = new Date(new Date().getFullYear(), 0, 1).toISOString();
        end = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59).toISOString();
        break;
      case 'custom':
        if (!startDate || !endDate) {
          ({ start, end } = getDateRangeByName('month'));
        } else {
          start = startDate;
          end = endDate;
        }
        break;
      default:
        ({ start, end } = getDateRangeByName('month'));
    }

    const filtered = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= new Date(start) && txDate <= new Date(end);
    });

    setFilteredTransactions(filtered);

    // 计算总额
    let income = 0;
    let expense = 0;
    filtered.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    });
    setTotalIncome(income);
    setTotalExpense(expense);

    // 按分类统计（仅支出）
    const expenseByCategory = filtered
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

    const allCategories = getAllCategories();
    const stats = Object.entries(expenseByCategory)
      .map(([categoryId, total]) => {
        const category = allCategories.find(c => c.id === categoryId);
        return {
          category: categoryId,
          name: category?.name || '未知',
          color: category?.color || '#ccc',
          total,
          count: filtered.filter(tx => tx.category === categoryId).length,
        };
      })
      .sort((a, b) => b.total - a.total);

    setCategoryStats(stats);
  };

  // 生成简单的柱状图
  const renderBarChart = () => {
    const maxAmount = Math.max(totalIncome, totalExpense) || 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: 20,
                  width: (totalIncome / maxAmount) * (SCREEN_WIDTH - 100),
                  backgroundColor: '#6BCB77',
                },
              ]}
            />
            <Text style={styles.barLabel}>收入 ¥{formatAmount(totalIncome)}</Text>
          </View>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  height: 20,
                  width: (totalExpense / maxAmount) * (SCREEN_WIDTH - 100),
                  backgroundColor: '#FF6B6B',
                },
              ]}
            />
            <Text style={styles.barLabel}>支出 ¥{formatAmount(totalExpense)}</Text>
          </View>
        </View>
      </View>
    );
  };

  // 生成分类饼图（简化版，使用颜色块）
  const renderCategoryChart = () => {
    if (categoryStats.length === 0) {
      return (
        <View style={styles.emptyCategoryContainer}>
          <Text style={styles.emptyCategoryText}>暂无支出数据</Text>
        </View>
      );
    }

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>支出分类统计</Text>
          {categoryStats.map((stat, index) => (
            <View key={stat.category} style={styles.categoryStatRow}>
              <View style={styles.categoryStatLeft}>
                <View style={[styles.categoryDot, { backgroundColor: stat.color }]} />
                <Text style={styles.categoryName}>{stat.name}</Text>
                <Text style={styles.categoryCount}>({stat.count}笔)</Text>
              </View>
              <Text style={styles.categoryAmount}>
                ¥{formatAmount(stat.total)}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>统计分析</Text>

        {/* 时间范围选择 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>时间范围</Text>
            <SegmentedButtons
              value={selectedRange}
              onValueChange={value => setSelectedRange(value as any)}
              buttons={[
                { value: 'week', label: '本周' },
                { value: 'month', label: '本月' },
                { value: 'year', label: '今年' },
                { value: 'custom', label: '自定义' },
              ]}
              style={styles.segmentedButtons}
            />

            {selectedRange === 'custom' && (
              <View style={styles.customDateRow}>
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.dateButton}
                >
                  选择日期
                </Button>
                <Text style={styles.dateRangeText}>
                  {startDate && endDate
                    ? `${startDate} ~ ${endDate}`
                    : '请选择日期范围'}
                </Text>
              </View>
            )}

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<View />}
            >
              <Menu.Item
                onPress={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setStartDate(today);
                  setEndDate(today);
                  setMenuVisible(false);
                }}
                title="今天"
              />
              <Menu.Item
                onPress={() => {
                  const weekStart = new Date();
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                  const weekEnd = new Date(weekStart);
                  weekEnd.setDate(weekEnd.getDate() + 6);
                  setStartDate(weekStart.toISOString().split('T')[0]);
                  setEndDate(weekEnd.toISOString().split('T')[0]);
                  setMenuVisible(false);
                }}
                title="本周"
              />
              <Menu.Item
                onPress={() => {
                  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                  setStartDate(monthStart.toISOString().split('T')[0]);
                  setEndDate(monthEnd.toISOString().split('T')[0]);
                  setMenuVisible(false);
                }}
                title="本月"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  const yearStart = new Date(new Date().getFullYear(), 0, 1);
                  const yearEnd = new Date(new Date().getFullYear(), 11, 31);
                  setStartDate(yearStart.toISOString().split('T')[0]);
                  setEndDate(yearEnd.toISOString().split('T')[0]);
                  setMenuVisible(false);
                }}
                title="今年"
              />
            </Menu>
          </Card.Content>
        </Card>

        {/* 统计概览 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>收支概览</Text>
            {renderBarChart()}
            <View style={styles.totalRow}>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>总收入</Text>
                <Text style={[styles.totalAmount, { color: '#6BCB77' }]}>
                  ¥{formatAmount(totalIncome)}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>总支出</Text>
                <Text style={[styles.totalAmount, { color: '#FF6B6B' }]}>
                  ¥{formatAmount(totalExpense)}
                </Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>结余</Text>
                <Text style={[
                  styles.totalAmount,
                  { color: totalIncome - totalExpense >= 0 ? '#333' : '#FF6B6B' }
                ]}>
                  ¥{formatAmount(totalIncome - totalExpense)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 分类统计 */}
        {renderCategoryChart()}

        {/* 账单数量统计 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>账单统计</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{filteredTransactions.length}</Text>
                <Text style={styles.statLabel}>总笔数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {filteredTransactions.filter(tx => tx.type === 'expense').length}
                </Text>
                <Text style={styles.statLabel}>支出笔数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {filteredTransactions.filter(tx => tx.type === 'income').length}
                </Text>
                <Text style={styles.statLabel}>收入笔数</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  customDateRow: {
    marginTop: 12,
  },
  dateButton: {
    alignSelf: 'flex-start',
  },
  dateRangeText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    paddingVertical: 16,
  },
  chart: {
    gap: 16,
  },
  barContainer: {
    marginBottom: 8,
  },
  bar: {
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  emptyCategoryContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#999',
  },
  categoryStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  categoryCount: {
    fontSize: 12,
    color: '#999',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
});
