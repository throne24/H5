# 极简记账 Vue 改造记录

## 第三阶段 1.3：建立响应式数据流（计划）

> 本文记录 1.3 阶段的设计方案和学习目标。
>
> 当前只完成方案记录，尚未开始修改业务代码。

---

## 1. 本阶段要解决的问题

1.2 完成后，页面已经拆成了多个 Vue 组件，但数据仍然是静态写死的：

```text
预算金额：3000
已用金额：0
预算百分比：0%
账单：一条固定示例数据
```

当前页面可以显示内容，但还没有形成真正的数据联动。

本阶段要解决的问题是：

```text
账单数据发生变化
        ↓
总支出自动重新计算
        ↓
预算使用率自动重新计算
        ↓
预算环和账单列表自动更新
```

核心目标是让项目从“静态组件展示”进入“响应式数据驱动视图”。

---

## 2. 本阶段学习目标

本阶段重点学习以下 Vue 3 能力：

- `ref`：创建响应式数据
- `computed`：根据已有数据自动计算结果
- `props`：父组件向子组件传递数据
- `v-for`：根据数组渲染列表
- 响应式数据流的设计
- 父组件和子组件的职责划分

本阶段暂时不引入 Pinia。当前项目只有一个页面，先使用 Vue 自身的响应式能力理解数据流，等状态复杂度真正增加后再引入状态管理工具。

---

## 3. 本阶段的数据流设计

计划让 `App.vue` 管理整个页面的核心业务数据：

```text
App.vue
├── transactions
├── budgetLimit
├── totalExpense
└── budgetPercent
       │
       ├── props → BudgetHeader.vue
       └── props → TransactionList.vue
```

组件职责如下：

| 组件 | 职责 |
|------|------|
| `App.vue` | 保存账单和预算状态，计算派生数据，组合页面 |
| `BudgetHeader.vue` | 接收预算数据并负责展示 |
| `TransactionList.vue` | 接收账单数组并渲染列表或空状态 |
| `TransactionItem.vue` | 接收一条账单并展示 |
| `EmptyState.vue` | 展示没有账单时的提示 |

数据流方向：

```text
App.vue
   ↓ props
子组件
   ↓
展示页面
```

这样可以保证核心数据只有一个来源，避免多个组件各自保存一份账单数据，导致页面显示不一致。

---

## 4. 统一账单数据结构

账单对象暂时使用以下结构：

```js
{
  id: 1,
  type: "expense",
  category: "餐饮",
  icon: "🍜",
  note: "示例账单",
  amount: 25,
  date: "2026-09-20"
}
```

字段说明：

| 字段 | 类型 | 含义 |
|------|------|------|
| `id` | `number` | 账单唯一标识 |
| `type` | `string` | 账单类型，`expense` 表示支出 |
| `category` | `string` | 账单分类 |
| `icon` | `string` | 分类图标 |
| `note` | `string` | 备注 |
| `amount` | `number` | 金额 |
| `date` | `string` | 日期 |

这个结构会被后续功能继续使用：

```text
新增账单
删除账单
筛选账单
统计分类
数据持久化
```

因此，本阶段先把它作为项目中的统一数据结构。

---

## 5. 使用 ref 保存响应式状态

### 5.1 普通变量的问题

普通变量可以保存数据：

```js
const budgetLimit = 3000;
```

但是以后这样修改：

```js
budgetLimit = 5000;
```

Vue 不一定能够追踪这个变化，也就不能保证页面自动更新。

### 5.2 使用 ref

计划使用 `ref`：

```js
import { ref } from "vue";

const budgetLimit = ref(3000);

const transactions = ref([
  {
    id: 1,
    type: "expense",
    category: "餐饮",
    icon: "🍜",
    note: "示例账单",
    amount: 25,
    date: "2026-09-20",
  },
]);
```

使用 `ref` 后，Vue 可以追踪数据的变化。

在 JavaScript 中读取或修改 `ref` 的值需要使用 `.value`：

```js
budgetLimit.value = 5000;
```

在模板中，Vue 会自动解包，因此可以直接使用：

```vue
{{ budgetLimit }}
```

### 5.3 ref 的作用

```text
ref 数据变化
      ↓
Vue 重新计算依赖它的内容
      ↓
相关组件重新渲染
```

---

## 6. 使用 computed 计算总支出

总支出不应该手动维护：

```js
let totalExpense = 25;
```

因为新增或删除账单后，很容易忘记同步修改总支出。

计划使用计算属性：

```js
import { computed } from "vue";

const totalExpense = computed(() => {
  return transactions.value
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
});
```

计算过程：

```text
transactions
    ↓ filter
筛选出支出账单
    ↓ reduce
累计所有支出金额
    ↓
totalExpense
```

例如账单金额为：

```text
25
40
15
```

则：

```text
totalExpense = 80
```

当 `transactions` 发生变化时，`computed` 会自动重新计算。

---

## 7. 使用 computed 计算预算百分比

预算百分比根据总支出和预算上限计算：

```js
const budgetPercent = computed(() => {
  if (budgetLimit.value <= 0) {
    return 0;
  }

  return Math.min(
    Math.round((totalExpense.value / budgetLimit.value) * 100),
    100
  );
});
```

计算公式：

```text
总支出 ÷ 预算上限 × 100
```

例如：

```text
总支出：750
预算上限：3000

750 ÷ 3000 × 100 = 25%
```

使用 `Math.min(..., 100)` 是为了限制进度环最大显示为 100%。

如果：

```text
总支出：4000
预算上限：3000
```

原始结果是 `133%`，但进度环只显示 `100%`。

---

## 8. 通过 props 传递数据

### 8.1 传给 BudgetHeader

`App.vue` 计算出预算相关数据后，传给预算组件：

```vue
<BudgetHeader
  :budget="budgetLimit"
  :spent="totalExpense"
  :percent="budgetPercent"
/>
```

`BudgetHeader.vue` 使用 `defineProps` 接收：

```js
defineProps({
  budget: Number,
  spent: Number,
  percent: Number,
});
```

预算组件不需要自己管理账单，也不需要重新计算总支出，只负责展示父组件传来的结果。

### 8.2 传给 TransactionList

```vue
<TransactionList :transactions="transactions" />
```

`TransactionList.vue` 接收账单数组：

```js
defineProps({
  transactions: {
    type: Array,
    required: true,
  },
});
```

然后使用 `v-for` 渲染：

```vue
<TransactionItem
  v-for="transaction in transactions"
  :key="transaction.id"
  :transaction="transaction"
/>
```

---

## 9. 本阶段实施范围

本阶段计划完成：

- 将账单数组从 `TransactionList.vue` 移动到 `App.vue`
- 将预算上限从 `BudgetHeader.vue` 移动到 `App.vue`
- 使用 `ref` 保存账单数组和预算上限
- 使用 `computed` 计算总支出
- 使用 `computed` 计算预算百分比
- 使用 `props` 将预算数据传给 `BudgetHeader.vue`
- 使用 `props` 将账单数组传给 `TransactionList.vue`
- 使用 `v-for` 渲染多条账单
- 验证修改账单数组后页面自动更新
- 验证预算环随金额变化

---

## 10. 本阶段暂时不实现的功能

以下内容留到后续阶段：

- 点击添加按钮打开弹窗
- 表单输入和校验
- 保存新账单
- 删除账单
- 左滑删除
- `localStorage` 持久化
- Pinia
- Vue Router
- 图表统计
- 后端接口

原因是先明确下面几个基础问题：

```text
状态应该放在哪里？
数据如何计算？
父组件如何传值？
子组件如何展示？
```

---

## 11. 小步骤拆分

为了降低学习难度，1.3 分成两个小步骤。

### 1.3.1：响应式账单和预算计算

完成：

```text
ref
computed
props
v-for
```

目标：

```text
修改账单数组
    ↓
账单列表更新
    ↓
总支出更新
    ↓
预算环更新
```

### 1.3.2：组件数据流复盘

代码完成后重点复盘：

- 为什么状态放在 `App.vue`
- 为什么子组件不直接修改 `props`
- `ref` 和普通变量的区别
- `computed` 和普通函数的区别
- `v-for` 的 `key` 为什么重要
- Vue 如何追踪数据变化

然后进行两个练习：

- 修改预算上限，观察百分比变化。
- 增加第二条静态账单，观察列表和总支出变化。

---

## 12. 验收标准

- [ ] `App.vue` 管理账单数组
- [ ] `App.vue` 管理预算上限
- [ ] 使用 `ref` 创建响应式数据
- [ ] 使用 `computed` 计算总支出
- [ ] 使用 `computed` 计算预算百分比
- [ ] `BudgetHeader.vue` 使用 `props` 接收预算数据
- [ ] `TransactionList.vue` 使用 `props` 接收账单数组
- [ ] `TransactionList.vue` 使用 `v-for` 渲染账单
- [ ] `TransactionItem.vue` 继续使用 `props` 接收单条账单
- [ ] 修改账单数据后页面自动更新
- [ ] 预算环随数据变化
- [ ] `npm run build` 构建通过

---

## 13. Git 提交建议

完成代码修改并构建通过后，建议提交：

```powershell
git add src docs
git commit -m "feat: 建立响应式账单数据流"
```

如果本阶段只修改代码，没有新增文档，可以只提交 `src`：

```powershell
git add src
git commit -m "feat: 建立响应式账单数据流"
```

---

## 14. 后续路线

```text
1.3 响应式数据流
    ↓
1.4 添加按钮和弹窗开关
    ↓
1.5 新增账单表单
    ↓
1.6 删除账单
    ↓
1.7 左滑删除交互
    ↓
1.8 localStorage 持久化
    ↓
1.9 Pinia 状态管理
    ↓
1.10 数据统计和图表
    ↓
1.11 PWA 和部署优化
```

---

## 15. 总结

1.2 解决了“页面如何拆成组件”的问题。

1.3 要解决“组件如何共享和响应数据”的问题。

本阶段的核心变化是：

```text
静态变量
    ↓
ref 响应式状态
    ↓
computed 派生数据
    ↓
props 组件传递
    ↓
页面自动更新
```
