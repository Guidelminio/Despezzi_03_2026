import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPtBrCsv } from '../src/utils/csv.ts';
import { formatIsoDate, formatMonthKey, isIsoDate, monthKeyInTimeZone, monthKeyWithOffset } from '../src/utils/financialDates.ts';

test('datas ISO civis são formatadas sem deslocamento UTC', () => {
  assert.equal(isIsoDate('2026-03-31'), true);
  assert.equal(isIsoDate('2026-02-30'), false);
  assert.equal(formatIsoDate('2026-03-31'), '31/03/2026');
  assert.equal(formatIsoDate('2026-02-30'), '2026-02-30');
});

test('competência usa fuso configurado e atravessa corretamente a virada do ano', () => {
  assert.equal(monthKeyInTimeZone(new Date('2026-04-01T02:00:00.000Z')), '2026-03');
  assert.equal(monthKeyWithOffset('2026-03', 5), '2025-10');
  assert.equal(formatMonthKey('2026-03'), 'Mar/2026');
});

test('CSV pt-BR usa BOM, ponto e vírgula e aspas escapadas', () => {
  const csv = buildPtBrCsv([['Nome', 'Valor'], ['A; "B"', 'R$ 1.234,56']]);
  assert.equal(csv, '\uFEFF"Nome";"Valor"\r\n"A; ""B""";"R$ 1.234,56"');
});
