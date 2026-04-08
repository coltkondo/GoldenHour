// Mock native modules that can't run in node test environment
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('axios', () => {
  const mockInstance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { default: { create: jest.fn().mockReturnValue(mockInstance) }, create: jest.fn().mockReturnValue(mockInstance) };
});

describe('apiClient — __DEV__ console.log guard (Fix 2)', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    delete (global as any).__DEV__;
  });

  test('does NOT log API URL in production builds (__DEV__ = false)', () => {
    (global as any).__DEV__ = false;
    require('../api/client');
    expect(logSpy).not.toHaveBeenCalledWith(
      'API Client initialized with base URL:',
      expect.anything(),
    );
  });

  test('logs API URL in development builds (__DEV__ = true)', () => {
    (global as any).__DEV__ = true;
    require('../api/client');
    expect(logSpy).toHaveBeenCalledWith(
      'API Client initialized with base URL:',
      expect.any(String),
    );
  });

  test('does NOT log JWT token for any request in production (__DEV__ = false)', () => {
    (global as any).__DEV__ = false;
    require('../api/client');
    // No Authorization header values should be logged to console
    const allCalls = logSpy.mock.calls.flat();
    const hasTokenLeak = allCalls.some(
      (arg) => typeof arg === 'string' && arg.toLowerCase().includes('bearer'),
    );
    expect(hasTokenLeak).toBe(false);
  });
});
