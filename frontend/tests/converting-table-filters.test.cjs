/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const sourceRoot = path.resolve(__dirname, "../src");
const moduleCache = new Map();

const stubs = {
  "@/components/ui/button": {
    Button: ({ children, icon, variant, ...props }) => {
      void icon;
      void variant;
      return React.createElement("button", props, children);
    },
  },
  "@/components/ui/icon": {
    Icon: ({ name, size, ...props }) => {
      void size;
      return React.createElement("span", { ...props, "data-icon": name });
    },
  },
  "@/components/ui/badge": {
    Badge: ({ children }) => React.createElement("span", null, children),
  },
  "@/components/ui/use-table-pagination": {
    DEFAULT_TABLE_PAGE_SIZE: 7,
  },
  "@/lib/offset-labels": {
    englishOffsetLabel: (value) => value,
  },
};

function resolveModule(base) {
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function load(filename) {
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;

  const loaded = { exports: {} };
  moduleCache.set(filename, loaded);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier === "react") return React;
    if (stubs[specifier]) return stubs[specifier];
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? path.resolve(sourceRoot, specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      const resolved = resolveModule(base);
      if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${filename}`);
      return load(resolved);
    }
    return require(specifier);
  };

  new Function("require", "module", "exports", source)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

function sourceFile(relativePath) {
  return fs.readFileSync(path.resolve(sourceRoot, relativePath), "utf8");
}

function collectButtons(node, buttons = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectButtons(child, buttons));
    return buttons;
  }
  if (!React.isValidElement(node)) return buttons;
  if (node.type === "button") buttons.push(node);
  collectButtons(node.props.children, buttons);
  return buttons;
}

function buttonLabel(button) {
  const firstChild = React.Children.toArray(button.props.children)[0];
  return React.isValidElement(firstChild) ? firstChild.props.children : "";
}

function makeOrder(overrides = {}) {
  return {
    id: "converting-filter-test",
    no: "PSR#260853",
    lineage: { entryType: "new", rootProjectNo: "PSR#260853", sourceProjectNo: null, versionNumber: 0 },
    mainData: { component: "Component A" },
    workflow: {
      preparationType: "converting",
      convertingRoute: "by_production",
      productionOrder: "tooling",
      materialRequested: true,
      currentStage: "preparation",
      currentProcess: "Order Tooling",
      currentStatus: "in_progress",
      drawingLink: null,
      designDecision: null,
      progress: 50,
    },
    toolingOrders: [],
    rubberOrders: [],
    materialRequests: [],
    offsetSpks: [],
    processHistory: [],
    sampleProgress: [],
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-31T12:00:00.000Z",
    customer: "Customer A",
    product: "Product A",
    description: "Description",
    material: "Material",
    priority: "Medium",
    process: "Order Tooling",
    pic: "Designer PIC",
    projectDate: "2026-10-30",
    deadline: "2026-11-10",
    status: "Ordered",
    tone: "info",
    stage: "tooling-progress",
    progress: 50,
    ...overrides,
  };
}

const requirementOptions = [
  { value: "needed", label: "Needed" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "available", label: "Available / Existing" },
  { value: "on_hold", label: "On Hold" },
  { value: "repair", label: "Repair" },
  { value: "issue", label: "Issue / Reorder" },
  { value: "cancelled", label: "Cancelled" },
];

const materialOptions = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "released", label: "Released" },
  { value: "received", label: "Received" },
  { value: "on_hold", label: "On Hold" },
];

test("Converting status cards use all saved categories, All, active toggles, and compact wrapping", () => {
  const { RecordFilterCards } = load(path.resolve(sourceRoot, "components/workflow/record-filter-cards.tsx"));
  let selected = null;
  const element = RecordFilterCards({
    title: "Tooling Status",
    description: "Filter records by their saved status.",
    options: requirementOptions,
    selectedValue: "ordered",
    countForValue: (value) => value === "ordered" ? 3 : 1,
    totalCount: 11,
    onChange: (value) => { selected = value; },
  });
  const buttons = collectButtons(element);
  assert.deepEqual(buttons.map(buttonLabel), ["All", ...requirementOptions.map((option) => option.label)]);
  assert.equal(buttons.find((button) => buttonLabel(button) === "Ordered").props["aria-pressed"], true);
  buttons.find((button) => buttonLabel(button) === "Ordered").props.onClick();
  assert.equal(selected, "");
  buttons.find((button) => buttonLabel(button) === "Needed").props.onClick();
  assert.equal(selected, "needed");
  buttons.find((button) => buttonLabel(button) === "All").props.onClick();
  assert.equal(selected, "");

  const requirementMarkup = renderToStaticMarkup(element);
  assert.match(requirementMarkup, /workflow-filter-grid record-filter-grid/);
  assert.doesNotMatch(requirementMarkup, /workflow-filter-arrow/);
  const css = sourceFile("app/globals.css");
  assert.match(css, /\.workflow-filter-grid\.record-filter-grid\s*\{[^}]*display:\s*grid[^}]*overflow:\s*visible[^}]*\}/s);
  assert.match(css, /\.workflow-filter-grid\.record-filter-grid \.workflow-filter-item\s*\{[^}]*min-height:\s*56px[^}]*\}/s);

  const materialMarkup = renderToStaticMarkup(React.createElement(RecordFilterCards, {
    title: "Material Request Status",
    description: "Filter records by their saved status.",
    options: materialOptions,
    selectedValue: "",
    countForValue: () => 1,
    totalCount: 5,
    onChange: () => {},
  }));
  assert.doesNotMatch(materialMarkup, /workflow-filter-arrow/);
  assert.match(materialMarkup, /Draft/);
  assert.match(materialMarkup, /On Hold/);
});

test("Converting Search and PIC controls remain scoped and preserve OrderFilters defaults", () => {
  const { OrderFilters } = load(path.resolve(sourceRoot, "app/orders/components/order-filters.tsx"));
  const props = {
    query: "", preparationType: "", pic: "", people: ["PIC A"],
    onQueryChange: () => {}, onPreparationTypeChange: () => {},
    onPicChange: () => {}, onClear: () => {},
  };
  const convertingMarkup = renderToStaticMarkup(React.createElement(OrderFilters, {
    ...props,
    showPreparationType: false,
    showReset: false,
    searchPlaceholder: "Search PSR, customer, or product...",
  }));
  assert.match(convertingMarkup, /Search PSR, customer, or product/);
  assert.match(convertingMarkup, /PIC: All/);
  assert.doesNotMatch(convertingMarkup, /Preparation Type: All/);
  assert.doesNotMatch(convertingMarkup, /Reset Filters/);

  const defaultMarkup = renderToStaticMarkup(React.createElement(OrderFilters, props));
  assert.match(defaultMarkup, /Preparation Type: All/);
  assert.match(defaultMarkup, /Reset Filters/);
});

test("queue tables opt into a contextual PIC column without changing default Designer", () => {
  const { OrderTable } = load(path.resolve(sourceRoot, "components/workflow/order-table.tsx"));
  const order = makeOrder();
  const defaultMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [order], queueLayout: true,
  }));
  assert.match(defaultMarkup, />Designer</);
  assert.match(defaultMarkup, />Designer PIC</);

  const picMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [order],
    queueLayout: true,
    personLabel: "PIC",
    personForOrder: () => "Tooling PIC",
  }));
  assert.match(picMarkup, />PIC</);
  assert.match(picMarkup, />Tooling PIC</);
  assert.doesNotMatch(picMarkup, />Designer</);

  const emptyPicMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [order], queueLayout: true, personLabel: "PIC", personForOrder: () => "   ",
  }));
  assert.match(emptyPicMarkup, />-</);
});

test("WorkflowStageView combines unpaginated search, PIC, and record status filters while keeping export raw", () => {
  const source = sourceFile("components/workflow/workflow-stage-view.tsx");
  assert.match(source, /const filteredQueueOrders = useMemo/);
  assert.ok(source.indexOf("<OrderFilters") < source.indexOf("<RecordFilterCards"));
  assert.match(source, /\$\{order\.no\} \$\{order\.customer\} \$\{order\.product\} \$\{order\.mainData\.component/);
  assert.match(source, /matchesQuery && matchesPic && matchesStatus/);
  assert.match(source, /useTablePagination\(filteredQueueOrders\)/);
  assert.match(source, /dateRangeExport \? dateRangeExport\(orders\) : null/);
  assert.match(source, /setQuery\(value\);[\s\S]*resetPage\(\)/);
  assert.match(source, /setPic\(value\);[\s\S]*resetPage\(\)/);
  assert.match(source, /setRecordStatus\(value\);[\s\S]*resetPage\(\)/);
  assert.match(source, /order\.toolingOrders\.at\(-1\)\?\.status/);
  assert.match(source, /order\.rubberOrders\.at\(-1\)\?\.status/);
  assert.match(source, /order\.materialRequests\.at\(-1\)\?\.status/);
  assert.match(source, /order\.sampleProgress\?\.at\(-1\)\?\.pic/);
  assert.match(source, /convertingTableFilter !== "sample"/);

  const statusFunction = source.slice(source.indexOf("function recordStatusFor"), source.indexOf("function recordPicFor"));
  assert.doesNotMatch(statusFunction, /notes/);
});

test("only the three status pages request card filters; Sample Progress retains Search and PIC without note categories", () => {
  const tooling = sourceFile("app/converting/components/tooling-progress-view.tsx");
  const rubber = sourceFile("app/converting/components/rubber-order-setting-view.tsx");
  const material = sourceFile("app/converting/components/material-request-view.tsx");
  const sample = sourceFile("app/converting/components/sample-view.tsx");

  assert.match(tooling, /convertingTableFilter="tooling"/);
  assert.match(rubber, /convertingTableFilter="rubber"/);
  assert.match(material, /convertingTableFilter="material"/);
  assert.match(sample, /convertingTableFilter="sample"/);
  assert.doesNotMatch(sample, /Production Notes/);
});
