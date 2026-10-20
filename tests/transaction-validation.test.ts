import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTransactionInput } from '../src/services/transactionValidation.ts';

const valid = {
  type: 'expense',
  amount: 25.99,
  description: 'Mercado',
  date: '2026-10-19',
  category: 'alimentacao',
  payment_method: 'pix',
};

test('aceita lançamento válido e força estado concluído', () => {
  const result = validateTransactionInput({ ...valid, status: 'pending' });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.status, 'completed');
});

test('rejeita dinheiro negativo, precisão indevida, datas e categorias inválidas', () => {
  assert.equal(validateTransactionInput({ ...valid, amount: -1 }).ok, false);
  assert.equal(validateTransactionInput({ ...valid, amount: 1.234 }).ok, false);
  assert.equal(validateTransactionInput({ ...valid, date: '2026-02-30' }).ok, false);
  assert.equal(validateTransactionInput({ ...valid, category: 'salario' }).ok, false);
  assert.equal(validateTransactionInput({ ...valid, payment_method: 'crypto' }).ok, false);
  assert.equal(validateTransactionInput({ ...valid, description: '   ' }).ok, false);
});

test('usa dinheiro como forma padrão somente quando o método não foi enviado', () => {
  const result = validateTransactionInput({ ...valid, payment_method: undefined });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.payment_method, 'cash');
});
