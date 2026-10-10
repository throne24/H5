# 极简记账 Vue 改造记录

## 第四阶段 1.4：添加按钮和弹窗开关（已实施）

> 编写日期：2026-10-07。
>
> 本文记录 1.4 阶段的技术方案、学习目标与实施结果。
>
> 最初先记录方案，随后于 2026-10-07 按方案实施。下文设计章节保留原方案描述；实际完成情况和验证结果见第 14、18 节。

---

## 1. 当前进度与本阶段目标

根据当前代码，1.3 的核心数据流已经建立：

```text
App.vue
├── ref：transactions、budgetLimit
├── computed：totalExpense、budgetPercent
├── props → BudgetHeader.vue
└── props → TransactionList.vue → TransactionItem.vue
```

实施前交互有两个缺口（现已补齐）：

- `AddButton.vue` 只有按钮模板，没有点击事件。
- `TransactionSheet.vue` 使用固定的 `const visible = false`，面板无法由用户打开。

本阶段要实现：

```text
点击底部“+”按钮
        ↓
显示遮罩和记账面板
        ↓
点击“取消”或遮罩
        ↓
关闭遮罩和记账面板
```

这里先解决“面板能不能打开和关闭”，不解决“账单能不能保存”。

---

## 2. 学习目标

本阶段重点理解：

- `ref`：保存会变化的界面状态。
- `defineEmits`：声明子组件可以发出的自定义事件。
- `@click`：监听原生点击事件。
- `@open`、`@close`：父组件监听子组件自定义事件。
- `props`：父组件把开关状态传给子组件。
- `v-if`：根据开关状态创建或移除面板内容。
- 单向数据流：子组件请求变化，父组件实际修改状态。

继续使用 Vue 自身的能力，不引入 Pinia、Vue Router 或弹窗组件库。

---

## 3. 本阶段范围

### 3.1 要做的功能

- 页面首次加载时，面板默认关闭。
- 点击添加按钮后，面板和遮罩同时显示。
- 点击取消按钮后，面板和遮罩同时关闭。
- 点击遮罩后，面板和遮罩同时关闭。
- 点击面板内部，不触发遮罩关闭。
- 关闭后可以再次打开，重复操作不产生额外面板。
- 保留现有页面样式、账单数据和预算计算。
- 暂时禁用保存按钮，避免用户误认为已经支持保存。

### 3.2 暂时不做

- 金额和备注的 `v-model` 绑定。
- 分类切换、金额校验、保存账单。
- 日期选择、账单唯一 ID 生成。
- 删除账单、左滑交互、数据持久化。
- 入场和退场动画、拖拽关闭。
- 滚动锁定、焦点陷阱、关闭后焦点恢复、Escape 关闭。

最后一组属于弹窗体验和键盘可访问性的后续补强，本阶段的基础开关不等同于完整的生产级模态交互。

---

## 4. 状态应该放在哪里

计划在 `App.vue` 增加一个状态：

```js
const isSheetVisible = ref(false);
```

状态含义：

| 值 | 页面表现 |
|----|----------|
| `false` | 不显示遮罩和面板 |
| `true` | 显示遮罩和面板 |

为什么放在 `App.vue`？

`AddButton.vue` 和 `TransactionSheet.vue` 是兄弟组件，它们都由 `App.vue` 组合。把共享开关放到共同的父组件，就不需要让两个子组件直接互相调用，也不会出现两份互相矛盾的开关状态。

```text
App.vue：唯一开关状态 isSheetVisible
    │
    ├── AddButton.vue：请求打开
    │
    └── TransactionSheet.vue：接收 visible，请求关闭
```

账单和预算仍使用原来的状态和计算属性。本阶段不把任何业务数据移到子组件。

---

## 5. 完整的数据流

### 5.1 打开过程

```text
用户点击 AddButton 中的原生 button
        ↓ @click
AddButton 发出 open 事件
        ↓ App.vue 的 @open
App.vue 执行 openSheet()
        ↓
isSheetVisible.value = true
        ↓ :visible
TransactionSheet 的 visible prop 变成 true
        ↓ v-if
遮罩和面板显示
```

### 5.2 关闭过程

```text
用户点击取消按钮或遮罩
        ↓ @click
TransactionSheet 发出 close 事件
        ↓ App.vue 的 @close
App.vue 执行 closeSheet()
        ↓
isSheetVisible.value = false
        ↓ :visible
TransactionSheet 的 visible prop 变成 false
        ↓ v-if
遮罩和面板移除
```

记住这两个方向：

```text
父 → 子：props 传递状态
子 → 父：emit 发出请求
```

`emit` 本身不会修改父组件状态。父组件需要监听事件，并在处理函数里修改状态。

---

## 6. 组件通信约定

| 组件 | 接收的 props | 发出的事件 | 职责 |
|------|--------------|------------|------|
| `App.vue` | 无新增 | 无新增 | 管理状态、处理打开和关闭 |
| `AddButton.vue` | 无新增 | `open`，无参数 | 请求打开记账面板 |
| `TransactionSheet.vue` | `visible: Boolean`，默认 `false` | `close`，无参数 | 根据状态展示，请求关闭 |

当前只需要打开和关闭，不需要传递事件参数。后续保存账单时，再单独设计携带表单数据的事件。

---

## 7. App.vue 的计划修改

### 7.1 增加状态和处理函数

现有文件已经导入 `ref`，无需重复导入。保留原来的账单数组和计算属性，增加以下内容：

```js
const isSheetVisible = ref(false);

function openSheet() {
  isSheetVisible.value = true;
}

function closeSheet() {
  isSheetVisible.value = false;
}
```

使用明确的打开、关闭操作，不使用同一个取反函数：

```js
// 本阶段不采用这种写法
isSheetVisible.value = !isSheetVisible.value;
```

原因是“请求打开”应该始终得到打开状态，“请求关闭”应该始终得到关闭状态。即使同一个请求重复触发，也不会意外反转界面。

### 7.2 更新两个组件的绑定

在原有模板中，仅替换添加按钮和面板的使用方式：

```vue
<AddButton @open="openSheet" />
<TransactionSheet
  :visible="isSheetVisible"
  @close="closeSheet"
/>
```

其中：

- `:visible` 是 `v-bind:visible` 的缩写，传入布尔值，不是文本。
- `@open` 是 `v-on:open` 的缩写，监听子组件事件。
- 模板中的 `ref` 会自动解包，不需要写 `.value`。
- JavaScript 函数中修改状态时，需要写 `.value`。

不要写成：

```vue
<!-- 错误：传入的是字符串，不是响应式布尔值 -->
<TransactionSheet visible="isSheetVisible" />
```

---

## 8. AddButton.vue 的计划修改

### 8.1 声明事件

新增脚本块：

```vue
<script setup>
const emit = defineEmits(["open"]);
</script>
```

`defineEmits` 是 `<script setup>` 中的编译宏，不需要从 Vue 导入。

### 8.2 点击按钮时发出事件

```vue
<template>
  <button
    type="button"
    class="fab"
    aria-label="记一笔"
    @click="emit('open')"
  >
    +
  </button>
</template>
```

`type="button"` 明确表示普通按钮，避免以后放进表单时意外提交。

保留现有 `.fab` 样式和按钮文字。本阶段不让按钮组件持有面板状态。

---

## 9. TransactionSheet.vue 的计划修改

### 9.1 用 prop 替换固定值

删除原来的临时展示说明和固定变量：

```js
const visible = false;
```

改为：

```js
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);
```

现有 `categories` 和 `selectedCategory` 保持不变。分类交互留到 1.5。

不要在子组件中给 `visible` 赋值。它来自父组件，子组件只能发出关闭请求：

```js
emit("close");
```

### 9.2 遮罩点击关闭

在现有遮罩上增加事件：

```vue
<div
  v-if="visible"
  class="modal-overlay active"
  @click.self="emit('close')"
></div>
```

`.self` 表示只有点击目标是当前元素自身时才执行处理函数。

当前遮罩和面板是两个并列元素，不是父子嵌套结构，点击面板不会冒泡到遮罩。这里使用 `.self` 表达“只点击遮罩本身才关闭”的意图；本阶段不调整它们的层级结构，也不需要额外堆叠 `@click.stop`。

### 9.3 取消按钮关闭

替换现有取消按钮：

```vue
<button
  type="button"
  class="btn btn-cancel"
  @click="emit('close')"
>
  取消
</button>
```

### 9.4 保存按钮暂时禁用

由于本阶段没有保存逻辑，计划明确禁用：

```vue
<button
  type="button"
  class="btn btn-save"
  disabled
  title="保存功能将在下一阶段实现"
>
  保存
</button>
```

并补充禁用样式：

```less
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

禁用保存按钮是临时阶段边界，不是最终产品行为。1.5 实现表单时，需要重新设计它的启用条件与保存事件。

### 9.5 保留现有条件显示方式

两个根元素继续使用同一个 `visible`：

```vue
<div
  v-if="visible"
  class="modal-overlay active"
  @click.self="emit('close')"
></div>
<div v-if="visible" class="action-sheet active">
  <!-- 保留现有面板内容 -->
</div>
```

上面的片段用于说明显示条件，面板内部沿用现有模板内容。

本阶段不再在 `App.vue` 上额外写 `<TransactionSheet v-if="isSheetVisible" />`，避免同时维护两层开关条件。

---

## 10. 为什么暂时继续使用 v-if

项目已有 `v-if="visible"`，本阶段直接沿用，以减少不必要的改动。

| 方式 | 隐藏时的行为 | 本阶段选择 |
|------|--------------|------------|
| `v-if` | 条件区域的 DOM 被移除 | 使用 |
| `v-show` | DOM 保留，通过样式隐藏 | 暂不使用 |

这里要区分“面板里的 DOM”与“面板组件实例”：

- `App.vue` 始终渲染 `TransactionSheet` 组件。
- 组件内部的遮罩和面板 DOM 受 `v-if` 控制。
- 关闭会移除这些 DOM，但不会卸载 `TransactionSheet` 组件实例。
- 本阶段输入框尚未绑定状态，关闭再打开后，其手动输入内容会随 DOM 重建而丢失。
- 1.5 引入 `v-model` 后，表单数据会存放在响应式变量中，需要明确决定关闭时重置还是保留，不能仅依赖 `v-if`。

本阶段不增加 `<Transition>`。现有 `active` 类保留用于展示面板最终位置，不把开关功能和动画改造混在一起。

---

## 11. 预计修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/App.vue` | 新增开关状态、打开和关闭函数、事件及 prop 绑定 |
| `src/components/AddButton.vue` | 声明并发出 `open` 事件 |
| `src/components/TransactionSheet.vue` | 接收 `visible`、发出 `close`、禁用保存按钮 |

实施时不需要修改：

- `BudgetHeader.vue`、`TransactionList.vue`、`TransactionItem.vue`。
- `EmptyState.vue`。
- 全局样式、Less 变量。
- `package.json` 和依赖锁文件。
- `legacy/` 和根目录中的旧版本代码。

不清空或替换 `App.vue` 中现有的两条账单练习数据。

---

## 12. 实施顺序

### 1.4.1：让添加按钮能发送请求

1. `App.vue` 增加 `isSheetVisible`、`openSheet` 和 `closeSheet`。
2. `AddButton.vue` 增加 `defineEmits(["open"])`。
3. 添加按钮绑定原生点击事件。
4. `App.vue` 监听 `open` 事件。

### 1.4.2：让面板受父组件控制

1. 将面板固定的 `visible` 替换为 prop。
2. `App.vue` 通过 `:visible` 传值。
3. 验证点击添加按钮可以显示面板。

### 1.4.3：补齐关闭入口

1. 面板声明 `close` 事件。
2. 取消按钮和遮罩发出 `close`。
3. `App.vue` 监听 `close` 并修改状态。
4. 禁用保存按钮并补充禁用样式。
5. 检查反复打开、关闭以及点击面板内部的行为。

### 1.4.4：构建与复盘

1. 执行生产构建。
2. 检查浏览器中的交互和控制台。
3. 复盘 props 与 emits 的方向。
4. 实施完成后再更新验收状态和实际验证结果。

---

## 13. 验收用例

以下为原定验收用例。现已用本机无头 Chrome 自动化执行，对应结果见第 18 节；未另行进行人工逐项点击验收。

| 编号 | 操作 | 预期结果 |
|------|------|----------|
| T01 | 首次加载页面 | 面板和遮罩隐藏，现有账单正常显示 |
| T02 | 点击底部添加按钮 | 面板和遮罩显示 |
| T03 | 点击取消按钮 | 面板和遮罩隐藏 |
| T04 | 再次打开，点击遮罩空白处 | 面板和遮罩隐藏 |
| T05 | 打开后点击标题、分类或输入框 | 面板保持打开，不误关闭 |
| T06 | 连续重复打开和关闭至少 5 次 | 始终只有一份面板和遮罩，无状态错乱 |
| T07 | 检查保存按钮 | 禁用，无法创建账单，也不会触发关闭 |
| T08 | 对比操作前后的列表与预算 | 账单、总支出和预算百分比保持不变 |
| T09 | 打开面板时调整窗口宽度 | 桌面窄窗口和移动端宽度下，取消按钮仍可操作 |
| T10 | 查看浏览器控制台 | 无 prop 修改警告、事件相关警告或运行错误 |
| T11 | 执行 `npm run build` | 构建成功，无模板或脚本编译错误 |

构建验证命令：

```powershell
npm run build
```

浏览器手动验证入口：

```powershell
npm run dev
```

构建通过不能替代 T01–T10 的浏览器交互验证。当前 `package.json` 没有配置自动化测试脚本，本阶段先采用构建加手动验收，不额外安装测试依赖。

---

## 14. 验收清单

- [x] `App.vue` 使用 `ref(false)` 管理唯一的面板开关。
- [x] 添加按钮通过 `open` 事件请求打开。
- [x] 面板通过 `visible` prop 接收状态。
- [x] 取消按钮通过 `close` 事件请求关闭。
- [x] 点击遮罩可以关闭面板。
- [x] 点击面板内容不会误关闭。
- [x] 可重复打开和关闭。
- [x] 保存按钮已明确禁用。
- [x] 子组件没有直接修改 prop。
- [x] 没有手动查询 DOM、修改 `innerHTML` 或直接切换元素样式。
- [x] 现有账单和预算计算没有回归。
- [x] 没有新增依赖，旧版代码保持不变。
- [x] 本机 Chrome 自动化浏览器交互验收通过。
- [x] `npm run build` 构建通过。

---

## 15. 常见问题与复盘

### 为什么不让 AddButton 直接控制 TransactionSheet？

它们是兄弟组件。通过共同父组件协调，可以让事件关系和状态来源更清楚，也方便以后从其他入口打开同一个面板。

### 为什么不能在 TransactionSheet 中直接修改 visible？

`visible` 是父组件传入的 prop，不是子组件拥有的状态。直接修改会破坏单向数据流；正确方式是发出 `close` 请求，由父组件更新。

### 为什么此时不用组件 v-model？

当前先用显式的 `visible` 和 `close` 理解数据流，不同时引入 `update:modelValue` 或其他双向绑定约定。下一阶段的输入框 `v-model` 与组件的双向绑定是不同层面的用法。

### 如果按钮点击了但面板仍没出现，先检查哪里？

按事件链逐项检查：

```text
@click 是否发出 open
    ↓
App 是否监听 @open
    ↓
是否修改 isSheetVisible.value
    ↓
是否通过 :visible 传入
    ↓
面板是否移除了原来的固定 visible
```

### 如果关闭后又重新打开了，先检查什么？

确认没有用同一个“取反函数”同时处理打开和关闭，也没有给面板外层额外增加重复的点击处理函数。

---

## 16. Git 提交建议

如果希望将技术方案单独提交，可以先提交文档：

```powershell
git add docs/04-sheet-toggle-plan.md
git commit -m "docs: 记录添加按钮和弹窗开关方案"
```

本阶段代码现已实施并验证通过，也可以将代码与文档一起提交：

```powershell
git add src/App.vue src/components/AddButton.vue src/components/TransactionSheet.vue docs/04-sheet-toggle-plan.md
git commit -m "feat: 实现添加按钮和记账面板开关"
```

以上仅为提交建议，本次不会自动执行提交。

---

## 17. 下一阶段预告

```text
1.3 响应式账单数据流：当前代码已有核心实现
    ↓
1.4 添加按钮和弹窗开关：已实施并完成构建与浏览器自动化验证
    ↓
1.5 新增账单表单
    ├── v-model 绑定金额和备注
    ├── 分类选择
    ├── 表单校验
    ├── 保存事件携带账单数据
    └── 父组件新增账单，列表与预算自动更新
```

1.4 的学习重点：

```text
ref 管理状态
    +
props 向下传值
    +
emit 向上发出请求
    =
多个组件协作完成一个交互
```

---

## 18. 实施与验证记录（2026-10-07）

### 18.1 实际修改

| 文件 | 完成内容 |
|------|----------|
| `src/App.vue` | 增加 `isSheetVisible`、`openSheet`、`closeSheet`，接入 `@open`、`:visible` 和 `@close` |
| `src/components/AddButton.vue` | 声明 `open` 事件，普通按钮点击时发出请求 |
| `src/components/TransactionSheet.vue` | 用 Boolean prop 替换固定开关，遮罩和取消按钮发出 `close`，禁用保存按钮并补充禁用样式 |

原有两条账单及预算计算没有修改。未引入依赖，未修改旧版本代码，未执行 Git 提交。

### 18.2 构建与差异检查

- `npm run build`：通过，Vite 成功构建 24 个模块。
- `git diff --check`：通过。
- 本机沙箱首次阻止了 esbuild 和 Chrome 子进程启动（`spawn EPERM`）；经授权在沙箱外运行后，构建和浏览器验证均成功。

### 18.3 浏览器自动化验证

使用现成的 Playwright 运行本机无头 Chrome，临时 HTTP 服务器提供本次构建的 `dist` 产物。没有安装测试依赖，也没有修改项目的 npm scripts。

验证视口：

- 手机：`390 × 844`。
- 桌面：`1280 × 800`。
- 窄屏：`320 × 568`。

三个视口均通过以下检查：

- 初始页面没有面板和遮罩。
- 点击添加按钮后，只显示一份面板和遮罩。
- 点击标题、分类、金额框和备注框时，不误关闭。
- 保存按钮确实禁用，点击其位置不会保存或关闭。
- 点击取消可以关闭，取消按钮位于视口内。
- 点击遮罩空白处可以关闭。
- 连续打开和关闭 5 次，取消和遮罩两种关闭入口交替使用，均无异常。
- 面板打开时切换窗口宽度，仍可正常关闭。
- 操作前后仍有两条账单，总支出 `379.00`，预算使用率 `13%`，内容未变化。
- 未捕获 JavaScript 运行异常或控制台警告、错误。

临时测试服务器首次因浏览器自动请求 `/favicon.ico` 返回 404，导致控制台检查失败；修正测试服务器对该请求的处理后完整重跑通过。此项未修改业务代码，也不代表项目新增了 favicon。

自动化脚本、JSON 验证结果和手机截图保存在当前聊天的可视化输出目录中，不纳入项目依赖或 Git 提交范围。手机截图已查看，面板、输入框与两个按钮布局正常。

### 18.4 阶段边界

目前只完成基础面板开关。输入框尚未绑定响应式表单，分类不能切换，保存不能创建账单；这些功能留到 1.5。焦点管理、Escape 关闭、滚动锁定和过渡动画仍未实施。自动化视口验证不等同于真机软键盘验证。
