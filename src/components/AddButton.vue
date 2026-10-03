<template>
  <button class="fab" aria-label="记一笔">+</button>
</template>

<style scoped lang="less">
@import "../assets/styles/variables.less";

.fab {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: @primary-color;
  color: #fff;
  font-size: 28px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
  cursor: pointer;
  z-index: 100;

  &:active {
    transform: translateX(-50%) scale(0.92);
  }
}
</style>
