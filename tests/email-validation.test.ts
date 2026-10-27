import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmailAddress } from '../src/utils/emailValidation.ts';

test('accepts ordinary mailbox addresses', () => {
  assert.equal(isValidEmailAddress('ana.silva+demo@example.com'), true);
  assert.equal(isValidEmailAddress('user@subdomain.example.org'), true);
});

test('rejects structured recipient lists and header injection characters', () => {
  for (const value of [
    'user@example.com,attacker@example.net',
    'user@example.com;attacker@example.net',
    'user@example.com\r\nBcc: attacker@example.net',
    'Name <user@example.com>',
    '"quoted"@example.com',
  ]) {
    assert.equal(isValidEmailAddress(value), false, value);
  }
});

test('rejects malformed and oversized addresses', () => {
  assert.equal(isValidEmailAddress('a..b@example.com'), false);
  assert.equal(isValidEmailAddress('.ab@example.com'), false);
  assert.equal(isValidEmailAddress(`a${'b'.repeat(255)}@example.com`), false);
  assert.equal(isValidEmailAddress(null), false);
});
