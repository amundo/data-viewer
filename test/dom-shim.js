class ClassList {
  constructor(element) {
    this.element = element;
    this.items = new Set();
  }

  add(...classes) {
    classes.forEach((className) => this.items.add(className));
    this.element.attributes.class = [...this.items].join(" ");
  }

  contains(className) {
    return this.items.has(className);
  }
}

class TestEventTarget {
  constructor() {
    this.listeners = {};
  }

  addEventListener(type, callback) {
    this.listeners[type] ||= [];
    this.listeners[type].push(callback);
  }

  dispatchEvent(event) {
    event.target ||= this;
    (this.listeners[event.type] || []).forEach((callback) => callback(event));
    return true;
  }
}

class TestElement extends TestEventTarget {
  constructor(tagName = "") {
    super();
    this.tagName = tagName.toUpperCase();
    this.localName = tagName.toLowerCase();
    this.children = [];
    this.parentElement = null;
    this.attributes = {};
    this.dataset = {};
    this.classList = new ClassList(this);
    this.hidden = false;
    this.value = "";
    this._textContent = "";
  }

  append(...nodes) {
    nodes.forEach((node) => {
      if (node === null || node === undefined) {
        return;
      }
      if (typeof node !== "object") {
        node = new TestText(String(node));
      }
      node.parentElement = this;
      this.children.push(node);
    });
  }

  set id(value) {
    this.attributes.id = value;
  }

  get id() {
    return this.attributes.id || "";
  }

  set textContent(value) {
    this.children = [];
    this._textContent = String(value);
  }

  get textContent() {
    return this._textContent +
      this.children.map((child) => child.textContent).join("");
  }

  set innerHTML(value) {
    this.children = [];
    this._textContent = "";
    this._innerHTML = String(value);
  }

  get innerHTML() {
    return this._innerHTML || this.textContent;
  }

  get cells() {
    return this.children.filter((child) =>
      child.localName === "td" || child.localName === "th"
    );
  }

  matches(selector) {
    return matchesSelector(this, selector);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return descendants(this).filter((element) =>
      matchesSelector(element, selector)
    );
  }

  insertAdjacentElement(position, element) {
    if (position !== "beforeend") {
      throw new Error(`Unsupported position: ${position}`);
    }
    this.append(element);
    return element;
  }
}

class TestText {
  constructor(text) {
    this.textContent = text;
    this.parentElement = null;
  }
}

class TestDocument extends TestElement {
  constructor() {
    super("#document");
    this.body = this.createElement("body");
    this.append(this.body);
  }

  createElement(tagName) {
    return new TestElement(tagName);
  }
}

class TestHTMLElement extends TestElement {
  constructor() {
    super("");
  }
}

function descendants(element) {
  return element.children.flatMap((child) => {
    if (!(child instanceof TestElement)) {
      return [];
    }
    return [child, ...descendants(child)];
  });
}

function matchesSelector(element, selector) {
  if (!(element instanceof TestElement)) {
    return false;
  }

  if (selector.includes(" ")) {
    const [ancestorSelector, childSelector] = selector.split(/\s+/, 2);
    return matchesSelector(element, childSelector) &&
      hasAncestor(element, ancestorSelector);
  }

  if (selector.startsWith("#")) {
    return element.id === selector.slice(1);
  }

  if (selector.startsWith(".")) {
    return element.classList.contains(selector.slice(1));
  }

  const dataHeaderMatch = selector.match(
    /^([a-z]*)?\[data-header(?:="([^"]*)")?\]$/,
  );
  if (dataHeaderMatch) {
    const [, tagName, header] = dataHeaderMatch;
    if (tagName && element.localName !== tagName) {
      return false;
    }
    if (!("header" in element.dataset)) {
      return false;
    }
    return header === undefined || element.dataset.header === header;
  }

  return element.localName === selector.toLowerCase();
}

function hasAncestor(element, selector) {
  let parent = element.parentElement;
  while (parent) {
    if (matchesSelector(parent, selector)) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

export function installDom() {
  const registry = new Map();
  globalThis.window = globalThis;
  globalThis.document = new TestDocument();
  globalThis.HTMLElement = TestHTMLElement;
  globalThis.customElements = {
    define(name, constructor) {
      registry.set(name, constructor);
    },
    get(name) {
      return registry.get(name);
    },
  };
  globalThis.Event = class Event {
    constructor(type) {
      this.type = type;
      this.target = null;
    }
  };
  globalThis.CustomEvent = class CustomEvent extends Event {
    constructor(type, options = {}) {
      super(type);
      this.bubbles = Boolean(options.bubbles);
      this.detail = options.detail;
    }
  };
}
