export const expenseCategories = [
  { name: "餐饮", icon: "🍜" },
  { name: "交通", icon: "🚗" },
  { name: "购物", icon: "🛍️" },
  { name: "娱乐", icon: "🎮" },
  { name: "居住", icon: "🏠" },
  { name: "医疗", icon: "💊" },
  { name: "学习", icon: "📚" },
  { name: "其他", icon: "📝" },
];

const MAX_AMOUNT_CENTS = 99_999_999;

export function parseExpenseAmount(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return null;
  }

  const [integerPart, decimalPart = ""] = text.split(".");
  const cents = Number(integerPart) * 100
    + Number(decimalPart.padEnd(2, "0"));

  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_AMOUNT_CENTS) {
    return null;
  }

  return cents / 100;
}

export function normalizeExpenseDraft(draft) {
  if (!draft || typeof draft !== "object") {
    return { data: null, error: "表单数据无效，请重新填写" };
  }

  const category = expenseCategories.find(
    (item) => item.name === draft.category,
  );
  if (!category) {
    return { data: null, error: "请选择有效分类" };
  }

  const amount = parseExpenseAmount(draft.amount);
  if (amount === null) {
    return {
      data: null,
      error: "请输入大于 0、最多两位小数且不超过 999999.99 的金额",
    };
  }

  if (typeof draft.note !== "string") {
    return { data: null, error: "备注格式无效" };
  }

  const note = draft.note.trim();
  if (note.length > 20) {
    return { data: null, error: "备注不能超过 20 个字符" };
  }

  return {
    data: {
      type: "expense",
      category: category.name,
      icon: category.icon,
      amount,
      note,
    },
    error: "",
  };
}
