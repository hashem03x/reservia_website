/**
 * Visual-editor element identity (build time). Gives every element of the EXISTING React
 * components a stable editor id, so the dashboard's Visual Editor can select it on the real
 * website and the saved overrides can be applied back to exactly that element.
 *
 * For each source file under src/ (except the editor runtime itself) this transform adds:
 *   - `data-ed="<owner>/<Component>.<n>[@<i>[.<j>]]"` to every DOM element (lowercase JSX tags,
 *     framer-motion `motion.*`, react-router `Link`/`NavLink`, which render DOM elements);
 *   - `__edk="<owner>/<Component>.<n>..."` to every element of the site's OWN components (imported
 *     from a relative path or declared in the same file), and makes the component read it back as
 *     its owner prefix.
 *
 * So an id is the source location of the element plus the chain of component usages that rendered
 * it: the `Container` inside the home hero and the one inside the footer get different ids, and the
 * third card of a `.map()` list gets `...@2` (the map index - the plugin adds an index parameter
 * when the callback has none). Ids depend only on the source code, never on the DOM at runtime,
 * and are identical in the prerendered HTML and in the browser. Editing a component's source can
 * shift its ordinals; the editor reports overrides whose element no longer exists.
 *
 * Nothing else about the code changes: no wrapper elements, no extra DOM nodes.
 */
import ts from 'typescript';
import type { Plugin } from 'vite';

const SKIP_TAGS = new Set(['title', 'meta', 'link', 'script', 'style', 'html', 'head', 'body', 'base', 'noscript', 'template']);
const SKIP_SUBTREE_COMPONENTS = new Set(['Helmet']);
const ROUTER_DOM_COMPONENTS = new Set(['Link', 'NavLink']);
/** Files whose component usages carry no owner prefix (the app shell), keeping ids short. */
const ROOT_FILES = /(?:^|\/)(App|Shell|main|entry-server)\.tsx$/;
const EXCLUDE = /(?:^|\/)src\/editor\/|\.test\.tsx?$/;

interface Edit {
  pos: number;
  text: string;
}

interface CompCtx {
  name: string;
  /** JS expression evaluating to the owner prefix ('' or 'X/Y.3'). */
  owner: string;
  counter: number;
  /** Deferred edit that makes the component read `__edk` (applied only when used). */
  injectOwner: Edit | null;
  used: boolean;
}

interface MapCtx {
  indexName: string;
  inject: Edit[] | null;
  used: boolean;
}

const isCapital = (s: string) => /^[A-Z]/.test(s);

export function instrument(code: string, fileId: string): string | null {
  const file = fileId.replace(/\\/g, '/');
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const base = (file.split('/').pop() || 'x').replace(/\.[^.]+$/, '');
  const rootFile = ROOT_FILES.test(file);

  // Which identifiers are the site's own components (relative imports or local declarations) and
  // which come from react-router.
  const own = new Set<string>();
  const router = new Set<string>();
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.importClause) {
      const spec = st.moduleSpecifier.text;
      const names: string[] = [];
      if (st.importClause.name) names.push(st.importClause.name.text);
      const nb = st.importClause.namedBindings;
      if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) names.push(el.name.text);
      if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('@/')) names.filter(isCapital).forEach((n) => own.add(n));
      if (spec === 'react-router-dom' || spec === 'react-router') names.filter((n) => ROUTER_DOM_COMPONENTS.has(n)).forEach((n) => router.add(n));
    }
    if (ts.isFunctionDeclaration(st) && st.name && isCapital(st.name.text)) own.add(st.name.text);
    if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && isCapital(d.name.text)) own.add(d.name.text);
  }

  const edits: Edit[] = [];
  const comps: CompCtx[] = [];
  const maps: MapCtx[] = [];
  let mapDepth = 0;

  function componentName(fn: ts.FunctionLikeDeclaration): string | null {
    if ((ts.isFunctionDeclaration(fn) || ts.isFunctionExpression(fn)) && fn.name && isCapital(fn.name.text)) return fn.name.text;
    if (ts.isFunctionDeclaration(fn) && !fn.name && fn.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) return isCapital(base) ? base : null;
    let p: ts.Node = fn.parent;
    // const X = memo(function ...) / forwardRef((props, ref) => ...)
    while (p && ts.isCallExpression(p)) p = p.parent;
    if (p && ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && isCapital(p.name.text)) return p.name.text;
    if (p && ts.isExportAssignment(p)) return isCapital(base) ? base : null;
    return null;
  }

  function ownerSetup(fn: ts.FunctionLikeDeclaration): { owner: string; inject: Edit | null } {
    const p0 = fn.parameters[0];
    if (!p0) {
      const open = fn.parameters.pos; // position right after "("
      const hasParens = code[open - 1] === '(';
      return { owner: '__edo', inject: hasParens ? { pos: open, text: '{ __edk: __edo = "" } = {}' } : null };
    }
    if (ts.isObjectBindingPattern(p0.name)) {
      const els = p0.name.elements;
      const hasRest = els.some((e) => !!e.dotDotDotToken);
      if (hasRest) {
        // insert before the rest element so __edk never reaches the DOM through it
        const rest = els.find((e) => !!e.dotDotDotToken)!;
        return { owner: '__edo', inject: { pos: rest.getStart(sf), text: '__edk: __edo = "", ' } };
      }
      const last = els[els.length - 1];
      // `{ a, b }` -> `{ a, b, __edk: __edo = "" }` (a trailing comma after b stays valid)
      if (last) return { owner: '__edo', inject: { pos: last.end, text: ', __edk: __edo = ""' } };
      return { owner: '__edo', inject: { pos: p0.name.getStart(sf) + 1, text: ' __edk: __edo = "" ' } };
    }
    if (ts.isIdentifier(p0.name)) {
      const n = p0.name.text;
      return { owner: `((${n} && ${n}.__edk) || "")`, inject: null };
    }
    return { owner: '""', inject: null };
  }

  function mapIndexFor(fn: ts.ArrowFunction | ts.FunctionExpression): MapCtx {
    const p1 = fn.parameters[1];
    if (p1 && ts.isIdentifier(p1.name)) return { indexName: p1.name.text, inject: null, used: false };
    const name = `__edi${mapDepth}`;
    const ps = fn.parameters;
    if (ps.length === 0) {
      return { indexName: name, inject: [{ pos: ps.pos, text: `_${name}, ${name}` }], used: false };
    }
    const p0 = ps[0];
    const parens = ts.isArrowFunction(fn) ? code.slice(fn.getStart(sf), p0.getStart(sf)).includes('(') : true;
    if (!parens) return { indexName: name, inject: [{ pos: p0.getStart(sf), text: '(' }, { pos: p0.end, text: `, ${name})` }], used: false };
    return { indexName: name, inject: [{ pos: p0.end, text: `, ${name}` }], used: false };
  }

  function idExpr(comp: CompCtx | undefined, ordinal: string): string {
    const owner = comp ? comp.owner : '""';
    const ownerPart = owner === '""' ? '' : `(${owner} ? ${owner} + "/" : "") + `;
    const idx = maps.map((m) => {
      m.used = true;
      return m.indexName;
    });
    const inst = idx.length ? ` + "@" + ${idx.join(' + "." + ')}` : '';
    return `{${ownerPart}${JSON.stringify(ordinal)}${inst}}`;
  }

  function tagInfo(tag: ts.JsxTagNameExpression): { kind: 'dom' | 'own' | 'skip' | 'skipTree'; name: string } {
    if (ts.isIdentifier(tag)) {
      const n = tag.text;
      if (!isCapital(n)) return { kind: SKIP_TAGS.has(n) ? 'skip' : 'dom', name: n };
      if (SKIP_SUBTREE_COMPONENTS.has(n)) return { kind: 'skipTree', name: n };
      if (router.has(n)) return { kind: 'dom', name: n };
      if (own.has(n)) return { kind: 'own', name: n };
      return { kind: 'skip', name: n };
    }
    if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression) && tag.expression.text === 'motion') return { kind: 'dom', name: tag.name.text };
    return { kind: 'skip', name: '' };
  }

  const hasAttr = (attrs: ts.JsxAttributes, name: string) => attrs.properties.some((p) => ts.isJsxAttribute(p) && ts.isIdentifier(p.name) && p.name.text === name);

  function visit(node: ts.Node, skip: boolean) {
    // components: functions that render JSX get an owner prefix
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      const fn = node as ts.FunctionLikeDeclaration;
      // map/flatMap callbacks: instance index
      const parent = node.parent;
      const isMapCb =
        (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
        parent &&
        ts.isCallExpression(parent) &&
        parent.arguments[0] === node &&
        ts.isPropertyAccessExpression(parent.expression) &&
        ['map', 'flatMap'].includes(parent.expression.name.text);
      const name = componentName(fn);
      if (name) {
        const { owner, inject } = ownerSetup(fn);
        const ctx: CompCtx = { name, owner, counter: 0, injectOwner: inject, used: false };
        comps.push(ctx);
        const savedMaps = maps.splice(0, maps.length);
        const savedDepth = mapDepth;
        mapDepth = 0;
        ts.forEachChild(node, (c) => visit(c, skip));
        maps.push(...savedMaps);
        mapDepth = savedDepth;
        comps.pop();
        if (ctx.used && ctx.injectOwner && ctx.owner === '__edo') edits.push(ctx.injectOwner);
        return;
      }
      if (isMapCb) {
        const m = mapIndexFor(node as ts.ArrowFunction | ts.FunctionExpression);
        maps.push(m);
        mapDepth++;
        ts.forEachChild(node, (c) => visit(c, skip));
        mapDepth--;
        maps.pop();
        if (m.used && m.inject) edits.push(...m.inject);
        return;
      }
    }

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      const info = tagInfo(opening.tagName);
      let childSkip = skip;
      if (info.kind === 'skipTree') childSkip = true;
      if (hasAttr(opening.attributes, 'data-ed-skip')) childSkip = true;
      if (!skip && !childSkip && (info.kind === 'dom' || (info.kind === 'own' && !rootFile)) && !hasAttr(opening.attributes, 'data-ed') && !hasAttr(opening.attributes, '__edk')) {
        const comp = comps[comps.length - 1];
        const compName = comp ? comp.name : base;
        const ordinal = `${compName}.${comp ? ++comp.counter : 0}`;
        if (comp) comp.used = true;
        const attr = info.kind === 'dom' ? 'data-ed' : '__edk';
        const insertAt = opening.typeArguments ? opening.typeArguments.end + 1 : opening.tagName.end;
        edits.push({ pos: insertAt, text: ` ${attr}=${idExpr(comp, ordinal)}` });
      }
      // SVG internals are presentation details: the <svg> itself is the editable element.
      if (info.kind === 'dom' && info.name === 'svg') childSkip = true;
      ts.forEachChild(node, (c) => visit(c, childSkip));
      return;
    }
    ts.forEachChild(node, (c) => visit(c, skip));
  }

  visit(sf, false);
  if (!edits.length) return null;
  edits.sort((a, b) => b.pos - a.pos);
  let out = code;
  for (const e of edits) out = out.slice(0, e.pos) + e.text + out.slice(e.pos);
  return out;
}

/** The Vite plugin: runs before React's JSX transform on the site's own .tsx files. */
export function editorIds(): Plugin {
  return {
    name: 'reservia-editor-ids',
    enforce: 'pre',
    transform(code, id) {
      const file = id.split('?')[0].replace(/\\/g, '/');
      if (!file.endsWith('.tsx') || file.includes('/node_modules/') || !file.includes('/src/') || EXCLUDE.test(file)) return null;
      const out = instrument(code, file);
      return out ? { code: out, map: null } : null;
    },
  };
}
