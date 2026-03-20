# 穷鬼账单 - 记账应用

一个基于 React Native + Expo 开发的跨平台记账应用，支持移动端和网页端。

> **注意**: 本项目采用单文件架构，所有代码集中在 `App.tsx` 中，便于快速开发和部署。

## ✨ 核心特性

- 💬 **一句话智能记账** - 输入"奶茶12元"自动解析金额和分类
- 📷 **拍照识别**（准备中）- 集成百度OCR识别小票
- 🤖 **AI智能解析**（准备中）- 使用 Step Flash 3.5 结构化解析
- 📊 **账单列表** - 按日期分组，支持今天/本周/本月筛选
- 📈 **统计分析** - 支出分类TOP5，收支对比
- 💾 **本地优先** - 使用 SQLite（移动端）/ localStorage（Web）
- 🌐 **跨平台** - 一套代码同时运行在 iOS、Android 和 Web

## 技术栈

- **前端框架**: Expo SDK 55 + React Native 0.83
- **UI组件库**: React Native Paper (Material Design)
- **路由方案**: 无路由（单文件直接渲染）
- **数据库**: SQLite (移动端) / localStorage (Web)
- **状态管理**: React Context API
- **工具库**: date-fns（日期处理）、uuid（唯一ID）、expo-image-picker（图片选择）
- **图表**: Victory Native（待优化）

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- iOS Simulator (Mac) 或 Android Emulator
- 可选: Expo Go 移动端 App

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) 或 Android Emulator

### 安装步骤

1. **克隆或进入项目目录**
   ```bash
   cd qionggui-bill
   ```

2. **安装依赖**
   ```bash
   npm install
   ```
   如果遇到依赖冲突，使用：
   ```bash
   npm install --legacy-peer-deps
   ```

3. **一键启动（推荐）**
   ```bash
   # 使用提供的启动脚本
   ./穷鬼账单
   ```
   脚本会自动：
   - 清理残留进程和端口冲突
   - 检查并安装依赖
   - 启动 Expo 开发服务器
   - 等待就绪后自动打开浏览器

   或者手动启动：
   ```bash
   # 清除缓存启动
   npx expo start --clear --web
   ```

4. **在浏览器中访问**
   - 服务器启动后自动打开 http://localhost:19006
   - 或手动访问该地址
   - 使用 Expo Go App 扫描二维码在手机上预览

## 使用说明

### 添加账单

1. 点击底部"添加"标签
2. 输入描述（如"奶茶12元"），系统会自动解析金额和分类
3. 或手动输入金额、选择分类、类型
4. 选择日期（默认为今天）
5. 可选添加备注
6. 点击"保存账单"

### 查看账单

1. "账单"页面显示所有账单
2. 使用顶部筛选器切换时间范围：
   - **今天**: 仅显示今日账单
   - **本周**: 显示本周账单
   - **本��**: 显示本月账单
   - **自定义**: 显示全部账单
3. 账单按日期分组显示
4. 顶部显示当前时间范围的收入、支出、结余总额

### 编辑/删除账单

1. 在账单卡片右上角点击编辑图标（铅笔）修改账单
2. 点击删除图标（垃圾桶）删除账单
3. 删除前需要确认

### 统计分析

1. 点击"统计"标签
2. 选择时间范围（本周/本月/今年/自定义）
3. 查看：
   - 收支对比条形图
   - 支出分类统计（按分类汇总）
   - 账单数量统计

## 项目架构

本项目采用**单文件架构**（Single File Architecture），所有代码集中在 `App.tsx` 中，结构清晰，便于维护：

```
qionggui-bill/
├── App.tsx                      # 主应用文件（包含所有组件和服务）
├── CLAUDE.md                    # Claude Code 协作指南
├── README.md                    # 项目说明（本文件）
├── TESTING.md                   # 测试指南
├── package.json                 # 项目配置
├── tsconfig.json                # TypeScript 配置
├── app.json                     # Expo 配置
├── 穷鬼账单                     # 一键启动脚本（推荐使用）
├── types/                       # TypeScript 类型定义
│   ├── transaction.ts
│   └── category.ts
├── context/                     # React Context
│   └── TransactionContext.tsx
├── constants/                   # 常量配置
│   └── categories.ts
├── services/                    # 服务层
│   └── database/
│       ├── db.ts
│       ├── db.web.tsx
│       ├── db.native.tsx
│       └── TransactionService.ts
├── utils/                       # 工具函数
│   ├── dateUtils.ts
│   └── platform.ts
└── components/                  # 可复用组件
    ├── TransactionCard.tsx
    ├── ErrorBoundary.tsx
    └── TestComponent.tsx
```

### App.tsx 内部结构

```typescript
// 1. Types (37-54行)
export interface Transaction { ... }
export interface TransactionForm { ... }

// 2. Database Layer (56-111行)
const db = Platform.select({ ... })
class TransactionService { ... }

// 3. Constants (113-132行)
const EXPENSE_CATEGORIES = [...]
const INCOME_CATEGORIES = [...]

// 4. Utils (134-159行)
const parseAmount = (text: string) => ...
const formatCurrency = (amount: number) => ...
const getDateRange = (filter: string) => ...

// 5. Screens
const BillListScreen = ({ navigation }) => { ... }    // 274-448行
const AddTransactionScreen = ({ navigation }) => { ... } // 457-819行
const StatsScreen = ({ navigation }) => { ... }       // 822-942行

// 6. Main App (947-994行)
export default function App() { ... }
const styles = StyleSheet.create({ ... })              // 997-1082行
```

## 数据模型

### Transaction（账单）

```typescript
interface Transaction {
  id: string;           // UUID
  type: 'expense' | 'income';
  amount: number;       // 金额（元）
  description: string;  // 描述
  category: string;     // 分类名称
  date: string;         // ISO 8601 格式
  createdAt: string;    // 创建时间
  updatedAt: string;    // 更新时间
}
```

### 预设分类

**支出分类**（8个）:
- 🍔 餐饮 - 奶茶、咖啡、餐厅、火锅...
- 🚗 交通 - 地铁、公交、打车、加油...
- 🛍️ 购物 - 超市、淘宝、京东、衣服...
- 🎮 娱乐 - 电影、游戏、KTV、旅游...
- 💊 医疗 - 医院、药店、药品...
- 📚 教育 - 学费、培训、课程...
- 🏠 住房 - 房租、房贷、水电燃气...
- 📝 其他支出

**收入分类**（4个）:
- 💰 工资
- 🎁 奖金
- 📈 理财
- 📝 其他收入

## API 集成（待开发）

### Step Flash 3.5（AI智能解析）

计划用于自然语言处理的深度解析：

1. 申请 API 密钥：https://platform.stepfun.com/
2. 配置环境变量：
   ```bash
   EXPO_PUBLIC_STEP_API_KEY=your_api_key
   EXPO_PUBLIC_STEP_API_ENDPOINT=https://api.stepfun.com/v1
   ```
3. 功能：一句话智能解析、语义理解、分类推荐

### 百度 OCR（图片识别）

计划用于小票和截图识别：

1. 申请 API 密钥：https://ai.baidu.com/
2. 配置环境变量：
   ```bash
   EXPO_PUBLIC_BAIDU_OCR_API_KEY=your_api_key
   EXPO_PUBLIC_BAIDU_OCR_SECRET_KEY=your_secret_key
   ```
3. 功能：拍照识别、相册导入、文字提取

## 智能解析规则

当前 MVP 版本实现了基础的规则解析，支持：

- **金额识别**: `12元`、`¥35`、`5.5块`、`12` 等格式
- **描述提取**: 自动去除金额和货币符号
- **分类匹配**: 基于关键词自动匹配分类
- **类型推断**: 包含"工资"、"奖金"等关键词自动识别为收入

### 关键词分类示例

- "奶茶12元" → 餐饮、支出、12元
- "工资8000" → 工资、收入、8000元
- "地铁5块" → 交通、支出、5元
- "超市购物200" → 购物、支出、200元

### 未来 AI 增强

计划集成 Step Flash 3.5 API 后，将支持：
- 更复杂的自然语言（"今天吃了顿火锅花了300"）
- 模糊金额识别（"花了大概100左右"）
- 多实体提取（"买了奶茶和咖啡共35元"）
- 上下文理解（"和昨天一样的金额"）

## 测试指南

### 快速测试流程

1. **启动应用**
   ```bash
   ./穷鬼账单
   ```
   等待浏览器自动打开，或访问 http://localhost:19006

2. **测试添加账单**
   - 点击底部"添加"标签
   - 输入"奶茶12元"
   - 验证自动解析：金额=12.00，分类=餐饮，类型=支出
   - 点击"保存账单"
   - 提示"账单保存成功"

3. **测试账单列表**
   - 切换到"账单"标签
   - 验证新账单显示在列表中
   - 验证顶部"收入/支出/结余"总额
   - 尝试筛选：今天 / 本周 / 本月 / 全部

4. **测试删除账单**
   - 点击账单卡片右上角删除按钮（垃圾桶图标）
   - 确认删除对话框
   - 点击"删除"
   - 验证列表和总额更新

5. **测试统计分析**
   - 切换到"统计"标签
   - 切换时间范围（本周/本月/今年）
   - 查看支出分类TOP5图表
   - 验证数据正确性

6. **测试智能指令（底部）**
   - 在"添加"页面的底部智能指令区
   - 输入"地铁5元"并点击"确定"
   - 验证自动填充：金额=5.00，分类=交通
   - 点击"保存账单"

### 预期结果

所有功能应流畅运行，无控制台错误，数据持久化正常（刷新页面数据不丢失）。

### 浏览器开发者工具检查

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页，不应有红色错误
3. 查看 Application → Local Storage，确认数据存储正常

## 已知问题

1. **victory-native 兼容性**: 统计页图表组件可能存在兼容性问题，显示效果待优化
2. **移动端 SQLite**: Web 端使用 localStorage 模拟，移动端才使用真实 SQLite
3. **编辑功能**: 编辑功能为占位，尚未完整实现
4. **OCR/AI**: 需要配置 API 密钥后才能使用真实功能
5. **日期选择器**: 使用原生日期输入，体验可优化

## 后续计划

- [ ] OCR 图片识别（拍照/相册上传 + 百度 OCR）
- [ ] AI 智能解析（Step Flash 3.5 集成）
- [ ] 账单编辑功能完整实现
- [ ] 日期范围选择器优化
- [ ] 数据导出（CSV/Excel）
- [ ] 云端同步（Supabase）
- [ ] 多账户支持
- [ ] 预算管理
- [ ] 账单提醒
- [ ] 暗色主题
- [ ] 多语言支持

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT

---

**最后更新**: 2026-03-20
**版本**: 1.0.0-MVP
**架构**: 单文件架构（App.tsx）
