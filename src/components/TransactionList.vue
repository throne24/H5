<script setup>
import TransactionItem from "./TransactionItem.vue";
import EmptyState from "./EmptyState.vue";

// 开发期间用于同时验证两种视觉状态
// 改为 false 可查看 EmptyState
const showDemoTransaction = true;

const demoTransaction = {
  id: 1,
  type: "expense",
  category: "餐饮",
  icon: "🍜",
  note: "示例账单",
  amount: 25,
  date: "2026-09-20",
};
</script>

<template>
  <section class="list-container">
    <TransactionItem v-if="showDemoTransaction" :transaction="demoTransaction" />
    <EmptyState v-else />
  </section>
</template>

<style scoped lang="less">
.list-container {
  padding: 0 16px;
}
</style>
