<script setup>
import { ref, watch } from "vue";
import {
  expenseCategories,
  normalizeExpenseDraft,
} from "../utils/transaction.js";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "save"]);

const selectedCategory = ref("餐饮");
const amountInput = ref("");
const noteInput = ref("");
const errorMessage = ref("");

function resetForm() {
  selectedCategory.value = "餐饮";
  amountInput.value = "";
  noteInput.value = "";
  errorMessage.value = "";
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetForm();
    }
  },
);

watch([amountInput, noteInput, selectedCategory], () => {
  errorMessage.value = "";
});

function submitForm() {
  if (!props.visible) {
    return;
  }

  const result = normalizeExpenseDraft({
    category: selectedCategory.value,
    amount: amountInput.value,
    note: noteInput.value,
  });

  errorMessage.value = result.error;
  if (!result.data) {
    return;
  }

  emit("save", result.data);
}
</script>

<template>
  <div
    v-if="visible"
    class="modal-overlay active"
    @click.self="emit('close')"
  ></div>
  <form
    v-if="visible"
    class="action-sheet active"
    novalidate
    @submit.prevent="submitForm"
  >
    <div class="sheet-title">记一笔支出</div>

    <div class="category-grid">
      <button
        v-for="category in expenseCategories"
        :key="category.name"
        type="button"
        class="category-item"
        :class="{ selected: category.name === selectedCategory }"
        :aria-pressed="category.name === selectedCategory"
        @click="selectedCategory = category.name"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span class="category-name">{{ category.name }}</span>
      </button>
    </div>

    <div class="input-group">
      <label for="transaction-amount">金额</label>
      <input
        id="transaction-amount"
        v-model="amountInput"
        type="text"
        placeholder="0.00"
        inputmode="decimal"
        autocomplete="off"
        :aria-describedby="errorMessage ? 'transaction-form-error' : undefined"
      />
    </div>

    <div class="input-group">
      <label for="transaction-note">备注（可选）</label>
      <input
        id="transaction-note"
        v-model="noteInput"
        type="text"
        placeholder="午餐、打车..."
        maxlength="20"
        :aria-describedby="errorMessage ? 'transaction-form-error' : undefined"
      />
    </div>

    <p
      v-if="errorMessage"
      id="transaction-form-error"
      class="form-error"
      role="alert"
    >
      {{ errorMessage }}
    </p>

    <div class="btn-group">
      <button
        type="button"
        class="btn btn-cancel"
        @click="emit('close')"
      >
        取消
      </button>
      <button type="submit" class="btn btn-save">保存</button>
    </div>
  </form>
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
  max-height: 100dvh;
  overflow-y: auto;
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
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;

  &.selected {
    background: rgba(74, 144, 226, 0.1);
  }

  &:focus-visible {
    outline: 2px solid @primary-color;
    outline-offset: 2px;
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

.form-error {
  margin-top: 4px;
  color: @danger-color;
  font-size: 12px;
  line-height: 1.5;
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
}
</style>
