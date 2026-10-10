<script setup>
import { computed, ref } from "vue";

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

const totalExpense = computed(() => {
  return transactions.value
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
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
    <TransactionList :transactions="transactions" />
    <AddButton @open="openSheet" />
    <TransactionSheet :visible="isSheetVisible" @close="closeSheet" />
  </main>
</template>

<style scoped lang="less">
.app {
  min-height: 100vh;
}
</style>