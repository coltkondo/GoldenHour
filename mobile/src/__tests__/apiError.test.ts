import { apiErrorMessage } from '../utils/apiError';

const err = (detail: unknown) => ({ response: { data: { detail } } });
const FALLBACK = 'Something went wrong';

describe('apiErrorMessage', () => {
  test('string detail is returned as-is', () => {
    expect(apiErrorMessage(err('Email already registered'), FALLBACK)).toBe(
      'Email already registered',
    );
  });

  test('FastAPI 422 validation list becomes readable text, never an array', () => {
    const detail = [
      {
        type: 'value_error',
        loc: ['body', 'password'],
        msg: 'Value error, Password must contain at least one special character',
        input: 'Password1',
      },
    ];
    const out = apiErrorMessage(err(detail), FALLBACK);
    expect(typeof out).toBe('string');
    expect(out).toBe('Password must contain at least one special character');
  });

  test('multiple validation errors are joined, duplicates removed', () => {
    const detail = [{ msg: 'A' }, { msg: 'B' }, { msg: 'A' }];
    expect(apiErrorMessage(err(detail), FALLBACK)).toBe('A\nB');
  });

  test('object detail with a message', () => {
    expect(apiErrorMessage(err({ message: 'Nope' }), FALLBACK)).toBe('Nope');
  });

  test('missing, empty, or unrecognized detail → fallback', () => {
    expect(apiErrorMessage(err(undefined), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(err(''), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(err([]), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(err([{ foo: 1 }]), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(err(42), FALLBACK)).toBe(FALLBACK);
  });

  test('network errors (no response) → fallback', () => {
    expect(apiErrorMessage(new Error('Network Error'), FALLBACK)).toBe(FALLBACK);
    expect(apiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });
});
