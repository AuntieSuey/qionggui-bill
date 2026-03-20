import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Menu,
  Divider,
  HelperText,
  Card,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTransactions } from '../context/TransactionContext';
import { getCategoriesByType, getAllCategories } from '../constants/categories';
import { Category } from '../types/category';
import { parseAmount } from '../utils/dateUtils';

type TransactionType = 'expense' | 'income';

/**
 * 添加账单页面
 */
export default function AddTransactionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addTransaction } = useTransactions();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [parsing, setParsing] = useState(false);

  // 获取当前类型的分类列表
  const categories = getCategoriesByType(transactionType);
  const allCategories = getAllCategories();

  // 自动解析输入文本
  const parseInputText = (text: string) => {
    if (!text.trim()) return;

    setParsing(true);
    try {
      // 提取金额
      const amountValue = parseAmount(text);
      if (amountValue !== null) {
        setAmount(amountValue.toString());
      }

      // 提取分类（简单关键词匹配）
      let matchedCategory: Category | null = null;
      for (const cat of allCategories) {
        if (text.toLowerCase().includes(cat.name.toLowerCase())) {
          matchedCategory = cat;
          break;
        }
      }

      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
        setTransactionType(matchedCategory.type);
      }

      // 提取描述（移除金额和分类关键词）
      let desc = text;
      if (amountValue !== null) {
        desc = desc.replace(/[¥¥]?\s*\d+(?:\.\d{1,2})?\s*[元块]?/, '').trim();
      }
      if (matchedCategory) {
        desc = desc.replace(new RegExp(matchedCategory.name, 'gi'), '').trim();
      }
      if (desc) {
        setDescription(desc);
      } else if (matchedCategory) {
        setDescription(matchedCategory.name);
      }
    } finally {
      setParsing(false);
    }
  };

  // 处理描述输入变化（自动解析）
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    // 只有在用户输入完整后才触发解析（简单的防抖）
    if (text.includes('元') || text.includes('块') || /¥\d+/.test(text)) {
      parseInputText(text);
    }
  };

  // 选择分类
  const selectCategory = (category: Category) => {
    setSelectedCategory(category);
    setTransactionType(category.type);
    setMenuVisible(false);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证
    if (!description.trim()) {
      Alert.alert('提示', '请输入账单描述');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('提示', '请输入有效的金额');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('提示', '请选择分类');
      return;
    }

    if (!date) {
      Alert.alert('提示', '请选择日期');
      return;
    }

    try {
      await addTransaction({
        description: description.trim(),
        amount: Math.round(amountNum * 100), // 转换为分
        category: selectedCategory.id,
        type: transactionType,
        date: new Date(date + 'T00:00:00').toISOString(),
        source: 'manual',
        notes: notes.trim() || undefined,
      });

      Alert.alert('成功', '账单已添加', [
        { text: '继续添加', onPress: resetForm },
        { text: '返回', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('错误', '添加账单失败，请重试');
      console.error('Failed to add transaction:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    setDescription('');
    setAmount('');
    setSelectedCategory(null);
    setTransactionType('expense');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>添加账单</Text>

        {/* 一句话输入 */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="一句话记账"
              value={description}
              onChangeText={handleDescriptionChange}
              placeholder="例如：奶茶12元"
              mode="outlined"
              multiline
              style={styles.input}
              right={
                <TextInput.Icon
                  icon="auto-fix"
                  disabled={parsing}
                  onPress={() => parseInputText(description)}
                />
              }
            />
            <HelperText type="info" visible={true}>
              输入如"奶茶12元"，系统将自动解析金额和分类
            </HelperText>
          </Card.Content>
        </Card>

        {/* 金额输入 */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="金额"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              left={<TextInput.Icon icon="currency-cny" />}
            />
          </Card.Content>
        </Card>

        {/* 分类选择 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>分类</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuVisible(true)}
                  style={styles.categoryButton}
                >
                  {selectedCategory
                    ? `${selectedCategory.name} ${selectedCategory.type === 'expense' ? '支出' : '收入'}`
                    : '选择分类'}
                </Button>
              }
            >
              {categories.map(category => (
                <Menu.Item
                  key={category.id}
                  onPress={() => selectCategory(category)}
                  title={category.name}
                  leadingIcon={() => (
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Text style={styles.categoryIconText}>
                        {getCategoryEmoji(category.icon)}
                      </Text>
                    </View>
                  )}
                />
              ))}
            </Menu>
            {selectedCategory && (
              <HelperText type="info" visible={true}>
                已选择：{selectedCategory.name}
              </HelperText>
            )}
          </Card.Content>
        </Card>

        {/* 类型选择 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>类型</Text>
            <View style={styles.typeButtons}>
              <Button
                mode={transactionType === 'expense' ? 'contained' : 'outlined'}
                onPress={() => setTransactionType('expense')}
                style={[styles.typeButton, transactionType === 'expense' && styles.typeButtonActive]}
                buttonColor={transactionType === 'expense' ? '#FF6B6B' : undefined}
              >
                支出
              </Button>
              <Button
                mode={transactionType === 'income' ? 'contained' : 'outlined'}
                onPress={() => setTransactionType('income')}
                style={[styles.typeButton, transactionType === 'income' && styles.typeButtonActive]}
                buttonColor={transactionType === 'income' ? '#6BCB77' : undefined}
              >
                收入
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 日期选择 */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="日期"
              value={date}
              onChangeText={setDate}
              mode="outlined"
              style={styles.input}
              placeholder="YYYY-MM-DD"
            />
          </Card.Content>
        </Card>

        {/* 备注 */}
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="备注（可选）"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* 提交按钮 */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          保存账单
        </Button>

        <View style={styles.footer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
  },
  categoryButton: {
    alignSelf: 'flex-start',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
  },
  typeButtonActive: {
    elevation: 2,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  footer: {
    height: 40,
  },
});
