import { Platform } from 'react-native';

// Web平台使用localStorage，移动端使用SQLite
// 在Web上，Platform.OS可能是'web'、'ios'或'android'取决于构建配置
// 使用typeof window来更可靠地检测Web平台
export const isWeb = typeof window !== 'undefined' && window.document != null;
