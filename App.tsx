import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Provider as PaperProvider,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  SegmentedButtons,
  IconButton,
  FAB,
  Portal,
  Modal as PaperModal,
  List,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { v4 as uuidv4 } from 'uuid';
import * as ImagePicker from 'expo-image-picker';

// ==================== Types ====================
export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionForm {
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: string;
}

// ==================== Database ====================
const isWeb = Platform.OS === 'web';
const DB_KEY = 'qionggui-bill-transactions';

let db: any;

if (isWeb) {
  db = {
    async runAsync(sql: string, params: any[] = []): Promise<void> {
      const transactions = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      console.log('[WebDB] runAsync:', sql, params);
    },
    getAllAsync(sql: string, params: any[] = []): Promise<any[]> {
      const transactions = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      console.log('[WebDB] getAllAsync:', sql, params);
      return Promise.resolve(transactions);
    },
  };
  db.runAsync(`CREATE TABLE IF NOT EXISTS transactions (...)`).catch(() => {});
} else {
  db = SQLite.openDatabaseSync('qionggui-bill.db');
  db.runSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);
  db.runSync(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
  db.runSync(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);

  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
  if (count.count === 0) {
    const now = new Date().toISOString();
    const sampleTransactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [
      { type: 'expense', amount: 12.5, description: '奶茶', category: '餐饮', date: now },
      { type: 'expense', amount: 35.0, description: '地铁', category: '交通', date: subDays(now, 1).toISOString() },
      { type: 'income', amount: 5000.0, description: '工资', category: '工资', date: subDays(now, 2).toISOString() },
    ];
    sampleTransactions.forEach(tx => {
      const id = uuidv4();
      db.runSync(
        `INSERT INTO transactions (id, type, amount, description, category, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, tx.type, tx.amount, tx.description, tx.category, tx.date, now, now]
      );
    });
    console.log('[Database] Seeded with sample data');
  }
}

export { db };

// ==================== Categories ====================
export const EXPENSE_CATEGORIES = [
  { key: '餐饮', label: '餐饮', icon: 'food', color: '#FF6B6B' },
  { key: '交通', label: '交通', icon: 'car', color: '#4ECDC4' },
  { key: '购物', label: '购物', icon: 'shopping', color: '#FFD93D' },
  { key: '娱乐', label: '娱乐', icon: 'gamepad-variant', color: '#A8E6CF' },
  { key: '医疗', label: '医疗', icon: 'medical', color: '#FF8B94' },
  { key: '教育', label: '教育', icon: 'book', color: '#C7CEEA' },
  { key: '住房', label: '住房', icon: 'home', color: '#B5EAD7' },
  { key: '其他支出', label: '其他支出', icon: 'dots-horizontal', color: '#9E9E9E' },
];

export const INCOME_CATEGORIES = [
  { key: '工资', label: '工资', icon: 'cash', color: '#66BB6A' },
  { key: '奖金', label: '奖金', icon: 'gift', color: '#AB47BC' },
  { key: '理财', label: '理财', icon: 'trending-up', color: '#5C6BC0' },
  { key: '其他收入', label: '其他收入', icon: 'dots-horizontal', color: '#78909C' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

// ==================== Utils ====================
function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

function getDateRange(type: 'today' | 'week' | 'month' | 'all'): { start: string; end: string } {
  const now = new Date();
  switch (type) {
    case 'today':
      return { start: startOfDay(now).toISOString(), end: endOfDay(now).toISOString() };
    case 'week':
      return { start: startOfWeek(now, { locale: zhCN }).toISOString(), end: endOfWeek(now, { locale: zhCN }).toISOString() };
    case 'month':
      return { start: startOfMonth(now).toISOString(), end: endOfMonth(now).toISOString() };
    case 'all':
    default:
      return { start: '1970-01-01', end: '2100-12-31' };
  }
}

// ==================== Transaction Service ====================
class TransactionService {
  async getAll(): Promise<Transaction[]> {
    if (isWeb) {
      return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } else {
      return new Promise((resolve, reject) => {
        db.transaction((tx: any) => {
          tx.executeSql(
            'SELECT * FROM transactions ORDER BY date DESC, createdAt DESC',
            [],
            (_, result: any) => {
              const rows = result.rows;
              const transactions: Transaction[] = [];
              for (let i = 0; i < rows.length; i++) {
                transactions.push(rows.item(i) as Transaction);
              }
              resolve(transactions);
            },
            (_, error: any) => {
              reject(error);
              return false;
            }
          );
        });
      });
    }
  }

  async create(form: TransactionForm): Promise<Transaction> {
    const now = new Date().toISOString();
    const transaction: Transaction = { ...form, id: uuidv4(), createdAt: now, updatedAt: now };

    if (isWeb) {
      const transactions = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      transactions.push(transaction);
      localStorage.setItem(DB_KEY, JSON.stringify(transactions));
      console.log('[TransactionService] Created (web):', transaction);
    } else {
      db.runSync(
        `INSERT INTO transactions (id, type, amount, description, category, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [transaction.id, transaction.type, transaction.amount, transaction.description, transaction.category, transaction.date, transaction.createdAt, transaction.updatedAt]
      );
      console.log('[TransactionService] Created (mobile):', transaction);
    }

    return transaction;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const all = await this.getAll();
    return all.filter(tx => tx.date >= startDate && tx.date <= endDate);
  }

  async getTotalByDateRange(startDate: string, endDate: string): Promise<{ income: number; expense: number }> {
    const transactions = await this.getByDateRange(startDate, endDate);
    const income = transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return { income, expense };
  }

  async delete(id: string): Promise<boolean> {
    if (isWeb) {
      const transactions = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
      const filtered = transactions.filter((tx: any) => tx.id !== id);
      localStorage.setItem(DB_KEY, JSON.stringify(filtered));
      console.log('[TransactionService] Deleted (web):', id);
      return true;
    } else {
      const result = db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
      console.log('[TransactionService] Deleted (mobile):', id, result);
      return result > 0;
    }
  }
}

export const transactionService = new TransactionService();

// ==================== Context ====================
interface TransactionContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType>({
  refreshTrigger: 0,
  triggerRefresh: () => {},
  loading: false,
});

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  const triggerRefresh = () => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <TransactionContext.Provider value={{ refreshTrigger, triggerRefresh, loading }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => useContext(TransactionContext);

// ==================== Screens ====================

// ----- Bill List Screen -----
interface BillListScreenProps {
  onNavigateToAdd: () => void;
  onNavigateToAddWithOCR: () => void;
}

const BillListScreen: React.FC<BillListScreenProps> = ({ onNavigateToAdd, onNavigateToAddWithOCR }) => {
  const { refreshTrigger } = useTransaction();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await transactionService.getAll();
      setTransactions(all);
      applyFilter(all, dateFilter);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (txs: Transaction[], filter: typeof dateFilter) => {
    const { start, end } = getDateRange(filter);
    const filtered = txs.filter(tx => tx.date >= start && tx.date <= end);
    setFilteredTransactions(filtered);

    const income = filtered.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const expense = filtered.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    setTotals({ income, expense });
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilter(transactions, dateFilter);
  }, [dateFilter, transactions]);

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await transactionService.delete(transactionToDelete.id);
      setDeleteModalVisible(false);
      setTransactionToDelete(null);
      loadData();
    } catch (error) {
      Alert.alert('错误', '删除失败');
    }
  };

  const confirmDelete = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setDeleteModalVisible(true);
  };

  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={dateFilter}
        onValueChange={setDateFilter}
        buttons={[
          { value: 'today', label: '今天' },
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' },
          { value: 'all', label: '全部' },
        ]}
        style={styles.filterButtons}
      />

      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>收入</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{formatCurrency(totals.income)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>支出</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>{formatCurrency(totals.expense)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>结余</Text>
              <Text style={[styles.summaryValue, { color: totals.income - totals.expense >= 0 ? '#2196F3' : '#F44336' }]}>
                {formatCurrency(totals.income - totals.expense)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" />
      ) : sortedDates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暂无数据</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {sortedDates.map(date => (
            <View key={date}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{format(parseISO(date), 'M月d日 EEEE', { locale: zhCN })}</Text>
                <Text style={styles.dateTotal}>
                  {formatCurrency(groupedTransactions[date].filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0))}
                  {' / '}
                  {formatCurrency(groupedTransactions[date].filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0))}
                </Text>
              </View>
              {groupedTransactions[date].map(tx => {
                const cat = ALL_CATEGORIES.find(c => c.key === tx.category);
                return (
                  <Card key={tx.id} style={styles.transactionCard}>
                    <Card.Content style={styles.transactionContent}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: cat?.color || '#ccc' }]}>
                          <Text style={styles.categoryIconText}>{cat?.icon || '?'}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionDesc}>{tx.description}</Text>
                          <Text style={styles.transactionCategory}>{cat?.label || tx.category}</Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: tx.type === 'income' ? '#4CAF50' : '#F44336' }]}>
                          {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </Text>
                        <IconButton icon="delete" size={18} onPress={() => confirmDelete(tx)} />
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      <FAB icon="plus" style={styles.fab} onPress={onNavigateToAdd} label="添加" />
      <FAB icon="camera" style={[styles.fab, styles.fabCamera]} onPress={onNavigateToAddWithOCR} />

      <Portal>
        <PaperModal
          visible={deleteModalVisible}
          onDismiss={() => setDeleteModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title>确认删除</Title>
          <Paragraph>确定要删除这条记录吗？此操作无法撤销。</Paragraph>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setDeleteModalVisible(false)}>取消</Button>
            <Button mode="contained" onPress={handleDelete} style={{ marginLeft: 10 }}>删除</Button>
          </View>
        </PaperModal>
      </Portal>
    </View>
  );
};

// ----- Add Transaction Screen -----
interface AddTransactionScreenProps {
  onNavigateBack: () => void;
  triggerOCR?: boolean;
  onOCRHandled?: () => void;
}

const AddTransactionScreen: React.FC<AddTransactionScreenProps> = ({ onNavigateBack, triggerOCR = false, onOCRHandled }) => {
  const { triggerRefresh } = useTransaction();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [smartCommand, setSmartCommand] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // 自动触发 OCR
  useEffect(() => {
    if (triggerOCR) {
      handleSelectImage();
    }
  }, [triggerOCR]);

  // 通知父组件 OCR 已处理
  const handleOCRComplete = () => {
    if (onOCRHandled) onOCRHandled();
  };

  const handleSmartCommand = (command: string) => {
    console.log('[SmartCommand] Parsing:', command);
    if (!command.trim()) {
      setSuccessMessage('请输入指令');
      return;
    }

    // 提取金额
    const amountPatterns = [
      /(\d+(?:\.\d+)?)\s*元/,
      /(\d+(?:\.\d+)?)\s*块/,
      /¥\s*(\d+(?:\.\d+)?)/,
      /(\d+(?:\.\d+)?)$/,
      /(\d+(?:\.\d+)?)/,
    ];

    let amount: number | null = null;
    let amountMatchStr = '';

    for (const pattern of amountPatterns) {
      const match = command.match(pattern);
      if (match) {
        amount = parseFloat(match[1]);
        amountMatchStr = match[0];
        break;
      }
    }

    if (amount !== null) {
      setAmountInput(amount.toString());
      console.log('[SmartCommand] Amount:', amount);
    }

    // 提取描述
    let desc = command.trim();
    if (amountMatchStr) desc = desc.replace(amountMatchStr, '').trim();
    desc = desc.replace(/[¥￥元块]/g, '').trim();

    if (desc) {
      setDescription(desc);
      console.log('[SmartCommand] Description:', desc);
    }

    // 自动识别分类
    const lowerInput = command.toLowerCase();
    const categoryKeywords: Record<string, string[]> = {
      '餐饮': ['奶茶', '咖啡', '早餐', '午餐', '晚餐', '夜宵', '餐厅', '饭店', '火锅', '烧烤', '快餐', '面条', '米饭', '饺子', '蛋糕', '面包', '水果', '零食', '饮料', '水', '茶', '果汁', '牛奶', '酸奶', '冰淇淋', '肯德基', '麦当劳', '必胜客', '星巴克', '瑞幸', '蜜雪冰城'],
      '交通': ['地铁', '公交', '打车', '滴滴', '出租车', '网约车', '加油', '停车', '过路费', '高铁', '火车', '飞机', '机票', '火车票', '共享单车', '自行车', '电动车', '摩托车', '汽油', '洗车', '维修'],
      '购物': ['超市', '商场', '网购', '淘宝', '京东', '拼多多', '衣服', '裤子', '鞋子', '包包', '化妆品', '护肤品', '日用品', '零食', '水果', '蔬菜', '肉', '鱼', '文具', '书', '玩具', '礼品', '家具', '家电', '手机', '电脑'],
      '娱乐': ['电影', '游戏', '视频', '会员', '演唱会', 'KTV', '酒吧', '桌游', '旅游', '景点', '门票', '演出', '直播', '打赏', '电竞', '棋牌', '扑克', '麻将', '温泉', '健身', '运动'],
      '医疗': ['医院', '药店', '药', '体检', '疫苗', '挂号', '诊疗', '急诊', '门诊', '住院', '手术', '检查', '化验', 'X光', 'CT', '核磁', '医保', '体检中心'],
      '教育': ['学费', '培训', '课程', '补习', '学校', '大学', '中学', '小学', '幼儿园', '书本', '资料', '文具', '考试', '证书', '技能', '才艺', '兴趣班', '网课', '讲座'],
      '住房': ['房租', '房贷', '水电', '燃气', '物业', '维修', '装修', '家具', '家电', '日用品', '网络', '电视', '电话', '宽带', '取暖', '空调', '暖气'],
      '其他支出': ['其他', '杂费', '未知', '待分类', '意外', '罚款', '捐款', '礼金', '红包', '转账', '提现'],
      '工资': ['工资', '薪水', '薪资', '月薪', '年终奖', '绩效', '补贴', '加班费', '底薪', '提成'],
      '奖金': ['奖金', '年终奖', '绩效奖', '项目奖', '抽奖', '中奖', '红包', '津贴'],
      '理财': ['理财', '收益', '分红', '利息', '股票', '基金', '债券', '投资', '回本', '股息', '租金', '房租收入'],
      '其他收入': ['退款', '返还', '报销', '押金', '赔偿', '意外之财', '赠款', '赞助', '兼职', '稿费', '专利费'],
    };

    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerInput.includes(keyword))) {
        setCategory(cat);
        console.log('[SmartCommand] Category:', cat);
        break;
      }
    }

    setSuccessMessage('已自动解析！请检查并完善信息');
    console.log('[SmartCommand] Parsed:', { amount: amountInput, description, category });
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') handleSmartCommand(smartCommand);
  };

  const handleSelectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setSuccessMessage('需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setIsProcessingOCR(true);

        try {
          const recognizedText = await performOCR(uri);
          console.log('[OCR] Recognized text:', recognizedText);
          setSmartCommand(recognizedText);
          handleSmartCommand(recognizedText);
          setSuccessMessage('OCR识别成功！已自动填充表单');
        } catch (ocrError) {
          console.error('[OCR] Failed:', ocrError);
          setSuccessMessage('OCR识别失败，请手动输入');
        } finally {
          setIsProcessingOCR(false);
          handleOCRComplete();
        }
      }
    } catch (error) {
      console.error('[ImagePicker] Error:', error);
      setSuccessMessage('图片选择失败');
      setIsProcessingOCR(false);
      handleOCRComplete();
    }
  };

  const performOCR = async (imageUri: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockTexts = ['奶茶18元', '午餐35元', '打车25元', '超市购物128元', '星巴克咖啡32元'];
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    console.log('[OCR] Simulated recognition for:', imageUri);
    return randomText;
  };

  const handleSubmit = async () => {
    const amount = parseAmount(amountInput);
    if (!amount || amount <= 0) {
      setSuccessMessage('请输入有效的金额');
      return;
    }
    if (!description.trim()) {
      setSuccessMessage('请输入描述');
      return;
    }
    if (!category) {
      setSuccessMessage('请选择分类');
      return;
    }

    setLoading(true);
    try {
      await transactionService.create({
        type,
        amount,
        description: description.trim(),
        category,
        date: new Date(date).toISOString(),
      });

      setSuccessMessage('记录已添加');
      triggerRefresh();
      setAmountInput('');
      setDescription('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);

      setTimeout(() => {
        onNavigateBack();
      }, 1000);
    } catch (error) {
      console.error('[AddTransaction] Failed:', error);
      setSuccessMessage('保存失败: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.addContent}>
      {/* Type Toggle */}
      <View style={styles.typeToggle}>
        <Button
          mode={type === 'expense' ? 'contained' : 'outlined'}
          onPress={() => { setType('expense'); setCategory(''); }}
          style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
        >
          支出
        </Button>
        <Button
          mode={type === 'income' ? 'contained' : 'outlined'}
          onPress={() => { setType('income'); setCategory(''); }}
          style={[styles.typeButton, type === 'income' && styles.typeButtonActive]}
        >
          收入
        </Button>
      </View>

      {/* Amount Input */}
      <Card style={styles.inputCard}>
        <Card.Content>
          <Text style={styles.inputLabel}>金额</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>¥</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={amountInput}
              onChangeText={setAmountInput}
              onBlur={() => handleSmartCommand(description + amountInput)}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Category Picker */}
      <Card style={styles.inputCard}>
        <Card.Content>
          <Text style={styles.inputLabel}>分类</Text>
          <TouchableOpacity
            style={[styles.categoryPicker, category && { borderColor: categories[0]?.color }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={category ? styles.categorySelected : styles.categoryPlaceholder}>
              {category || '请选择分类'}
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Date Picker */}
      <Card style={styles.inputCard}>
        <Card.Content>
          <Text style={styles.inputLabel}>日期</Text>
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
        </Card.Content>
      </Card>

      {/* Description Input */}
      <Card style={styles.inputCard}>
        <Card.Content>
          <Text style={styles.inputLabel}>描述</Text>
          <TextInput
            style={styles.textInput}
            placeholder="例如：奶茶、午餐..."
            value={description}
            onChangeText={setDescription}
            onBlur={() => handleSmartCommand(description + amountInput)}
          />
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        保存
      </Button>

      {/* Smart Command Section */}
      <Card style={styles.inputCard}>
        <Card.Content>
          <Text style={styles.inputLabel}>智能指令</Text>
          <View style={styles.smartCommandRow}>
            <Button
              icon="camera"
              mode="outlined"
              onPress={handleSelectImage}
              style={styles.smartCommandCameraButton}
              disabled={isProcessingOCR}
            >
              {isProcessingOCR ? '识别中...' : '拍照'}
            </Button>
            <TextInput
              style={styles.smartCommandInput}
              placeholder="输入一句话，如：奶茶12元"
              value={smartCommand}
              onChangeText={setSmartCommand}
              onSubmitEditing={() => handleSmartCommand(smartCommand)}
              returnKeyType="done"
            />
            <Button
              mode="contained"
              onPress={() => handleSmartCommand(smartCommand || description)}
              style={styles.smartCommandParseButton}
            >
              确定
            </Button>
          </View>
        </Card.Content>
      </Card>


      {/* Category Picker Modal */}
      <Portal>
        <PaperModal
          visible={showCategoryPicker}
          onDismiss={() => setShowCategoryPicker(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title>选择{type === 'expense' ? '支出' : '收入'}分类</Title>
          <ScrollView style={styles.categoryList}>
            {categories.map(cat => (
              <List.Item
                key={cat.key}
                title={cat.label}
                left={() => (
                  <View style={[styles.categoryIconModal, { backgroundColor: cat.color }]}>
                    <Text style={styles.categoryIconText}>{cat.icon}</Text>
                  </View>
                )}
                onPress={() => {
                  setCategory(cat.key);
                  setShowCategoryPicker(false);
                }}
                style={styles.categoryItem}
              />
            ))}
          </ScrollView>
        </PaperModal>

        {successMessage && (
          <Snackbar
            visible={!!successMessage}
            onDismiss={() => setSuccessMessage(null)}
            duration={3000}
            style={successMessage.includes('失败') ? { backgroundColor: '#F44336' } : undefined}
          >
            {successMessage}
          </Snackbar>
        )}
      </Portal>
    </ScrollView>
  );
};

// ----- Stats Screen -----
const StatsScreen: React.FC = () => {
  const { refreshTrigger } = useTransaction();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const all = await transactionService.getAll();
      setTransactions(all);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const { start, end } = getDateRange(period === 'week' ? 'week' : period === 'year' ? 'all' : 'month');
  const periodTransactions = transactions.filter(tx => tx.date >= start && tx.date <= end);

  const totalIncome = periodTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = periodTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

  const expenseByCategory: Record<string, number> = {};
  periodTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
    expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + tx.amount;
  });

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.statsContent}>
      <Title style={styles.statsTitle}>统计</Title>

      <SegmentedButtons
        value={period}
        onValueChange={setPeriod}
        buttons={[
          { value: 'week', label: '本周' },
          { value: 'month', label: '本月' },
          { value: 'year', label: '全年' },
        ]}
        style={styles.filterButtons}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" />
      ) : (
        <>
          <View style={styles.statsCards}>
            <Card style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
              <Card.Content>
                <Text style={styles.statLabel}>收入</Text>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{formatCurrency(totalIncome)}</Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
              <Card.Content>
                <Text style={styles.statLabel}>支出</Text>
                <Text style={[styles.statValue, { color: '#F44336' }]}>{formatCurrency(totalExpense)}</Text>
              </Card.Content>
            </Card>
          </View>

          {sortedCategories.length > 0 && (
            <Card style={styles.breakdownCard}>
              <Card.Content>
                <Title>支出分类 TOP 5</Title>
                <Divider style={styles.divider} />
                {sortedCategories.map(([category, amount]) => {
                  const catInfo = EXPENSE_CATEGORIES.find(c => c.key === category);
                  const percentage = totalExpense > 0 ? (amount / totalExpense * 100).toFixed(1) : '0';
                  return (
                    <View key={category} style={styles.breakdownRow}>
                      <View style={styles.breakdownLeft}>
                        <View style={[styles.breakdownIcon, { backgroundColor: catInfo?.color || '#ccc' }]}>
                          <Text style={styles.breakdownIconText}>{catInfo?.icon || '?'}</Text>
                        </View>
                        <Text style={styles.breakdownCategory}>{catInfo?.label || category}</Text>
                      </View>
                      <View style={styles.breakdownRight}>
                        <Text style={styles.breakdownAmount}>{formatCurrency(amount)}</Text>
                        <Text style={styles.breakdownPercent}>{percentage}%</Text>
                      </View>
                    </View>
                  );
                })}
              </Card.Content>
            </Card>
          )}

          <Card style={styles.infoCard}>
            <Card.Content>
              <Title>其他信息</Title>
              <Divider />
              <View style={styles.infoRow}>
                <Text>交易笔数</Text>
                <Text>{periodTransactions.length} 笔</Text>
              </View>
              <View style={styles.infoRow}>
                <Text>平均每笔支出</Text>
                <Text>
                  {formatCurrency(
                    periodTransactions.filter(tx => tx.type === 'expense').length > 0
                      ? totalExpense / periodTransactions.filter(tx => tx.type === 'expense').length
                      : 0
                  )}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

// ==================== Main App with Tab Navigation ====================
type TabType = 'bills' | 'add' | 'stats';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('bills');
  const { refreshTrigger, triggerRefresh } = useTransaction();
  const [ocrTrigger, setOcrTrigger] = useState(0);

  const handleNavigateToAdd = () => setActiveTab('add');
  const handleNavigateToAddWithOCR = () => { setOcrTrigger(prev => prev + 1); setActiveTab('add'); };
  const handleOCRHandled = () => setOcrTrigger(0);

  const renderScreen = () => {
    switch (activeTab) {
      case 'bills':
        return <BillListScreen onNavigateToAdd={handleNavigateToAdd} onNavigateToAddWithOCR={handleNavigateToAddWithOCR} />;
      case 'add':
        return <AddTransactionScreen onNavigateBack={() => setActiveTab('bills')} triggerOCR={ocrTrigger > 0} onOCRHandled={handleOCRHandled} />;
      case 'stats':
        return <StatsScreen />;
      default:
        return <BillListScreen onNavigateToAdd={handleNavigateToAdd} onNavigateToAddWithOCR={handleNavigateToAddWithOCR} />;
    }
  };

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <TransactionProvider>
          <View style={styles.appContainer}>
            {renderScreen()}
            <View style={styles.tabBar}>
              <TouchableOpacity style={[styles.tab, activeTab === 'bills' && styles.tabActive]} onPress={() => setActiveTab('bills')}>
                <Text style={[styles.tabIcon, activeTab === 'bills' && styles.tabIconActive]}>📋</Text>
                <Text style={[styles.tabLabel, activeTab === 'bills' && styles.tabLabelActive]}>账单</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'add' && styles.tabActive]} onPress={() => setActiveTab('add')}>
                <Text style={[styles.tabIcon, activeTab === 'add' && styles.tabIconActive]}>➕</Text>
                <Text style={[styles.tabLabel, activeTab === 'add' && styles.tabLabelActive]}>添加</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'stats' && styles.tabActive]} onPress={() => setActiveTab('stats')}>
                <Text style={[styles.tabIcon, activeTab === 'stats' && styles.tabIconActive]}>📊</Text>
                <Text style={[styles.tabLabel, activeTab === 'stats' && styles.tabLabelActive]}>统计</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TransactionProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// ==================== Styles ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  appContainer: { flex: 1, backgroundColor: '#f5f5f5' },

  // Bill List Styles
  filterButtons: { margin: 16, marginBottom: 8 },
  summaryCard: { marginHorizontal: 16, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: 'bold' },
  listContainer: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, color: '#999' },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#eee' },
  dateText: { fontSize: 14, fontWeight: '600', color: '#333' },
  dateTotal: { fontSize: 12, color: '#666' },
  transactionCard: { marginHorizontal: 16, marginVertical: 4 },
  transactionContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryIconText: { fontSize: 20, color: '#fff' },
  transactionInfo: { flex: 1 },
  transactionDesc: { fontSize: 16, color: '#333', marginBottom: 2 },
  transactionCategory: { fontSize: 12, color: '#999' },
  transactionRight: { flexDirection: 'row', alignItems: 'center' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', marginRight: 8 },
  fab: { position: 'absolute', right: 16, bottom: 80 },
  fabCamera: { position: 'absolute', right: 80, bottom: 80 },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 },

  // Add Screen Styles
  addContent: { padding: 16 },
  typeToggle: { flexDirection: 'row', marginBottom: 16 },
  typeButton: { flex: 1, marginHorizontal: 4 },
  typeButtonActive: { backgroundColor: '#2196F3' },
  inputCard: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 24, color: '#333', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: 'bold', color: '#333', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 12, fontSize: 16 },
  categoryPicker: { borderWidth: 1, borderColor: '#ddd', borderRadius: 4, padding: 12 },
  categorySelected: { fontSize: 16, color: '#333' },
  categoryPlaceholder: { fontSize: 16, color: '#999' },
  submitButton: { marginTop: 24, paddingVertical: 8 },
  // Smart Command Combined Section (bottom)
  smartCommandRow: { flexDirection: 'row', alignItems: 'center' },
  smartCommandInput: { flex: 1, borderWidth: 1, borderColor: '#2196F3', borderRadius: 4, padding: 12, fontSize: 16, marginHorizontal: 8, backgroundColor: '#fff' },
  smartCommandCameraButton: { marginRight: 8 },
  smartCommandParseButton: { paddingHorizontal: 16 },
  categoryList: { maxHeight: 300 },
  categoryItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  categoryIconModal: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryIconText: { fontSize: 16, color: '#fff' },

  // Stats Styles
  statsContent: { padding: 16 },
  statsTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  statsCards: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { flex: 1, marginHorizontal: 4 },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  breakdownCard: { marginBottom: 16 },
  divider: { marginVertical: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  breakdownIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  breakdownIconText: { fontSize: 16, color: '#fff' },
  breakdownCategory: { fontSize: 16, color: '#333' },
  breakdownRight: { alignItems: 'flex-end' },
  breakdownAmount: { fontSize: 16, fontWeight: '600', color: '#333' },
  breakdownPercent: { fontSize: 12, color: '#999' },
  infoCard: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },

  // Tab Bar Styles
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ddd', height: 60, paddingBottom: Platform.OS === 'ios' ? 10 : 0 },
  tab: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabActive: { borderTopWidth: 2, borderTopColor: '#2196F3' },
  tabIcon: { fontSize: 24, marginBottom: 2 },
  tabIconActive: { transform: [{ scale: 1.1 }] },
  tabLabel: { fontSize: 12, color: '#666' },
  tabLabelActive: { color: '#2196F3', fontWeight: '600' },
});
