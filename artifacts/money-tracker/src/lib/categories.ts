export type Category = {
  name: string;
  emoji: string;
  color: string;
};

export const EXPENSE_CATEGORIES: Category[] = [
  { name: "Shopping", emoji: "🛒", color: "#3B82F6" },
  { name: "Food", emoji: "🍴", color: "#10B981" },
  { name: "Phone", emoji: "📱", color: "#8B5CF6" },
  { name: "Entertainment", emoji: "🎮", color: "#EC4899" },
  { name: "Education", emoji: "🎓", color: "#6366F1" },
  { name: "Beauty", emoji: "✂️", color: "#F472B6" },
  { name: "Sports", emoji: "🏃", color: "#14B8A6" },
  { name: "Social", emoji: "👥", color: "#F59E0B" },
  { name: "Transportation", emoji: "🚌", color: "#64748B" },
  { name: "Clothing", emoji: "👕", color: "#7C3AED" },
  { name: "Car", emoji: "🚗", color: "#0EA5E9" },
  { name: "Alcohol", emoji: "🍷", color: "#DC2626" },
  { name: "Cigarettes", emoji: "🚬", color: "#78716C" },
  { name: "Electronics", emoji: "🖥️", color: "#2563EB" },
  { name: "Travel", emoji: "✈️", color: "#0891B2" },
  { name: "Health", emoji: "❤️", color: "#EF4444" },
  { name: "Pets", emoji: "🐾", color: "#D97706" },
  { name: "Repairs", emoji: "🔧", color: "#9CA3AF" },
  { name: "Housing", emoji: "🏠", color: "#059669" },
  { name: "Home", emoji: "🛋️", color: "#7C2D12" },
  { name: "Gifts", emoji: "🎁", color: "#DB2777" },
  { name: "Donations", emoji: "🤲", color: "#16A34A" },
  { name: "Lottery", emoji: "🎰", color: "#CA8A04" },
  { name: "Snacks", emoji: "🍿", color: "#EA580C" },
  { name: "Baby", emoji: "👶", color: "#F9A8D4" },
  { name: "Vegetables", emoji: "🥦", color: "#22C55E" },
  { name: "Fruits", emoji: "🍎", color: "#F87171" },
  { name: "Other", emoji: "📦", color: "#6B7280" },
];

export const INCOME_CATEGORIES: Category[] = [
  { name: "Salary", emoji: "💼", color: "#10B981" },
  { name: "Investments", emoji: "📈", color: "#3B82F6" },
  { name: "Part-Time", emoji: "⏰", color: "#F59E0B" },
  { name: "Bonus", emoji: "🏆", color: "#FFD700" },
  { name: "Others", emoji: "💰", color: "#8B5CF6" },
];

export function getCategoryInfo(name: string, type: string): Category {
  const list = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find((c) => c.name === name) || { name, emoji: "💸", color: "#6B7280" };
}

export const CHART_COLORS = [
  "#FFD700", "#10B981", "#3B82F6", "#EC4899", "#F59E0B",
  "#8B5CF6", "#14B8A6", "#EF4444", "#6366F1", "#0EA5E9",
];
