<script setup>
const message = "Vue 项目骨架已搭建";
</script>

<template>
  <div class="app-start">
    <h1>{{ message }}</h1>
    <p class="hint">Less 样式验证通过</p>
  </div>
</template>

<style scoped lang="less">
@app-primary: #4A90E2;
@app-bg: #F5F7FA;

.app-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: @app-bg;
  color: #333;

  h1 {
    color: @app-primary;
    font-size: 22px;
    margin-bottom: 12px;
  }

  .hint {
    font-size: 14px;
    color: #999;
  }
}
</style>
