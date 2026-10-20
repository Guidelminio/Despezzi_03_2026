import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFinancialStats, type FinancialTransaction } from '../src/services/financialStats.ts';

test('calcula valores concluídos em centavos e janela de seis competências no fuso de São Paulo', () => {
  const transactions: FinancialTransaction[] = [
    { id: 1, type: 'income', amount: 1000, date: '2025-10-31', category: 'salario', status: 'completed' },
    { id: 2, type: 'expense', amount: 200, date: '2026-03-31', category: 'alimentacao', status: 'completed' },
    { id: 3, type: 'income', amount: 0.1, date: '2026-03-31', category: 'freelance', status: 'completed' },
    { id: 4, type: 'expense', amount: 9999, date: '2026-03-31', category: 'transporte', status: 'pending' },
    { id: 5, type: 'expense', amount: 50, date: '2026-02-30', category: 'lazer', status: 'completed' },
  ];
  // 02:00 UTC ainda é 23:00 do dia anterior em São Paulo.
  const stats = calculateFinancialStats(transactions, new Date('2026-04-01T02:00:00.000Z'));

  assert.equal(stats.currentMonthKey, '2026-03');
  assert.equal(stats.totalIncome, 1000.1);
  assert.equal(stats.totalExpense, 200);
  assert.equal(stats.balance, 800.1);
  assert.deepEqual(stats.categoryExpenses, { alimentacao: 200 });
  assert.deepEqual(stats.currentMonthCategoryExpenses, { alimentacao: 200 });
  assert.deepEqual(stats.monthlyChartData.map((item) => item.monthKey), [
    '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03',
  ]);
  assert.equal(stats.monthlyChartData[5].income, 0.1);
  assert.equal(stats.monthlyChartData[5].expense, 200);
  assert.equal(stats.monthlyChartData[5].value, -199.9);
  assert.equal(stats.chartData.length, 3);
  assert.equal(stats.chartData[0].name, '31/10/2025');
  assert.equal(stats.chartData[2].value, 800.1);
});

test('sem lançamentos retorna ponto zero legível, sem inventar histórico', () => {
  const stats = calculateFinancialStats([], new Date('2026-10-20T15:00:00.000Z'));
  assert.equal(stats.balance, 0);
  assert.deepEqual(stats.chartData, [{ date: null, name: 'Sem lançamentos', value: 0, income: 0, expense: 0, description: '' }]);
  assert.equal(stats.monthlyChartData.length, 6);
  assert.equal(stats.monthlyChartData.every((item) => item.income === 0 && item.expense === 0), true);
});
