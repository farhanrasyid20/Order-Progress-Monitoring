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
  "@/components/workflow/workflow-provider": {
    workflowStageDetails: {},
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

function makeOrder(sampleProgress = []) {
  return {
    id: "incoming-design-note-test",
    no: "PSR#NOTE",
    lineage: { entryType: "new", rootProjectNo: "PSR#NOTE", sourceProjectNo: null, versionNumber: 0 },
    mainData: {},
    workflow: {
      preparationType: "converting",
      convertingRoute: "by_production",
      productionOrder: null,
      materialRequested: false,
      currentStage: "preparation",
      currentProcess: "Order Tooling",
      currentStatus: "in_progress",
      drawingLink: null,
      designDecision: null,
      progress: 56,
    },
    toolingOrders: [],
    rubberOrders: [],
    materialRequests: [],
    offsetSpks: [],
    processHistory: [],
    sampleProgress,
    createdAt: "2026-10-30T00:00:00.000Z",
    updatedAt: "2026-10-31T12:00:00.000Z",
    customer: "Customer",
    product: "Product",
    description: "Description",
    material: "Material",
    priority: "Medium",
    process: "Sample Process",
    pic: "PIC",
    projectDate: "30 Oct 2026",
    deadline: "10 Nov 2026",
    status: "Sample In Progress",
    tone: "info",
    stage: "sample-progress",
    progress: 85,
  };
}

function sampleRecord(notes, recordedAt, sequence) {
  return {
    sequence,
    pic: "Sample PIC",
    deadline: "2026-11-01",
    sampleNumber: `S-${sequence}`,
    notes,
    recordedAt,
  };
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

function collectElements(node, type, elements = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectElements(child, type, elements));
    return elements;
  }
  if (!React.isValidElement(node)) return elements;
  if (node.type === type) elements.push(node);
  collectElements(node.props.children, type, elements);
  return elements;
}

function workflowButtonLabel(button) {
  const firstChild = React.Children.toArray(button.props.children)[0];
  return React.isValidElement(firstChild) ? firstChild.props.children : "";
}

test("Incoming Design uses 50-item pagination and replaces its reset action with project status", () => {
  const ordersViewSource = sourceFile("app/orders/components/orders-view.tsx");
  assert.match(ordersViewSource, /useTablePagination\(filteredOrders,\s*50\)/);
  assert.match(ordersViewSource, /showReset=\{false\}/);
  assert.match(ordersViewSource, /onAll=\{clearFilters\}/);
  assert.match(ordersViewSource, /useState<ProjectVisibility>\("active"\)/);
  assert.match(ordersViewSource, /matchesProjectVisibility\(order, projectVisibility\)/);
  assert.match(ordersViewSource, /onProjectVisibilityChange=\{\(value\) => \{[\s\S]*setProjectVisibility\(value\);[\s\S]*setWorkflowPhase\(""\);[\s\S]*resetPage\(\);[\s\S]*\}\}/);
  assert.match(ordersViewSource, /onPhaseChange=\{[\s\S]*?resetPage\(\)/);

  const { OrderFilters } = load(path.resolve(sourceRoot, "app/orders/components/order-filters.tsx"));
  const props = {
    query: "", preparationType: "", pic: "", people: [],
    onQueryChange: () => {}, onPreparationTypeChange: () => {},
    onPicChange: () => {}, onClear: () => {},
  };
  let selectedProjectVisibility = null;
  const incomingElement = OrderFilters({
    ...props,
    showReset: false,
    projectVisibility: "active",
    onProjectVisibilityChange: (value) => { selectedProjectVisibility = value; },
  });
  const incomingMarkup = renderToStaticMarkup(incomingElement);
  const defaultMarkup = renderToStaticMarkup(React.createElement(OrderFilters, props));
  assert.doesNotMatch(incomingMarkup, /Reset Filters/);
  assert.match(defaultMarkup, /Reset Filters/);
  assert.match(incomingMarkup, /aria-label="Filter by project status"/);
  ["all", "active", "completed", "cancelled"].forEach((value) => {
    assert.match(incomingMarkup, new RegExp(`<option value="${value}"`));
  });
  const projectStatusSelect = collectElements(incomingElement, "select")
    .find((select) => select.props["aria-label"] === "Filter by project status");
  assert.ok(projectStatusSelect);
  projectStatusSelect.props.onChange({ target: { value: "completed" } });
  assert.equal(selectedProjectVisibility, "completed");

  const { TablePagination } = load(path.resolve(sourceRoot, "components/ui/table-pagination.tsx"));
  const renderPage = (page) => renderToStaticMarkup(React.createElement(TablePagination, {
    page,
    pageCount: 3,
    totalItems: 120,
    pageSize: 50,
    itemLabel: "projects",
    onPageChange: () => {},
  }));
  assert.match(renderPage(1), /Showing 1-50 of 120 projects/);
  assert.match(renderPage(2), /Showing 51-100 of 120 projects/);
  assert.match(renderPage(3), /Showing 101-120 of 120 projects/);
  const thirteenProjects = renderToStaticMarkup(React.createElement(TablePagination, {
    page: 1,
    pageCount: 1,
    totalItems: 13,
    pageSize: 50,
    itemLabel: "projects",
    onPageChange: () => {},
  }));
  assert.match(thirteenProjects, /Showing 1-13 of 13 projects/);
});

test("project visibility keeps active, completed, and cancelled projects distinct", () => {
  const { matchesProjectVisibility } = load(path.resolve(sourceRoot, "lib/active-project.ts"));
  const active = makeOrder();
  const completed = {
    ...makeOrder(),
    id: "completed-project",
    stage: "completed",
    workflow: { ...makeOrder().workflow, currentStage: "completed", currentStatus: "completed" },
  };
  const cancelled = {
    ...makeOrder(),
    id: "cancelled-project",
    stage: "completed",
    workflow: { ...makeOrder().workflow, currentStage: "completed", currentStatus: "cancelled" },
  };

  assert.equal(matchesProjectVisibility(active, "active"), true);
  assert.equal(matchesProjectVisibility(completed, "active"), false);
  assert.equal(matchesProjectVisibility(cancelled, "active"), false);
  assert.equal(matchesProjectVisibility(completed, "completed"), true);
  assert.equal(matchesProjectVisibility(cancelled, "completed"), false);
  assert.equal(matchesProjectVisibility(cancelled, "cancelled"), true);
  assert.equal(matchesProjectVisibility(active, "all"), true);
  assert.equal(matchesProjectVisibility(completed, "all"), true);
  assert.equal(matchesProjectVisibility(cancelled, "all"), true);
});

test("workflow cards retain their order, selection behavior, and visual-only arrows", () => {
  const { WorkflowFilterCards } = load(path.resolve(sourceRoot, "app/orders/components/workflow-filter-cards.tsx"));
  let selected = null;
  const element = WorkflowFilterCards({
    orders: [],
    selectedPhase: "process",
    onPhaseChange: (phase) => { selected = phase; },
  });
  const buttons = collectButtons(element);
  const allButton = buttons.find((button) => workflowButtonLabel(button) === "All");
  const preparationButton = buttons.find((button) => workflowButtonLabel(button) === "Preparation");
  assert.ok(allButton);
  assert.ok(preparationButton);
  allButton.props.onClick();
  assert.equal(selected, "");
  preparationButton.props.onClick();
  assert.equal(selected, "preparation");

  let resetCalls = 0;
  const withReset = WorkflowFilterCards({
    orders: [],
    selectedPhase: "preparation",
    onPhaseChange: () => {},
    onAll: () => { resetCalls += 1; },
  });
  collectButtons(withReset).find((button) => workflowButtonLabel(button) === "All").props.onClick();
  assert.equal(resetCalls, 1);

  const markup = renderToStaticMarkup(React.createElement(WorkflowFilterCards, {
    orders: [], selectedPhase: "process", onPhaseChange: () => {},
  }));
  const labels = ["All", "Order", "Preparation", "Process", "Closing"];
  const positions = labels.map((label) => markup.indexOf(`>${label}<`));
  assert.ok(positions.every((position) => position >= 0));
  assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]));
  assert.equal((markup.match(/workflow-filter-arrow/g) ?? []).length, 4);
  assert.match(markup, /→/);
  assert.doesNotMatch(markup, /<button[^>]*workflow-filter-arrow/);
  assert.match(markup, /workflow-filter-item is-active/);
  assert.match(markup, /0 projects/);
});

test("Incoming Design uses the newest non-empty Sample Progress production note", () => {
  const { latestProductionNotes, IncomingOrdersTable } = load(path.resolve(sourceRoot, "app/orders/components/incoming-orders-table.tsx"));
  const order = makeOrder([
    sampleRecord("Older note", "2026-10-30T10:00:00.000Z", 1),
    sampleRecord("", "2026-11-01T10:00:00.000Z", 2),
    sampleRecord("Newest note", "2026-10-31T10:00:00.000Z", 3),
  ]);
  assert.equal(latestProductionNotes(order), "Newest note");
  assert.equal(latestProductionNotes(makeOrder([sampleRecord("   ", "2026-11-01T10:00:00.000Z", 1)])), null);
  assert.equal(latestProductionNotes(makeOrder()), null);

  const longNote = `Waiting for Approval ${"x".repeat(140)}`;
  const markup = renderToStaticMarkup(React.createElement(IncomingOrdersTable, {
    orders: [makeOrder([sampleRecord(longNote, "2026-11-01T10:00:00.000Z", 1)])],
    onShowDetails: () => {},
  }));
  assert.match(markup, /Production Notes:/);
  assert.match(markup, /class="incoming-production-note"/);
  assert.ok(markup.includes(`title="${longNote}"`));
  assert.ok(markup.includes(`Production Notes: ${longNote}`));
  assert.equal((markup.match(/<tr>/g) ?? []).length, 2);

  const emptyMarkup = renderToStaticMarkup(React.createElement(IncomingOrdersTable, {
    orders: [makeOrder()],
    onShowDetails: () => {},
  }));
  assert.doesNotMatch(emptyMarkup, /Production Notes:/);

  const cancelledMarkup = renderToStaticMarkup(React.createElement(IncomingOrdersTable, {
    orders: [{
      ...makeOrder(),
      stage: "completed",
      workflow: { ...makeOrder().workflow, currentStage: "completed", currentStatus: "cancelled" },
    }],
    onShowDetails: () => {},
  }));
  assert.match(cancelledMarkup, /Cancelled/);

  const css = sourceFile("app/globals.css");
  assert.match(css, /\.incoming-production-note\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap[^}]*\}/s);
});

test("Offset queue status displays only its stored handoff remark", () => {
  const { OrderTable } = load(path.resolve(sourceRoot, "components/workflow/order-table.tsx"));
  const { ProjectHistoryModal } = load(path.resolve(sourceRoot, "components/workflow/project-history-modal.tsx"));
  const offsetOrder = (stage, offsetHandoffRemark) => ({
    ...makeOrder(),
    stage,
    status: "Waiting for Prepress",
    workflow: {
      ...makeOrder().workflow,
      preparationType: "offset",
      convertingRoute: null,
      offsetHandoffRemark,
    },
  });

  const remarkMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [offsetOrder("offset-prepress", "Waiting proof color")],
    queueLayout: true,
  }));
  assert.match(remarkMarkup, /Waiting proof color/);
  assert.doesNotMatch(remarkMarkup, /Waiting for Prepress/);

  const emptyMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [offsetOrder("offset-material-request", "")],
    queueLayout: true,
  }));
  assert.match(emptyMarkup, />-</);
  assert.doesNotMatch(emptyMarkup, /Waiting for Prepress/);

  const legacyIncomingMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [{
      ...offsetOrder("offset-prepress", ""),
      processHistory: [
        { process: "incoming_preparation", status: "updated", date: "2026-11-18T01:00:00.000Z", user: "Design", remark: "Waiting proof color" },
        { process: "Prepress", status: "Waiting for Prepress", date: "2026-11-18T01:01:00.000Z", user: "System", remark: "" },
      ],
    }],
    queueLayout: true,
  }));
  assert.match(legacyIncomingMarkup, /Waiting proof color/);
  assert.doesNotMatch(legacyIncomingMarkup, /Waiting for Prepress/);

  const legacyIncomingOrder = {
    ...offsetOrder("offset-prepress", ""),
    no: "PSR#260860",
    processHistory: [
      { process: "incoming_preparation", status: "updated", date: "2026-11-18T01:00:00.000Z", user: "Design", remark: "continue next preperation" },
      { process: "Prepress", status: "Waiting for Prepress", date: "2026-11-18T01:01:00.000Z", user: "System", remark: "" },
    ],
  };
  const legacyModalMarkup = renderToStaticMarkup(React.createElement(ProjectHistoryModal, {
    order: legacyIncomingOrder,
    offsetDetails: true,
    onClose: () => {},
  }));
  assert.match(legacyModalMarkup, /<span>Status<\/span><strong>continue next preperation<\/strong>/);
  assert.doesNotMatch(legacyModalMarkup, /<span>Status<\/span><strong>Waiting for Prepress<\/strong>/);

  const legacyMaterialMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [{
      ...offsetOrder("offset-material-request", ""),
      processHistory: [
        { process: "handoff_details_updated", stage: "offset-prepress", status: "updated", date: "2026-11-18T02:00:00.000Z", user: "Design", remark: "Waiting material" },
        { process: "Offset Material / Create MI", status: "Waiting for Offset Material", date: "2026-11-18T02:01:00.000Z", user: "System", remark: "" },
      ],
    }],
    queueLayout: true,
  }));
  assert.match(legacyMaterialMarkup, /Waiting material/);

  const handoffMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [{
      ...offsetOrder("offset-material-request", "Create MI from Prepress"),
      materialRequests: [{ miNumber: "OMI-001", status: "requested", requestedBy: "Design", requestDate: "2026-11-25", material: "Ivory", quantity: "100", unit: "sheet", remark: "" }],
      processHistory: [{ process: "offset_prepress", status: "updated", date: "2026-11-25T01:00:00.000Z", user: "Design", remark: "Old prepress remark" }],
    }],
    queueLayout: true,
    statusPresentation: "offset-material",
  }));
  assert.match(handoffMarkup, /Requested/);
  assert.match(handoffMarkup, /Create MI from Prepress/);
  assert.doesNotMatch(handoffMarkup, /Old prepress remark/);
  assert.doesNotMatch(handoffMarkup, /badge/);

  const emptyModalMarkup = renderToStaticMarkup(React.createElement(ProjectHistoryModal, {
    order: offsetOrder("offset-material-request", ""),
    offsetDetails: true,
    onClose: () => {},
  }));
  assert.match(emptyModalMarkup, /<span>Status<\/span><strong>-<\/strong>/);
});

test("Offset Preparation Check keeps legacy status-only and draft records neutral", () => {
  const { preparationChecks } = load(path.resolve(sourceRoot, "app/orders/components/incoming-orders-table.tsx"));
  const base = {
    ...makeOrder(),
    id: "offset-preparation-check",
    stage: "offset-material-request",
    workflow: { ...makeOrder().workflow, preparationType: "offset", convertingRoute: null },
    offsetPreparationPlan: {
      projectId: "offset-preparation-check",
      material: { state: "draft" },
      tooling: { state: "draft" },
      varnish: { state: "draft" },
    },
    materialRequests: [{ status: "released" }],
    offsetToolingId: "offset-tooling-1",
    offsetToolingRecords: [{ id: "offset-tooling-1", status: "available" }],
  };
  assert.deepEqual(preparationChecks(base), [
    { label: "Material / MI", state: "empty" },
    { label: "Tooling / Plate", state: "empty" },
    { label: "Block / Spot Varnish", state: "empty" },
  ]);

  const ready = {
    ...base,
    offsetPreparationPlan: {
      ...base.offsetPreparationPlan,
      material: { state: "submitted" },
      tooling: { state: "submitted" },
    },
  };
  assert.deepEqual(preparationChecks(ready), [
    { label: "Material / MI", state: "empty" },
    { label: "Tooling / Plate", state: "empty" },
    { label: "Block / Spot Varnish", state: "empty" },
  ]);
  assert.ok(!preparationChecks(ready).some((check) => check.label === "Req. Material"));
});

test("Offset Prepress queue renders its four saved statuses and prepress remark without badges", () => {
  const { OrderTable } = load(path.resolve(sourceRoot, "components/workflow/order-table.tsx"));
  const order = {
    ...makeOrder(),
    stage: "offset-prepress",
    status: "Waiting for Prepress",
    workflow: { ...makeOrder().workflow, preparationType: "offset", convertingRoute: null },
    offsetPrepress: {
      noJoPnCode: "MC-001", idPlate: "PL-001", plateType: "CD102", fgQuantity: "900",
      proofColor: "Ready", plot: "Waiting", plate: "Ready", ink: "Waiting",
      remark: "Waiting for ink and plot.", recordedAt: "2026-11-25T00:00:00.000Z", updatedBy: "Design",
    },
  };
  const markup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [order], queueLayout: true, statusPresentation: "offset-prepress",
  }));
  assert.match(markup, /Proof: Ready/);
  assert.match(markup, /Plot: Waiting/);
  assert.match(markup, /Plate: Ready/);
  assert.match(markup, /Ink: Waiting/);
  assert.match(markup, /Waiting for ink and plot\./);
  assert.doesNotMatch(markup, /Waiting for Prepress/);
  assert.doesNotMatch(markup, /badge/);

  const legacyMarkup = renderToStaticMarkup(React.createElement(OrderTable, {
    orders: [{ ...order, offsetPrepress: undefined }], queueLayout: true, statusPresentation: "offset-prepress",
  }));
  assert.match(legacyMarkup, /Proof: -/);
  assert.match(legacyMarkup, /<span class="prepress-status-remark">-<\/span>/);
});

test("every Offset Details modal renders the complete shared Add Project master data", () => {
  const { ProjectHistoryModal } = load(path.resolve(sourceRoot, "components/workflow/project-history-modal.tsx"));
  const mainData = {
    ...makeOrder().mainData,
    mcNo: "MC-001",
    component: "Offset carton",
    custName: "Customer Offset",
    boardQua: "Ivory",
    fgQuantity: "1000",
    imposition: "4 UP",
    grammage: "310 gsm",
    printingSide: "2 side",
    printingMachine: "CD102",
    width: "600",
    length: "900",
    weight: "250",
    printing: "Yes",
    colours: "CMYK",
    colour2: "Pantone 123",
    pantoneCount: "1",
    specialColourCount: "2",
    varnish: "WB Spot Varnish",
    lamination: "Matte",
    coatingSide: "1 side",
    emboss: "Yes",
    deboss: "No",
    hotprint: "Yes",
    spotUv: "No",
    remark: "Master remark",
  };
  const expectedMasterFields = [
    "Description / Component", "Offset carton", "Pantone (Qty)", "Special Colour (Qty)",
    "Emboss", "Deboss", "Hotprint Gold/Silver", "Spot UV", "Master remark",
  ];

  for (const stage of ["offset-prepress", "offset-material-request", "offset-plate", "offset-varnish", "offset-press"]) {
    const markup = renderToStaticMarkup(React.createElement(ProjectHistoryModal, {
      order: {
        ...makeOrder(),
        stage,
        no: "2611001",
        mainData,
        workflow: {
          ...makeOrder().workflow,
          preparationType: "offset",
          convertingRoute: null,
          offsetHandoffRemark: "Handoff remark",
        },
      },
      offsetDetails: true,
      onClose: () => {},
    }));
    expectedMasterFields.forEach((value) => assert.ok(markup.includes(value), `${stage} should include ${value}`));
    assert.ok(markup.includes("Handoff remark"), `${stage} should retain the shared Offset Status`);
  }
});
