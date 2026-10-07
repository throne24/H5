<script setup>
defineProps({
  budget: {
    type: Number,
    required: true,
  },
  spent: {
    type: Number,
    required: true,
  },
  percent: {
    type: Number,
    required: true,
  },
});
</script>

<template>
  <header class="budget-header">
    <div class="progress-container">
      <div class="progress-ring" :style="{ background: `conic-gradient(var(--primary-color) ${percent}%, #eee ${percent}% 100%)` }">
        <div class="progress-inner">
          <span class="progress-percent">{{ percent }}%</span>
          <span class="progress-label">已用预算</span>
        </div>
      </div>
    </div>
    <div class="budget-text">预算: ¥{{ budget }} | 已用: ¥{{ spent.toFixed(2) }}</div>
  </header>
</template>

<style scoped lang="less">
@import "../assets/styles/variables.less";

.budget-header {
  padding: 20px 16px 10px;
  text-align: center;
}

.progress-container {
  width: 120px;
  height: 120px;
  margin: 0 auto 12px;
  position: relative;
}

.progress-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.5s ease;
}

.progress-inner {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: @bg-color;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.progress-percent {
  font-size: 22px;
  font-weight: bold;
  color: @primary-color;
}

.progress-label {
  font-size: 11px;
  color: @text-sub;
  margin-top: 2px;
}

.budget-text {
  font-size: 13px;
  color: @text-sub;
  cursor: pointer;
  border-bottom: 1px dashed @text-sub;
  display: inline-block;
  padding-bottom: 2px;
}
</style>