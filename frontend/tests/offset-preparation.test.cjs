/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

function loadTypeScript(filename, cache = new Map()) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? path.resolve(__dirname, "../src", specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      const resolved = [base, base + ".ts", base + ".tsx"].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      return loadTypeScript(resolved, cache);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

function loadTypeScriptWithMocks(filename, mocks, cache = new Map()) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const localRequire = (specifier) => {
    if (mocks.has(specifier)) return mocks.get(specifier);
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const base = specifier.startsWith("@/")
        ? path.resolve(__dirname, "../src", specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      const resolved = [base, base + ".ts", base + ".tsx"].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      return loadTypeScriptWithMocks(resolved, mocks, cache);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

function memoryStorage() {
  const entries = new Map();
  return {
    failWrites: false,
    getItem: (key) => entries.get(key) ?? null,
    setItem(key, value) {
      if (this.failWrites) throw new Error("Quota exceeded");
      entries.set(key, value);
    },
  };
}

const providerModuleSources = new Map();

function providerHarness(storage = memoryStorage()) {
  const states = [];
  const callbacks = [];
  const effectDependencies = [];
  let effects;
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useCallback(callback, dependencies) {
      const index = cursor++;
      const previous = callbacks[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous.dependencies[i]))) {
        callbacks[index] = { callback, dependencies };
      }
      return callbacks[index].callback;
    },
    useMemo: (factory) => factory(),
    useRef(current) {
      const isOrdersRef = cursor === 3;
      const [ref] = react.useState(() => ({ current }));
      // Fixtures replace the first hook's state directly between renders.
      if (isOrdersRef) ref.current = current;
      return ref;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const previous = effectDependencies[index];
      if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
        effects.push(() => {
          effectDependencies[index] = dependencies;
          effect();
        });
      }
    },
  };
  const cache = new Map();
  const load = (filename) => {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    if (!providerModuleSources.has(filename)) {
      const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      providerModuleSources.set(filename, source);
    }
    const localRequire = (specifier) => {
      if (specifier === "react") return react;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const base = specifier.startsWith("@/") ? path.resolve(__dirname, "../src", specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
        const resolved = [base, base + ".ts", base + ".tsx"].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        return load(resolved);
      }
      return require(specifier);
    };
    new Function("require", "module", "exports", "window", providerModuleSources.get(filename))(
      localRequire, loadedModule, loadedModule.exports, { localStorage: storage },
    );
    return loadedModule.exports;
  };
  const { WorkflowOrdersProvider } = load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const api = (commitEffects = true) => {
    cursor = 0;
    effects = [];
    const value = WorkflowOrdersProvider({ children: null, currentUserName: "Offset User" }).props.value;
    if (commitEffects) effects.forEach((effect) => effect());
    return value;
  };
  const original = structuredClone(api(false).orders[0]);
  states[0] = [{
    ...original,
    id: "offset-parallel-foundation",
    no: "2611001",
    stage: "offset-prepress",
    processHistory: [],
    workflow: { ...original.workflow, preparationType: "offset", convertingRoute: null, currentStatus: "in_progress" },
  }];
  api();
  api();
  return { api, states, storage };
}

const readiness = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-readiness.ts"));

function submitPlan(h, rows, toolingDraft, remark = "") {
  const api = h.api();
  const order = api.orders[0];
  return api.submitOffsetMaterialPreparation(order.id, { rows, toolingDraft, remark }, readiness.offsetPlanSnapshot(order));
}

function saveStep(h, step, values, action = "draft", snapshot) {
  const api = h.api();
  const order = api.orders[0];
  const save = { prepress: api.saveOffsetPrepress, material: api.saveOffsetMaterial, tooling: api.saveOffsetTooling };
  return save[step](order.id, values, action, snapshot ?? readiness.offsetPreparationSnapshot(order, step));
}

test("Offset preparation helper retains project identity, one tooling draft, and deduplicates submitted branches", () => {
  const preparation = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
  const toolingDraft = {
    mcNo: "MC-OFFSET-01", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Draft only",
  };
  const draft = preparation.createOffsetPreparationPlan("project-offset-1", {
    material: { state: "draft" }, tooling: { state: "draft", draft: toolingDraft },
  }, "Design", "2026-11-24T01:00:00.000Z");
  assert.equal(draft.projectId, "project-offset-1");
  assert.equal(draft.tooling.state, "draft");
  assert.deepEqual(draft.tooling.draft, toolingDraft);
  assert.deepEqual(preparation.appendOffsetPreparationRecords([], draft, "Design", draft.updatedAt), []);

  const submitted = preparation.createOffsetPreparationPlan("project-offset-1", {
    material: { state: "submitted" }, tooling: { state: "submitted" }, varnish: { state: "submitted" },
  }, "Design", "2026-11-24T01:01:00.000Z");
  const records = preparation.appendOffsetPreparationRecords([], submitted, "Design", submitted.updatedAt);
  const repeated = preparation.appendOffsetPreparationRecords(records, submitted, "Design", "2026-11-24T01:02:00.000Z");
  assert.deepEqual(records.map((record) => [record.projectId, record.kind]), [
    ["project-offset-1", "material"], ["project-offset-1", "tooling"], ["project-offset-1", "varnish"],
  ]);
  assert.equal(repeated.length, 3);
});

test("Offset preparation provider persists drafts and append-only submission history without moving the linear workflow", () => {
  const h = providerHarness();
  const original = structuredClone(h.api().orders[0]);
  const toolingDraft = {
    mcNo: "MC-OFFSET-01", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Draft only",
  };
  h.api().saveOffsetPreparationPlan("offset-parallel-foundation", {
    material: { state: "draft" }, tooling: { state: "draft", draft: toolingDraft },
  }, readiness.offsetPlanSnapshot(original));
  let saved = h.api().orders[0];
  assert.equal(saved.id, original.id);
  assert.equal(saved.no, original.no);
  assert.deepEqual(saved.mainData, original.mainData);
  assert.equal(saved.stage, "offset-prepress");
  assert.equal(saved.offsetPreparationPlan.tooling.state, "draft");
  assert.deepEqual(saved.offsetPreparationPlan.tooling.draft, toolingDraft);
  assert.equal(saved.offsetPreparationRecords.length, 0);
  assert.equal(saved.processHistory.at(-1).process, "offset_preparation_plan");
  assert.equal(saved.processHistory.at(-1).status, "draft");

  const firstHistoryLength = saved.processHistory.length;
  assert.match(h.api().saveOffsetPreparationPlan(saved.id, {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "submitted" },
  }, readiness.offsetPlanSnapshot(saved)), /Use Update/);
  assert.equal(h.api().orders[0].processHistory.length, firstHistoryLength);
  assert.equal(h.api().orders[0].offsetPreparationRecords.length, 0);
});

test("Offset preparation submits project-owned Tooling and Varnish records in parallel with MI", () => {
  const h = providerHarness();
  const original = structuredClone(h.api().orders[0]);
  const toolingDraft = {
    mcNo: "MC-OFFSET-02", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Keep draft",
  };
  submitPlan(h, ["tooling", "varnish"], toolingDraft, "Create MI");
  let saved = h.api().orders[0];
  assert.equal(saved.id, original.id);
  assert.equal(saved.no, original.no);
  assert.deepEqual(saved.mainData, original.mainData);
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.materialRequests.length, 0);
  assert.deepEqual(saved.offsetPreparationRecords.map((record) => record.kind), ["material", "tooling", "varnish"]);
  assert.equal(saved.offsetToolingRecords.length, 1);
  assert.equal(saved.offsetToolingId, saved.offsetToolingRecords[0].id);
  assert.deepEqual(saved.offsetToolingRecords[0].mcNo, toolingDraft.mcNo);
  assert.deepEqual(saved.offsetPreparationPlan.tooling.draft, toolingDraft);
  assert.equal(saved.offsetPreparationPlan.varnish.state, "submitted");
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_preparation_plan"));
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_tooling" && entry.status === "submitted"));
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_varnish" && entry.status === "submitted"));
  assert.ok(saved.processHistory.some((entry) => entry.process === "Offset Material / Create MI"));

  const historyLength = saved.processHistory.length;
  submitPlan(h, ["tooling", "varnish"], toolingDraft, "Create MI");
  saved = h.api().orders[0];
  assert.equal(saved.offsetToolingRecords.length, 1);
  assert.equal(saved.processHistory.length, historyLength);

  assert.equal(saveStep(h, "tooling", { ...toolingDraft, status: "ordered", remark: "Supplier confirmed" }), "");
  saved = h.api().orders[0];
  assert.equal(saved.offsetToolingRecords[0].status, "ordered");
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_tooling" && entry.status === "ordered"));

  const mi = { miNumber: "OMI-2611001-1", status: "requested", requestedBy: "Offset User", requestDate: "2026-11-24", material: "Attempted override", quantity: "1000", unit: "pcs", remark: "Requested" };
  assert.equal(saveStep(h, "material", mi), "");
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.materialRequests.length, 1);
  assert.equal(saved.materialRequests[0].material, saved.mainData.boardQua || (saved.material === "-" ? "" : saved.material));
  assert.equal(saved.materialRequests[0].unit, "pcs");
  assert.equal(saved.workflow.materialReady, false);

  assert.equal(saveStep(h, "material", { ...mi, status: "released", remark: "Released" }), "");
  saved = h.api().orders[0];
  assert.equal(saved.materialRequests.length, 1);
  assert.equal(saved.materialRequests[0].status, "released");
  assert.equal(saved.workflow.materialReady, true);
  assert.equal(saved.processHistory.filter((entry) => entry.process === "material_request").length, 2);
});

test("Offset Varnish submission persists and is projected to its queue independently of Material and Tooling", () => {
  const preparation = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
  const h = providerHarness();
  submitPlan(h, ["varnish"], undefined, "Parallel varnish");

  const submitted = h.api().orders[0];
  assert.equal(submitted.stage, "offset-material-request");
  assert.equal(submitted.offsetPreparationPlan.varnish.state, "submitted");
  assert.equal(submitted.offsetPreparationRecords.filter((record) => record.kind === "varnish").length, 1);
  assert.equal(preparation.isOffsetVarnishQueueOrder(submitted), true);

  // Mirrors the localStorage JSON round-trip used after browser refresh.
  const restored = JSON.parse(JSON.stringify(submitted));
  assert.equal(preparation.isOffsetVarnishQueueOrder(restored), true);

  const withoutMaterialReadiness = {
    ...restored,
    workflow: { ...restored.workflow, materialReady: false },
    offsetToolingRecords: [],
    offsetToolingId: undefined,
  };
  assert.equal(preparation.isOffsetVarnishQueueOrder(withoutMaterialReadiness), true);
  assert.equal(preparation.isOffsetVarnishQueueOrder({
    ...withoutMaterialReadiness,
    offsetPreparationRecords: withoutMaterialReadiness.offsetPreparationRecords.filter((record) => record.kind !== "varnish"),
  }), false);
});

test("Details Prepress closes without submission and keeps Update validation and persistence", () => {
  let h = providerHarness();
  const order = h.api().orders[0];
  const states = [];
  let cursor = 0;
  let closed = 0;
  const mocks = new Map([
    ["./workflow-provider", { useOptionalWorkflowOrders: () => h.api() }],
    ["react", {
      ...require("react"),
      useId: () => "prepress-details",
      useEffect: () => {},
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
    }],
  ]);
  const { OffsetPrepressPreparationDetails } = loadTypeScriptWithMocks(
    path.resolve(__dirname, "../src/components/workflow/offset-prepress-preparation-details.tsx"), mocks,
  );
  const { ProjectHistoryModal } = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/components/workflow/project-history-modal.tsx"), mocks);
  function find(node, predicate) {
    if (!node) return undefined;
    if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
    if (predicate(node)) return node.props;
    return find(node.props?.children, predicate);
  }
  function render(disabled) {
    cursor = 0;
    const tree = OffsetPrepressPreparationDetails({ order });
    const byClass = (className) => find(tree, (node) => node.props?.className === className);
    const update = byClass("table-update-button");
    assert.equal(update.disabled, disabled);
    assert.equal(byClass("table-cancel-button"), undefined);
    return { update, byClass, alert: find(tree, (node) => node.props?.role === "alert") };
  }

  render(true).byClass("preparation-select").onChange({ target: { value: "material" } });
  const modal = ProjectHistoryModal({ order, offsetDetails: true, onClose: () => { closed++; } });
  const close = find(modal, (node) => node.props?.children === "Close");
  assert.equal(close.variant, "secondary");
  close.onClick();
  assert.equal(closed, 1);
  assert.equal(h.api().orders[0], order);
  states.length = 0;
  render(true).byClass("preparation-select").onChange({ target: { value: "material" } });
  render(false).byClass("preparation-add-button").onClick();
  render(true).byClass("table-action preparation-row-remove").onClick();
  h.storage.failWrites = true;
  render(false).update.onClick();
  assert.match(render(false).alert.children, /could not be saved to browser storage/);
  h.storage.failWrites = false;
  render(false).update.onClick();
  assert.equal(render(true).alert, undefined);
  assert.equal(closed, 1);

  states.length = 0;
  render(true);
  h = providerHarness(h.storage);
  states.length = 0;
  render(true);
});

test("Incoming Offset Details show the actual stage, fixed Next Preparation, and initial saved Prepress remark", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const h = providerHarness();
  const initial = h.api().orders[0];
  const mocks = new Map([
    ["@/components/workflow/workflow-provider", { useWorkflowOrders: () => h.api() }],
    ["@/components/board-types/board-types-provider", { useBoardTypes: () => ({ boardTypes: [] }) }],
  ]);
  const { OrderHistoryModal } = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/app/orders/components/order-history-modal.tsx"), mocks);
  const summary = (order) => renderToStaticMarkup(React.createElement(OrderHistoryModal, { order, onClose() {} }));
  const blank = summary(initial);
  assert.match(blank, /<span>Next Preparation<\/span><input[^>]+readonly=""[^>]+value="Prepress"/i);
  assert.match(blank, /<span>Remarks<\/span><input[^>]+readonly=""[^>]+value="-"/i);
  assert.match(blank, /Drawing Status/);
  assert.match(blank, /Add Issue/);
  assert.match(blank, />\s*Edit<\/button>/);
  assert.match(blank, /class="button button-secondary"[^>]*>Close<\/button>/);

  const record = (stage, process, remark) => ({ stage, process, remark, status: "updated", user: "Offset User", date: "2026-11-26T03:00:00.000Z" });
  const downstream = {
    ...initial, stage: "quality-control", process: "QC Checking",
    offsetPrepress: { remark: "Later Prepress note" },
    processHistory: [
      record("offset-prepress", "offset_preparation_plan", "Preparation plan remark"),
      record("offset-prepress", "offset_prepress", "First saved Prepress note"),
      record("offset-prepress", "offset_prepress", "Later Prepress note"),
      record("offset-material-request", "material_request", "MI note"),
    ],
  };
  const html = summary(downstream);
  assert.match(html, /<span>Current Process<\/span><strong>QC Checking<\/strong>/);
  assert.match(html, /<span>Remarks<\/span><input[^>]+value="First saved Prepress note"/);
  assert.match(summary({ ...downstream, processHistory: [] }), /<span>Remarks<\/span><input[^>]+value="Later Prepress note"/);
});

test("Incoming Offset Cancel uses project cancellation even when Update is disabled", () => {
  const h = providerHarness();
  const mocks = new Map([
    ["@/components/workflow/workflow-provider", { useWorkflowOrders: () => h.api() }],
    ["react", { ...require("react"), useState: (initial) => [initial, () => {}] }],
  ]);
  const { IncomingPreparationDetails } = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/app/orders/components/incoming-preparation-details.tsx"), mocks);
  function find(node, className) {
    if (!node) return undefined;
    if (Array.isArray(node)) return node.map((child) => find(child, className)).find(Boolean);
    return node.props?.className === className ? node.props : find(node.props?.children, className);
  }
  let requestedCancellation;
  const render = (order) => IncomingPreparationDetails({ order, onCancel: (candidate) => { requestedCancellation = candidate; },
    onUpdatePreparation: (id, values) => h.api().completeIncomingPreparation(id, values) });
  const original = h.api().orders[0];
  h.states[0] = [{ ...original, stage: "order" }];
  const update = find(render(h.api().orders[0]), "table-update-button");
  assert.equal(update.disabled, false);
  update.onClick();
  const moved = h.api().orders[0];
  assert.equal(moved.stage, "offset-prepress");
  const details = render(moved);
  assert.equal(find(details, "table-update-button").disabled, true);
  const cancel = find(details, "table-cancel-button");
  assert.equal(cancel.disabled, false);
  cancel.onClick();
  assert.equal(requestedCancellation, moved);
  assert.equal(h.api().orders[0], moved);
  h.api().cancelIncomingProject(requestedCancellation.id, "Confirmed cancellation");
  const cancelled = h.api().orders[0];
  assert.equal(cancelled.workflow.currentStatus, "cancelled");
  assert.equal(find(render(cancelled), "table-cancel-button").disabled, true);
});

test("Details Prepress keeps the legacy Varnish fixture as monitoring only without an extra submit action", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const sourceOrder = structuredClone(providerHarness().api().orders[0]);
  const fixture = {
    ...sourceOrder,
    id: "project-legacy-varnish-draft",
    no: "legacy-varnish-sample",
    stage: "offset-material-request",
    workflow: { ...sourceOrder.workflow, preparationType: "offset", currentStatus: "waiting", materialReady: true },
    offsetPreparationPlan: {
      projectId: "project-legacy-varnish-draft",
      material: { state: "submitted" },
      tooling: { state: "submitted" },
      varnish: { state: "draft" },
      remark: "",
      updatedAt: "2026-11-25T00:00:00.000Z",
      updatedBy: "Offset User",
    },
    offsetPreparationRecords: [
      { id: "material", projectId: "project-legacy-varnish-draft", kind: "material", state: "submitted", createdAt: "2026-11-25T00:00:00.000Z", updatedAt: "2026-11-25T00:00:00.000Z", updatedBy: "Offset User" },
      { id: "tooling", projectId: "project-legacy-varnish-draft", kind: "tooling", state: "submitted", createdAt: "2026-11-25T00:00:00.000Z", updatedAt: "2026-11-25T00:00:00.000Z", updatedBy: "Offset User" },
    ],
    processHistory: [{ process: "offset_preparation_plan", status: "submitted", date: "2026-11-25T00:00:00.000Z", user: "Offset User", changeSummary: "Offset Material preparation submitted: material, tooling.", remark: "" }],
  };
  const mocks = new Map([["@/data/orders", { orders: [fixture] }]]);
  const moduleCache = new Map();
  const providerModule = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"), mocks, moduleCache);
  const detailsModule = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/components/workflow/offset-prepress-preparation-details.tsx"), mocks, moduleCache);
  const html = renderToStaticMarkup(React.createElement(
    providerModule.WorkflowOrdersProvider,
    { currentUserName: "Offset User" },
    React.createElement(detailsModule.OffsetPrepressPreparationDetails, { order: fixture, onClose: () => {} }),
  ));

  assert.match(html, /Block \/ Spot Varnish/);
  assert.doesNotMatch(html, /Submit Varnish/);
});

test("Offset Varnish recovery restores only verified submissions without changing Material or Tooling", () => {
  const { reconcileOffsetVarnishSubmission } = loadTypeScript(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const h = providerHarness();
  const toolingDraft = {
    mcNo: "MC-VARNISH-01", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Tooling",
  };
  submitPlan(h, ["tooling", "varnish"], toolingDraft, "Submit Varnish");
  const submitted = h.api().orders[0];
  const withoutVarnishRecord = {
    ...submitted,
    offsetPreparationRecords: submitted.offsetPreparationRecords.filter((record) => record.kind !== "varnish"),
  };
  const restored = reconcileOffsetVarnishSubmission(withoutVarnishRecord, "2026-11-25T02:00:00.000Z");
  assert.equal(restored.offsetPreparationRecords.filter((record) => record.kind === "varnish").length, 1);
  assert.deepEqual(restored.materialRequests, withoutVarnishRecord.materialRequests);
  assert.deepEqual(restored.offsetToolingRecords, withoutVarnishRecord.offsetToolingRecords);
  assert.ok(restored.processHistory.some((entry) => /record restored/.test(entry.changeSummary)));
  assert.equal(reconcileOffsetVarnishSubmission(restored, "2026-11-25T02:01:00.000Z"), restored);

  const historicalDraft = {
    ...withoutVarnishRecord,
    offsetPreparationPlan: { ...withoutVarnishRecord.offsetPreparationPlan, varnish: { state: "draft" } },
    processHistory: [{ process: "offset_preparation_plan", status: "submitted", date: new Date(Date.parse(withoutVarnishRecord.offsetPreparationPlan.updatedAt) + 1000).toISOString(), user: "Offset User", changeSummary: "Offset Material preparation submitted: material, tooling.", remark: "" }],
  };
  const recoveredDraft = reconcileOffsetVarnishSubmission(historicalDraft, "2026-11-25T02:02:00.000Z");
  assert.equal(recoveredDraft.offsetPreparationPlan.varnish.state, "submitted");
  assert.equal(recoveredDraft.offsetPreparationRecords.filter((record) => record.kind === "varnish").length, 1);
  assert.equal(recoveredDraft.offsetVarnish?.completion, undefined);
  assert.equal(recoveredDraft.stage, historicalDraft.stage);

  const unverifiedDraft = {
    ...historicalDraft,
    offsetPreparationPlan: { ...historicalDraft.offsetPreparationPlan, material: { state: "draft" } },
    offsetPreparationRecords: historicalDraft.offsetPreparationRecords.filter((record) => record.kind !== "material"),
    processHistory: [{ process: "offset_preparation_plan", status: "draft", date: new Date(Date.parse(withoutVarnishRecord.offsetPreparationPlan.updatedAt) + 1000).toISOString(), user: "Design", changeSummary: "Offset preparation plan saved as draft.", remark: "" }],
  };
  assert.equal(reconcileOffsetVarnishSubmission(unverifiedDraft, "2026-11-25T02:03:00.000Z"), unverifiedDraft);

  const evidence = historicalDraft.processHistory[0];
  for (const invalid of [
    { ...historicalDraft, processHistory: [{ ...evidence, date: "bad date" }] },
    { ...historicalDraft, processHistory: [{ ...evidence, user: "Different actor" }] },
    { ...historicalDraft, processHistory: [{ ...evidence, date: new Date(Date.parse(evidence.date) + 86400000).toISOString() }] },
    { ...historicalDraft, processHistory: [{ ...evidence, process: "offset_varnish" }] },
    { ...historicalDraft, offsetPreparationRecords: [] },
    { ...historicalDraft, offsetPreparationPlan: { ...historicalDraft.offsetPreparationPlan, projectId: "another-project" } },
    { ...withoutVarnishRecord, processHistory: [] },
  ]) {
    assert.equal(reconcileOffsetVarnishSubmission(invalid, "2026-11-25T02:03:00.000Z"), invalid);
  }

  const storage = memoryStorage();
  storage.setItem("cots-workflow-orders-v1", JSON.stringify([historicalDraft]));
  const hydrated = providerHarness(storage).api().orders[0];
  const reloaded = providerHarness(storage).api().orders[0];
  assert.equal(hydrated.offsetPreparationPlan.varnish.state, "submitted");
  assert.equal(reloaded.offsetPreparationRecords.filter((record) => record.kind === "varnish").length, 1);
  assert.equal(reloaded.processHistory.filter((entry) => entry.user === "System").length, 1);
});

function submittedVarnishHarness() {
  const harness = providerHarness();
  const id = harness.api().orders[0].id;
  submitPlan(harness, ["varnish"], undefined, "Prepress handoff");
  const { offsetVarnishSnapshot } = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
  const { preparationChecks } = loadTypeScript(path.resolve(__dirname, "../src/app/orders/components/incoming-orders-table.tsx"));
  const current = () => harness.api().orders[0];
  const save = (status, remark, action = "draft", snapshot = offsetVarnishSnapshot(current())) =>
    harness.api().saveOffsetVarnish(id, { status, remark }, action, snapshot);
  const check = (order = current()) => preparationChecks(order).find((item) => item.label === "Block / Spot Varnish")?.state;
  return { ...harness, id, current, save, check, offsetVarnishSnapshot };
}

test("Varnish Draft and Continue are independent, validated, and persist across hydration", () => {
  const h = submittedVarnishHarness();
  const original = h.current();
  assert.equal(original.offsetVarnish.status, "not_ordered");
  assert.match(h.save("Revision Required", "  "), /select a Varnish status/i);
  assert.match(h.save("Unknown", ""), /select a Varnish status/i);
  assert.match(h.save("ordered", "", "continue"), /must be Received/);
  assert.equal(h.current(), original);
  h.states[0] = [{ ...original, offsetPreparationRecords: [] }];
  assert.match(h.save("received", "", "continue"), /submitted Varnish/);
  h.states[0] = [original];

  assert.equal(h.save("received", "Artwork confirmed"), "");
  const draft = h.current();
  assert.equal(draft.offsetVarnish.completion, undefined);
  assert.equal(h.check(), "empty");
  assert.match(draft.processHistory.at(-1).changeSummary, /Save Draft/);

  assert.equal(h.save("received", "Artwork confirmed", "continue"), "");
  const saved = h.current();
  assert.equal(saved.stage, original.stage);
  assert.deepEqual(saved.mainData, original.mainData, "master varnish specification is untouched");
  assert.deepEqual(saved.materialRequests, original.materialRequests, "Material is untouched");
  assert.deepEqual(saved.offsetToolingRecords, original.offsetToolingRecords, "Tooling is untouched");
  assert.equal(saved.processHistory.length, original.processHistory.length + 2);
  const event = saved.processHistory.at(-1);
  assert.match(event.changeSummary, /Save & Continue/);
  assert.equal(event.remark, "Artwork confirmed");
  assert.equal(saved.offsetVarnish.completion.actor, "Offset User");
  assert.equal(saved.offsetVarnish.completion.timestamp, event.date);
  assert.equal(h.check(), "complete");
  assert.equal(h.check({ ...saved, offsetPreparationRecords: [] }), "empty");
  assert.equal(h.check({ ...saved, offsetVarnish: { ...saved.offsetVarnish, completion: undefined } }), "empty");
  const reloaded = providerHarness(h.storage).api().orders[0];
  assert.deepEqual(reloaded.offsetVarnish, saved.offsetVarnish);
  assert.equal(reloaded.stage, original.stage);
  assert.equal(h.check(reloaded), "complete");
});

test("Varnish rejects stale drafts and locks after a single successful Continue", () => {
  const h = submittedVarnishHarness();
  const originalSnapshot = h.offsetVarnishSnapshot(h.current());
  const api = h.api();
  assert.equal(api.saveOffsetVarnish(h.id, { status: "received", remark: "" }, "draft", originalSnapshot), "");
  assert.match(api.saveOffsetVarnish(h.id, { status: "received", remark: "" }, "continue", originalSnapshot), /changed/);
  assert.equal(h.save("received", "", "continue"), "");
  const continued = h.current();
  assert.match(h.save("received", "", "continue"), /cannot be edited/);
  assert.match(h.save("received", ""), /cannot be edited/);
  assert.equal(h.current(), continued);
  assert.match(h.save("not_ordered", "stale", "draft", originalSnapshot), /cannot be edited/);
  assert.match(h.save("received", "Remark only"), /cannot be edited/);
  assert.deepEqual(h.current().offsetVarnish.completion, continued.offsetVarnish.completion);
  assert.equal(h.check(), "complete");
  assert.match(h.save("ordered", ""), /cannot be edited/);
  assert.equal(h.current(), continued);
});

test("Varnish preserves completed coating specifications and blocks preparation edits at Press, QC and terminal stages", () => {
  const h = submittedVarnishHarness();
  h.save("received", "", "continue");
  const continued = h.current();
  const editMaster = (varnish) => h.api().editProject(h.id, {
    preparationType: "offset", mainData: { ...h.current().mainData, varnish }, projectDate: "", deadline: "",
  });
  assert.equal(h.check({ ...continued, mainData: { ...continued.mainData, varnish: "OPV Spot Varnish" } }), "empty");
  editMaster("OPV Spot Varnish");
  assert.equal(h.current().mainData.varnish, continued.mainData.varnish);
  assert.deepEqual(h.current().offsetVarnish.completion, continued.offsetVarnish.completion);
  assert.equal(h.check(), "complete");
  assert.match(h.save("received", "", "continue", h.offsetVarnishSnapshot(continued)), /cannot be edited/);
  const beforeHandoff = h.current();

  for (const [stage, currentStatus] of [
    ["offset-press", "waiting"], ["quality-control", "in_progress"], ["fa-report", "in_progress"],
    ["completed", "completed"], ["completed", "cancelled"],
  ]) {
    const locked = { ...beforeHandoff, stage, workflow: { ...beforeHandoff.workflow, currentStatus } };
    h.states[0] = [locked];
    assert.match(h.save("received", "blocked", "continue"), /cannot be edited|active project/);
    assert.match(h.save("ordered", "blocked"), /cannot be edited|active project/);
    assert.equal(h.current(), locked);
    editMaster("OPV Block Varnish");
    assert.equal(h.current().mainData.varnish, locked.mainData.varnish);
    assert.deepEqual(h.current().offsetVarnish, locked.offsetVarnish);
  }
});

test("Varnish keeps the last saved snapshot when persistence fails and rejects a changed storage snapshot", () => {
  const h = submittedVarnishHarness();
  const key = "cots-workflow-orders-v1";
  const original = h.current();
  const lastSaved = h.storage.getItem(key);
  h.storage.failWrites = true;
  assert.match(h.save("received", "", "continue"), /could not be saved/);
  assert.equal(h.current(), original);
  assert.equal(h.storage.getItem(key), lastSaved);
  h.storage.failWrites = false;

  h.storage.setItem(key, JSON.stringify([{ ...original, updatedAt: "external edit" }]));
  assert.match(h.save("received", "", "continue"), /another tab/);
  assert.match(h.save("not_ordered", ""), /another tab/);
  assert.equal(h.current(), original);
});

test("Shared workflow persistence merges edits on different projects and rejects stale edits, cancel, and Update", () => {
  const key = "cots-workflow-orders-v1";
  const storage = memoryStorage();
  const fixture = providerHarness().api().orders[0];
  const second = { ...fixture, id: "second-project", no: "2611002" };
  storage.setItem(key, JSON.stringify([fixture, second]));
  const tabA = providerHarness(storage);
  const tabB = providerHarness(storage);
  const firstA = tabA.api().orders[0];
  const firstB = tabB.api().orders[0];
  const edit = (order, remark) => ({
    mainData: { ...order.mainData, remark },
    projectDate: "2026-11-28",
    deadline: "2026-12-01",
    preparationType: "offset",
  });

  assert.equal(saveReadyStep(tabA, "prepress"), "");
  const completed = JSON.parse(storage.getItem(key))[0];
  assert.ok(completed.offsetPreparationProgress.prepress.completion);
  assert.equal(tabB.api().editProject(second.id, edit(second, "Independent edit")), "");
  const latest = storage.getItem(key);
  const [savedFirst, savedSecond] = JSON.parse(latest);
  assert.deepEqual(savedFirst, completed);
  assert.equal(savedSecond.mainData.remark, "Independent edit");
  assert.match(tabB.api().editProject(firstB.id, edit(firstB, "Stale edit")), /another tab.*Reload/);
  assert.match(tabB.api().cancelIncomingProject(firstB.id, "Stale cancellation"), /another tab.*Reload/);
  assert.match(tabB.api().submitOffsetMaterialPreparation(firstB.id, { rows: [], remark: "" },
    readiness.offsetPlanSnapshot(firstB)), /another tab.*Reload/);
  assert.equal(storage.getItem(key), latest);

  storage.failWrites = true;
  assert.match(tabA.api().editProject(firstA.id, edit(firstA, "Unsaved edit")), /could not be saved/);
  assert.equal(storage.getItem(key), latest);
  assert.equal(tabA.api().orders[0].mainData.remark, completed.mainData.remark);
  storage.failWrites = false;
  const reloaded = providerHarness(storage).api().orders;
  assert.deepEqual(reloaded[0].processHistory, completed.processHistory);
  assert.deepEqual(reloaded[0].offsetPreparationProgress, completed.offsetPreparationProgress);
  assert.equal(reloaded[1].mainData.remark, "Independent edit");
});

test("Varnish UI keeps the existing fields and exposes Draft and Received-only Continue", () => {
  const modalSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-varnish-modal.tsx"), "utf8");
  assert.match(modalSource, /<span>Coating Side<\/span>[^\n]+<\/label>\s*<label className="modal-field"><span>Varnish Status[^\n]+<\/label>\s*<label className="modal-field modal-field-full"><span>Remark/);
  const detailsSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/offset-varnish-details.tsx"), "utf8");
  const tableSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/order-table.tsx"), "utf8");
  assert.match(modalSource, /modal-form-grid/);
  for (const label of ["Sample Number", "MC No. \/ Code", "Customer", "Description \/ Component", "PIC", "Target Completion Date", "Varnish Type", "Lamination", "Coating Side", "Varnish Status", "Remark"]) assert.match(modalSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(modalSource, /Save Draft/);
  assert.match(modalSource, /disabled=\{!canEdit \|\| Boolean\(continueError\)\}[^\n]+Save &amp; Continue/);
  assert.match(modalSource, /if \(saveError\) \{ setValidationError\(saveError\); return; \}/);
  assert.doesNotMatch(modalSource, /Complete &amp; Continue|advanceOrder/);
  assert.match(modalSource, /validateOffsetVarnishValues/);
  assert.match(detailsSource, /Varnish Status/);
  assert.match(detailsSource, /Remark/);
  assert.match(tableSource, /offsetVarnish\?\.remark\.trim\(\) \|\| "-"/);
  assert.doesNotMatch(tableSource, /previousProcess = "offset_varnish"/);
});

const readyPrepress = { noJoPnCode: "", idPlate: "PLATE", plateType: "CD102", fgQuantity: "100", proofColor: "Ready", plot: "Ready", plate: "Ready", ink: "Ready", remark: "" };
const readyMaterial = { miNumber: "MI-TEST", status: "released", requestedBy: "Offset User", requestDate: "2026-11-26", material: "", quantity: "100", unit: "sheet", remark: "" };
const readyTooling = { mcNo: "MC", status: "received", grammage: "310 gsm", priority: "", machine: "", orderDate: "", receivedDate: "2026-11-26", supplier: "Vendor", invoiceNumber: "INV", price: "100", remark: "" };

const printingEvents = (order) => order.processHistory.filter((entry) => entry.process === "offset_printing_routed");
const { offsetVarnishSnapshot } = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
const readySteps = { prepress: readyPrepress, material: readyMaterial, tooling: readyTooling, varnish: { status: "received", remark: "" } };
const { isInOffsetQueue, isOffsetQueueCompleted } = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-queue.ts"));
const offsetStages = ["offset-prepress", "offset-material-request", "offset-plate", "offset-varnish", "offset-press"];

function saveReadyStep(h, step, action = "continue") {
  if (step !== "varnish") return saveStep(h, step, readySteps[step], action);
  const api = h.api();
  const order = api.orders[0];
  return api.saveOffsetVarnish(order.id, readySteps.varnish, action, offsetVarnishSnapshot(order));
}

test("Offset queues retain the same project and per-menu completions across Printing, QC, completion, and reload", () => {
  const h = providerHarness();
  const order = () => h.api().orders[0];
  const original = order();
  const membership = (project) => offsetStages.filter((stage) => isInOffsetQueue(project, stage));
  const completed = (project) => offsetStages.filter((stage) => isOffsetQueueCompleted(project, stage));
  assert.deepEqual(membership(original), ["offset-prepress"]);
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "not_ordered" }), "");
  assert.deepEqual(membership(order()), offsetStages.slice(0, -1));
  assert.equal(saveReadyStep(h, "varnish", "draft"), "");
  assert.equal(saveReadyStep(h, "tooling", "draft"), "");
  assert.deepEqual(completed(order()), []);
  assert.equal(saveReadyStep(h, "tooling"), "");
  assert.deepEqual(completed(order()), ["offset-plate"]);
  for (const step of ["prepress", "material", "varnish"]) assert.equal(saveReadyStep(h, step), "");
  assert.deepEqual(membership(order()), offsetStages);
  assert.deepEqual(completed(order()), offsetStages.slice(0, -1));
  assert.equal(h.api().completeOffsetPrinting(order().id, "Printed and sent to QC", order().updatedAt), "");
  assert.equal(order().stage, "quality-control");
  assert.deepEqual(completed(order()), offsetStages);

  for (const stage of ["fa-report", "submit-sample", "sample-completed", "completed"]) {
    if (stage === "sample-completed") h.api().submitSample(order().id, "2026-11-28");
    else if (stage === "completed") h.api().completeSampleDecision(order().id, "approve", "Offset User", "");
    else h.api().advanceOrder(order().id);
    assert.equal(order().stage, stage);
    assert.deepEqual(membership(order()), offsetStages);
    assert.deepEqual(completed(order()), offsetStages);
  }
  const terminal = order();
  const reloaded = providerHarness(h.storage).api().orders;
  assert.equal(reloaded.filter((project) => project.id === original.id).length, 1);
  assert.equal(reloaded[0].no, original.no);
  assert.deepEqual(reloaded[0].mainData, original.mainData);
  assert.deepEqual(reloaded[0].offsetPreparationRecords, terminal.offsetPreparationRecords);
  assert.deepEqual(reloaded[0].processHistory, JSON.parse(JSON.stringify(terminal.processHistory)));
  assert.deepEqual(membership(reloaded[0]), offsetStages);
  assert.deepEqual(completed(reloaded[0]), offsetStages);

  h.api().cancelIncomingProject(order().id, "Retain completed records");
  assert.equal(order().workflow.currentStatus, "cancelled");
  const cancelled = providerHarness(h.storage).api().orders[0];
  assert.equal(cancelled.workflow.currentStatus, "cancelled");
  assert.deepEqual(membership(cancelled), offsetStages);
  assert.deepEqual(completed(cancelled), offsetStages);
});

test("Offset queue admission avoids unselected branches and legacy completion requires recorded proof", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, []), "");
  for (const step of ["prepress", "material"]) assert.equal(saveReadyStep(h, step), "");
  const printed = h.api().orders[0];
  assert.equal(isInOffsetQueue(printed, "offset-plate"), false);
  assert.equal(isInOffsetQueue(printed, "offset-varnish"), false);

  const date = "2026-11-26T03:00:00.000Z";
  const event = (process, extra = {}) => ({ process, date, user: "Offset User", status: "updated", remark: "", ...extra });
  const legacy = {
    ...printed, stage: "quality-control", offsetPreparationPlan: undefined, offsetPreparationProgress: undefined,
    offsetPreparationRecords: undefined, offsetPrepress: undefined, materialRequests: [],
    processHistory: [event("Prepress / Pra-Cetak"), event("Offset Material Request"), event("QC Checking")],
  };
  assert.deepEqual(offsetStages.filter((stage) => isInOffsetQueue(legacy, stage)), offsetStages.slice(0, 2));
  assert.deepEqual(offsetStages.filter((stage) => isOffsetQueueCompleted(legacy, stage)), []);
  const entries = [event("Press / Cetak"), event("QC Checking")];
  assert.equal(isInOffsetQueue({ ...legacy, processHistory: entries }, "offset-press"), true);
  assert.equal(isOffsetQueueCompleted({ ...legacy, processHistory: entries }, "offset-press"), false);
  const handoff = event("handoff_details_updated");
  assert.equal(isOffsetQueueCompleted({ ...legacy, processHistory: [entries[0], handoff, entries[1]] }, "offset-press"), true);
  assert.equal(isOffsetQueueCompleted({ ...legacy, processHistory: [entries[0], { ...handoff, stage: "offset-varnish" }, entries[1]] }, "offset-press"), false);
});

test("Offset All and Completed cards use unpaginated menu counts and keep historical Details accessible", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const { OrderTable } = loadTypeScript(path.resolve(__dirname, "../src/components/workflow/order-table.tsx"));
  const { ProjectHistoryModal } = loadTypeScript(path.resolve(__dirname, "../src/components/workflow/project-history-modal.tsx"));
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], readyTooling), "");
  for (const step of ["prepress", "material", "tooling", "varnish"]) assert.equal(saveReadyStep(h, step), "");
  const printing = h.api().orders[0];
  assert.equal(h.api().completeOffsetPrinting(printing.id, "Printed and sent to QC", printing.updatedAt), "");
  const completed = h.api().orders[0];
  const draft = { ...printing, id: "legacy-draft", no: "2611002", offsetPreparationProgress: undefined,
    offsetVarnish: { ...printing.offsetVarnish, completion: undefined },
    offsetPreparationRecords: printing.offsetPreparationRecords.map((record) => ({ ...record, projectId: "legacy-draft" })),
    offsetPreparationPlan: { ...printing.offsetPreparationPlan, projectId: "legacy-draft" },
  };
  const states = [];
  let cursor = 0;
  const mocks = new Map([
    ["@/components/workflow/workflow-provider", { useWorkflowOrders: () => ({ orders: [completed, draft] }) }],
    ["react", {
      ...require("react"), useMemo: (factory) => factory(), useCallback: (callback) => callback, useEffect: () => {},
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
        return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
    }],
  ]);
  const { WorkflowStageView } = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), mocks);
  function find(node, component) {
    if (!node) return undefined;
    if (Array.isArray(node)) return node.map((child) => find(child, component)).find(Boolean);
    return node.type?.name === component ? node.props : find(node.props?.children, component);
  }
  for (const stage of offsetStages) {
    states.length = 0;
    const render = () => { cursor = 0; return WorkflowStageView({ stage, convertingTableFilter: stage === "offset-plate" ? "offset-tooling" : undefined }); };
    const all = render();
    const cards = find(all, "RecordFilterCards");
    assert.equal(cards.totalCount, 2);
    assert.equal(cards.countForValue("completed"), 1);
    assert.deepEqual(find(all, "OrderTable").orders, [completed, draft]);
    if (stage === "offset-plate") {
      assert.equal(cards.countForValue("received"), 2);
      cards.onChange("received");
      assert.deepEqual(find(render(), "OrderTable").orders, [completed, draft]);
    }
    cards.onChange("completed");
    const filtered = render();
    assert.equal(find(filtered, "RecordFilterCards").selectedValue, "completed");
    const table = find(filtered, "OrderTable");
    assert.deepEqual(table.orders, [completed]);
    table.onViewOrder(completed);
    const details = find(render(), "ProjectHistoryModal");
    assert.equal(details.order, completed);
    if (stage === "offset-press" || stage === "offset-material-request") {
      const html = renderToStaticMarkup(React.createElement(ProjectHistoryModal, details));
      assert.match(html, stage === "offset-press" ? /Press \/ Printing - Latest Input/ : /Material Request \/ MI Details - Latest Input/);
    }

    const html = renderToStaticMarkup(React.createElement(OrderTable, table));
    assert.match(html, /<button[^>]+aria-label="Edit 2611001"[^>]+disabled/);
    assert.match(html, /<button[^>]+aria-label="View details and history for 2611001"(?![^>]*disabled)[^>]*>/);
  }
});

test("Offset Continue confirmation defers saves, and Cancel keeps all five editors open", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "not_ordered" }), "");
  for (const step of ["prepress", "material", "tooling", "varnish"]) assert.equal(saveReadyStep(h, step, "draft"), "");
  const states = [];
  let cursor = 0;
  let closed = 0;
  const react = {
    ...require("react"),
    useId: () => "test-dialog",
    useEffect: () => {},
    useRef: () => ({ current: { open: true, close() { this.open = false; } } }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
  };
  const mocks = new Map([["react", react], ["@/components/workflow/workflow-provider", { useWorkflowOrders: () => h.api() }]]);
  function find(node, predicate) {
    if (!node) return undefined;
    if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
    return predicate(node) ? node : find(node.props?.children, predicate);
  }
  const current = () => h.api().orders[0];
  const cases = [
    ["offset-prepress-modal.tsx", "OffsetPrepressModal"],
    ["offset-material-request-modal.tsx", "OffsetMaterialRequestModal"],
    ["offset-tooling-management-modals.tsx", "OffsetToolingEditModal"],
    ["offset-varnish-modal.tsx", "OffsetVarnishModal"],
    ["offset-stage-modal.tsx", "OffsetStageModal"],
  ];
  for (const [file, name] of cases) {
    const before = current();
    const previouslyClosed = closed;
    const { [name]: Modal } = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/app/offset/components", file), mocks);
    states.length = 0;
    const render = () => { cursor = 0; return Modal({ order: before, onClose: () => { closed++; } }); };
    const submit = () => find(render(), (node) => node.type === "form").props.onSubmit({
      preventDefault() {}, nativeEvent: { submitter: { getAttribute: () => "continue" } },
    });
    const confirmation = () => find(render(), (node) => node.type?.name === "OffsetContinueConfirmation");
    const dialog = () => { const element = confirmation(); return element.type(element.props); };
    submit();
    assert.equal(current(), before);
    const alert = dialog();
    assert.equal(alert.props.role, "alertdialog");
    assert.ok(find(alert, (node) => node.props?.children === "Are you sure you want to save and continue? Once submitted, this record will be locked and can no longer be edited."));
    find(alert, (node) => node.props?.children === "Cancel").props.onClick();
    assert.equal(confirmation(), undefined);
    assert.equal(current(), before);
    assert.equal(closed, previouslyClosed);
    submit();
    find(dialog(), (node) => node.props?.children === "Confirm").props.onClick();
    assert.ok(current().processHistory.length > before.processHistory.length);
    assert.equal(closed, previouslyClosed + 1);
  }
  assert.equal(current().stage, "quality-control");
});

test("Prepress remains locked after reload while Update Preparation is still available", () => {
  const h = providerHarness();
  assert.equal(saveReadyStep(h, "prepress"), "");
  const reloaded = providerHarness(h.storage);
  const order = reloaded.api().orders[0];
  assert.equal(order.stage, "offset-prepress");
  assert.equal(readiness.canEditOffsetPreparation(order, "prepress"), false);
  assert.equal(readiness.canChangeOffsetPreparationPlan(order), true);
  reloaded.api().advanceOrder(order.id, { description: "Bypass plan" });
  reloaded.api().updateOrder(order.id, { material: "Changed material", offsetPreparationProgress: {} });
  const afterEdit = reloaded.api().orders[0];
  assert.equal(afterEdit.stage, "offset-prepress");
  assert.equal(afterEdit.mainData.boardQua, order.mainData.boardQua);
  assert.equal(readiness.canEditOffsetPreparation(afterEdit, "prepress"), false);
  assert.equal(submitPlan(reloaded, []), "");
  assert.deepEqual(reloaded.api().orders[0].offsetPreparationProgress.prepress, order.offsetPreparationProgress.prepress);
  assert.equal(saveReadyStep(reloaded, "material"), "");
  assert.equal(reloaded.api().orders[0].stage, "offset-press");
});

test("Printing handoff is atomic and rejects stale, generic, and repeated submissions", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, []), "");
  for (const step of ["prepress", "material"]) assert.equal(saveReadyStep(h, step), "");
  const api = h.api();
  const order = api.orders[0];
  api.advanceOrder(order.id, { description: "Bypass" });
  api.moveOrderToStage(order.id, "quality-control");
  assert.equal(h.api().orders[0], order);
  assert.match(api.completeOffsetPrinting(order.id, "", "stale"), /changed/);
  assert.match(api.completeOffsetPrinting(order.id, 42, order.updatedAt), /valid Process Notes/);
  h.storage.failWrites = true;
  assert.match(api.completeOffsetPrinting(order.id, "Note", order.updatedAt), /could not be saved/);
  assert.equal(h.api().orders[0], order);
  assert.equal(readiness.canEditOffsetPrinting(order), true);
  h.storage.failWrites = false;
  assert.equal(api.completeOffsetPrinting(order.id, "Note", order.updatedAt), "");
  assert.match(api.completeOffsetPrinting(order.id, "Note", order.updatedAt), /cannot be edited/);
  const reloaded = providerHarness(h.storage);
  const saved = reloaded.api().orders[0];
  assert.equal(saved.stage, "quality-control");
  assert.equal(saved.processHistory.filter((entry) => entry.stage === "offset-press" && entry.process === "handoff_details_updated").length, 1);
  assert.equal(readiness.canEditOffsetPrinting(saved), false);
  assert.match(reloaded.api().completeOffsetPrinting(order.id, "Note", saved.updatedAt), /cannot be edited/);
});

const designSpk = {
  customer: "Existing customer", productName: "Offset readiness", fgQuantity: "100", paperType: "Ivory",
  grammage: "310", planoSize: "65 x 100 cm", up: "2", waste: "0", planoSheets: "50", colors: "4C",
  machine: "CD102", finishing: "Varnish", deadline: "2026-12-02", remark: "SPK", status: "design_offset",
};

test("Direct Offset transitions cannot bypass readiness, create an unselected queue, or relabel an active project", () => {
  const h = providerHarness();
  const key = "cots-workflow-orders-v1";
  assert.equal(submitPlan(h, []), "");
  const api = h.api();
  const order = api.orders[0];
  const stored = h.storage.getItem(key);
  assert.equal(readiness.evaluateOffsetReadiness(order).branches.material, "invalid-data");
  for (const stage of ["offset-design", "offset-prepress", "offset-plate", "offset-varnish", "offset-press",
    "sample-progress", "quality-control", "fa-report", "submit-sample", "sample-completed", "completed"]) {
    api.moveOrderToStage(order.id, stage, { description: "Bypass" });
  }
  api.advanceOrder(order.id, { description: "Bypass" });
  api.saveOffsetSpk(order.id, designSpk, true);
  api.saveOffsetSpk(order.id, designSpk, false);
  api.createOffsetTooling(order.id, readyTooling);
  assert.match(api.saveOffsetVarnish(order.id, { status: "received", remark: "" }, "continue", offsetVarnishSnapshot(order)), /submitted Varnish/);
  assert.match(api.completeOffsetPrinting(order.id, "", order.updatedAt), /cannot be edited/);
  assert.match(api.editProject(order.id, { preparationType: "converting" }), /preparation type cannot be changed/);
  assert.equal(h.api().orders[0], order);
  assert.equal(h.storage.getItem(key), stored);
  for (const stage of ["offset-plate", "offset-varnish"]) {
    assert.equal(isInOffsetQueue({ ...order, stage }, stage), false);
  }

  const legacyPress = { ...order, stage: "offset-press", offsetPreparationPlan: undefined, offsetPreparationRecords: [] };
  h.storage.setItem(key, JSON.stringify([legacyPress]));
  const legacy = providerHarness(h.storage);
  const existing = legacy.api().orders[0];
  const legacyStored = h.storage.getItem(key);
  assert.equal(existing.stage, "offset-press");
  assert.equal(readiness.canEditOffsetPrinting(existing), false);
  assert.match(legacy.api().completeOffsetPrinting(existing.id, "", existing.updatedAt), /valid completion/);
  assert.equal(h.storage.getItem(key), legacyStored);

  h.storage.setItem(key, JSON.stringify([{ ...order, stage: "quality-control",
    workflow: { ...order.workflow, preparationType: "converting" } }]));
  const converting = providerHarness(h.storage);
  const other = converting.api().orders[0];
  converting.api().moveOrderToStage(other.id, "offset-design");
  assert.equal(converting.api().orders[0], other);
  converting.api().updateOrder(other.id, { stage: "offset-plate", workflow: order.workflow });
  assert.equal(converting.api().orders[0].stage, other.stage);
  assert.equal(converting.api().orders[0].workflow.preparationType, "converting");
  assert.match(converting.api().editProject(other.id, { preparationType: "offset" }), /preparation type cannot be changed/);
});

test("Legacy Offset Design SPK can enter Prepress only through a valid design submission", () => {
  const storage = memoryStorage();
  const key = "cots-workflow-orders-v1";
  const original = providerHarness().api().orders[0];
  storage.setItem(key, JSON.stringify([{ ...original, stage: "offset-design" }]));
  const h = providerHarness(storage);
  const starting = h.api().orders[0];
  h.api().advanceOrder(starting.id);
  h.api().moveOrderToStage(starting.id, "offset-prepress");
  h.api().saveOffsetSpk(starting.id, { ...designSpk, machine: "" }, true);
  assert.equal(h.api().orders[0], starting);
  h.api().saveOffsetSpk(starting.id, designSpk, true);
  const prepress = h.api().orders[0];
  assert.equal(prepress.stage, "offset-prepress");
  assert.equal(prepress.offsetSpks.length, 1);
  h.api().saveOffsetSpk(starting.id, designSpk, true);
  assert.equal(h.api().orders[0], prepress);
});

test("All 38 preparation completion orders route once and require Printing completion before QC", () => {
  function permutations(steps) {
    if (!steps.length) return [[]];
    return steps.flatMap((step) => permutations(steps.filter((item) => item !== step)).map((rest) => [step, ...rest]));
  }
  let tested = 0;
  for (const optional of [[], ["tooling"], ["varnish"], ["tooling", "varnish"]]) {
    for (const sequence of permutations(["prepress", "material", ...optional])) {
      const h = providerHarness();
      const order = () => h.api().orders[0];
      const initial = order();
      assert.equal(submitPlan(h, optional, optional.includes("tooling") ? readyTooling : undefined), "");
      for (const step of sequence) {
        assert.equal(order().stage, "offset-material-request", sequence.join(" → "));
        h.api().moveOrderToStage(order().id, "quality-control");
        assert.equal(saveReadyStep(h, step), "");
      }
      const printing = order();
      assert.equal(printing.stage, "offset-press");
      assert.equal(printingEvents(printing).length, 1);
      for (const [branch, stage] of [["tooling", "offset-plate"], ["varnish", "offset-varnish"]]) {
        assert.equal(isInOffsetQueue(printing, stage), optional.includes(branch));
      }
      h.api().advanceOrder(printing.id);
      h.api().moveOrderToStage(printing.id, "quality-control");
      assert.equal(order(), printing);
      assert.equal(h.api().completeOffsetPrinting(printing.id, "", printing.updatedAt), "");
      const after = providerHarness(h.storage).api().orders[0];
      assert.equal(after.stage, "quality-control");
      assert.equal(after.id, initial.id);
      assert.equal(after.no, initial.no);
      assert.equal(printingEvents(after).length, 1);
      assert.equal(isOffsetQueueCompleted(after, "offset-press"), true);
      tested++;
    }
  }
  assert.equal(tested, 38);
});

test("Offset partial drafts persist while direct Continue and malformed draft calls are rejected", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "not_ordered" }), "");
  const cases = [
    ["prepress", { ...readyPrepress, proofColor: "", ink: "Waiting", idPlate: "", plateType: "", fgQuantity: "" }, { fgQuantity: "-1" }, /Remark is required.*Ready/],
    ["material", { ...readyMaterial, requestDate: "", quantity: "", unit: "" }, { quantity: "ten" }, /Request Date and Request Quantity are required/],
    ["tooling", { ...readyTooling, receivedDate: "", supplier: "", invoiceNumber: "", price: "" }, { price: "-10" }, /Complete Received Date, Supplier, Invoice Number, and Price/],
    ["varnish", { status: "ordered", remark: "" }, { remark: 10 }, /must be Received/],
  ];
  const current = () => h.api().orders[0];
  const save = (step, values, action) => step === "varnish"
    ? h.api().saveOffsetVarnish(current().id, values, action, offsetVarnishSnapshot(current()))
    : saveStep(h, step, values, action);
  for (const [step, partial, invalid, continueReason] of cases) {
    assert.equal(save(step, partial, "draft"), "");
    const saved = current();
    const reloaded = providerHarness(h.storage).api().orders[0];
    const record = step === "varnish" ? reloaded.offsetVarnish : readiness.offsetPreparationRecord(reloaded, step);
    assert.equal(record.remark, partial.remark);
    assert.notEqual(readiness.evaluateOffsetReadiness(reloaded).branches[step], "ready");
    assert.match(save(step, partial, "continue"), continueReason);
    assert.notEqual(save(step, { ...partial, ...invalid }, "draft"), "");
    assert.equal(current(), saved);
  }
  assert.equal(current().workflow.materialReady, false);
  assert.equal(save("prepress", { ...readyPrepress, idPlate: "", plateType: "", fgQuantity: "" }, "continue"), "");
  for (const step of ["material", "tooling", "varnish"]) assert.equal(saveReadyStep(h, step), "");
  assert.equal(current().stage, "offset-press");
  assert.equal(h.api().completeOffsetPrinting(current().id, "", current().updatedAt), "");
  assert.equal(current().stage, "quality-control");
  assert.ok(current().processHistory.some((record) => record.stage === "offset-press" && record.process === "handoff_details_updated"));
});

test("Offset editors show why Continue is disabled while allowing incomplete drafts", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, receivedDate: "", supplier: "", invoiceNumber: "", price: "" }), "");
  const order = h.api().orders[0];
  const mocks = new Map([["@/components/workflow/workflow-provider", { useWorkflowOrders: () => h.api() }]]);
  const cases = [
    ["offset-prepress-modal.tsx", "OffsetPrepressModal", /Proof Color, Plot, Plate, and Ink must be Ready/],
    ["offset-material-request-modal.tsx", "OffsetMaterialRequestModal", /Request Date and Request Quantity are required/],
    ["offset-tooling-management-modals.tsx", "OffsetToolingEditModal", /Complete Received Date, Supplier, Invoice Number, and Price/],
    ["offset-varnish-modal.tsx", "OffsetVarnishModal", /Varnish Status must be Received/],
  ];
  for (const [file, name, reason] of cases) {
    const { [name]: Modal } = loadTypeScriptWithMocks(path.resolve(__dirname, "../src/app/offset/components", file), mocks);
    const html = renderToStaticMarkup(React.createElement(Modal, { order, onClose() {} }));
    const draft = html.match(/<button(?=[^>]*value="draft")[^>]*>/)?.[0];
    const submit = html.match(/<button(?=[^>]*value="continue")[^>]*>/)?.[0];
    assert.ok(draft && submit);
    assert.doesNotMatch(draft, /disabled/);
    assert.match(submit, /disabled/);
    assert.match(html, reason);
    assert.doesNotMatch(html, / required=""/);
  }
});

test("Verified legacy completions keep their readiness with historical numeric formatting", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling"], readyTooling), "");
  for (const step of ["material", "tooling"]) assert.equal(saveReadyStep(h, step), "");
  const legacy = structuredClone(h.api().orders[0]);
  legacy.materialRequests.at(-1).quantity = "1,000";
  readiness.activeOffsetTooling(legacy).price = "IDR 500,000";
  for (const step of ["material", "tooling"]) {
    const completion = legacy.offsetPreparationProgress[step].completion;
    completion.fingerprint = readiness.offsetPreparationFingerprint(legacy, step);
  }
  h.storage.setItem("cots-workflow-orders-v1", JSON.stringify([legacy]));
  const restored = providerHarness(h.storage);
  const reloaded = restored.api().orders[0];
  assert.equal(readiness.evaluateOffsetReadiness(reloaded).branches.material, "ready");
  assert.equal(readiness.evaluateOffsetReadiness(reloaded).branches.tooling, "ready");
  assert.equal(saveReadyStep(restored, "prepress"), "");
  assert.equal(restored.api().orders[0].stage, "offset-press");
});

test("Offset legacy statuses retain exact values and only verifiable legacy completions count", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "needed" }), "");
  const initial = h.api().orders[0];
  assert.equal(readiness.activeOffsetTooling(initial).status, "not_ordered");
  assert.equal(initial.offsetVarnish.status, "not_ordered");
  for (const step of ["prepress", "tooling", "varnish"]) assert.equal(saveReadyStep(h, step), "");

  const legacy = structuredClone(h.api().orders[0]);
  const tooling = readiness.activeOffsetTooling(legacy);
  tooling.status = "available";
  legacy.offsetPreparationProgress.tooling.completion.fingerprint = readiness.offsetPreparationFingerprint(legacy, "tooling");
  const varnish = legacy.offsetVarnish;
  varnish.status = "Ready";
  const { offsetVarnishFingerprint } = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
  varnish.completion.fingerprint = offsetVarnishFingerprint(legacy);
  const key = "cots-workflow-orders-v1";
  h.storage.setItem(key, JSON.stringify([legacy]));
  const reloaded = providerHarness(h.storage);
  const saved = reloaded.api().orders[0];
  assert.deepEqual(readiness.activeOffsetTooling(saved), tooling);
  assert.deepEqual(saved.offsetVarnish, varnish);
  assert.equal(readiness.evaluateOffsetReadiness(saved).branches.tooling, "ready");
  assert.equal(readiness.evaluateOffsetReadiness(saved).branches.varnish, "ready");
  assert.equal(saved.stage, "offset-material-request");

  const draftOnly = { ...saved, offsetPreparationProgress: { ...saved.offsetPreparationProgress, tooling: undefined },
    offsetVarnish: { ...varnish, completion: undefined } };
  assert.notEqual(readiness.evaluateOffsetReadiness(draftOnly).branches.tooling, "ready");
  assert.notEqual(readiness.evaluateOffsetReadiness(draftOnly).branches.varnish, "ready");
  assert.match(saveStep(reloaded, "tooling", tooling, "continue"), /select a tooling status/i);
  assert.match(reloaded.api().saveOffsetVarnish(saved.id, varnish, "continue", offsetVarnishSnapshot(saved)), /select a varnish status/i);
  assert.equal(saveReadyStep(reloaded, "material"), "");
  assert.equal(reloaded.api().orders[0].stage, "offset-press");

  legacy.offsetVarnish.status = "Revision Required";
  tooling.status = "repair";
  h.storage.setItem(key, JSON.stringify([legacy]));
  const ambiguous = providerHarness(h.storage).api().orders[0];
  assert.equal(ambiguous.offsetVarnish.status, "Revision Required");
  assert.equal(readiness.activeOffsetTooling(ambiguous).status, "repair");
  assert.notEqual(readiness.evaluateOffsetReadiness(ambiguous).branches.tooling, "ready");
  assert.notEqual(readiness.evaluateOffsetReadiness(ambiguous).branches.varnish, "ready");
});

test("Offset Received drafts and Cancelled branches do not complete Incoming or release Printing", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "not_ordered" }), "");
  const { preparationChecks } = loadTypeScript(path.resolve(__dirname, "../src/app/orders/components/incoming-orders-table.tsx"));
  const current = () => h.api().orders[0];
  const saveVarnish = (status, action) => h.api().saveOffsetVarnish(current().id, { status, remark: "" }, action, offsetVarnishSnapshot(current()));
  const checks = () => preparationChecks(current()).slice(1).map((item) => item.state);
  assert.equal(saveReadyStep(h, "prepress"), "");
  assert.equal(saveReadyStep(h, "tooling", "draft"), "");
  assert.equal(saveReadyStep(h, "varnish", "draft"), "");
  assert.equal(saveReadyStep(h, "material"), "");
  assert.deepEqual(checks(), ["empty", "empty"]);
  assert.equal(current().stage, "offset-material-request");
  assert.equal(saveVarnish("cancelled", "draft"), "");
  assert.match(saveVarnish("cancelled", "continue"), /must be Received/);
  assert.deepEqual(checks(), ["empty", "empty"]);
  assert.equal(printingEvents(current()).length, 0);
  assert.equal(saveStep(h, "tooling", { ...readyTooling, status: "cancelled" }), "");
  assert.match(saveStep(h, "tooling", { ...readyTooling, status: "cancelled" }, "continue"), /must be Received/);
  assert.equal(saveReadyStep(h, "varnish"), "");
  assert.deepEqual(checks(), ["empty", "complete"]);
  assert.equal(printingEvents(current()).length, 0);
  assert.equal(saveReadyStep(h, "tooling"), "");
  assert.equal(current().stage, "offset-press");
  assert.equal(printingEvents(current()).length, 1);
});

test("Offset Prepress, MI, Varnish, and Printing keep their filters without a reset button", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const mocks = new Map([["@/components/workflow/workflow-provider", { useWorkflowOrders: () => ({ orders: [] }) }]]);
  const cache = new Map();
  const load = (file) => loadTypeScriptWithMocks(path.resolve(__dirname, "../src/app/offset", file), mocks, cache);
  const { OffsetStageView } = load("components/offset-stage-view.tsx");
  const { OffsetMaterialRequestView } = load("components/offset-material-request-view.tsx");
  mocks.set("../components", { OffsetStageView, OffsetMaterialRequestView });

  for (const [route, filters] of [
    ["prepress", ["Plate Type", "PIC"]],
    ["material", ["MI Status", "Material"]],
    ["varnish", ["Varnish", "Coating Side", "Status"]],
    ["press", ["Machine", "Printing Side"]],
  ]) {
    const { default: Page } = load(route + "/page.tsx");
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.doesNotMatch(html, /Reset Filters/);
    assert.match(html, /aria-label="Search queue"/);
    assert.match(html, />Completed<\//);
    for (const filter of filters) assert.ok(html.includes(`aria-label="Filter by ${filter}"`));
  }
});

test("Offset dropdowns and queue filters expose the four business statuses", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "not_ordered" }), "");
  const order = h.api().orders[0];
  const source = (file) => path.resolve(__dirname, "../src", file);
  const mocks = new Map([["@/components/workflow/workflow-provider", { useWorkflowOrders: () => h.api() }]]);
  const cache = new Map();
  const load = (file) => loadTypeScriptWithMocks(source(file), mocks, cache);
  const modals = load("app/offset/components/offset-tooling-management-modals.tsx");
  const { OffsetVarnishModal } = load("app/offset/components/offset-varnish-modal.tsx");
  const labels = ["Not Ordered", "Ordered", "Received", "Cancelled"];
  for (const Modal of [modals.OffsetToolingAddModal, modals.OffsetToolingDraftModal, modals.OffsetToolingEditModal, OffsetVarnishModal]) {
    const html = renderToStaticMarkup(React.createElement(Modal, { order, onClose() {} }));
    const status = html.match(/<select[^>]*><option value="not_ordered" selected="">Not Ordered<\/option>.*?<\/select>/)?.[0];
    assert.ok(status);
    assert.deepEqual(Array.from(status.matchAll(/<option[^>]*>([^<]+)<\/option>/g), (option) => option[1]), labels);
  }

  const { OffsetStageView } = load("app/offset/components/offset-stage-view.tsx");
  mocks.set("../components", { OffsetStageView });
  const { default: OffsetVarnishPage } = load("app/offset/varnish/page.tsx");
  const varnishQueue = renderToStaticMarkup(React.createElement(OffsetVarnishPage));
  const varnishFilter = varnishQueue.match(/<select[^>]*aria-label="Filter by Status"[^>]*>.*?<\/select>/)?.[0];
  assert.ok(varnishFilter);
  assert.deepEqual(Array.from(varnishFilter.matchAll(/<option[^>]*>([^<]+)<\/option>/g), (option) => option[1]), ["Status: All", ...[...labels].sort()]);
  const statusFilter = OffsetVarnishPage().props.queueTableFilters.filters.find((filter) => filter.key === "status");
  assert.equal(statusFilter.matches(order, "Not Ordered"), true);
  assert.equal(statusFilter.matches({ ...order, offsetVarnish: { ...order.offsetVarnish, status: "Ready" } }, "Received"), false);
  assert.match(varnishQueue, /<strong>Not Ordered<\/strong>/);

  const plateQueue = renderToStaticMarkup(React.createElement(OffsetStageView, { stage: "offset-plate" }));
  const plateFilter = plateQueue.match(/<section[^>]*aria-label="Tooling Status filter"[^>]*>.*?<\/section>/)?.[0];
  assert.ok(plateFilter);
  assert.deepEqual(Array.from(plateFilter.matchAll(/<span>([^<]+)<\/span>/g), (option) => option[1]), ["All", ...labels, "Completed"]);
  assert.match(plateQueue, /<strong>Not Ordered<\/strong>/);

  const { ProjectHistoryModal } = load("components/workflow/project-history-modal.tsx");
  for (const [kind, heading] of [["tooling", "Tooling / Plate Details"], ["varnish", "Block / Spot Varnish Details"]]) {
    const html = renderToStaticMarkup(React.createElement(ProjectHistoryModal, { order, offsetDetails: true, offsetPreparationDetails: kind, onClose() {} }));
    assert.ok(html.includes(heading));
    assert.match(html, /<dd>Not Ordered<\/dd>/);
  }
});

test("Offset Tooling preserves legacy Open Size through draft, submission, and completion", () => {
  const h = providerHarness();
  const legacy = { openWidth: "300", openLength: "400" };
  const order = () => h.api().orders[0];
  const saveDraft = (draft) => {
    const result = h.api().saveOffsetPreparationPlan(order().id, {
      material: { state: "draft" }, tooling: { state: "draft", draft },
    }, readiness.offsetPlanSnapshot(order()));
    assert.equal(typeof result, "object");
    return result.offsetPreparationPlan.tooling.draft;
  };
  assert.deepEqual(saveDraft(readyTooling), readyTooling);
  assert.deepEqual(saveDraft({ ...readyTooling, ...legacy }), { ...readyTooling, ...legacy });
  const tooling = { ...readyTooling, remark: "Updated without dimensions" };
  assert.deepEqual(saveDraft(tooling), { ...tooling, ...legacy });
  assert.equal(submitPlan(h, ["tooling"], tooling), "");
  assert.equal(saveStep(h, "tooling", readyTooling), "");
  assert.equal(saveReadyStep(h, "tooling"), "");

  const saved = structuredClone(order());
  const record = readiness.activeOffsetTooling(saved);
  assert.equal(record.openWidth, legacy.openWidth);
  assert.equal(record.openLength, legacy.openLength);
  const completion = saved.offsetPreparationProgress.tooling.completion;
  const legacyFingerprint = JSON.parse(completion.fingerprint);
  assert.equal(legacyFingerprint[3][4], tooling.priority);
  legacyFingerprint[3].splice(4, 0, "200", "300");
  completion.fingerprint = JSON.stringify(legacyFingerprint);
  h.storage.setItem("cots-workflow-orders-v1", JSON.stringify([saved]));
  const reloaded = providerHarness(h.storage).api().orders[0];
  assert.equal(readiness.evaluateOffsetReadiness(reloaded).branches.tooling, "ready");
  assert.deepEqual(readiness.activeOffsetTooling(reloaded), record);
  assert.equal(readiness.offsetPreparationFingerprint(reloaded, "tooling"), readiness.offsetPreparationFingerprint({
    ...reloaded, offsetToolingRecords: [{ ...record, openWidth: "", openLength: "" }],
  }, "tooling"));
  assert.equal(readiness.evaluateOffsetReadiness({
    ...reloaded, offsetToolingRecords: [{ ...record, supplier: "Different vendor" }],
  }).branches.tooling, "not-continued");
});

test("Offset Tooling Add and legacy Edit accept values without Open Size", () => {
  const h = providerHarness();
  const order = h.api().orders[0];
  h.states[0] = [{ ...order, stage: "offset-plate" }];
  h.api().createOffsetTooling(order.id, readyTooling);
  let record = readiness.activeOffsetTooling(h.api().orders[0]);
  assert.ok(record);
  assert.equal(Object.hasOwn(record, "openWidth"), false);
  assert.equal(Object.hasOwn(record, "openLength"), false);

  const legacy = { openWidth: "300", openLength: "400" };
  const created = h.api().orders[0];
  h.states[0] = [{ ...created, offsetToolingRecords: [{ ...record, ...legacy }] }];
  h.api().updateOffsetTooling(created.id, record.id, { ...readyTooling, remark: "Edited" });
  record = readiness.activeOffsetTooling(h.api().orders[0]);
  assert.equal(record.remark, "Edited");
  assert.equal(record.openWidth, legacy.openWidth);
  assert.equal(record.openLength, legacy.openLength);
});

test("Offset Tooling Add, Edit, Details, and Prepress pencil omit Open Size labels", () => {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const h = providerHarness();
  const draft = { ...readyTooling, openWidth: "300", openLength: "400" };
  assert.equal(submitPlan(h, ["tooling"], draft), "");
  const order = h.api().orders[0];
  const mocks = new Map([["@/components/workflow/workflow-provider", { useWorkflowOrders: () => h.api() }]]);
  const components = loadTypeScriptWithMocks(
    path.resolve(__dirname, "../src/app/offset/components/offset-tooling-management-modals.tsx"), mocks,
  );
  const { OffsetToolingDetails } = loadTypeScript(path.resolve(__dirname, "../src/components/workflow/offset-tooling-details.tsx"));
  for (const [Component, label] of [
    [components.OffsetToolingAddModal, "Save Tooling"],
    [components.OffsetToolingEditModal, "Save &amp; Continue"],
    [components.OffsetToolingDraftModal, "Save Tooling Draft"],
    [OffsetToolingDetails, "Recorded At"],
  ]) {
    const html = renderToStaticMarkup(React.createElement(Component, { order, draftValues: draft, onClose() {} }));
    assert.ok(html.includes(label));
    assert.doesNotMatch(html, /Open Size Width|Open Size Length/);
  }
});

for (const [rows, last] of [
  [[], "material"], [["tooling"], "tooling"], [["varnish"], "varnish"], [["tooling", "varnish"], "prepress"],
]) {
  test("Offset routes MI" + rows.map((row) => " + " + row).join("") + " when " + last + " continues last", () => {
    const h = providerHarness();
    const current = () => h.api().orders[0];
    const initial = current();
    const prepressBeforeUpdate = last === "material" || last === "tooling";
    if (prepressBeforeUpdate) {
      assert.equal(saveReadyStep(h, "prepress"), "");
      assert.equal(current().stage, "offset-prepress");
      assert.equal(readiness.evaluateOffsetReadiness(current()).branches.prepress, "ready");
      assert.equal(readiness.evaluateOffsetReadiness(current()).ready, false);
    }
    if (last === "prepress") {
      assert.equal(saveStep(h, "prepress", { ...readyPrepress, ink: "Waiting", remark: "Awaiting ink" }), "");
    }
    assert.equal(submitPlan(h, rows, { ...readyTooling, status: "not_ordered" }), "");
    assert.equal(current().stage, "offset-material-request");
    assert.equal(printingEvents(current()).length, 0);
    if (prepressBeforeUpdate) assert.equal(readiness.evaluateOffsetReadiness(current()).branches.prepress, "ready");

    const steps = ["material", ...rows, ...(prepressBeforeUpdate ? [] : ["prepress"])];
    for (const step of steps.filter((step) => step !== last)) {
      assert.equal(saveReadyStep(h, step), "");
      assert.equal(current().stage, "offset-material-request");
    }
    assert.equal(saveReadyStep(h, last, "draft"), "");
    const beforeLast = current();
    assert.equal(beforeLast.stage, "offset-material-request");
    assert.equal(readiness.evaluateOffsetReadiness(beforeLast).branches[last], "not-continued");
    const partialReload = providerHarness(h.storage).api().orders[0];
    assert.equal(partialReload.stage, beforeLast.stage);
    assert.deepEqual(partialReload.offsetPreparationProgress, JSON.parse(JSON.stringify(beforeLast.offsetPreparationProgress)));
    assert.equal(printingEvents(partialReload).length, 0);

    assert.equal(saveReadyStep(h, last), "");
    const printed = current();
    assert.equal(printed.stage, "offset-press");
    assert.equal(printed.id, initial.id);
    assert.equal(printed.no, initial.no);
    assert.deepEqual(printed.mainData, initial.mainData);
    assert.deepEqual(printed.offsetPreparationPlan, beforeLast.offsetPreparationPlan);
    assert.deepEqual(printed.offsetPreparationRecords, beforeLast.offsetPreparationRecords);
    assert.ok(Object.values(readiness.evaluateOffsetReadiness(printed).branches).every((state) => ["ready", "not-selected"].includes(state)));
    const [continued, routed] = printed.processHistory.slice(-2);
    assert.match(continued.changeSummary, /Save & Continue/);
    assert.equal(continued.user, "Offset User");
    assert.equal(routed.user, "System");
    assert.equal(routed.stage, "offset-press");
    assert.equal(routed.date, continued.date);
    assert.deepEqual(printingEvents(printed), [routed]);
    assert.notEqual(saveReadyStep(h, last), "");
    assert.equal(current(), printed);
    const reloaded = providerHarness(h.storage).api().orders[0];
    assert.equal(reloaded.stage, "offset-press");
    assert.deepEqual(printingEvents(reloaded), [routed]);
    assert.deepEqual(reloaded.offsetPreparationProgress, printed.offsetPreparationProgress);
    assert.deepEqual(reloaded.offsetVarnish, printed.offsetVarnish);
    h.api().moveOrderToStage(current().id, "offset-prepress");
    assert.equal(current(), printed);
  });
}

test("Offset Continue rejects routing when a selected record or the submitted plan is invalid", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling", "varnish"], { ...readyTooling, status: "not_ordered" }), "");
  for (const step of ["prepress", "tooling", "varnish"]) assert.equal(saveReadyStep(h, step), "");
  const prepared = h.api().orders[0];
  for (const kind of ["tooling", "varnish"]) {
    const admission = prepared.offsetPreparationRecords.find((record) => record.kind === kind);
    const remaining = prepared.offsetPreparationRecords.filter((record) => record.kind !== kind);
    for (const records of [remaining, [...remaining, { ...admission, state: "draft" }], [...remaining, { ...admission, projectId: "foreign" }], [...remaining, { ...admission, createdAt: "invalid" }], [...remaining, admission, admission]]) {
      h.states[0] = [{ ...prepared, offsetPreparationRecords: records }];
      assert.equal(saveReadyStep(h, "material"), "");
      const blocked = h.api().orders[0];
      assert.equal(blocked.stage, "offset-material-request");
      assert.equal(readiness.evaluateOffsetReadiness(blocked).branches[kind], "not-submitted");
      assert.equal(printingEvents(blocked).length, 0);
    }
    h.states[0] = [{ ...prepared, offsetPreparationPlan: { ...prepared.offsetPreparationPlan, [kind]: { state: "draft" } } }];
    assert.equal(saveReadyStep(h, "material"), "");
    assert.equal(h.api().orders[0].stage, "offset-material-request");
  }
  for (const offsetPreparationPlan of [undefined, { ...prepared.offsetPreparationPlan, projectId: "foreign" }, { ...prepared.offsetPreparationPlan, material: { state: "draft" } }]) {
    h.states[0] = [{ ...prepared, offsetPreparationPlan }];
    assert.notEqual(saveReadyStep(h, "material"), "");
    assert.equal(h.api().orders[0].stage, "offset-material-request");
  }
  h.states[0] = [{ ...prepared, offsetVarnish: { ...prepared.offsetVarnish, status: "Unknown" } }];
  assert.equal(saveReadyStep(h, "material"), "");
  assert.equal(h.api().orders[0].stage, "offset-material-request");
});

test("The last Continue persists user completion and System routing together, and retries after storage failure", () => {
  const h = providerHarness();
  const key = "cots-workflow-orders-v1";
  assert.equal(submitPlan(h, []), "");
  assert.equal(saveReadyStep(h, "prepress"), "");
  const original = h.api().orders[0];
  const stored = h.storage.getItem(key);
  h.storage.failWrites = true;
  assert.match(saveReadyStep(h, "material"), /could not be saved/);
  assert.equal(h.api().orders[0], original);
  assert.equal(h.storage.getItem(key), stored);
  h.storage.failWrites = false;

  const api = h.api();
  const snapshot = readiness.offsetPreparationSnapshot(original, "material");
  assert.equal(api.saveOffsetMaterial(original.id, readyMaterial, "continue", snapshot), "");
  assert.notEqual(api.saveOffsetMaterial(original.id, readyMaterial, "continue", snapshot), "");
  const saved = JSON.parse(h.storage.getItem(key))[0];
  assert.equal(saved.stage, "offset-press");
  assert.equal(printingEvents(saved).length, 1);
  assert.equal(saved.processHistory.length, original.processHistory.length + 2);
  assert.equal(h.api().orders[0].stage, saved.stage);
});

test("Offset gate ignores hydration, Save Draft, Save MI and generic or legacy routing even with valid completions", () => {
  const h = providerHarness();
  const key = "cots-workflow-orders-v1";
  assert.equal(submitPlan(h, []), "");
  assert.equal(saveReadyStep(h, "prepress"), "");
  assert.equal(saveReadyStep(h, "material"), "");
  const printed = h.api().orders[0];
  const pending = {
    ...printed,
    stage: "offset-varnish",
    processHistory: printed.processHistory.filter((entry) => entry.process !== "offset_printing_routed"),
  };
  h.storage.setItem(key, JSON.stringify([pending]));
  const hydrated = providerHarness(h.storage);
  const restored = hydrated.api().orders[0];
  assert.equal(readiness.evaluateOffsetReadiness(restored).ready, true);
  assert.equal(restored.stage, "offset-varnish");
  assert.equal(printingEvents(restored).length, 0);

  const api = hydrated.api();
  api.moveOrderToStage(restored.id, "offset-press", { description: "Bypass" });
  api.advanceOrder(restored.id, { description: "Bypass" });
  assert.equal(hydrated.api().orders[0], restored);
  api.saveOffsetSpk(restored.id, { productName: "Legacy SPK", status: "varnish", remark: "" }, true);
  assert.equal(hydrated.api().orders[0].stage, "offset-varnish");
  assert.match(saveStep(hydrated, "prepress", { ...readyPrepress, remark: "Draft only" }), /cannot be edited/);
  assert.match(saveStep(hydrated, "material", { ...readyMaterial, remark: "MI save only" }), /cannot be edited/);
  const beforeContinue = hydrated.api().orders[0];
  assert.equal(beforeContinue.stage, "offset-varnish");
  assert.equal(printingEvents(beforeContinue).length, 0);
  assert.match(saveStep(hydrated, "material", { ...readyMaterial, remark: "MI save only" }, "continue"), /cannot be edited/);
  assert.equal(hydrated.api().orders[0], beforeContinue);

  const legacy = { ...pending, offsetPreparationProgress: undefined };
  const legacyStorage = memoryStorage();
  legacyStorage.setItem(key, JSON.stringify([legacy]));
  const reloadedLegacy = providerHarness(legacyStorage).api().orders[0];
  assert.equal(reloadedLegacy.stage, legacy.stage);
  assert.equal(readiness.evaluateOffsetReadiness(reloadedLegacy).ready, false);
});

test("Offset uses the latest same-turn state and blocks terminal projects", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, []), "");
  const api = h.api();
  const original = api.orders[0];
  const miSnapshot = readiness.offsetPreparationSnapshot(original, "material");
  assert.equal(api.saveOffsetPrepress(original.id, { ...readyPrepress, ink: "Waiting", remark: "Awaiting ink" },
    "draft", readiness.offsetPreparationSnapshot(original, "prepress")), "");
  assert.equal(api.saveOffsetMaterial(original.id, readyMaterial, "continue", miSnapshot), "");
  const waiting = h.api().orders[0];
  assert.equal(waiting.stage, "offset-material-request");
  assert.equal(printingEvents(waiting).length, 0);

  for (const [stage, currentStatus] of [["quality-control", "waiting"], ["completed", "completed"], ["completed", "cancelled"]]) {
    h.states[0] = [{ ...waiting, stage, workflow: { ...waiting.workflow, currentStatus } }];
    const locked = h.api().orders[0];
    assert.notEqual(saveReadyStep(h, "prepress"), "");
    h.api().moveOrderToStage(locked.id, "offset-press");
    assert.equal(h.api().orders[0], locked);
  }

  h.states[0] = [waiting];
  const sameTurn = h.api();
  sameTurn.cancelIncomingProject(waiting.id, "Cancelled before Continue");
  assert.notEqual(sameTurn.saveOffsetPrepress(waiting.id, readyPrepress, "continue", readiness.offsetPreparationSnapshot(waiting, "prepress")), "");
  const cancelled = h.api().orders[0];
  assert.equal(cancelled.workflow.currentStatus, "cancelled");
  assert.equal(printingEvents(cancelled).length, 0);
});

test("Offset Update rejects incomplete rows and freezes the submitted plan across every entry point", () => {
  const h = providerHarness();
  const original = h.api().orders[0];
  assert.match(submitPlan(h, [null]), /empty rows/);
  assert.match(submitPlan(h, ["varnish", "varnish"]), /different preparation order/);
  assert.match(submitPlan(h, ["tooling"]), /Save Tooling details/);
  assert.match(submitPlan(h, ["tooling"], { status: "not_ordered" }), /valid Tooling/);
  assert.equal(h.api().orders[0], original);
  h.storage.failWrites = true;
  assert.match(submitPlan(h, []), /could not be saved/);
  assert.equal(h.api().orders[0], original);
  h.storage.failWrites = false;
  assert.equal(submitPlan(h, []), "");
  const submitted = h.api().orders[0];
  assert.match(submitPlan(h, ["varnish"]), /no longer/);
  assert.match(h.api().saveOffsetPreparationPlan(submitted.id, { material: { state: "draft" } }, readiness.offsetPlanSnapshot(submitted)), /no longer/);
  h.states[0] = [{ ...submitted, stage: "offset-plate" }];
  const plate = h.api().orders[0];
  h.api().createOffsetTooling(plate.id, readyTooling);
  assert.equal(h.api().orders[0], plate);
});

for (const [step, values, invalid, changed, nonReady] of [
  ["prepress", readyPrepress, { proofColor: "Unknown" }, { fgQuantity: "101" }, { ink: "Waiting", remark: "Await ink" }],
  ["material", readyMaterial, { unit: "invalid" }, { quantity: "101" }, { status: "requested" }],
  ["tooling", readyTooling, { price: "" }, { supplier: "Another supplier" }, { status: "ordered" }],
]) {
  test("Offset " + step + " validates, detects stale saves, and locks only after successful persistence", () => {
    const h = providerHarness();
    assert.equal(submitPlan(h, ["tooling"], { ...readyTooling, status: "not_ordered" }), "");
    const current = () => h.api().orders[0];
    const original = current();
    const snapshot = readiness.offsetPreparationSnapshot(original, step);
    assert.notEqual(saveStep(h, step, { ...values, ...invalid }, "continue"), "");
    assert.match(saveStep(h, step, { ...values, ...nonReady }, "continue"), step === "tooling" ? /must be Received/ : /must be Ready/);
    h.storage.failWrites = true;
    const stored = h.storage.getItem("cots-workflow-orders-v1");
    assert.match(saveStep(h, step, values, "continue"), /could not be saved/);
    assert.equal(current(), original);
    assert.equal(h.storage.getItem("cots-workflow-orders-v1"), stored);
    h.storage.failWrites = false;
    assert.equal(saveStep(h, step, { ...values, remark: "Draft before confirmation" }), "");
    assert.match(saveStep(h, step, values, "continue", snapshot), /data changed/);
    assert.equal(saveStep(h, step, values, "continue"), "");
    const confirmed = current();
    assert.equal(readiness.canEditOffsetPreparation(confirmed, step), false);
    assert.match(saveStep(h, step, values, "continue", snapshot), /cannot be edited/);
    assert.match(saveStep(h, step, values, "continue"), /cannot be edited/);
    assert.equal(current(), confirmed);

    assert.match(saveStep(h, step, { ...values, remark: "Remark only" }), /cannot be edited/);
    assert.match(saveStep(h, step, { ...values, ...changed }), /cannot be edited/);
    assert.equal(current(), confirmed);
    const restored = providerHarness(h.storage);
    assert.equal(readiness.canEditOffsetPreparation(restored.api().orders[0], step), false);
    assert.match(saveStep(restored, step, values), /cannot be edited/);

    for (const stage of ["offset-press", "quality-control", "completed"]) {
      const locked = { ...current(), stage };
      h.states[0] = [locked];
      assert.match(saveStep(h, step, values, "continue"), /cannot be edited/);
      assert.equal(current(), locked);
    }
  });
}

test("Offset completion ignores concurrent changes to other branches and protects completed master input", () => {
  const h = providerHarness();
  assert.equal(submitPlan(h, ["tooling"], { ...readyTooling, status: "not_ordered" }), "");
  const api = h.api();
  const order = api.orders[0];
  assert.equal(api.saveOffsetMaterial(order.id, readyMaterial, "continue", readiness.offsetPreparationSnapshot(order, "material")), "");
  assert.equal(api.saveOffsetTooling(order.id, readyTooling, "continue", readiness.offsetPreparationSnapshot(order, "tooling")), "");
  let saved = h.api().orders[0];
  const completed = saved;
  assert.equal(readiness.evaluateOffsetReadiness(saved).branches.material, "ready");
  assert.equal(readiness.evaluateOffsetReadiness(saved).branches.tooling, "ready");
  h.api().editProject(order.id, { preparationType: "offset", mainData: { ...saved.mainData, imposition: "4 UP" }, projectDate: "", deadline: "" });
  saved = h.api().orders[0];
  assert.equal(saved.mainData.imposition, completed.mainData.imposition);
  assert.deepEqual(saved.offsetPreparationProgress.tooling.completion, completed.offsetPreparationProgress.tooling.completion);
  assert.equal(readiness.evaluateOffsetReadiness(saved).branches.material, "ready");
  assert.equal(readiness.evaluateOffsetReadiness(saved).branches.tooling, "ready");
});

test("Offset Tooling queue projects submitted Tooling independently of Material readiness and Add Tooling requires a project", () => {
  const stageViewSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), "utf8");
  const addModalSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-tooling-management-modals.tsx"), "utf8");
  const providerSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"), "utf8");
  assert.match(stageViewSource, /stage === "offset-plate"/);
  assert.match(stageViewSource, /isInOffsetQueue\(order, offsetQueueStage\)/);
  assert.match(stageViewSource, /stage === "offset-varnish"/);
  assert.match(stageViewSource, /showOffsetPrepressPreparation=\{stage === "offset-prepress"\}/);
  assert.match(stageViewSource, /statusPresentation=\{statusPresentation\}/);
  assert.match(addModalSource, /Select Active Project/);
  assert.match(addModalSource, /disabled=\{!project \|\| Boolean\(draftError\)\}/);
  assert.doesNotMatch(addModalSource, /Manual Entry \(No Sample Number\)/);
  assert.match(providerSource, /order\.offsetToolingId/);
  assert.match(providerSource, /Offset Tooling \/ Plate .* submitted from Prepress/);
  assert.doesNotMatch(providerSource, /return moveToStage\(\{[\s\S]{0,300}offset-varnish/);
});

test("Offset Prepress remains editable in its persistent queue without resubmitting preparation", () => {
  const h = providerHarness();
  const toolingDraft = {
    mcNo: "MC-PERSISTENT-01", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Draft",
  };
  submitPlan(h, ["tooling"], toolingDraft, "Submit once");
  let saved = h.api().orders[0];
  const recordCount = saved.offsetPreparationRecords.length;
  const historyLength = saved.processHistory.length;
  assert.equal(saveStep(h, "prepress", {
    noJoPnCode: saved.mainData.mcNo || saved.no,
    idPlate: "PL-1", plateType: "CD102", fgQuantity: "1000",
    proofColor: "Ready", plot: "Ready", plate: "Ready", ink: "Ready", remark: "Prepress checked",
  }), "");
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.offsetPreparationRecords.length, recordCount);
  assert.equal(saved.processHistory.length, historyLength + 1);
  assert.equal(saved.offsetPrepress.remark, "Prepress checked");

  assert.match(submitPlan(h, ["tooling"], toolingDraft, "Repeat"), /no longer/);
  saved = h.api().orders[0];
  assert.equal(saved.offsetPreparationRecords.length, recordCount);
  assert.equal(saved.processHistory.length, historyLength + 1);

  const { isInOffsetQueue, isOffsetQueueCompleted } = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-queue.ts"));
  assert.equal(isInOffsetQueue(saved, "offset-prepress"), true);
  assert.equal(isOffsetQueueCompleted(saved, "offset-prepress"), false);
});

test("Prepress Details supports two distinct Tooling and Varnish preparation orders without activating their routing", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/offset-prepress-preparation-details.tsx"), "utf8");
  const editSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-prepress-modal.tsx"), "utf8");
  const offsetMaterialSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-material-request-modal.tsx"), "utf8");
  const stageViewSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), "utf8");
  const historySource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/project-history-modal.tsx"), "utf8");
  assert.match(source, /Status &amp; Preparation/);
  assert.match(source, /Request Material \/ Create MI/);
  assert.match(source, /Add Preparation Order/);
  assert.match(source, /type PreparationOrder = "tooling" \| "varnish"/);
  assert.match(source, /const canAddPreparationOrder = preparationOrders\.length < 2/);
  assert.match(source, /const hasUnselectedPreparationOrder = preparationOrders\.some/);
  assert.match(source, /canAddPreparationOrder && !hasUnselectedPreparationOrder/);
  assert.match(source, /disabled=\{!workflow \|\| preparationOrderLocked \|\| !canUpdatePreparation\}/);
  assert.match(source, /preparation-order-list is-compact/);
  assert.match(source, /selectedOrders\.includes\("tooling"\) && kind !== "tooling"/);
  assert.match(source, /selectedOrders\.includes\("varnish"\) && kind !== "varnish"/);
  assert.match(source, /Tooling \/ Plate/);
  assert.match(source, /Block \/ Spot Varnish/);
  assert.match(source, /OffsetToolingDraftModal order=\{currentOrder\}/);
  assert.doesNotMatch(source, /table-cancel-button/);
  assert.match(source, /Varnish Type/);
  assert.match(source, /Lamination/);
  assert.match(source, /Coating Side/);
  assert.doesNotMatch(source, /<Badge/);
  assert.doesNotMatch(source, />Draft</);
  assert.doesNotMatch(source, /Press \/ Printing/);
  assert.doesNotMatch(source, /offset-varnish/);
  assert.doesNotMatch(editSource, /Status &amp; Preparation/);
  assert.doesNotMatch(editSource, /Update Preparation/);
  assert.doesNotMatch(editSource, /Save &amp; Continue to Material/);
  assert.match(offsetMaterialSource, /Gramatur/);
  assert.match(offsetMaterialSource, /value=\{masterMaterial \|\| "-"\} disabled/);
  assert.match(offsetMaterialSource, /<option value="sheet">sheet<\/option><option value="pcs">pcs<\/option>/);
  assert.doesNotMatch(offsetMaterialSource, /app\/converting/);
  assert.doesNotMatch(offsetMaterialSource, /Next Step/);
  assert.match(source, /onSubmitted\?\.\(\)/);
  assert.doesNotMatch(source, /Submit Varnish/);
  assert.match(historySource, /showOffsetPrepressPreparation/);
  assert.match(stageViewSource, /Preparation for \$\{displayedHistoryOrder\.no\} was updated and moved to Material Request \/ MI\./);
  assert.match(stageViewSource, /toast-message/);
  assert.ok(historySource.indexOf("history-project-summary") < historySource.lastIndexOf("<OffsetPrepressPreparationDetails"));
  assert.ok(historySource.lastIndexOf("<OffsetPrepressPreparationDetails") < historySource.lastIndexOf("<OffsetPrepressDetails"));
});
