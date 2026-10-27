import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, isScryptPasswordHash, verifyLegacyPassword, verifyPassword } from '../src/security/password.ts';
import { isValidPassword } from '../src/utils/passwordPolicy.ts';

test('política de senha aceita frases-senha entre 8 e 128 caracteres', () => {
  assert.equal(isValidPassword('frase senha segura'), true);
  assert.equal(isValidPassword('curta'), false);
  assert.equal(isValidPassword('x'.repeat(129)), false);
  assert.equal(isValidPassword(null), false);
});

test('scrypt gera hashes distintos e só valida a senha correta', async () => {
  const first = await hashPassword('minha frase-senha 2026');
  const second = await hashPassword('minha frase-senha 2026');
  assert.notEqual(first, second, 'salt aleatório deve produzir hashes diferentes');
  assert.equal(isScryptPasswordHash(first), true);
  assert.equal(await verifyPassword('minha frase-senha 2026', first), true);
  assert.equal(await verifyPassword('outra senha', first), false);
  assert.equal(await verifyPassword('minha frase-senha 2026', 'texto em claro'), false);
});

test('comparador legado só aceita igualdade e deve desaparecer após migração', () => {
  assert.equal(verifyLegacyPassword('senha-legada', 'senha-legada'), true);
  assert.equal(verifyLegacyPassword('senha-incorreta', 'senha-legada'), false);
});
