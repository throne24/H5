<script setup>
import TransactionItem from "./TransactionItem.vue";
import EmptyState from "./EmptyState.vue";

defineProps({
  transactions: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["delete"]);
</script>

<template>
  <section class="list-container">
    <template v-if="transactions.length">
      <TransactionItem
        v-for="transaction in transactions"
        :key="transaction.id"
        :transaction="transaction"
        @delete="emit('delete', $event)"
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