// Visual editor JSX runtime (vite.config.ts: react({ jsxImportSource: 'reservia-editor' })). Wraps
// React's own automatic runtime; see apply.ts for what it adds.
import { Fragment, jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';
import { applyEditor } from './apply';

type Fn = (type: unknown, props: unknown, key?: unknown, ...rest: unknown[]) => unknown;
const one = reactJsx as unknown as Fn;
const many = reactJsxs as unknown as Fn;

export { Fragment };
export function jsx(type: unknown, props: Record<string, unknown>, key?: unknown) {
  return applyEditor(one, many, type, props, key, []) as ReturnType<typeof reactJsx>;
}
export function jsxs(type: unknown, props: Record<string, unknown>, key?: unknown) {
  return applyEditor(many, many, type, props, key, []) as ReturnType<typeof reactJsxs>;
}
