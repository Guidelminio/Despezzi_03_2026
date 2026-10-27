import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSavingsGoalPlan, validateSavingsGoalInput } from '../src/services/savingsGoalCalculations.ts';

const now = new Date('2026-10-20T15:00:00.000Z');

test('R$ 50.000 em 24 meses exige R$ 2.083,34 mensais após arredondar para cima', () => {
  const validation = validateSavingsGoalInput({
    title: 'Comprar um carro',
    reason: 'Quero ter mais autonomia para me deslocar.',
    targetAmount: 50000,
    amountSaved: 0,
    targetDate: '2028-10-20',
    monthlyContribution: null,
  }, now);
  assert.equal(validation.ok, true);
  assert.equal(validation.value.targetAmountCents, 5_000_000);
  const plan = calculateSavingsGoalPlan(validation.value, now);
  assert.equal(plan.monthsToTarget, 24);
  assert.equal(plan.requiredMonthlyCents, 208_334);
  assert.equal(plan.isOnTrack, null);
});

test('considera o valor já juntado e detecta insuficiência de aporte no prazo', () => {
  const plan = calculateSavingsGoalPlan({
    targetAmountCents: 5_000_000,
    amountSavedCents: 1_000_000,
    targetDate: '2027-10-20',
    monthlyContributionCents: 200_000,
  }, now);
  assert.equal(plan.remainingCents, 4_000_000);
  assert.equal(plan.requiredMonthlyCents, 333_334);
  assert.equal(plan.plannedContributionTotalCents, 2_400_000);
  assert.equal(plan.shortfallCents, 1_600_000);
  assert.equal(plan.isOnTrack, false);
});

test('com aporte e sem prazo estima o mês de conclusão', () => {
  const plan = calculateSavingsGoalPlan({
    targetAmountCents: 5_000_000,
    amountSavedCents: 0,
    targetDate: null,
    monthlyContributionCents: 400_000,
  }, now);
  assert.equal(plan.monthsToTarget, 13);
  assert.equal(plan.estimatedCompletionMonth, '2027-11');
});

test('objetivo concluído não gera aporte mensal adicional', () => {
  const plan = calculateSavingsGoalPlan({
    targetAmountCents: 100_000,
    amountSavedCents: 100_000,
    targetDate: null,
    monthlyContributionCents: 5000,
  }, now);
  assert.equal(plan.isComplete, true);
  assert.equal(plan.remainingCents, 0);
  assert.equal(plan.requiredMonthlyCents, 0);
});

test('valida texto, dinheiro, prazo e exige prazo ou aporte', () => {
  const base = { title: 'Reserva', reason: 'Segurança familiar.', targetAmount: 1000, amountSaved: 0, targetDate: null, monthlyContribution: 100 };
  assert.equal(validateSavingsGoalInput(base, now).ok, true);
  assert.equal(validateSavingsGoalInput({ ...base, reason: '' }, now).ok, false);
  assert.equal(validateSavingsGoalInput({ ...base, targetAmount: -1 }, now).ok, false);
  assert.equal(validateSavingsGoalInput({ ...base, targetDate: '2026-02-30' }, now).ok, false);
  assert.equal(validateSavingsGoalInput({ ...base, targetDate: null, monthlyContribution: null }, now).ok, false);
  assert.equal(validateSavingsGoalInput({ ...base, targetDate: '2026-10-19' }, now).ok, false);
});
