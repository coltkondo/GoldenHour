/**
 * Tests for Fix 5: Notification toggle must be disabled (coming soon).
 *
 * The bug: the "Happy Hour Alerts" Switch stored local state but did nothing —
 * no push notification registration, no backend call. Beta users who toggled
 * it on would get no notifications and assume the app was broken.
 *
 * The fix: value=false, disabled=true, hint text changed to
 * "Notifications coming soon" so the UI clearly communicates the feature
 * isn't live yet.
 *
 * Test strategy: parse ProfileScreen source to assert the three structural
 * properties that enforce this behaviour — no React component rendering
 * required, and the assertions will fail immediately if the fix is reverted.
 */
import * as fs from 'fs';
import * as path from 'path';

const PROFILE_SCREEN = path.resolve(
  __dirname,
  '../screens/ProfileScreen.tsx',
);

const source = fs.readFileSync(PROFILE_SCREEN, 'utf8');

describe('ProfileScreen — notification toggle disabled (Fix 5)', () => {
  test('Switch value is hardcoded to false (never reflects local state)', () => {
    // Must NOT use a state variable as value — only the literal false is acceptable
    expect(source).toMatch(/value=\{false\}/);
  });

  test('Switch has disabled={true} so users cannot interact with it', () => {
    expect(source).toMatch(/disabled=\{true\}/);
  });

  test('hint text says "Notifications coming soon" not "Active 5pm – 9pm daily"', () => {
    expect(source).toContain('Notifications coming soon');
    expect(source).not.toContain('Active 5pm');
  });

  test('notificationsEnabled state variable is removed (no dead state)', () => {
    expect(source).not.toContain('notificationsEnabled');
    expect(source).not.toContain('setNotificationsEnabled');
  });

  test('onValueChange is not wired to the disabled Switch', () => {
    // A disabled switch with onValueChange is misleading and unnecessary
    const switchBlock = source.match(/<Switch[\s\S]*?\/>/g) ?? [];
    const notifSwitch = switchBlock.find((b) => b.includes('disabled={true}'));
    expect(notifSwitch).toBeDefined();
    expect(notifSwitch).not.toContain('onValueChange');
  });
});
