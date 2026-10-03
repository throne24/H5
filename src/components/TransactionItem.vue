<script setup>
defineProps({
  transaction: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="transaction-card-wrapper">
    <div class="delete-btn-bg">删除</div>
    <div class="transaction-card">
      <div class="transaction-left">
        <span class="transaction-icon">{{ transaction.icon }}</span>
        <div class="transaction-info">
          <div class="transaction-title">{{ transaction.category }}</div>
          <div class="transaction-note">{{ transaction.note }}</div>
          <div class="transaction-date">{{ transaction.date }}</div>
        </div>
      </div>
      <div class="transaction-amount" :class="transaction.type">
        {{ transaction.type === "income" ? "+" : "-" }}¥{{ transaction.amount.toFixed(2) }}
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

.delete-btn-bg {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px;
  background: @danger-color;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  border-radius: 0 @border-radius @border-radius 0;
  cursor: pointer;
  z-index: 1;
  user-select: none;
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
  will-change: transform;
  touch-action: pan-y;
}

.transaction-card.animating {
  transition: transform 0.3s ease, opacity 0.25s ease;
}

.transaction-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.transaction-icon {
  font-size: 24px;
}

.transaction-info {
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

.transaction-amount {
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
