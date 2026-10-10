<script setup>
defineProps({
  transaction: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["delete"]);
</script>

<template>
  <div class="transaction-card-wrapper">
    <div class="transaction-card">
      <div class="transaction-left">
        <span class="transaction-icon">{{ transaction.icon }}</span>
        <div class="transaction-info">
          <div class="transaction-title">{{ transaction.category }}</div>
          <div class="transaction-note">{{ transaction.note }}</div>
          <div class="transaction-date">{{ transaction.date }}</div>
        </div>
      </div>
      <div class="transaction-right">
        <div class="transaction-amount" :class="transaction.type">
          {{ transaction.type === "income" ? "+" : "-" }}¥{{ transaction.amount.toFixed(2) }}
        </div>
        <button
          type="button"
          class="transaction-delete"
          :aria-label="`删除${transaction.category}账单，金额${transaction.amount.toFixed(2)}元`"
          @click="emit('delete', transaction.id)"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "../assets/styles/variables.less";

.transaction-card-wrapper {
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  border-radius: @border-radius;
}

.transaction-card-wrapper.animating {
  transition: transform 0.3s ease, opacity 0.3s ease, max-height 0.3s ease, margin-bottom 0.3s ease;
}

.transaction-card {
  position: relative;
  z-index: 2;
  background: @card-bg;
  padding: 14px 16px;
  border-radius: @border-radius;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  will-change: transform;
  touch-action: pan-y;
}

.transaction-card.animating {
  transition: transform 0.3s ease, opacity 0.25s ease;
}

.transaction-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.transaction-icon {
  flex-shrink: 0;
  font-size: 24px;
}

.transaction-info {
  min-width: 0;
  overflow-wrap: anywhere;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.transaction-title {
  font-size: 15px;
  font-weight: 500;
  color: @text-main;
}

.transaction-note {
  font-size: 12px;
  color: @text-sub;
}

.transaction-date {
  font-size: 11px;
  color: @text-sub;
}

.transaction-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
  gap: 4px;
}

.transaction-delete {
  min-width: 44px;
  min-height: 44px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 77, 79, 0.08);
  color: @danger-color;
  font-size: 12px;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid @danger-color;
    outline-offset: 2px;
  }
}

.transaction-amount {
  white-space: nowrap;
  font-size: 16px;
  font-weight: 600;

  &.expense {
    color: @text-main;
  }

  &.income {
    color: @danger-color;
  }
}
</style>
