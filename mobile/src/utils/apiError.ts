// Turn an API error into a message that's always safe to render.
//
// FastAPI returns `detail` in different shapes:
//   - HTTPException      → "Email already registered"            (string)
//   - request validation → [{ loc, msg, type, ... }, ...]         (array, 422)
//   - custom handlers    → { message: "..." } or anything else    (object)
// Rendering an array/object inside <Text> crashes the screen ("Objects are not
// valid as a React child"), and Alert.alert() requires strings on iOS. Every
// `err.response?.data?.detail` should go through this.

const PYDANTIC_PREFIX = /^Value error,\s*/i;

function cleanMsg(msg: string): string {
  return msg.replace(PYDANTIC_PREFIX, '').trim();
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as any)?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => (typeof d === 'string' ? d : typeof d?.msg === 'string' ? d.msg : null))
      .filter((m): m is string => !!m && !!m.trim())
      .map(cleanMsg);
    const unique = Array.from(new Set(msgs));
    if (unique.length) return unique.join('\n');
  }

  if (detail && typeof detail === 'object') {
    const m = (detail as any).message ?? (detail as any).msg;
    if (typeof m === 'string' && m.trim()) return cleanMsg(m);
  }

  return fallback;
}
