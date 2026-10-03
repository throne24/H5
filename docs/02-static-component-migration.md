# 极简记账 Vue 改造记录

## 第二阶段 1.2：静态页面组件化迁移

## 1. 本阶段目标

本阶段把原来集中在 `legacy/index.html` 中的页面结构和样式，迁移为多个职责清晰的 Vue 组件。

注意：本阶段只迁移静态结构和样式，**不实现新增账单、删除账单、修改预算、本地存储等业务逻辑**。

本阶段重点学习：

- Vue 单文件组件
- 父子组件关系
- `props`
- `v-if`
- `v-for`
- 动态属性绑定 `:style`
- Less 全局样式与组件样式分层
- 数据驱动视图的基本思想

---

## 2. 改造前的页面结构

旧项目把页面全部集中在 `legacy/index.html` 中：

```text
index.html
├── 顶部预算区域
├── 账单列表
├── 添加按钮
├── 遮罩层
└── 底部记账面板
```

这种方式的问题是：

- 结构、样式和业务逻辑都混在一起。
- 随着功能增加，文件会越来越大。
- 修改一个区域时容易影响其他区域。
- 不方便复用和测试。

---

## 3. 改造后的组件结构

本阶段将页面拆分为以下结构：

```text
App.vue
├── BudgetHeader.vue
├── TransactionList.vue
│   ├── TransactionItem.vue
│   └── EmptyState.vue
├── AddButton.vue
└── TransactionSheet.vue
```

每个组件的职责如下：

| 组件 | 职责 |
|------|------|
| `App.vue` | 组合整个页面 |
| `BudgetHeader.vue` | 顶部预算环形进度和预算文字 |
| `TransactionList.vue` | 决定显示账单列表还是空状态 |
| `TransactionItem.vue` | 展示一条账单卡片 |
| `EmptyState.vue` | 没有账单时的空状态提示 |
| `AddButton.vue` | 底部悬浮添加按钮 |
| `TransactionSheet.vue` | 底部添加账单面板 |

---

## 4. `App.vue`：页面的组装者

`App.vue` 是应用的根组件。它只负责导入和组合其他组件，不承担具体的展示细节。

```vue
<template>
  <main class="app">
    <BudgetHeader />
    <TransactionList />
    <AddButton />
    <TransactionSheet />
  </main>
</template>
```

这里的 `<BudgetHeader />` 不是普通 HTML 标签，而是一个 Vue 组件。

Vue 会找到对应的 `BudgetHeader.vue`，并把那个组件渲染到当前位置。

`App.vue` 的核心思想：

> 它是一份页面目录，描述“顶部放什么、中间放什么、底部放什么”。

---

## 5. `BudgetHeader.vue`：顶部预算区域

该组件负责展示：

- 预算环形进度
- 已用百分比
- 本月已使用金额
- 总预算金额

### 固定静态数据

```js
const budget = 3000;
const spent = 0;
const percent = 0;
```

当前这些数据只是静态展示，下一阶段会改成响应式计算。

### 文本插值

模板中使用：

```vue
{{ percent }}%
```

Vue 会将 JavaScript 中的 `percent` 值显示到页面中。

这就是 Vue 最基础的思想：

```text
JavaScript 数据
      ↓
Vue 模板读取数据
      ↓
浏览器显示页面
```

原生项目通常需要手动查找 DOM：

```js
document.querySelector(...)
```

Vue 中则是修改数据，页面自动更新。

### `:style` 动态绑定

预算环使用：

```vue
:style="{
  background: \`conic-gradient(
    var(--primary-color) ${percent}%,
    #eee ${percent}% 100%
  )\`
}"
```

冒号 `:` 是 `v-bind:` 的简写，表示 `style` 的值是一个 JavaScript 表达式。

当 `percent` 从 `0` 变成 `45` 时，Vue 会自动重新计算背景，预算环的进度也会自动变化。

---

## 6. `TransactionList.vue`：账单列表区域

该组件负责决定列表区域显示什么：

```text
有账单 → 显示 TransactionItem
没有账单 → 显示 EmptyState
```

当前为了同时展示账单卡片和空状态，使用了一个开关：

```js
const showDemoTransaction = true;
```

配合 `v-if` 使用：

```vue
<TransactionItem v-if="showDemoTransaction" />
<EmptyState v-else />
```

含义：

```text
如果 showDemoTransaction 为 true
    ↓
显示 TransactionItem

否则
    ↓
显示 EmptyState
```

你可以尝试将 `showDemoTransaction` 改成 `false`，观察页面变化。

---

## 7. `TransactionItem.vue`：单条账单组件

### `props` 接收数据

账单卡片不应该写死具体账单内容，因此父组件通过 `props` 传入数据：

```vue
<TransactionItem :transaction="demoTransaction" />
```

子组件接收：

```js
defineProps({
  transaction: {
    type: Object,
    required: true,
  },
});
```

关系：

```text
TransactionList.vue
        ↓ props
TransactionItem.vue
        ↓ 使用 transaction 字段
账单卡片
```

父子组件通信方向：

```text
父组件
   ↓ props
子组件
```

后续“删除账单”时，会通过 `emit` 反向通知父组件，当前阶段不涉及。

---

## 8. `EmptyState.vue`：空状态

该组件负责没有账单时的提示：

```text
还没有账单，点击下方 + 记一笔吧
```

现在它只显示默认文字，但独立出来的好处是：

- 后续可以传入不同标题和说明。
- 可以在多处复用，如搜索无结果、筛选无结果、某月无账单。

---

## 9. `AddButton.vue`：底部添加按钮

该组件负责底部圆形“+”按钮。

它使用固定定位：

```less
position: fixed;
bottom: 24px;
left: 50%;
```

表示按钮固定在视口底部，水平居中。

当前只有外观和按下动画，下一阶段才会加入点击事件。

---

## 10. `TransactionSheet.vue`：底部记账面板

该组件负责底部添加账单面板，包含：

- 遮罩层
- 面板标题
- 分类网格
- 金额输入框
- 备注输入框
- 取消和保存按钮

当前通过 `visible` 属性控制显示和隐藏：

```js
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});
```

模板中：

```vue
<div v-if="visible" class="modal-overlay active"></div>
<div v-if="visible" class="action-sheet active">
```

当前 `App.vue` 没有传入 `:visible="true"`，所以面板默认隐藏。

这样写是为了下一阶段预留接口。

后续 `App.vue` 会有类似这样的逻辑：

```js
const isSheetVisible = ref(false);
```

按钮点击后修改状态：

```js
isSheetVisible.value = true;
```

弹窗就能自动显示。

---

## 11. `v-for` 的使用

当前 `v-for` 主要出现在 `TransactionSheet.vue` 的分类网格中：

```vue
<div
  v-for="category in categories"
  :key="category.name"
>
```

`:key` 是 Vue 用来识别列表项身份的标识，便于后续高效更新页面。

---

## 12. Less 样式分层

### `variables.less`

文件路径：`src/assets/styles/variables.less`

集中保存设计变量：

```less
@primary-color: #4A90E2;
@danger-color: #FF4D4F;
@bg-color: #F5F7FA;
@card-bg: #FFFFFF;
@border-radius: 12px;
```

作用：

- 统一管理设计系统。
- 修改主题色时只需改一处。

### `global.less`

文件路径：`src/assets/styles/global.less`

保存影响整个应用的规则：

- CSS Reset
- `html`、`body`、`#app` 基础样式
- 全局字体和背景

该文件在 `main.js` 中导入：

```js
import "./assets/styles/global.less";
```

### 组件内部样式

组件中使用：

```vue
<style scoped lang="less">
```

- `scoped`：样式主要限制在当前组件，避免互相影响。
- `lang="less"`：使用 Less 语法。

---

## 13. 当前数据流

```text
BudgetHeader.vue
├── budget = 3000
├── spent = 0
└── percent = 0

TransactionList.vue
├── showDemoTransaction = true
└── demoTransaction
      ↓ props
      TransactionItem.vue
```

当前数据都是静态的，写在组件内部。

下一阶段会改成响应式状态：

```text
响应式账单数组
      ↓
自动计算总支出
      ↓
自动计算预算百分比
      ↓
BudgetHeader 自动更新
      ↓
TransactionList 自动更新
```

---

## 14. 小练习

### 练习一：查看空状态

在 `TransactionList.vue` 中，将：

```js
const showDemoTransaction = true;
```

改成：

```js
const showDemoTransaction = false;
```

观察页面变化，然后再改回 `true`。

### 练习二：修改示例账单

在 `TransactionList.vue` 中，修改：

```js
category: "餐饮",
icon: "🍜",
note: "示例账单",
amount: 25,
```

改成你自己的示例，例如：

```js
category: "交通",
icon: "🚇",
note: "地铁通勤",
amount: 4,
```

保存后观察账单卡片变化。

### 练习重点

理解：

```text
修改 JavaScript 数据
      ↓
Vue 自动重新渲染模板内容
```

---

## 15. 本阶段验收标准

- [x] 页面视觉效果基本恢复
- [x] 预算区域拆分为 `BudgetHeader.vue`
- [x] 账单列表拆分为 `TransactionList.vue`
- [x] 单条账单拆分为 `TransactionItem.vue`
- [x] 空状态拆分为 `EmptyState.vue`
- [x] 添加按钮拆分为 `AddButton.vue`
- [x] 记账面板拆分为 `TransactionSheet.vue`
- [x] 全局 Less 变量和样式已分离
- [x] 组件使用 `scoped lang="less"`
- [x] 示例账单通过 `props` 传递
- [x] 使用 `v-if` 控制条件展示
- [x] 使用 `v-for` 渲染列表
- [x] 不使用 `document.querySelector`
- [x] 不使用 `innerHTML`
- [x] 不使用 Pinia 或 Vue Router
- [x] `npm run build` 构建通过
- [x] `legacy/` 中的原始代码保持不变

---

## 16. 下一步预告

下一阶段将学习：

- `ref`：让数据变成响应式
- `computed`：根据数据自动计算
- 响应式账单数据
- 预算百分比自动计算
- 组件之间的简单事件通信

目标：让“账单数据变化”自动驱动页面更新。

