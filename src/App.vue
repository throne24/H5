<script setup>
import BudgetHeader from "./components/BudgetHeader.vue";
import TransactionList from "./components/TransactionList.vue";
import AddButton from "./components/AddButton.vue";
import TransactionSheet from "./components/TransactionSheet.vue";
</script>

<template>
  <main class="app">
    <BudgetHeader />
    <TransactionList />
    <AddButton />
    <TransactionSheet />
  </main>
</template>

<style scoped lang="less">
.app {
  min-height: 100vh;
}
</style>
