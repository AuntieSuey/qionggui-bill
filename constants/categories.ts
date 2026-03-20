import { Category } from '../types/category';

/**
 * 预设分类列表
 */
export const DEFAULT_CATEGORIES: Category[] = [
  // 支出分类
  {
    id: 'food',
    name: '餐饮',
    icon: 'food',
    color: '#FF6B6B',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'transport',
    name: '交通',
    icon: 'transport',
    color: '#4ECDC4',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'shopping',
    name: '购物',
    icon: 'shopping',
    color: '#FFD93D',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'entertainment',
    name: '娱乐',
    icon: 'entertainment',
    color: '#95E1D3',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'medical',
    name: '医疗',
    icon: 'medical',
    color: '#F38181',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'education',
    name: '教育',
    icon: 'education',
    color: '#AA96DA',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'housing',
    name: '住房',
    icon: 'housing',
    color: '#FCBAD3',
    type: 'expense',
    isActive: true,
  },
  {
    id: 'other_expense',
    name: '其他支出',
    icon: 'other',
    color: '#A8A8A8',
    type: 'expense',
    isActive: true,
  },
  // 收入分类
  {
    id: 'salary',
    name: '工资',
    icon: 'salary',
    color: '#6BCB77',
    type: 'income',
    isActive: true,
  },
  {
    id: 'bonus',
    name: '奖金',
    icon: 'bonus',
    color: '#FFD93D',
    type: 'income',
    isActive: true,
  },
  {
    id: 'investment',
    name: '理财',
    icon: 'investment',
    color: '#4D96FF',
    type: 'income',
    isActive: true,
  },
  {
    id: 'other_income',
    name: '其他收入',
    icon: 'other',
    color: '#A8A8A8',
    type: 'income',
    isActive: true,
  },
];

/**
 * 根据ID获取分类
 */
export function getCategoryById(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id);
}

/**
 * 根据类型获取分类列表
 */
export function getCategoriesByType(type: 'expense' | 'income'): Category[] {
  return DEFAULT_CATEGORIES.filter(cat => cat.type === type && cat.isActive);
}

/**
 * 获取所有分类
 */
export function getAllCategories(): Category[] {
  return DEFAULT_CATEGORIES.filter(cat => cat.isActive);
}
