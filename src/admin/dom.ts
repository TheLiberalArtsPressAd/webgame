type Child = Node | string | number | null | undefined | false;

type Props = Record<string, unknown> & {
  class?: string;
  style?: Record<string, string>;
  dataset?: Record<string, string>;
};

/** 極簡 DOM 建立工具（不引入任何框架） */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Props | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') {
        el.className = String(value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key === 'dataset' && typeof value === 'object') {
        Object.assign(el.dataset, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      } else if (key === 'value' && el instanceof HTMLInputElement) {
        el.value = String(value);
      } else if (key === 'checked' && el instanceof HTMLInputElement) {
        el.checked = Boolean(value);
      } else if (value === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: Child[]) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function clear(el: Element) {
  el.replaceChildren();
}

export function button(text: string, onClick: () => void, variant = ''): HTMLButtonElement {
  return h(
    'button',
    {
      class: `btn${variant ? ` ${variant}` : ''}`,
      type: 'button',
      onclick: onClick
    },
    text
  );
}

export function field(labelText: string, control: HTMLElement, hint?: string): HTMLElement {
  return h(
    'div',
    { class: 'field' },
    h('span', { class: 'field-label' }, labelText),
    control,
    hint ? h('span', { class: 'field-hint' }, hint) : null
  );
}

export function numberBox(
  value: number,
  onChange: (value: number) => void,
  opts: { step?: number; min?: number; max?: number } = {}
): HTMLInputElement {
  const input = h('input', {
    type: 'number',
    class: 'input',
    value: String(Number.isFinite(value) ? value : 0),
    step: String(opts.step ?? 1)
  });
  if (opts.min !== undefined) input.min = String(opts.min);
  if (opts.max !== undefined) input.max = String(opts.max);
  input.addEventListener('input', () => {
    const next = Number(input.value);
    if (Number.isFinite(next)) onChange(next);
  });
  return input;
}

export function textBox(
  value: string,
  onChange: (value: string) => void,
  placeholder = ''
): HTMLInputElement {
  const input = h('input', { type: 'text', class: 'input', placeholder });
  input.value = value ?? '';
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

export function textArea(
  value: string,
  onChange: (value: string) => void,
  rows = 3
): HTMLTextAreaElement {
  const area = h('textarea', { class: 'input textarea', rows: String(rows) });
  area.value = value ?? '';
  area.addEventListener('input', () => onChange(area.value));
  return area;
}

export function selectBox<T extends string | number>(
  options: { value: T; label: string }[],
  selected: T,
  onChange: (value: T) => void,
  numeric = false
): HTMLSelectElement {
  const select = h('select', { class: 'input select' });
  for (const option of options) {
    const opt = h('option', { value: String(option.value) }, option.label);
    if (option.value === selected) opt.selected = true;
    select.append(opt);
  }
  select.addEventListener('change', () => {
    onChange((numeric ? Number(select.value) : select.value) as T);
  });
  return select;
}

export function checkBox(
  checked: boolean,
  onChange: (checked: boolean) => void,
  labelText?: string
): HTMLElement {
  const input = h('input', { type: 'checkbox', class: 'checkbox' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  if (!labelText) return input;
  return h('label', { class: 'check' }, input, h('span', null, labelText));
}

export function colorBox(value: string, onChange: (value: string) => void): HTMLInputElement {
  const input = h('input', { type: 'color', class: 'color-input' });
  input.value = value || '#ffffff';
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

export function section(title: string, ...children: Child[]): HTMLElement {
  return h('section', { class: 'section' }, h('h3', { class: 'section-title' }, title), ...children);
}

export function toast(message: string, type: 'ok' | 'error' | 'info' = 'ok') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = h('div', { id: 'toast-host', class: 'toast-host' });
    document.body.append(host);
  }
  const item = h('div', { class: `toast ${type}` }, message);
  host.append(item);
  window.setTimeout(() => {
    item.classList.add('out');
    window.setTimeout(() => item.remove(), 250);
  }, 2600);
}

export function badge(text: string, tone = ''): HTMLElement {
  return h('span', { class: `badge${tone ? ` ${tone}` : ''}` }, text);
}

export function empty(text: string): HTMLElement {
  return h('div', { class: 'empty' }, text);
}
