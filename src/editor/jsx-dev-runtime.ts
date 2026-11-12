// Development counterpart of jsx-runtime.ts (the dev server uses React's jsxDEV).
import { Fragment, jsxDEV as reactJsxDEV } from 'react/jsx-dev-runtime';
import { applyEditor } from './apply';

type Fn = (type: unknown, props: unknown, key?: unknown, ...rest: unknown[]) => unknown;
const dev = reactJsxDEV as unknown as Fn;

export { Fragment };
export function jsxDEV(type: unknown, props: Record<string, unknown>, key: unknown, isStatic: boolean, source: unknown, self: unknown) {
  const one: Fn = (t, p, k) => dev(t, p, k, isStatic, source, self);
  const many: Fn = (t, p, k) => dev(t, p, k, true, source, self);
  return applyEditor(one, many, type, props, key, []) as ReturnType<typeof reactJsxDEV>;
}
