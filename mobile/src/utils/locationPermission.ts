// Location permission flow with an Apple-style "pre-alert" explainer.
//
// Apple HIG / App Review guidance: a custom screen shown before the system
// permission alert must explain the benefit, have exactly one action, and
// that action must present the system alert (no "Not now" that skips it).
// It should only appear when the system alert is actually about to appear.
//
// Pure, with its dependencies injected, so it's unit-testable without expo.

export interface PermissionLike {
  status: string; // 'granted' | 'denied' | 'undetermined'
  canAskAgain?: boolean;
}

export interface EnsurePermissionDeps<T extends PermissionLike> {
  getStatus: () => Promise<T>;
  request: () => Promise<T>;
  /** Show the explainer; resolve when the user taps its single Continue button. */
  showExplainer: () => Promise<void>;
}

/** True when asking now would show the OS permission dialog. */
export function willShowSystemPrompt(p: PermissionLike): boolean {
  return p.status !== 'granted' && p.canAskAgain !== false;
}

/**
 * Returns the final permission. Shows the explainer first only if the OS
 * dialog is about to appear; already-granted or permanently-denied users go
 * straight through (iOS never re-shows the dialog after a denial).
 */
export async function ensurePermission<T extends PermissionLike>(
  deps: EnsurePermissionDeps<T>,
): Promise<T> {
  const current = await deps.getStatus();
  if (current.status === 'granted') return current;
  if (!willShowSystemPrompt(current)) return current;
  await deps.showExplainer();
  return deps.request();
}
