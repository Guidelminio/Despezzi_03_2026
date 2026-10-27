import {
  formatIsoDate,
  formatMonthKey,
  isIsoDate,
  monthKeyInTimeZone,
  monthKeyWithOffset,
} from '../utils/financialDates.ts';

export interface FinancialTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  category: string;
  status?: string | null;
}

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function centsToMoney(amountInCents: number): number {
  return amountInCents / 100;
}

function isUsableTransaction(value: FinancialTransaction): boolean {
  return (
    (value.type === 'income' || value.type === 'expense') &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    isIsoDate(value.date) &&
    (value.status == null || value.status === 'completed')
  );
}

export function calculateFinancialStats(
  transactions: FinancialTransaction[],
  now = new Date(),
  timeZone = 'America/Sao_Paulo',
) {
  const completed = transactions
    .filter(isUsableTransaction)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  let totalIncomeCents = 0;
  let totalExpenseCents = 0;
  let cumulativeCents = 0;
  const categoryExpenseCents = new Map<string, number>();
  const currentMonthCategoryExpenseCents = new Map<string, number>();
  const currentMonthKey = monthKeyInTimeZone(now, timeZone);
  const chartData: Array<Record<string, string | number | null>> = [];

  for (const transaction of completed) {
    const amountCents = toCents(transaction.amount);
    if (transaction.type === 'income') {
      totalIncomeCents += amountCents;
      cumulativeCents += amountCents;
    } else {
      totalExpenseCents += amountCents;
      cumulativeCents -= amountCents;
      categoryExpenseCents.set(
        transaction.category,
        (categoryExpenseCents.get(transaction.category) ?? 0) + amountCents,
      );
      if (transaction.date.startsWith(currentMonthKey)) {
        currentMonthCategoryExpenseCents.set(
          transaction.category,
          (currentMonthCategoryExpenseCents.get(transaction.category) ?? 0) + amountCents,
        );
      }
    }

    chartData.push({
      date: transaction.date,
      name: formatIsoDate(transaction.date),
      value: centsToMoney(cumulativeCents),
      income: transaction.type === 'income' ? centsToMoney(amountCents) : 0,
      expense: transaction.type === 'expense' ? centsToMoney(amountCents) : 0,
      description: transaction.description ?? '',
    });
  }

  if (chartData.length === 0) {
    chartData.push({ date: null, name: 'Sem lançamentos', value: 0, income: 0, expense: 0, description: '' });
  }

  const monthNames = new Map<string, { incomeCents: number; expenseCents: number }>();
  const monthKeys = Array.from({ length: 6 }, (_, index) => monthKeyWithOffset(currentMonthKey, 5 - index));
  for (const monthKey of monthKeys) monthNames.set(monthKey, { incomeCents: 0, expenseCents: 0 });

  for (const transaction of completed) {
    const month = monthNames.get(transaction.date.slice(0, 7));
    if (!month) continue;
    if (transaction.type === 'income') month.incomeCents += toCents(transaction.amount);
    else month.expenseCents += toCents(transaction.amount);
  }

  const monthlyChartData = monthKeys.map((monthKey) => {
    const month = monthNames.get(monthKey)!;
    const income = centsToMoney(month.incomeCents);
    const expense = centsToMoney(month.expenseCents);
    return {
      monthKey,
      name: formatMonthKey(monthKey),
      value: centsToMoney(month.incomeCents - month.expenseCents),
      income,
      expense,
    };
  });

  return {
    balance: centsToMoney(totalIncomeCents - totalExpenseCents),
    totalIncome: centsToMoney(totalIncomeCents),
    totalExpense: centsToMoney(totalExpenseCents),
    categoryExpenses: Object.fromEntries(
      [...categoryExpenseCents].map(([category, amount]) => [category, centsToMoney(amount)]),
    ),
    currentMonthCategoryExpenses: Object.fromEntries(
      [...currentMonthCategoryExpenseCents].map(([category, amount]) => [category, centsToMoney(amount)]),
    ),
    chartData,
    monthlyChartData,
    currentMonthKey,
    timeZone,
  };
}
