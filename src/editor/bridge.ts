import { visualStore } from './store';
import { cleanVisual, routeKey, STYLE_PROPS, type VisualConfig } from './visual';

/**
 * Visual Editor bridge - runs ONLY inside the dashboard's editor iframe (?__ve=<signed token>).
 * Turns the real, rendered website into an editing canvas:
 *   - hover and selection outlines, with a contextual toolbar (parent, move, hide, delete);
 *   - click to select any element carrying an editor id; double-click to edit text in place;
 *   - drag targets for new elements and for moving an element among its siblings;
 *   - the element tree (layers), element details and the site's design tokens for the dashboard.
 * Links, buttons and forms do not act while editing. All communication is postMessage with the
 * dashboard's exact origin (given by the backend with the draft); messages from anywhere else are
 * ignored. The bridge never evaluates code it receives.
 */

type Msg = { type: string; [k: string]: unknown };

const TEXT_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'small', 'b', 'strong', 'em', 'i', 'label', 'figcaption', 'blockquote', 'dt', 'dd', 'summary', 'a', 'button', 'th', 'td', 'cite', 'q', 'mark', 'u', 'time']);
const SECTION_TAGS = new Set(['section', 'header', 'footer', 'main', 'nav', 'article', 'aside']);

function kindOf(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return 'heading';
  if (tag === 'img' || tag === 'picture') return 'image';
  if (tag === 'svg') return 'icon';
  if (tag === 'video' || tag === 'iframe') return 'video';
  if (tag === 'button' || (tag === 'a' && /\bbtn\b/.test(el.className as string))) return 'button';
  if (tag === 'a') return 'link';
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return 'field';
  if (SECTION_TAGS.has(tag)) return 'section';
  if (TEXT_TAGS.has(tag)) return 'text';
  if (tag === 'ul' || tag === 'ol') return 'list';
  return 'container';
}

/** Text that can be edited in place: only text nodes and line breaks inside. */
function editableText(el: Element): string | null {
  if (el.tagName.toLowerCase() === 'svg' || el.tagName.toLowerCase() === 'img') return null;
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) continue;
    if (n.nodeType === Node.ELEMENT_NODE && (n as Element).tagName === 'BR') continue;
    if (n.nodeType === Node.COMMENT_NODE) continue;
    return null;
  }
  const t = (el as HTMLElement).innerText ?? el.textContent ?? '';
  return t.trim() ? t : el.childNodes.length === 0 && TEXT_TAGS.has(el.tagName.toLowerCase()) ? '' : null;
}

const edOf = (el: Element | null) => (el ? el.getAttribute('data-ed') : null);
const ofId = (id: string) => document.querySelector(`[data-ed="${CSS.escape(id)}"]`);

/** The list-instance generalisation of an id (last instance segment -> '@*'), or null. */
function wildcardOf(id: string): string | null {
  const segs = id.split('/');
  for (let i = segs.length - 1; i >= 0; i--) {
    const m = segs[i].match(/^(.*?)([@~].*)$/);
    if (m) {
      segs[i] = `${m[1]}@*`;
      return segs.join('/');
    }
  }
  return null;
}

function componentOf(id: string) {
  const last = id.split('/').pop() || id;
  return last.replace(/[@~].*$/, '').replace(/\.\d+$/, '').replace(/^ins:.*/, 'Added');
}

function snippet(el: Element) {
  const t = ((el as HTMLElement).innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
  return t.length > 48 ? `${t.slice(0, 47)}…` : t;
}

function visualChildren(el: Element): Element[] {
  const kids = Array.from(el.children).filter((c) => c.hasAttribute('data-ed'));
  return kids
    .map((c, i) => ({ c, i, o: Number(getComputedStyle(c).order) || 0 }))
    .sort((a, b) => a.o - b.o || a.i - b.i)
    .map((x) => x.c);
}

function info(el: Element) {
  const id = edOf(el) as string;
  const cs = getComputedStyle(el);
  const computed: Record<string, string> = {};
  for (const p of STYLE_PROPS) computed[p] = (cs as unknown as Record<string, string>)[p] ?? '';
  const parent = el.parentElement;
  const parentId = parent && parent.hasAttribute('data-ed') ? edOf(parent) : null;
  const wild = wildcardOf(id);
  const instances = wild ? document.querySelectorAll(wildSelector(wild)).length : 1;
  const r = el.getBoundingClientRect();
  const tag = el.tagName.toLowerCase();
  return {
    id,
    tag,
    kind: kindOf(el),
    component: componentOf(id),
    label: snippet(el),
    text: editableText(el),
    attrs: {
      src: (el as HTMLImageElement).currentSrc || el.getAttribute('src') || undefined,
      alt: el.getAttribute('alt') ?? undefined,
      href: el.getAttribute('href') ?? undefined,
      target: el.getAttribute('target') ?? undefined,
    },
    computed,
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    parentId,
    parentDisplay: parent ? getComputedStyle(parent).display : '',
    siblings: parent && parentId ? visualChildren(parent).map((c) => edOf(c)) : [],
    childIds: visualChildren(el).map((c) => edOf(c)),
    wildcard: wild,
    instances,
    global: !!el.closest('header.top, footer, .wa-float, [data-ed-global]'),
    isH1: tag === 'h1',
  };
}

function wildSelector(wild: string) {
  const m = wild.match(/^(.*?)@\*(.*)$/);
  if (!m) return `[data-ed="${CSS.escape(wild)}"]`;
  const end = m[2] ? `[data-ed$="${CSS.escape(m[2])}"]` : '';
  return `[data-ed^="${CSS.escape(m[1])}@"]${end},[data-ed^="${CSS.escape(m[1])}~"]${end}`;
}

function tree() {
  const nodes: Array<{ id: string; parent: string | null; tag: string; kind: string; component: string; label: string; hidden: boolean }> = [];
  const root = document.getElementById('root');
  if (!root) return nodes;
  root.querySelectorAll('[data-ed]').forEach((el) => {
    const id = edOf(el) as string;
    const p = el.parentElement?.closest('[data-ed]');
    const cs = getComputedStyle(el);
    nodes.push({ id, parent: p ? edOf(p) : null, tag: el.tagName.toLowerCase(), kind: kindOf(el), component: componentOf(id), label: snippet(el), hidden: cs.display === 'none' || cs.visibility === 'hidden' });
  });
  return nodes;
}

function tokens() {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const r of Array.from(rules)) {
      if (!(r instanceof CSSStyleRule)) continue;
      const sel = r.selectorText.replace(/\s+/g, '');
      const target = sel === ':root' ? light : sel === ":root[data-theme='dark']" || sel === ':root[data-theme="dark"]' ? dark : null;
      if (!target) continue;
      for (let i = 0; i < r.style.length; i++) {
        const name = r.style[i];
        if (name.startsWith('--')) target[name] = r.style.getPropertyValue(name).trim();
      }
    }
  }
  return { light, dark };
}

export function startBridge(editorOrigin: string) {
  const parentWin = window.parent;
  const post = (m: Msg) => parentWin.postMessage(m, editorOrigin);
  let selected: string | null = null;
  let hovered: string | null = null;
  let editing: HTMLElement | null = null;
  let pending: VisualConfig | null = null;

  // ---------- overlay ----------
  const overlay = document.createElement('div');
  overlay.id = 've-overlay';
  overlay.setAttribute('data-ve-ui', '');
  overlay.innerHTML = `
    <div class="ve-box ve-hover"></div>
    <div class="ve-box ve-sel"><div class="ve-tag"></div>
      <div class="ve-tools">
        <button type="button" data-act="parent" title="Select parent">↖</button>
        <span class="ve-drag" draggable="true" title="Drag to move">⠿</span>
        <button type="button" data-act="up" title="Move earlier">▲</button>
        <button type="button" data-act="down" title="Move later">▼</button>
        <button type="button" data-act="duplicate" title="Duplicate">⧉</button>
        <button type="button" data-act="hide" title="Hide on this device">◌</button>
        <button type="button" data-act="delete" title="Delete">✕</button>
      </div>
    </div>
    <div class="ve-drop"></div>`;
  document.documentElement.appendChild(overlay);
  const hoverBox = overlay.querySelector('.ve-hover') as HTMLElement;
  const selBox = overlay.querySelector('.ve-sel') as HTMLElement;
  const tag = overlay.querySelector('.ve-tag') as HTMLElement;
  const dropLine = overlay.querySelector('.ve-drop') as HTMLElement;
  document.documentElement.classList.add('ve-editing');

  const place = (box: HTMLElement, el: Element | null) => {
    if (!el) {
      box.style.display = 'none';
      return;
    }
    const r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.transform = `translate(${r.x}px, ${r.y}px)`;
    box.style.width = `${Math.max(r.width, 2)}px`;
    box.style.height = `${Math.max(r.height, 2)}px`;
  };
  const refresh = () => {
    place(hoverBox, hovered && hovered !== selected ? ofId(hovered) : null);
    const s = selected ? ofId(selected) : null;
    place(selBox, s);
    if (s) {
      const i = info(s);
      tag.textContent = `${i.component} · ${i.tag}`;
    }
  };
  let raf = 0;
  const loop = () => {
    refresh();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  void raf;

  const select = (id: string | null, notify = true) => {
    selected = id;
    const el = id ? ofId(id) : null;
    if (notify) post({ type: 've:select', info: el ? info(el) : null });
    refresh();
  };
  const target = (e: Event) => {
    const t = e.target as Element | null;
    if (!t || (t as Element).closest?.('[data-ve-ui]')) return null;
    return (t as Element).closest?.('[data-ed]') ?? null;
  };

  // ---------- pointer ----------
  window.addEventListener(
    'mousemove',
    (e) => {
      if (editing) return;
      const el = target(e);
      const id = edOf(el);
      if (id !== hovered) {
        hovered = id;
        post({ type: 've:hover', id });
      }
    },
    true,
  );
  window.addEventListener(
    'click',
    (e) => {
      const ui = (e.target as Element).closest?.('[data-ve-ui] [data-act]');
      if (ui) {
        e.preventDefault();
        e.stopPropagation();
        const act = ui.getAttribute('data-act');
        if (act === 'parent' && selected) {
          const p = ofId(selected)?.parentElement?.closest('[data-ed]');
          if (p) select(edOf(p));
        } else if (selected) post({ type: 've:action', action: act, id: selected });
        return;
      }
      if (editing && editing.contains(e.target as Node)) return;
      const el = target(e);
      e.preventDefault();
      e.stopPropagation();
      if (editing) finishEdit();
      select(edOf(el));
    },
    true,
  );
  window.addEventListener(
    'dblclick',
    (e) => {
      const el = target(e) as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      if (editableText(el) === null) return;
      startEdit(el);
    },
    true,
  );
  for (const ev of ['submit', 'auxclick']) window.addEventListener(ev, (e) => e.preventDefault(), true);
  window.addEventListener(
    'keydown',
    (e) => {
      if (editing) {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          finishEdit();
        }
        return;
      }
      if (e.key === 'Escape') select(null);
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) post({ type: 've:action', action: 'delete', id: selected });
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        post({ type: 've:action', action: e.shiftKey ? 'redo' : 'undo', id: selected });
      }
    },
    true,
  );

  // ---------- inline text ----------
  function startEdit(el: HTMLElement) {
    editing = el;
    select(edOf(el));
    el.setAttribute('contenteditable', 'plaintext-only');
    if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
    el.classList.add('ve-inline');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.addEventListener('input', onInput);
  }
  function onInput() {
    if (editing) post({ type: 've:text', id: edOf(editing), lang: document.documentElement.lang, text: editing.innerText.replace(/\n$/, '') });
  }
  function finishEdit() {
    const el = editing;
    if (!el) return;
    el.removeEventListener('input', onInput);
    el.removeAttribute('contenteditable');
    el.classList.remove('ve-inline');
    editing = null;
    post({ type: 've:textDone', id: edOf(el) });
    if (pending) {
      visualStore.set(pending);
      pending = null;
    }
  }

  // ---------- drag and drop ----------
  let dragMove: string | null = null;
  overlay.querySelector('.ve-drag')?.addEventListener('dragstart', (e) => {
    const de = e as DragEvent;
    dragMove = selected;
    de.dataTransfer?.setData('text/plain', `ve-move:${selected}`);
  });
  const dropTarget = (e: DragEvent) => {
    const el = (document.elementFromPoint(e.clientX, e.clientY) as Element | null)?.closest('[data-ed]');
    if (!el) return null;
    const id = edOf(el) as string;
    const r = el.getBoundingClientRect();
    const parent = el.parentElement;
    const row = parent ? /row/.test(getComputedStyle(parent).flexDirection) && getComputedStyle(parent).display.includes('flex') : false;
    const inside = id.startsWith('ins:') && el.classList.contains('ve-box');
    const pos: 'before' | 'after' | 'inside' = inside && e.clientY > r.y + r.height * 0.25 && e.clientY < r.y + r.height * 0.75 ? 'inside' : (row ? e.clientX < r.x + r.width / 2 : e.clientY < r.y + r.height / 2) ? 'before' : 'after';
    if (dragMove) {
      const moving = ofId(dragMove);
      if (!moving || moving.parentElement !== el.parentElement || id === dragMove) return null;
    }
    return { el, id, pos, row, r };
  };
  window.addEventListener(
    'dragover',
    (e) => {
      const t = dropTarget(e);
      if (!t) {
        dropLine.style.display = 'none';
        return;
      }
      e.preventDefault();
      const { r, pos, row } = t;
      dropLine.style.display = 'block';
      if (pos === 'inside') {
        dropLine.style.transform = `translate(${r.x}px, ${r.y}px)`;
        dropLine.style.width = `${r.width}px`;
        dropLine.style.height = `${r.height}px`;
        dropLine.className = 've-drop ve-drop-inside';
      } else if (row) {
        dropLine.style.transform = `translate(${pos === 'before' ? r.x - 2 : r.right - 2}px, ${r.y}px)`;
        dropLine.style.width = '4px';
        dropLine.style.height = `${r.height}px`;
        dropLine.className = 've-drop';
      } else {
        dropLine.style.transform = `translate(${r.x}px, ${pos === 'before' ? r.y - 2 : r.bottom - 2}px)`;
        dropLine.style.width = `${r.width}px`;
        dropLine.style.height = '4px';
        dropLine.className = 've-drop';
      }
    },
    true,
  );
  window.addEventListener(
    'drop',
    (e) => {
      const t = dropTarget(e);
      dropLine.style.display = 'none';
      const data = e.dataTransfer?.getData('text/plain') || '';
      e.preventDefault();
      const moving = dragMove;
      dragMove = null;
      if (!t) return;
      const parent = t.el.parentElement;
      const parentId = parent && parent.hasAttribute('data-ed') ? edOf(parent) : null;
      const siblings = parent && parentId ? visualChildren(parent).map((c) => edOf(c)) : [];
      if (moving || data.startsWith('ve-move:')) {
        post({ type: 've:move', id: moving || data.slice(8), targetId: t.id, position: t.pos === 'inside' ? 'after' : t.pos, parentId, siblings, parentDisplay: parent ? getComputedStyle(parent).display : '' });
      } else if (data.startsWith('ve-node:')) {
        post({ type: 've:drop', nodeType: data.slice(8), targetId: t.id, position: t.pos, parentId, siblings, parentDisplay: parent ? getComputedStyle(parent).display : '' });
      }
    },
    true,
  );
  window.addEventListener('dragend', () => {
    dragMove = null;
    dropLine.style.display = 'none';
  });

  // ---------- dashboard -> canvas ----------
  window.addEventListener('message', (e) => {
    if (e.origin !== editorOrigin || e.source !== parentWin) return;
    const m = e.data as Msg;
    if (!m || typeof m.type !== 'string') return;
    if (m.type === 've:config') {
      const next = cleanVisual(m.config);
      if (editing) pending = next;
      else visualStore.set(next);
    } else if (m.type === 've:select') {
      const id = (m.id as string) || null;
      if (id) ofId(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      select(id, true);
    } else if (m.type === 've:hover') {
      hovered = (m.id as string) || null;
    } else if (m.type === 've:requestTree') {
      sendTree();
    }
  });

  // ---------- canvas -> dashboard ----------
  let treeTimer = 0;
  const sendTree = () => {
    post({ type: 've:tree', nodes: tree(), route: routeKey(window.location.pathname), lang: document.documentElement.lang, title: document.title });
    if (selected) {
      const el = ofId(selected);
      post({ type: 've:select', info: el ? info(el) : null });
    }
  };
  const root = document.getElementById('root');
  if (root)
    new MutationObserver(() => {
      window.clearTimeout(treeTimer);
      treeTimer = window.setTimeout(sendTree, 250);
    }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-ed'] });
  visualStore.subscribe(() => {
    window.clearTimeout(treeTimer);
    treeTimer = window.setTimeout(sendTree, 150);
  });
  window.setTimeout(() => {
    post({ type: 've:ready', route: routeKey(window.location.pathname), lang: document.documentElement.lang, tokens: tokens() });
    sendTree();
  }, 300);
}
