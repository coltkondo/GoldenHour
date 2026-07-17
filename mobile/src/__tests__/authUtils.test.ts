import { parseStoredUser } from '../utils/authUtils';
import type { AuthUser } from '../types/api';

const VALID_USER: AuthUser = {
  id: 'u1',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
  points_balance: 150,
  market_slug: null,
  created_at: '2025-01-01T00:00:00Z',
};

describe('parseStoredUser', () => {
  test('returns null for null input', () => {
    expect(parseStoredUser(null)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(parseStoredUser('')).toBeNull();
  });

  test('returns null for invalid JSON (corrupted storage)', () => {
    expect(parseStoredUser('not-json')).toBeNull();
  });

  test('returns null for truncated JSON (corrupted storage)', () => {
    expect(parseStoredUser('{"id":"u1","username":')).toBeNull();
  });

  test('returns null for JSON null literal', () => {
    expect(parseStoredUser('null')).toBeNull();
  });

  test('parses a valid AuthUser object', () => {
    const result = parseStoredUser(JSON.stringify(VALID_USER));
    expect(result).toEqual(VALID_USER);
  });

  test('preserves all AuthUser fields', () => {
    const result = parseStoredUser(JSON.stringify(VALID_USER));
    expect(result?.id).toBe('u1');
    expect(result?.username).toBe('testuser');
    expect(result?.email).toBe('test@example.com');
    expect(result?.role).toBe('user');
    expect(result?.points_balance).toBe(150);
  });

  test('does not throw on any input', () => {
    const inputs = [null, '', '{}', '[]', 'undefined', '{bad json', '"\x00"'];
    for (const input of inputs) {
      expect(() => parseStoredUser(input)).not.toThrow();
    }
  });
});
