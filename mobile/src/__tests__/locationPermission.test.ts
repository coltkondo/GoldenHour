import { ensurePermission, willShowSystemPrompt } from '../utils/locationPermission';

function deps(initial: { status: string; canAskAgain?: boolean }, after = { status: 'granted' }) {
  const calls: string[] = [];
  return {
    calls,
    d: {
      getStatus: jest.fn(async () => {
        calls.push('getStatus');
        return initial;
      }),
      request: jest.fn(async () => {
        calls.push('request');
        return after;
      }),
      showExplainer: jest.fn(async () => {
        calls.push('explainer');
      }),
    },
  };
}

describe('willShowSystemPrompt', () => {
  test('undetermined → yes', () => {
    expect(willShowSystemPrompt({ status: 'undetermined', canAskAgain: true })).toBe(true);
  });
  test('granted → no', () => {
    expect(willShowSystemPrompt({ status: 'granted', canAskAgain: true })).toBe(false);
  });
  test('denied and cannot ask again (iOS after a denial) → no', () => {
    expect(willShowSystemPrompt({ status: 'denied', canAskAgain: false })).toBe(false);
  });
  test('denied but can ask again (Android) → yes', () => {
    expect(willShowSystemPrompt({ status: 'denied', canAskAgain: true })).toBe(true);
  });
});

describe('ensurePermission', () => {
  test('first ask: explainer BEFORE the system request', async () => {
    const { d, calls } = deps({ status: 'undetermined', canAskAgain: true });
    const result = await ensurePermission(d);
    expect(calls).toEqual(['getStatus', 'explainer', 'request']);
    expect(result.status).toBe('granted');
  });

  test('already granted: no explainer, no request', async () => {
    const { d, calls } = deps({ status: 'granted', canAskAgain: true });
    const result = await ensurePermission(d);
    expect(calls).toEqual(['getStatus']);
    expect(result.status).toBe('granted');
  });

  test('previously denied on iOS: no explainer, returns denied without nagging', async () => {
    const { d, calls } = deps({ status: 'denied', canAskAgain: false });
    const result = await ensurePermission(d);
    expect(calls).toEqual(['getStatus']);
    expect(result.status).toBe('denied');
  });

  test('user denies at the system dialog: result is denied', async () => {
    const { d } = deps({ status: 'undetermined', canAskAgain: true }, { status: 'denied' });
    expect((await ensurePermission(d)).status).toBe('denied');
  });

  test('request waits for the explainer to be dismissed', async () => {
    let dismiss!: () => void;
    const { d } = deps({ status: 'undetermined', canAskAgain: true });
    d.showExplainer.mockImplementation(() => new Promise<void>((r) => (dismiss = r)));
    const p = ensurePermission(d);
    await new Promise((r) => setTimeout(r, 0));
    expect(d.request).not.toHaveBeenCalled();
    dismiss();
    await p;
    expect(d.request).toHaveBeenCalledTimes(1);
  });
});
