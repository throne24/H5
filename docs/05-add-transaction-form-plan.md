# 极简记账 Vue 改造记录

## 第五阶段 1.5：新增账单表单（已实施）

> 编写日期：2026-10-09。
>
> 本文记录 1.5 阶段的技术方案、学习目标和实施结果。
>
> 2026-10-09 先记录方案，2026-10-10 按方案实施并验证。设计章节保留原方案描述；实际完成情况见第 15、19 节。

---

## 1. 当前进度与目标

1.4 已实现面板开关：

```text
AddButton 发出 open
        ↓
App.vue 修改 isSheetVisible
        ↓ visible prop
TransactionSheet 显示
        ↓ 发出 close
App.vue 关闭面板
```

实施前，面板还不能真正记账（以下缺口现已补齐）：

- 分类固定为“餐饮”，不能切换。
- 金额和备注没有绑定响应式状态。
- 保存按钮被禁用。
- 面板不能向父组件提交账单。

1.5 要形成完整闭环：

```text
打开面板 → 选择分类 → 输入金额和备注
        ↓
校验表单
        ↓ save 事件携带有效数据
App.vue 创建账单并加入数组
        ↓
列表、总支出和预算百分比自动更新
        ↓
关闭面板，下次打开显示空白表单
```

账单依然只保存在当前页面的内存中。本阶段不实现刷新后恢复。

---

## 2. 学习目标

- `v-model`：让输入框与表单状态同步。
- `ref`：管理选中分类、金额文本、备注和错误提示。
- `watch`：监听面板打开，重置表单。
- `@submit.prevent`：统一处理保存按钮和 Enter 提交。
- `defineEmits`：让事件携带数据。
- 数组 `unshift`：在列表顶部加入新账单。
- 纯函数：将分类规则和表单校验集中管理。
- 区分表单草稿与业务账单，避免把输入中的字符串直接加入账单数组。

不引入 Pinia、Vue Router、表单组件库、日期库或后端接口。

---

## 3. 范围与产品约定

### 3.1 本阶段完成

| 项目 | 约定 |
|------|------|
| 账单类型 | 只新增支出，`type` 固定为 `expense` |
| 分类 | 现有 8 个分类，默认选中餐饮，支持切换 |
| 金额 | 必填、正数、最多两位小数，最大 `999999.99` 元 |
| 备注 | 可选，去掉首尾空白后最多 20 个 JavaScript 字符串长度单位 |
| 日期 | 保存时的设备本地日期，格式 `YYYY-MM-DD` |
| 列表顺序 | 新增账单置顶，不对旧数据进行重排 |
| 保存成功 | 加入一条账单，随后关闭面板 |
| 校验失败 | 面板保持打开，显示具体原因，不新增账单 |
| 取消或遮罩关闭 | 不保存；下次打开重置为默认分类、空金额、空备注和空错误 |
| 重复提交 | 同一次打开最多保存一次；允许下一次打开记录内容相同的另一笔账单 |
| 持久化 | 暂无，刷新恢复代码中的示例数据 |

金额上限是本项目的输入约束，不代表行业标准。这里保留一个明确的业务范围，避免超大金额破坏展示和数值运算。

备注长度沿用原有 `maxlength="20"` 和 JavaScript `.length` 的计数方式；某些 emoji 会占用多个长度单位。本阶段不另外实现按可见字符计数。

### 3.2 暂不完成

- 收入账单、日期选择、预算修改。
- 编辑、删除、左滑删除。
- `localStorage`、后端保存、跨设备同步。
- 按日期分组、月份筛选、统计图表。
- 全项目改为“分”作为金额存储单位。
- 自动聚焦、焦点陷阱、Escape 关闭、滚动锁定、过渡动画。
- 大规模调整现有样式和历史练习数据。

---

## 4. 状态与组件职责

### App.vue：业务数据的唯一来源

继续管理：

```text
transactions
budgetLimit
totalExpense
budgetPercent
isSheetVisible
```

新增保存处理函数，负责：

1. 确认当前面板仍然打开。
2. 对事件数据再次规范化与检查。
3. 生成账单 ID 和本地日期。
4. 将新对象加入账单数组顶部。
5. 关闭面板。

### TransactionSheet.vue：临时表单草稿

计划新增：

```js
const selectedCategory = ref("餐饮");
const amountInput = ref("");
const noteInput = ref("");
const errorMessage = ref("");
```

这些状态只负责当前表单，不直接修改 `transactions`，也不自己计算预算。

### src/utils/transaction.js：共用规则

计划新增一个小型工具模块，集中提供：

- 支出分类数组。
- 金额字符串到数值的校验与转换。
- 支出草稿的校验和规范化。

父组件与面板使用同一套校验，避免出现“面板允许提交，父组件却采用另一套规则”的问题。工具模块不导入 Vue，也不维护响应式状态。

这不是建立大型架构，只是把本阶段需要复用的少量规则放到一个文件中。

---

## 5. 区分草稿、事件数据与账单

### 5.1 输入中的草稿

```js
{
  category: "交通",
  amount: "100.00", // 输入阶段保留文本
  note: " 地铁充值 "
}
```

### 5.2 save 事件携带的有效数据

```js
{
  type: "expense",
  category: "交通",
  icon: "🚗",
  amount: 100, // 保存前转换为 number
  note: "地铁充值"
}
```

### 5.3 父组件最终创建的账单

```js
{
  id: 3,
  type: "expense",
  category: "交通",
  icon: "🚗",
  amount: 100,
  note: "地铁充值",
  date: "2026-10-09"
}
```

例子中的日期和 ID 只用于说明。实际值必须在保存时生成，不能固定写死。

ID、日期由父组件补齐，分类图标根据已知分类计算，不能依赖用户输入。每次保存创建新对象，不把响应式表单对象直接放进账单数组。

---

## 6. 分类选择

将现有分类数组迁移到工具模块，使用同一个来源：

```js
export const expenseCategories = [
  { name: "餐饮", icon: "🍜" },
  { name: "交通", icon: "🚗" },
  { name: "购物", icon: "🛍️" },
  { name: "娱乐", icon: "🎮" },
  { name: "居住", icon: "🏠" },
  { name: "医疗", icon: "💊" },
  { name: "学习", icon: "📚" },
  { name: "其他", icon: "📝" },
];
```

计划把分类格子的 `div` 改成普通按钮，让鼠标、触摸和键盘均可选择：

```vue
<button
  v-for="category in expenseCategories"
  :key="category.name"
  type="button"
  class="category-item"
  :class="{ selected: category.name === selectedCategory }"
  :aria-pressed="category.name === selectedCategory"
  @click="selectedCategory = category.name"
>
  <span class="category-icon">{{ category.icon }}</span>
  <span class="category-name">{{ category.name }}</span>
</button>
```

模板中的 `ref` 会自动解包，赋值不需要 `.value`。JavaScript 函数中的读写仍需要 `.value`。

改成按钮后，需要局部清除默认 `border`、`background` 并继承字体，保持现有分类布局；键盘焦点使用清晰的 `:focus-visible` 样式，不隐藏焦点提示。

---

## 7. 金额输入与校验

### 7.1 为什么先保留文本

本阶段计划使用：

```vue
<label for="transaction-amount">金额</label>
<input
  id="transaction-amount"
  v-model="amountInput"
  type="text"
  inputmode="decimal"
  placeholder="0.00"
  autocomplete="off"
  :aria-describedby="errorMessage ? 'transaction-form-error' : undefined"
/>
```

`inputmode="decimal"` 提示设备优先提供小数键盘，但不代替校验。

这里不用 `type="number"` 或 `.number`：我们需要保留输入文本，以明确拒绝第三位小数、指数形式、正负号等，而不是先转换成数字后丢失原始格式。

允许：`100`、`100.5`、`100.50`、`0.01`、`01.20`。

拒绝：空白、`0`、负数、`1.234`、`1e3`、`NaN`、`Infinity`、`1,000`、`.5`、`1.`。

去掉首尾空格后再检查，因此 ` 12.50 ` 可按 `12.50` 处理。本阶段不自动接受逗号作为小数点。

### 7.2 用整数“分”校验，再转换回现有的“元”

工具函数示例：

```js
const MAX_AMOUNT_CENTS = 99_999_999;

export function parseExpenseAmount(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }

  const [integerPart, decimalPart = ""] = text.split(".");
  const cents = Number(integerPart) * 100
    + Number(decimalPart.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) {
    return null;
  }

  return cents / 100;
}
```

不要只用 `parseFloat`：它可能从不合法文本中解析出一个合法前缀。也不要自动把三位小数四舍五入成两位；本阶段约定是提示用户改正。

这是输入校验策略，不是全项目金额模型迁移。账单的 `amount` 仍为以元计的 `number`，现有展示继续使用 `toFixed(2)`。浮点数精度的全面改造留到后续；本阶段用整数分累计总支出来避免常见的小数累加误差，见第 11 节。

---

## 8. 共用草稿校验

约定工具函数返回以下两种结果之一：

```js
// 失败
{ data: null, error: "请输入大于 0、最多两位小数且不超过 999999.99 的金额" }

// 成功
{
  data: {
    type: "expense",
    category: "交通",
    icon: "🚗",
    amount: 100,
    note: "地铁充值"
  },
  error: ""
}
```

实现示例：

```js
export function normalizeExpenseDraft(draft) {
  if (!draft || typeof draft !== "object") {
    return { data: null, error: "表单数据无效，请重新填写" };
  }

  const category = expenseCategories.find(
    (item) => item.name === draft.category,
  );
  if (!category) {
    return { data: null, error: "请选择有效分类" };
  }

  const amount = parseExpenseAmount(draft.amount);
  if (amount === null) {
    return {
      data: null,
      error: "请输入大于 0、最多两位小数且不超过 999999.99 的金额",
    };
  }

  if (typeof draft.note !== "string") {
    return { data: null, error: "备注格式无效" };
  }

  const note = draft.note.trim();
  if (note.length > 20) {
    return { data: null, error: "备注不能超过 20 个字符" };
  }

  return {
    data: {
      type: "expense",
      category: category.name,
      icon: category.icon,
      amount,
      note,
    },
    error: "",
  };
}
```

分类和图标只能来自分类表。传入对象里额外的 `id`、`date`、`type`、`icon` 等字段不会被直接复制到返回值。

父组件的重复检查属于内部数据一致性保护，不是服务器安全校验。本阶段没有外部 API 或异步保存。

---

## 9. 保存事件与表单提交

### 9.1 扩展事件约定

保持 `close`，新增 `save`：

```js
const emit = defineEmits(["close", "save"]);
```

| 事件 | 参数 | 含义 |
|------|------|------|
| `close` | 无 | 请求取消并关闭 |
| `save` | 规范化后的支出数据 | 请求父组件创建账单 |

### 9.2 使用真正的 form

把现有 `.action-sheet` 根元素由 `div` 改为 `form`：

```vue
<form
  v-if="visible"
  class="action-sheet active"
  novalidate
  @submit.prevent="submitForm"
>
  <!-- 保留分类和输入布局，接入 v-model -->
  <!-- 取消：type="button"，仍然 emit('close') -->
  <!-- 保存：type="submit"，不再绑定独立 @click 保存 -->
</form>
```

- `.prevent` 阻止浏览器默认提交和页面刷新。
- 保存按钮和 Enter 都走同一个处理函数。
- `novalidate` 避免原生校验提示与本阶段自定义错误提示混用。
- 分类、取消仍是 `type="button"`，不会触发表单提交。
- 移除 1.4 保存按钮的固定 `disabled` 和“下一阶段实现”提示。
- 保存按钮保持可点击，让非法输入也能得到明确反馈，而不是无解释地无法点击。

### 9.3 提交处理

为了在脚本中检查面板状态，原来的 `defineProps` 改为保存返回值：

```js
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

function submitForm() {
  if (!props.visible) {
    return;
  }

  const result = normalizeExpenseDraft({
    category: selectedCategory.value,
    amount: amountInput.value,
    note: noteInput.value,
  });

  errorMessage.value = result.error;
  if (!result.data) {
    return;
  }

  emit("save", result.data);
}
```

面板不在 `emit('save')` 后另外发出 `close`，也不提前清空草稿；只有父组件成功加入账单后才关闭，防止保存处理被跳过时丢掉输入。

### 9.4 错误展示与清理

```vue
<p
  v-if="errorMessage"
  id="transaction-form-error"
  class="form-error"
  role="alert"
>
  {{ errorMessage }}
</p>
```

备注输入增加 `v-model="noteInput"`，保留 `maxlength="20"`，并关联自己的 `label` 和 `id`。

用户修改金额、备注或分类后，清除旧错误，下次提交重新校验。可以统一使用：

```js
watch([amountInput, noteInput, selectedCategory], () => {
  errorMessage.value = "";
});
```

错误文案按当前校验顺序显示一项。本阶段使用表单级 `role="alert"` 提示，并通过 `aria-describedby` 关联金额输入；不把所有表单错误笼统标记为金额的 `aria-invalid`。后续若扩展校验项，再设计逐字段错误与精确关联。

---

## 10. 表单重置时机

当前 `v-if` 位于面板组件内部，只移除面板 DOM，不卸载 `TransactionSheet` 组件实例。绑定了 `ref` 后，关闭并不能自动清空数据。

计划每次从关闭状态进入打开状态时，统一重置：

```js
function resetForm() {
  selectedCategory.value = "餐饮";
  amountInput.value = "";
  noteInput.value = "";
  errorMessage.value = "";
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
    }
  },
);
```

初始值已经是默认值，首次组件创建不需要依赖 watcher 初始化。后续每次打开都通过 prop 变化触发重置。

| 场景 | 结果 |
|------|------|
| 校验失败 | 保留输入，方便修改 |
| 取消或点击遮罩 | 不保存；再次打开时重置 |
| 保存成功 | 父组件关闭；再次打开时重置 |
| 单纯切换分类 | 只变分类，不清空金额和备注 |

不要只重置 DOM 的 input，也不要把 `.value` 写进 Vue 模板。

---

## 11. App.vue 接收并创建账单

### 11.1 接入事件

```vue
<TransactionSheet
  :visible="isSheetVisible"
  @close="closeSheet"
  @save="saveTransaction"
/>
```

### 11.2 本地日期

```js
function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

不用 `toISOString().slice(0, 10)`，因为它输出 UTC 日期，不一定与设备本地日期一致。不要用 `toLocaleDateString()` 拼账单字段，避免不同设备产生不同格式。

设备本地日期不强制为中国时区；当前用户环境是 Asia/Shanghai，但应用应以实际设备本地时间记账。

### 11.3 ID 策略与保存处理

保持当前 `id: number` 的结构，每次保存取现有账单最大 ID 加一：

```js
function saveTransaction(draft) {
  if (!isSheetVisible.value) {
    return;
  }

  const result = normalizeExpenseDraft(draft);
  if (!result.data) {
    return;
  }

  const nextId = transactions.value.reduce(
    (maxId, item) => Math.max(maxId, item.id),
    0,
  ) + 1;

  transactions.value.unshift({
    ...result.data,
    id: nextId,
    date: getLocalDate(),
  });

  closeSheet();
}
```

该策略适用于当前可信的内存账单列表：现有 ID 是唯一的正整数。没有账单时得到 ID `1`。未来加入外部数据或持久化时，必须重新考虑 ID 校验与唯一性；这里不使用时间戳假装保证唯一。

共用校验函数的合法输出再次传入函数后仍然合法。父组件拒绝非法数据时，不修改列表，也不关闭面板；因为正常 UI 先调用同一个校验函数，此路径通常只会在程序接线错误时出现，不额外设计异步确认协议。

### 11.4 重复提交保护

父组件保存后同步把 `isSheetVisible.value` 设为 `false`。后续连续的保存事件都会被开头的开关检查拒绝，即使 DOM 更新尚未完成，也不会加入第二条账单。

这仅针对当前同步内存保存成立，不依赖按钮禁用速度。未来引入异步接口后，需要增加 `isSubmitting`、失败反馈和请求层面的重复提交策略。

### 11.5 小数累加

目前总支出直接累加元数值。本阶段新增小数账单后，计划局部调整现有计算属性为：

```js
const totalExpense = computed(() => {
  const totalCents = transactions.value
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => {
      return total + Math.round(transaction.amount * 100);
    }, 0);

  return totalCents / 100;
});
```

只在累计过程中使用整数分，返回值仍为元，不改变 `BudgetHeader` 的 prop 或 `TransactionItem` 的金额展示。

不手动修改 `totalExpense` 或 `budgetPercent`，也不使用 watcher 维护预算。两者继续由账单数组自动派生。

---

## 12. 预计修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/components/TransactionSheet.vue` | 响应式草稿、分类按钮、输入绑定、提交校验、错误提示、打开时重置 |
| `src/App.vue` | 接收保存事件、创建 ID 和日期、新账单置顶、按整数分累计支出 |
| `src/utils/transaction.js`（新增） | 分类表、金额转换、共用草稿校验 |
| `docs/05-add-transaction-form-plan.md` | 实施结束后回填真实结果 |

不需要修改其他展示组件、添加按钮、依赖清单或旧版代码。保留现有两条账单练习数据及其字段，不顺便统一旧日期格式。

---

## 13. 小步骤拆分

### 1.5.1：规则与分类

- 新增分类表和纯校验函数。
- 用边界输入验证金额转换。
- 改为响应式选中分类，接入分类按钮。

### 1.5.2：输入与错误反馈

- 金额、备注接入 `v-model`。
- 面板改为 form，统一 submit 入口。
- 显示校验错误，修改输入后清除旧错误。

### 1.5.3：保存闭环

- 新增携带数据的 `save` 事件。
- 父组件校验、创建账单、置顶并关闭。
- 调整小数累加，观察列表和预算自动变化。
- 检查同一次打开的重复提交不会生成多条账单。

### 1.5.4：重置与验收

- 每次打开重置草稿。
- 回归取消、遮罩关闭和面板内点击。
- 执行构建、纯函数边界检查与浏览器交互检查。
- 回填实际验证结果后，再标记完成。

---

## 14. 验收用例（已执行，详见第 19 节）

### 14.1 输入规则

| 输入 | 预期 |
|------|------|
| `""`、空格 | 拒绝 |
| `0`、`0.00`、`-1` | 拒绝 |
| `0.01`、`100`、`100.5`、`100.50` | 接受并返回 number |
| ` 12.50 `、`01.20` | 分别转换为 `12.5`、`1.2` |
| `1.234`、`1e3`、`1,000`、`.5`、`1.` | 拒绝 |
| `NaN`、`Infinity`、`undefined`、`null` | 拒绝 |
| `999999.99` | 接受 |
| `1000000`、超长大整数 | 拒绝 |
| 不存在的分类 | 拒绝 |
| 空备注、只有空格的备注 | 接受，规范化为 `""` |
| 首尾带空格的备注 | 保存去掉首尾空格后的内容 |
| 规范化后的备注长于 20 | 拒绝；直接调用工具函数验证，不依赖 maxlength |
| 同一规范化数据再次校验 | 返回同样的业务字段，不增加 ID 或日期 |

### 14.2 浏览器交互

| 编号 | 操作 | 预期 |
|------|------|------|
| T01 | 首次打开 | 餐饮选中，金额、备注和错误为空 |
| T02 | 点击交通分类 | 交通高亮，其他分类取消高亮 |
| T03 | 空金额点击保存 | 显示错误，不关闭、不新增 |
| T04 | 输入 0、负数或三位小数保存 | 不新增；修改后可重新提交 |
| T05 | 选择交通，金额 100，备注“ 地铁充值 ”，保存 | 新增一条支出并置顶，金额为 number 100，图标 🚗，备注无首尾空格 |
| T06 | 基于现有两条示例执行 T05 | 总支出从 379 变成 479，预算上限 3000 不变，百分比从 13% 变成 16% |
| T07 | 保存后再次打开 | 草稿重置，上一笔内容不残留 |
| T08 | 填写后取消，再次打开 | 不新增，草稿重置 |
| T09 | 填写后点击遮罩，再次打开 | 不新增，草稿重置 |
| T10 | 输入合法金额后按 Enter | 保存一次，不刷新页面 |
| T11 | 同一次打开连续提交两次 | 只新增一次；通过触发连续 submit 和观察列表验证 |
| T12 | 重新打开再保存相同内容 | 可以新增另一笔，ID 与之前不同 |
| T13 | 依次新增 0.10 和 0.20 | 支出增加 0.30，展示保持两位小数 |
| T14 | 查看新账单日期 | 与设备本地当天一致，月份和日期补零 |
| T15 | 点击分类、标题或输入框 | 不触发取消或遮罩关闭 |
| T16 | 手机、桌面和 320px 窄屏，显示错误后操作 | 输入、错误和保存/取消按钮可用，局部样式没有明显回归 |
| T17 | 查看控制台 | 无 prop 修改警告、运行异常或事件接线错误 |
| T18 | 刷新页面 | 仅恢复代码中的示例数据；此行为为本阶段限制 |

T06 必须从当前示例数据开始，不能在前面已经新增了账单的页面上使用固定总额判断。

纯函数和日期检查补充：可固定本地时间到接近午夜的时刻，确认生成的是本地日期而非 UTC 日期。若没有执行此测试，不得将其写成已通过。

自动化 viewport 检查不代表已验证真机软键盘。若软键盘遮住按钮，需要在后续移动端体验阶段处理，不能把桌面浏览器模拟当成真机结论。

### 14.3 构建与检查

```powershell
npm run build
git diff --check
```

当前没有 npm 自动化测试脚本。实施时可使用本机已有工具编写临时验证脚本，放在聊天输出目录，不引入测试依赖或修改锁文件；需要正式保留测试时另行讨论。

---

## 15. 验收清单

- [x] 分类状态使用 `ref`，分类可以切换。
- [x] 金额和备注通过 `v-model` 绑定。
- [x] 金额按明确规则校验，不把非法输入加入账单。
- [x] 备注去掉首尾空白，限制长度。
- [x] 错误提示可见，修改输入后旧提示清除。
- [x] 保存与 Enter 使用同一个表单提交入口。
- [x] 子组件发出 `save`，不直接修改父组件账单数组。
- [x] 父组件补齐唯一数字 ID 与本地日期。
- [x] 新账单加入列表顶部。
- [x] 总支出按整数分累计，预算继续自动更新。
- [x] 同一次打开连续提交只创建一条账单。
- [x] 保存、取消或遮罩关闭后，再次打开均重置草稿。
- [x] 开关交互没有回归，旧示例数据保持不变。
- [x] 纯函数边界与浏览器交互检查通过。
- [x] `npm run build` 与差异格式检查通过。
- [x] 未新增依赖，未修改旧版本代码。

---

## 16. 常见问题与复盘

### 为什么表单状态放在面板，账单数组放在 App？

草稿只服务于一个输入面板；账单数组还要驱动列表和预算。按使用范围放状态，可以减少无关组件依赖，又保持核心数据来源唯一。

### 为什么要用事件携带新对象？

事件表达“请父组件保存这笔数据”。新对象把当前输入转换为独立业务数据，后续清空草稿不会清空已经保存的账单。

### 为什么 v-if 关闭后还需要重置 ref？

当前只移除组件内部 DOM，组件实例和响应式变量继续存在。真正的重置需要显式修改表单状态。

### 为什么保存后不手动更新预算？

预算数据是 computed 的计算结果。新增账单改变依赖，Vue 会自动重新计算；手动维护总额会引入多个数据来源。

### 为什么保存失败时不关闭？

保留用户输入，才能让用户在原位置修正错误。只有父组件完成新增后才关闭。

### 为什么两处检查却只写一份校验函数？

面板检查服务于用户反馈，父组件检查保护业务状态。共用纯函数能让两处规则一致，避免复制代码后逐渐分歧。

---

## 17. Git 提交建议

用户已提交上一阶段代码和文档。实施开始时确认 1.4 提交为 `bdfadf0`（`feat:添加按钮和弹窗开关`），业务代码工作区干净，仅本阶段方案文档未提交。

单独提交方案的建议命令：

```powershell
git add docs/05-add-transaction-form-plan.md
git commit -m "docs: 记录新增账单表单方案"
```

本阶段代码和验证已经完成。若确认需要提交，可先检查 diff，再执行：

```powershell
git add src/App.vue src/components/TransactionSheet.vue src/utils/transaction.js docs/05-add-transaction-form-plan.md
git commit -m "feat: 实现新增账单表单"
```

本次不执行任何 Git 提交。

---

## 18. 后续路线

```text
1.4 添加按钮和弹窗开关：已有实现
    ↓
1.5 新增账单表单：已实施并验证
    ↓
1.6 删除账单
    ↓
1.7 左滑删除交互
    ↓
1.8 localStorage 持久化
```

1.5 的核心：

```text
草稿输入 → 校验和规范化 → emit 携带数据
        ↓
父组件新增账单 → computed 自动更新 → 关闭面板
```

---

## 19. 实施与验证记录（2026-10-10）

### 19.1 完成内容

| 文件 | 实际修改 |
|------|----------|
| `src/utils/transaction.js` | 集中管理 8 个分类，金额解析与草稿规范化；校验金额范围、小数位、备注与分类 |
| `src/components/TransactionSheet.vue` | 响应式草稿、分类按钮、`v-model`、form 提交、错误提示、打开时重置、携带数据的 `save` 事件 |
| `src/App.vue` | 接收保存请求并再次校验，生成数字 ID 与设备本地日期，新账单置顶，同步关闭防重复，按整数分累计支出 |

原有两条示例账单未修改，预算上限仍为 3000。未新增依赖或修改 npm scripts，其他展示组件、添加按钮、旧版代码保持不变。

局部体验补强：面板增加 `max-height: 100dvh` 和 `overflow-y: auto`，避免错误文案或小视口导致面板超过视口时无法访问内容；分类增加键盘焦点样式。此改动不包含滚动锁定或真机软键盘适配。

### 19.2 构建与代码检查

- `npm run build`：通过，Vite 成功构建 25 个模块。
- 已跟踪代码的 `git diff --check`：通过。
- 新增工具模块及文档的差异格式检查：通过。
- 构建与 Chrome 启动首次被沙箱阻止子进程（`spawn EPERM`）；获授权在沙箱外重跑后成功。

### 19.3 纯函数与父组件状态检查

临时脚本直接导入实际工具模块；另外抽取 `App.vue` 的实际 script setup，在隔离上下文中运行其函数与 Vue 响应式状态，不为测试修改源码或加入隐藏接口。

检查通过：

- 9 组合法金额，24 组非法金额，包括上限、超长整数、非数值类型、指数格式、负数和多余小数位。
- 8 个分类，非法分类拒绝，图标从分类表生成。
- 备注为空、首尾空格、20 长度边界和超过 20 的拒绝。
- 规范化再次执行结果一致，不修改原草稿，不直接复制传入的 ID、日期、类型和图标。
- 面板关闭时拒绝保存；面板打开时拒绝非法草稿且保持原状态。
- ID 从现有最大值递增，空数组从 1 开始，连续成功保存 ID 不重复。
- 修改提交用的原始草稿不会改变已保存账单。
- 0.10 加 0.20 的总额为 0.30，收入不计入支出。
- 预算为 0 时百分比为 0，超出预算时百分比上限为 100。

### 19.4 浏览器自动化

使用现成本机 Playwright 与无头 Chrome，通过临时 HTTP 服务器加载本次构建产物，不安装依赖。

| 视口 | 结果 |
|------|------|
| 手机 `390 × 844` | 通过 |
| 桌面 `1280 × 800` | 通过 |
| 窄屏 `320 × 568` | 通过 |

三个视口均覆盖第 14 节 T01–T18 的交互：

- 首次打开默认餐饮，草稿与错误为空；切换分类有高亮与 `aria-pressed`。
- 非法金额显示错误，修改金额、备注或分类后旧错误清除；失败不关闭、不新增。
- 交通分类保存 100 元后，记录置顶，图标与备注正确；总支出 379 → 479，百分比 13% → 16%。
- 保存、取消和点击遮罩之后再次打开，草稿及错误重置。
- Enter 保存一次，不刷新或导航。
- 在同一个 JavaScript 调用中连续触发两次 submit，只新增一次。
- 下次打开可以保存内容相同的另一笔账单。
- 新增 0.10 和 0.20，总支出显示 479.30；再新增 0.20 后显示 479.50。
- 使用键盘 Space 选择分类，选中状态正确，焦点轮廓可见。
- 显示错误后，金额、备注、错误和保存/取消按钮均在三个目标视口内。
- 打开时缩放窗口仍能取消关闭；面板内部点击不误关闭。
- 刷新恢复两条示例账单和总支出 379.00，符合暂不持久化的阶段限制。
- 未捕获运行异常、控制台警告或错误。

手机端错误态、填写态和保存后列表截图已查看，布局正常。

### 19.5 本地日期验证

固定浏览器时间和时区，保存实际账单后检查日期字段：

| 设备时区 | 固定 UTC 时间 | 预期且实际日期 |
|----------|---------------|----------------|
| Asia/Shanghai | `2026-10-09T16:15:00Z` | `2026-10-10` |
| America/Los_Angeles | `2026-10-10T06:45:00Z` | `2026-10-09` |
| Asia/Shanghai | `2026-01-01T16:15:00Z` | `2026-01-02` |

前两项验证本地日期可与 UTC 日期不同，第三项验证月份和日期补零。均为模拟测试时间，不是执行当天的记录。

### 19.6 验证产物与限制

临时脚本、JSON 结果与截图保存在当前聊天输出目录：

```text
C:\Users\29727\.codex\visualizations\2026\10\07\01a1159b-5928-7b21-9d76-22a5d3fdfe2f\
├── verify-add-transaction.cjs
├── add-transaction-verification.json
├── add-transaction-error-mobile.png
├── add-transaction-form-mobile.png
└── add-transaction-saved-mobile.png
```

目录中的 `2026\10\07` 是聊天输出目录的原始日期，不代表本次执行日期；本次实施与验证日期为 2026-10-10。

以上产物未加入项目 Git 范围。未执行 Git 提交。仍没有持久化、删除、编辑、完整模态焦点管理或真机软键盘验证。
