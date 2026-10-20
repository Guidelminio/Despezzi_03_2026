import {
  formatMonthKey,
  isIsoDate,
  monthKeyInTimeZone,
  monthKeyWithOffset,
  todayIsoDateInTimeZone,
} from '../utils/financialDates.ts';

export interface SavingsGoalValues {
  title: string;
  reason: string;
  targetAmountCents: number;
  amountSavedCents: number;
  targetDate: string | null;
  monthlyContributionCents: number | null;
}

export type SavingsGoalValidationResult =
  | { ok: true; value: SavingsGoalValues }
  | { ok: false; error: string };

function toCents(value: unknown, allowZero: boolean): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if ((!allowZero && value <= 0) || (allowZero && value < 0) || value > 1_000_000_000) return null;
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) return null;
  return Math.round(value * 100);
}

export function validateSavingsGoalInput(
  input: unknown,
  now = new Date(),
  timeZone = 'America/Sao_Paulo',
): SavingsGoalValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Dados do objetivo inválidos.' };
  }
  const body = input as Record<string, unknown>;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const targetAmountCents = toCents(body.targetAmount, false);
  const amountSavedCents = toCents(body.amountSaved ?? 0, true);
  const monthlyContributionCents = body.monthlyContribution == null || body.monthlyContribution === ''
    ? null
    : toCents(body.monthlyContribution, false);
  const targetDate = body.targetDate == null || body.targetDate === '' ? null : body.targetDate;

  if (title.length < 3 || title.length > 80) {
    return { ok: false, error: 'O nome do objetivo deve ter entre 3 e 80 caracteres.' };
  }
  if (reason.length < 1 || reason.length > 500) {
    return { ok: false, error: 'Explique o motivo do objetivo em até 500 caracteres.' };
  }
  if (targetAmountCents === null) {
    return { ok: false, error: 'O valor-alvo deve ser positivo e ter no máximo duas casas decimais.' };
  }
  if (amountSavedCents === null || amountSavedCents > targetAmountCents) {
    return { ok: false, error: 'O valor já juntado deve estar entre zero e o valor-alvo.' };
  }
  if (body.monthlyContribution != null && body.monthlyContribution !== '' && monthlyContributionCents === null) {
    return { ok: false, error: 'O aporte mensal deve ser positivo e ter no máximo duas casas decimais.' };
  }
  if (targetDate !== null) {
    if (!isIsoDate(targetDate)) return { ok: false, error: 'Informe um prazo válido.' };
    if (targetDate < todayIsoDateInTimeZone(now, timeZone)) {
      return { ok: false, error: 'O prazo desejado não pode estar no passado.' };
    }
  }
  if (!targetDate && monthlyContributionCents === null) {
    return { ok: false, error: 'Informe um prazo desejado ou um aporte mensal.' };
  }

  return {
    ok: true,
    value: {
      title,
      reason,
      targetAmountCents,
      amountSavedCents,
      targetDate: targetDate as string | null,
      monthlyContributionCents,
    },
  };
}

export interface SavingsGoalPlan {
  remainingCents: number;
  monthsToTarget: number | null;
  requiredMonthlyCents: number | null;
  estimatedCompletionMonth: string | null;
  plannedContributionTotalCents: number | null;
  shortfallCents: number | null;
  isComplete: boolean;
  isOnTrack: boolean | null;
  insight: string;
}

function monthsUntilTarget(targetDate: string, now: Date, timeZone: string): number {
  const currentMonthKey = monthKeyInTimeZone(now, timeZone);
  const currentYear = Number(currentMonthKey.slice(0, 4));
  const currentMonth = Number(currentMonthKey.slice(5, 7));
  const targetYear = Number(targetDate.slice(0, 4));
  const targetMonth = Number(targetDate.slice(5, 7));
  return Math.max(1, (targetYear - currentYear) * 12 + targetMonth - currentMonth);
}

export function calculateSavingsGoalPlan(
  values: Pick<SavingsGoalValues, 'targetAmountCents' | 'amountSavedCents' | 'targetDate' | 'monthlyContributionCents'>,
  now = new Date(),
  timeZone = 'America/Sao_Paulo',
): SavingsGoalPlan {
  const remainingCents = Math.max(values.targetAmountCents - values.amountSavedCents, 0);
  if (remainingCents === 0) {
    return {
      remainingCents,
      monthsToTarget: 0,
      requiredMonthlyCents: 0,
      estimatedCompletionMonth: null,
      plannedContributionTotalCents: 0,
      shortfallCents: 0,
      isComplete: true,
      isOnTrack: true,
      insight: 'Objetivo alcançado. Você pode atualizá-lo ou criar outro.',
    };
  }

  if (values.targetDate) {
    const months = monthsUntilTarget(values.targetDate, now, timeZone);
    const requiredMonthlyCents = Math.ceil(remainingCents / months);
    if (values.monthlyContributionCents != null) {
      const plannedContributionTotalCents = values.monthlyContributionCents * months;
      const shortfallCents = Math.max(remainingCents - plannedContributionTotalCents, 0);
      const isOnTrack = shortfallCents === 0;
      return {
        remainingCents,
        monthsToTarget: months,
        requiredMonthlyCents,
        estimatedCompletionMonth: null,
        plannedContributionTotalCents,
        shortfallCents,
        isComplete: false,
        isOnTrack,
        insight: isOnTrack
          ? 'Nesse ritmo, o aporte planejado cobre o valor-alvo até o prazo informado.'
          : 'O aporte informado não cobre o objetivo no prazo. Considere aumentar o valor mensal ou ampliar o prazo.',
      };
    }
    return {
      remainingCents,
      monthsToTarget: months,
      requiredMonthlyCents,
      estimatedCompletionMonth: null,
      plannedContributionTotalCents: null,
      shortfallCents: null,
      isComplete: false,
      isOnTrack: null,
      insight: 'Para chegar ao prazo informado, reserve o aporte mensal necessário em todos os meses restantes.',
    };
  }

  const contribution = values.monthlyContributionCents ?? 0;
  const months = Math.ceil(remainingCents / contribution);
  const currentMonthKey = monthKeyInTimeZone(now, timeZone);
  const estimatedCompletionMonth = monthKeyWithOffset(currentMonthKey, -months);
  return {
    remainingCents,
    monthsToTarget: months,
    requiredMonthlyCents: null,
    estimatedCompletionMonth,
    plannedContributionTotalCents: contribution * months,
    shortfallCents: 0,
    isComplete: false,
    isOnTrack: true,
    insight: `Mantendo esse aporte, a previsão é concluir em cerca de ${months} ${months === 1 ? 'mês' : 'meses'} (${formatMonthKey(estimatedCompletionMonth)}).`,
  };
}
