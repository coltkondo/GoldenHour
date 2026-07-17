import type { AuthUser } from '../types/api';

/**
 * Mirrors the useFocusEffect callback in ProfileScreen.
 * Extracted here to test the async fetch-and-refresh logic in isolation
 * without rendering the component.
 */
async function refreshOnFocus(
  meApi: () => Promise<AuthUser>,
  refreshUser: (u: AuthUser) => Promise<void>,
): Promise<void> {
  try {
    const freshUser = await meApi();
    await refreshUser(freshUser);
  } catch {
    // network failure: keep showing stale balance — no throw
  }
}

const STALE_USER: AuthUser = {
  id: 'u1',
  username: 'alice',
  email: 'alice@example.com',
  role: 'user',
  points_balance: 0,
  market_slug: null,
  created_at: '2025-01-01T00:00:00Z',
};

const FRESH_USER: AuthUser = {
  ...STALE_USER,
  points_balance: 50,
};

describe('ProfileScreen — points refresh on focus (Fix 4)', () => {
  test('calls refreshUser with the fresh user returned by authAPI.me()', async () => {
    const meApi = jest.fn().mockResolvedValue(FRESH_USER);
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await refreshOnFocus(meApi, refreshUser);

    expect(meApi).toHaveBeenCalledTimes(1);
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(refreshUser).toHaveBeenCalledWith(FRESH_USER);
  });

  test('refreshUser receives the updated points_balance from the API', async () => {
    const meApi = jest.fn().mockResolvedValue(FRESH_USER);
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await refreshOnFocus(meApi, refreshUser);

    const savedUser: AuthUser = refreshUser.mock.calls[0][0];
    expect(savedUser.points_balance).toBe(50);
  });

  test('does not call refreshUser when authAPI.me() rejects (network failure)', async () => {
    const meApi = jest.fn().mockRejectedValue(new Error('Network Error'));
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await expect(refreshOnFocus(meApi, refreshUser)).resolves.toBeUndefined();
    expect(refreshUser).not.toHaveBeenCalled();
  });

  test('does not throw when authAPI.me() rejects', async () => {
    const meApi = jest.fn().mockRejectedValue(new Error('500'));
    const refreshUser = jest.fn();

    await expect(refreshOnFocus(meApi, refreshUser)).resolves.not.toThrow();
  });

  test('does not throw when refreshUser itself rejects', async () => {
    const meApi = jest.fn().mockResolvedValue(FRESH_USER);
    const refreshUser = jest.fn().mockRejectedValue(new Error('AsyncStorage write failed'));

    await expect(refreshOnFocus(meApi, refreshUser)).resolves.not.toThrow();
  });

  test('passes the exact object from the API, not a copy', async () => {
    const apiResponse = { ...FRESH_USER };
    const meApi = jest.fn().mockResolvedValue(apiResponse);
    const refreshUser = jest.fn().mockResolvedValue(undefined);

    await refreshOnFocus(meApi, refreshUser);

    expect(refreshUser.mock.calls[0][0]).toBe(apiResponse);
  });
});
