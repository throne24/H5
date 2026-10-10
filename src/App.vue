<script setup>
import { computed, ref } from "vue";
import { normalizeExpenseDraft } from "./utils/transaction.js";

import BudgetHeader from "./components/BudgetHeader.vue";
import TransactionList from "./components/TransactionList.vue";
import AddButton from "./components/AddButton.vue";
import TransactionSheet from "./components/TransactionSheet.vue";

const budgetLimit = ref(3000);
const isSheetVisible = ref(false);

function openSheet() {
  isSheetVisible.value = true;
}

function closeSheet() {
  isSheetVisible.value = false;
}

const transactions = ref([
  {
    id: 1,
    type: "expense",
    category: "餐饮",
    icon: "🍜",
    note: "示例账单",
    amount: 256,
    date: "2026-09-20",
  },
  {
    id:2,
    type:"expense",
    category:"餐饮",
    icon:"",
    note:"测试",
    amount:123,
    date:"2026-10-7",
  }
]);

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

function deleteTransaction(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return;
  }

  const target = transactions.value.find(
    (transaction) => transaction.id === id,
  );
  if (!target) {
    return;
  }

  const confirmed = window.confirm(
    `确定删除这笔${target.category}账单（¥${target.amount.toFixed(2)}）吗？此操作无法撤销。`,
  );
  if (!confirmed) {
    return;
  }

  transactions.value = transactions.value.filter(
    (transaction) => transaction.id !== id,
  );
}

const totalExpense = computed(() => {
  const totalCents = transactions.value
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => {
      return total + Math.round(transaction.amount * 100);
    }, 0);

  return totalCents / 100;
});

const budgetPercent = computed(() => {
  if (budgetLimit.value <= 0) {
    return 0;
  }

  return Math.min(
    Math.round((totalExpense.value / budgetLimit.value) * 100),
    100,
  );
});
</script>

<template>
  <main class="app">
    <BudgetHeader
      :budget="budgetLimit"
      :spent="totalExpense"
      :percent="budgetPercent"
    />
    <TransactionList
      :transactions="transactions"
      @delete="deleteTransaction"
    />
    <AddButton @open="openSheet" />
    <TransactionSheet
      :visible="isSheetVisible"
      @close="closeSheet"
      @save="saveTransaction"
    />
  </main>
</template>

<style scoped lang="less">
.app {
  min-height: 100vh;
}
</style>