type PromiseOr<T> = T | Promise<T>;

type HiddenAttributes = 'innerHTML' | 'outerHTML' | 'innerText' | 'outerText' | 'onclick' | 'textContent';

export type JsomlElement<E extends Element = HTMLElement> = {
  '$text'?: string;
} & {
  [K in keyof Omit<E, HiddenAttributes> as K extends string ? `$${K}` : never]?: JsomlSource;
} & (E extends HTMLElement ? {
  [K in keyof HTMLElementTagNameMap]?: JsomlElementOrList<HTMLElementTagNameMap[K]> | string;
} : {}) & (E extends SVGElement ? {
  [K in keyof SVGElementTagNameMap]?: JsomlElementOrList<SVGElementTagNameMap[K]> | string;
} : {});

export type JsomlSource<E extends Element = HTMLElement> = string | object | JsomlElementOrList<E>;
export type JsomlIterable = Iterable<[string, JsomlSource]>;
export type JsomlElementOrList<E extends Element> = JsomlElement<E> | JsomlElement<E>[];

export interface JsomlRendererConfig {
  includedTags?: string[];
  excludedTags?: string[];
  maxDepth?: number;
}

export const defaultConfig: JsomlRendererConfig = {
  maxDepth: 256,
};

export async function renderInto(element: HTMLElement, content: PromiseOr<JsomlSource>, config: JsomlRendererConfig = defaultConfig): Promise<void> {
  const children: Node[] = [];

  for await (const node of render(content, config)) {
    children.push(node);
  }

  element.replaceChildren(...children);
}

export default async function* render(content: PromiseOr<JsomlSource>, config: JsomlRendererConfig = defaultConfig): AsyncGenerator<Node> {
  yield* renderInternal(content, config, 0);
}

async function* renderInternal(content: PromiseOr<JsomlSource>, config: JsomlRendererConfig, depth: number): AsyncGenerator<Node> {
  const source = await content;

  if (typeof source === 'string') {
    yield document.createTextNode(source);
    return;
  }

  if (source instanceof Map) {
    yield* renderIterable(source.entries(), config, depth);
    return;
  }

  if (typeof source === 'object') {
    yield* renderIterable(Object.entries(source), config, depth);
    return;
  }

  yield renderErrorElement(new Error(`Cannot render '${typeof source}'. Expected one of string, object, Map or Promise of any of these`));
}

async function* renderIterable(content: JsomlIterable, config: JsomlRendererConfig, depth: number): AsyncGenerator<Node> {
  for (const [tagName, value] of content) {
    let element: HTMLElement;
    try {
      element = await renderTag(tagName, value, config, depth);
    } catch (e) {
      element = await renderErrorElement(e);
    }

    yield element;
  }
}

async function renderErrorElement(e: any): Promise<HTMLElement> {
  const element = document.createElement('div');

  element.textContent = e.toString();
  element.style.color = 'yellow';
  element.style.background = 'red';
  element.style.fontWeight = 'bold';

  return element;
}

async function renderTag(tagName: string, content: JsomlSource, config: JsomlRendererConfig, depth: number = 0): Promise<HTMLElement> {
  if (config?.excludedTags?.includes(tagName)) {
    return renderErrorElement(`Tag '${tagName}' is not allowed (via exclude list)`);
  }

  if (config?.includedTags?.length && !config.includedTags.includes(tagName)) {
    return renderErrorElement(`Tag '${tagName}' is not allowed (via include list)`);
  }

  if (config?.maxDepth && depth > config.maxDepth) {
    return renderErrorElement('Max depth reached');
  }

  const element = document.createElement(tagName);

  if (typeof content === 'string') {
    element.textContent = content;

    return element;
  }

  if (Array.isArray(content)) {
    for (const child of content) {
      for await (const grandChild of renderInternal(child, config, depth + 1)) {
        element.appendChild(grandChild);
      }
    }

    return element;
  }

  const children: JsomlIterable = content instanceof Map ? content.entries() : Object.entries(content);

  for (const [key, value] of children) {
    if (key.length > 0 && key.at(0) === '$') {
      const attribute = key.substring(1);

      if (typeof value === 'string') {
        if (attribute === 'text') {
          element.textContent = value;
        } else if (attribute === 'style') {
          element.style.cssText = value;
        } else {
          element.setAttribute(attribute, value);
        }
      } else if (typeof value === 'object') {
        if (attribute === 'style') {
          Object.assign(element.style, value);
        } else {
          return renderErrorElement(`Attribute '${attribute}' could not be rendered on tag '${tagName}'`);
        }
      } else {
        return renderErrorElement(`Attribute '${attribute}' could not be rendered on tag '${tagName}'`);
      }
    } else {
      const childElement = await renderTag(key, value, config, depth + 1);

      element.appendChild(childElement);
    }
  }

  return element;
}
