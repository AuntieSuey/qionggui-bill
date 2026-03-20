# 穷鬼账单 - Claude Code 协作指南

## 项目概述

**项目名称**: 穷鬼账单 (Qionggui Bill)
**类型**: 跨平台记账应用
**技术栈**: React Native + Expo
**目标**: 开发一个轻量级、智能化的个人记账应用，支持移动端和网页端

### 核心功能
- 一句话智能指令记账（如"奶茶12元"）
- 拍照识别小票/导入支付截图（OCR）
- 按天/周/月查看账单
- 数据统计和分析
- 本地优先存储，可选云端同步

---

## 技术架构

### 依赖框架
- **Expo SDK 50+**: 跨平台开发框架
- **React Native Paper**: Material Design UI 组件库
- **Expo SQLite**: 本地数据库（移动端）
- **localStorage**: Web 端数据存储
- **date-fns**: 日期处理（中文locale）
- **uuid**: 唯一标识符生成
- **expo-image-picker**: 图片选择器

### 单文件架构
项目采用单一文件架构（`App.tsx`），所有组件、服务和逻辑都集中在一个文件中，便于快速开发和维护。

### 状态管理
- **Context API**: 使用 `TransactionProvider` 管理全局刷新状态
- **useState**: 组件本地状态
- **TransactionService**: 数据访问层，封装数据库操作

---

## 项目结构（App.tsx 内）

```
App.tsx
├── Types (37-54行)
│   ├── Transaction
│   └── TransactionForm
├── Database Layer (56-111行)
│   ├── db (Web: localStorage / Mobile: SQLite)
│   └── TransactionService
├── Constants (113-132行)
│   ├── EXPENSE_CATEGORIES (8类)
│   ├── INCOME_CATEGORIES (4类)
│   └── ALL_CATEGORIES
├── Utils (134-159行)
│   ├── parseAmount
│   ├── formatCurrency
│   └── getDateRange
├── Screens
│   ├── BillListScreen (274-448行)
│   ├── AddTransactionScreen (457-819行)
│   └── StatsScreen (822-942行)
└── Main App (947-994行)
    ├── Tab Navigation
    └── Styles (997-1082行)
```

---

## 当前布局状态

### AddTransactionScreen 页面结构（自顶向下）
1. **类型切换** (656-671行): 支出/收入切换
2. **金额输入** (674-689行): 带货币符号的输入框
3. **分类选择** (691-704行): 打开分类选择器
4. **日期选择** (706-717行): 日期输入框
5. **描述输入** (719-731行): 独立的文本输入框
6. **保存按钮** (734-742行): 提交表单
7. **智能指令区域** (744-775行):
   - 拍照按钮（左侧）
   - 智能输入框（中间）
   - 确定按钮（右侧）

**注意**: 智能指令区域已从顶部移到底部，拍照按钮在输入框左侧。

---

## 开发指南

### 运行项目
```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 或清除缓存启动
npx expo start --clear
```

### 平台支持
- **iOS**: 使用 iOS Simulator 或真实设备
- **Android**: 使用 Android Emulator 或真实设备
- **Web**: 浏览器直接访问

### 数据库初始化
- **移动端**: 自动创建 `qionggui-bill.db` SQLite 数据库
- **Web 端**: 使用 localStorage 存储，键为 `qionggui-bill-transactions`
- **索引**: 自动创建日期和类型索引以优化查询
- **示例数据**: 首次运行自���插入3条示例记录

---

## 核心功能说明

### 1. 智能指令解析 (485-555行)
支持自然语言输入，自动提取：
- **金额**: 支持 `12元`、`¥12`、`12块`、`12` 等多种格式
- **描述**: 自动去除金���和货币符号
- **分类**: 基于关键词自动匹配12个预设分类

**关键词分类表**:
- 餐饮: 奶茶、咖啡、早餐、餐厅、火锅...
- 交通: 地铁、公交、打车、加油...
- 购物: 超市、淘宝、京东、衣服...
- 娱乐: 电影、游戏、KTV、旅游...
- 医疗: 医院、药店、药...
- 教育: 学费、培训、课程...
- 住房: 房租、房贷、水电...
- 其他支出: 其他、杂费...
- 工资: 工资、薪水、年终奖...
- 奖金: 奖金、绩效奖...
- 理财: 理财、收益、股票...
- 其他收入: 退款、报销...

### 2. OCR 图片识别 (561-608行)
当前使用模拟数据（Mock）:
- 随机返回预设的5条示例文本
- 实际集成需替换为真实 OCR API（百度OCR 或 Step Flash）

**待集成**:
- 百度通用文字识别 API（每月免费1000次）
- Step Flash 3.5 结构化解析

### 3. 账单列表 (274-448行)
- 按日期分组展示
- 支持筛选：今天/本周/本月/全部
- 实时显示收入/支出/结余
- 左滑删除功能（模态框确认）
- 分类图标和颜色编码

### 4. 统计分析 (822-942行)
- 周期切换：本周/本月/全年
- 收入支出卡片
- 支出分类 TOP 5
- 交易笔数和平均支出

---

## 样式系统

### 颜色主题
- 主色: `#2196F3` (蓝色)
- 收入: `#4CAF50` (绿色)
- 支出: `#F44336` (红色)
- 背景: `#f5f5f5` (浅灰)

### 关键样式类
- `container`: 主容器
- `inputCard`: 输入卡片
- `inputLabel`: 输入标签
- `smartCommandRow`: 智能指令横向布局
- `smartCommandInput`: 智能输入框（蓝色边框）
- `smartCommandCameraButton`: 拍照按钮
- `smartCommandParseButton`: 确定按钮

---

## 已知问题和注意事项

### 1. Web 数据库限制
- Web 端使用 localStorage，无真实 SQL 执行能力
- `db.runAsync` 和 `db.getAllAsync` 仅用于保持 API 兼容性
- 生产环境需考虑 IndexedDB 或后端 API

### 2. 日期处理
- 使用 `date-fns` 库，中文 locale 为 `zhCN`
- 日期格式：ISO 8601（YYYY-MM-DDTHH:mm:ss.sssZ）
- 显示格式：`M月d日 EEEE`（如：3月20日 星期五）

### 3. 金额单位
- 存储单位：元（浮点数）
- 解析时支持小数点和整数

### 4. 错误处理
- 使用 Snackbar 显示友好错误消息
- 控制台保留关键日志（可后续移除）
- Web 端 Alert 已替换为 Snackbar

### 5. 图片权限
- `expo-image-picker` 需要相册权限
- Android 需在 `app.json` 配置权限（暂未配置）

---

## 未来扩展计划

### 阶段4: AI 智能解析
- 集成 Step Flash 3.5 API
- Structured Outputs（JSON模式）
- API密钥管理（expo-secure-store）
- 成本控制和缓存

### 阶段5: OCR 图片识别
- 集成百度 OCR API
- 图片本地存储（expo-file-system）
- OCR 结果 AI 二次解析

### 阶段6: 云端同步
- Supabase 集成
- 用户认证
- 多设备实时同步

---

## Claude Code 协作提示

### 当修改此项目时：
1. **保持单文件架构**: 除非必要，不要拆分 App.tsx
2. **遵循现有样式**: 使用已有的 StyleSheet 定义
3. **维护移动端优先**: 考虑 iOS/Android 的兼容性
4. **保留 Context**: TransactionProvider 用于全局刷新
5. **测试 Web 和移动端**: 确保双端正常运行

### 添加新功能时：
1. 先在 AddTransactionScreen 或 BillListScreen 中实现 UI
2. 更新 TransactionService 如果需要新数据库字段
3. 考虑是否需要修改 Transaction 类型定义
4. 添加样式到 StyleSheet
5. 更新 CLAUDE.md 记录重要变更

### 性能优化：
- 使用 FlatList 替代 ScrollView（列表项多时）
- SQLite 查询已添加索引
- 图片需要压缩后存储
- API 响应需要缓存

---

## 环境变量配置

### 待配置（阶段4/5）
```bash
# Step Flash API
EXPO_PUBLIC_STEP_API_KEY=your_key
EXPO_PUBLIC_STEP_API_ENDPOINT=https://api.stepfun.com/v1

# 百度 OCR
EXPO_PUBLIC_BAIDU_OCR_API_KEY=your_key
EXPO_PUBLIC_BAIDU_OCR_SECRET_KEY=your_secret
```

**注意**: 环境变量不提交到 Git，添加到 `.gitignore`

---

## 测试检查清单

- [ ] 手动添加账单功能正常
- [ ] 智能指令解析准确
- [ ] 日期筛选正确
- [ ] 分类选择器弹出
- [ ] 保存后列表刷新
- [ ] 删除功能正常
- [ ] 统计页面显示正确
- [ ] Web 端 localStorage 工作正常
- [ ] 移动端 SQLite 工作正常
- [ ] 无控制台错误
- [ ] 布局适配不同屏幕尺寸

---

## 参考资源

- [Expo 文档](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [date-fns](https://date-fns.org/)
- [Step Flash API](https://platform.stepfun.com/)
- [百度 OCR](https://ai.baidu.com/ocr)

---

**最后更新**: 2026-03-20
**版本**: 1.0.0-MVP
**作者**: Claude Code Assistant
