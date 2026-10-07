<script setup>
import TransactionItem from "./TransactionItem.vue";
import EmptyState from "./EmptyState.vue";

defineProps({
  transactions: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <section class="list-container">
    <template v-if="transactions.length">
      <TransactionItem
        v-for="transaction in transactions"
        :key="transaction.id"
        :transaction="transaction"
      />
    </template>
    <EmptyState v-else />
  </section>
</template>

<style scoped lang="less">
.list-container {
  padding: 0 16px;
}
</style>