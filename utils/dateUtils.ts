import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化金额显示（分转元）
 */
export function formatAmount(amountInCents: number): string {
  const amountInYuan = amountInCents / 100;
  return amountInYuan.toFixed(2);
}

/**
 * 格式化金额为带人民币符号
 */
export function formatAmountWithSymbol(amountInCents: number): string {
  return `¥${formatAmount(amountInCents)}`;
}

/**
 * 格式化日期
 */
export function formatDate(dateString: string, formatStr: string = 'yyyy-MM-dd'): string {
  try {
    const date = new Date(dateString);
    return format(date, formatStr, { locale: zhCN });
  } catch (error) {
    console.error('Failed to format date:', error);
    return dateString;
  }
}

/**
 * 格式化日期为友好显示（如：今天、昨天）
 */
export function formatDateFriendly(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 清除时分秒，只比较日期部分
  const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const normDate = normalize(date);
  const normToday = normalize(today);
  const normYesterday = normalize(yesterday);

  if (normDate.getTime() === normToday.getTime()) {
    return '今天';
  } else if (normDate.getTime() === normYesterday.getTime()) {
    return '昨天';
  } else {
    return format(date, 'MM/dd', { locale: zhCN });
  }
}

/**
 * 获取今天的日期范围
 */
export function getTodayRange(): { start: string; end: string } {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * 获取本周的日期范围（周一到周日）
 */
export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 (周日) to 6 (周六)
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 调整到周一

  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * 获取本月的日期范围
 */
export function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * 获取自定义日期范围（按名称）
 */
export function getDateRangeByName(name: string): { start: string; end: string } {
  switch (name) {
    case 'today':
      return getTodayRange();
    case 'week':
      return getWeekRange();
    case 'month':
      return getMonthRange();
    default:
      return getTodayRange();
  }
}

/**
 * 解析自然语言中的金额
 */
export function parseAmount(text: string): number | null {
  // 匹配 "¥12", "12元", "12块", "12.5", "12.5元"
  const patterns = [
    /¥\s*(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*元/,
    /(\d+(?:\.\d{1,2})?)\s*块/,
    /(\d+(?:\.\d{1,2})?)/, // 纯数字
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      if (!isNaN(amount)) {
        return Math.round(amount * 100); // 转换为分
      }
    }
  }

  return null;
}
