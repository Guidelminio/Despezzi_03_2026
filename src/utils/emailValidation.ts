const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export function isValidEmailAddress(value: unknown): value is string {
  if (typeof value !== 'string' || value.length < 6 || value.length > 254 || value.trim() !== value) {
    return false;
  }

  const separator = value.lastIndexOf('@');
  if (separator < 1 || separator > 64) return false;
  const localPart = value.slice(0, separator);
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) return false;

  return EMAIL_PATTERN.test(value);
}
