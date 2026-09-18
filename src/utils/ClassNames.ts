/**
 * `cl` — conditionally join classNames into a single string.
 *
 * Inlined (ESM, zero-dependency) replacement for the external `classnames` CJS
 * package. Keeping this out of `node_modules` matters for standalone linked apps:
 * their Vite build serves `@_linked/*` as native ESM, and a bare CJS module like
 * `classnames` has no ESM `default` export there (it needed an `optimizeDeps`
 * interop hack). Same API as `classnames`: strings/numbers pass through, arrays
 * recurse, and plain objects contribute each key whose value is truthy.
 */
type ClassValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | ClassValue[]
  | {[key: string]: any};

const hasOwn = Object.prototype.hasOwnProperty;

function parseValue(arg: ClassValue): string {
  if (typeof arg === 'string' || typeof arg === 'number') return String(arg);
  if (typeof arg !== 'object' || arg === null) return '';
  if (Array.isArray(arg)) return cl(...arg);
  // Objects with a custom `toString` (e.g. a CSS-module proxy) stringify directly;
  // plain objects contribute their truthy keys.
  if (
    arg.toString !== Object.prototype.toString &&
    !arg.toString.toString().includes('[native code]')
  ) {
    return arg.toString();
  }
  let out = '';
  for (const key in arg) {
    if (hasOwn.call(arg, key) && (arg as any)[key]) {
      out = out ? out + ' ' + key : key;
    }
  }
  return out;
}

export function cl(...args: ClassValue[]): string {
  let out = '';
  for (const arg of args) {
    if (!arg) continue;
    const parsed = parseValue(arg);
    if (parsed) out = out ? out + ' ' + parsed : parsed;
  }
  return out;
}

export default cl;
