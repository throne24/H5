<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const categories = [
  { name: "餐饮", icon: "🍜" },
  { name: "交通", icon: "🚗" },
  { name: "购物", icon: "🛍️" },
  { name: "娱乐", icon: "🎮" },
  { name: "居住", icon: "🏠" },
  { name: "医疗", icon: "💊" },
  { name: "学习", icon: "📚" },
  { name: "其他", icon: "📝" },
];

const selectedCategory = "餐饮";
</script>

<template>
  <div
    v-if="visible"
    class="modal-overlay active"
    @click.self="emit('close')"
  ></div>
  <div v-if="visible" class="action-sheet active">
    <div class="sheet-title">记一笔支出</div>

    <div class="category-grid">
      <div
        v-for="category in categories"
        :key="category.name"
        class="category-item"
        :class="{ selected: category.name === selectedCategory }"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span class="category-name">{{ category.name }}</span>
      </div>
    </div>

    <div class="input-group">
      <label>金额</label>
      <input type="number" placeholder="0.00" inputmode="decimal" />
    </div>

    <div class="input-group">
      <label>备注（可选）</label>
      <input type="text" placeholder="午餐、打车..." maxlength="20" />
    </div>

    <div class="btn-group">
      <button
        type="button"
        class="btn btn-cancel"
        @click="emit('close')"
      >
        取消
      </button>
      <button
        type="button"
        class="btn btn-save"
        disabled
        title="保存功能将在下一阶段实现"
      >
        保存
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
@import "../assets/styles/variables.less";

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;

  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.action-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: @card-bg;
  border-radius: 16px 16px 0 0;
  padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  z-index: 300;
  transform: translateY(100%);
  transition: transform 0.3s ease;

  &.active {
    transform: translateY(0);
  }
}

.sheet-title {
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 16px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;

  &.selected {
    background: rgba(74, 144, 226, 0.1);
  }
}

.category-icon {
  font-size: 24px;
}

.category-name {
  font-size: 11px;
  color: @text-sub;

  .category-item.selected & {
    color: @primary-color;
    font-weight: 600;
  }
}

.input-group {
  margin-bottom: 12px;

  label {
    font-size: 12px;
    color: @text-sub;
    margin-bottom: 4px;
    display: block;
  }

  input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    font-size: 16px;
    outline: none;
    transition: border-color 0.2s;

    &:focus {
      border-color: @primary-color;
    }
  }
}

.btn-group {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
}

.btn-cancel {
  background: #f0f0f0;
  color: @text-main;
}

.btn-save {
  background: @primary-color;
  color: #fff;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
