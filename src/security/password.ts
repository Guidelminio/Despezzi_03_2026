import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { ScryptOptions } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_COST = 16_384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_OPTIONS: ScryptOptions = {
  N: SCRYPT_COST,
  r: SCRYPT_BLOCK_SIZE,
  p: SCRYPT_PARALLELIZATION,
  maxmem: 64 * 1024 * 1024,
};

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) return reject(error);
      resolve(key as Buffer);
    });
  });
}

export function isScryptPasswordHash(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^scrypt\$v1\$16384\$8\$1\$[a-f0-9]{32}\$[a-f0-9]{128}$/i.test(value)
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt);
  return [
    'scrypt',
    'v1',
    String(SCRYPT_COST),
    String(SCRYPT_BLOCK_SIZE),
    String(SCRYPT_PARALLELIZATION),
    salt.toString('hex'),
    derivedKey.toString('hex'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  if (!isScryptPasswordHash(encodedHash)) return false;

  const parts = encodedHash.split('$');
  const salt = Buffer.from(parts[5], 'hex');
  const expectedKey = Buffer.from(parts[6], 'hex');
  const actualKey = await deriveKey(password, salt);

  return expectedKey.length === actualKey.length && timingSafeEqual(expectedKey, actualKey);
}

/** Compatibilidade transitória: usa apenas durante a migração de senhas legadas. */
export function verifyLegacyPassword(password: string, legacyValue: string): boolean {
  const candidateDigest = createHash('sha256').update(password, 'utf8').digest();
  const storedDigest = createHash('sha256').update(legacyValue, 'utf8').digest();
  return timingSafeEqual(candidateDigest, storedDigest);
}
