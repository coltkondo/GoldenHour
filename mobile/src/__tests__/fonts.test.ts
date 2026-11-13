import { BODY_FONTS, DISPLAY_FONT, normalizeWeight, resolveFont } from '../theme/fonts';

describe('normalizeWeight', () => {
  test('maps keywords and numeric strings', () => {
    expect(normalizeWeight('normal')).toBe(400);
    expect(normalizeWeight('bold')).toBe(700);
    expect(normalizeWeight('800')).toBe(800);
    expect(normalizeWeight(600 as any)).toBe(600);
    expect(normalizeWeight(undefined)).toBeUndefined();
  });
});

describe('resolveFont', () => {
  test('big bold headings get the display face', () => {
    expect(resolveFont({ fontSize: 28, fontWeight: '800' }).fontFamily).toBe(DISPLAY_FONT);
    expect(resolveFont({ fontSize: 22, fontWeight: '700' }).fontFamily).toBe(DISPLAY_FONT);
  });

  test('big but light text stays body', () => {
    expect(resolveFont({ fontSize: 28, fontWeight: '400' }).fontFamily).toBe(BODY_FONTS[400]);
  });

  test('small bold text stays body at the matching weight', () => {
    expect(resolveFont({ fontSize: 16, fontWeight: '700' }).fontFamily).toBe(BODY_FONTS[700]);
    expect(resolveFont({ fontSize: 13, fontWeight: '600' }).fontFamily).toBe(BODY_FONTS[600]);
  });

  test('no style → regular body', () => {
    expect(resolveFont(undefined).fontFamily).toBe(BODY_FONTS[400]);
  });

  test('odd weights snap to the nearest available file', () => {
    expect(resolveFont({ fontWeight: '100' }).fontFamily).toBe(BODY_FONTS[300]);
  });

  test('always clears fontWeight so Android does not faux-bold the family', () => {
    const out = resolveFont({ fontSize: 14, fontWeight: '700' });
    expect('fontWeight' in out).toBe(true);
    expect(out.fontWeight).toBeUndefined();
  });

  test('explicit fontFamily wins', () => {
    expect(resolveFont({ fontFamily: 'Menlo', fontSize: 30, fontWeight: '900' })).toEqual({});
  });

  test('nested text without its own weight inherits from the parent', () => {
    expect(resolveFont({ color: 'red' }, true)).toEqual({});
    expect(resolveFont({ fontWeight: '700' }, true).fontFamily).toBe(BODY_FONTS[700]);
  });

  test('display face drops negative tracking but keeps positive', () => {
    expect(
      resolveFont({ fontSize: 40, fontWeight: '900', letterSpacing: -1.5 }).letterSpacing,
    ).toBe(0);
    expect(resolveFont({ fontSize: 40, fontWeight: '900', letterSpacing: 1 }).letterSpacing).toBe(
      1,
    );
  });
});
