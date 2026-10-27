import { isValidCategory, PAYMENT_METHODS } from '../data/categories.ts';
import { isIsoDate } from '../utils/financialDates.ts';

export interface ValidatedTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  category: string;
  payment_method: string;
  status: 'completed';
}

export type TransactionValidationResult =
  | { ok: true; value: ValidatedTransactionInput }
  | { ok: false; error: string };

export function validateTransactionInput(input: unknown): TransactionValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Dados da transação inválidos.' };
  }
  const body = input as Record<string, unknown>;
  const type = body.type;
  const amount = body.amount;
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const date = body.date;
  const category = body.category;
  const paymentMethod = body.payment_method;

  if (type !== 'income' && type !== 'expense') {
    return { ok: false, error: 'Tipo de transação inválido.' };
  }
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 1_000_000_000 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7
  ) {
    return { ok: false, error: 'O valor deve ser positivo e ter no máximo duas casas decimais.' };
  }
  if (description.length < 1 || description.length > 120) {
    return { ok: false, error: 'A descrição deve ter entre 1 e 120 caracteres.' };
  }
  if (!isIsoDate(date)) return { ok: false, error: 'A data deve ser válida.' };
  if (typeof category !== 'string' || !isValidCategory(type, category)) {
    return { ok: false, error: 'Categoria incompatível com o tipo da transação.' };
  }
  const allowedPaymentMethods = new Set<string>(PAYMENT_METHODS.map((method) => method.id));
  if (paymentMethod !== undefined && paymentMethod !== null && (typeof paymentMethod !== 'string' || !allowedPaymentMethods.has(paymentMethod))) {
    return { ok: false, error: 'Forma de pagamento inválida.' };
  }

  return {
    ok: true,
    value: {
      type,
      amount,
      description,
      date,
      category,
      payment_method: typeof paymentMethod === 'string' ? paymentMethod : 'cash',
      // O protótipo só permite lançar operações concluídas; estados pendentes não entram no saldo.
      status: 'completed',
    },
  };
}
