export const EXPENSE_CATEGORIES = [
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'moradia', label: 'Moradia' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'lazer', label: 'Lazer' },
  { id: 'saude', label: 'Saúde' },
  { id: 'educacao', label: 'Educação' },
  { id: 'outros', label: 'Outros' },
] as const;

export const INCOME_CATEGORIES = [
  { id: 'salario', label: 'Salário' },
  { id: 'investimento', label: 'Investimento' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'outros', label: 'Outros' },
] as const;

export const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Cartão de crédito' },
  { id: 'debit_card', label: 'Débito' },
  { id: 'cash', label: 'Dinheiro' },
  { id: 'pix', label: 'Pix' },
] as const;

const categoryLabels: Record<string, string> = Object.fromEntries(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(({ id, label }) => [id, label]),
);

export function isValidCategory(type: unknown, category: unknown): boolean {
  if (typeof category !== 'string') return false;
  if (type === 'expense') return EXPENSE_CATEGORIES.some((item) => item.id === category);
  if (type === 'income') return INCOME_CATEGORIES.some((item) => item.id === category);
  return false;
}

export function categoryLabel(category: string): string {
  if (categoryLabels[category]) return categoryLabels[category];
  return category
    .replace(/[_-]+/g, ' ')
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'));
}
