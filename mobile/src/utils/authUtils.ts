import { AuthUser } from '../types/api';

/**
 * Safely parse a JSON string from AsyncStorage into an AuthUser.
 * Returns null if the value is absent or cannot be parsed (corrupted storage).
 */
export function parseStoredUser(raw: string | null): AuthUser | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
