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

function providerHarness() {
  const states = [];
  let cursor = 0;
  const react = {
    createContext: () => ({ Provider: "provider" }),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useCallback: (callback) => callback,
    useMemo: (factory) => factory(),
    useRef: (current) => ({ current }),
    useEffect: () => {},
  };
  const cache = new Map();
  const load = (filename) => {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier === "react") return react;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const base = specifier.startsWith("@/") ? path.resolve(__dirname, "../src", specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
        const resolved = [base, base + ".ts", base + ".tsx"].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        return load(resolved);
      }
      return require(specifier);
    };
    new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  };
  const { WorkflowOrdersProvider } = load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const api = () => { cursor = 0; return WorkflowOrdersProvider({ children: null, currentUserName: "Offset User" }).props.value; };
  const original = structuredClone(api().orders[0]);
  states[0] = [{
    ...original,
    id: "offset-parallel-foundation",
    no: "2611001",
    stage: "offset-prepress",
    processHistory: [],
    workflow: { ...original.workflow, preparationType: "offset", convertingRoute: null, currentStatus: "in_progress" },
  }];
  return { api, states };
}

test("Offset preparation helper retains project identity, one tooling draft, and deduplicates submitted branches", () => {
  const preparation = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
  const toolingDraft = {
    mcNo: "MC-OFFSET-01", status: "needed", grammage: "310 gsm", openWidth: "700", openLength: "1000",
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
    mcNo: "MC-OFFSET-01", status: "needed", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Draft only",
  };
  h.api().saveOffsetPreparationPlan("offset-parallel-foundation", {
    material: { state: "draft" }, tooling: { state: "draft", draft: toolingDraft },
  });
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
  h.api().saveOffsetPreparationPlan("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "submitted" },
  });
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-prepress");
  assert.equal(saved.offsetPreparationRecords.length, 3);
  assert.ok(saved.offsetPreparationRecords.every((record) => record.projectId === saved.id));
  assert.equal(saved.processHistory.length, firstHistoryLength + 1);
  assert.equal(saved.processHistory.at(-1).status, "submitted");

  h.api().saveOffsetPreparationPlan("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "submitted" },
  });
  saved = h.api().orders[0];
  assert.equal(saved.offsetPreparationRecords.length, 3);
  assert.equal(saved.processHistory.length, firstHistoryLength + 2);
});

test("Offset preparation submits project-owned Tooling and Varnish records in parallel with MI", () => {
  const h = providerHarness();
  const original = structuredClone(h.api().orders[0]);
  const toolingDraft = {
    mcNo: "MC-OFFSET-02", status: "needed", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Keep draft",
  };
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "submitted" }, remark: "Create MI",
  });
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
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "submitted" }, remark: "Create MI",
  });
  saved = h.api().orders[0];
  assert.equal(saved.offsetToolingRecords.length, 1);
  assert.equal(saved.processHistory.length, historyLength);

  h.api().updateOffsetTooling(saved.id, saved.offsetToolingId, { ...toolingDraft, status: "ordered", remark: "Supplier confirmed" });
  saved = h.api().orders[0];
  assert.equal(saved.offsetToolingRecords[0].status, "ordered");
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_tooling" && entry.status === "ordered"));

  const mi = { miNumber: "OMI-2611001-1", status: "requested", requestedBy: "Offset User", requestDate: "2026-11-24", material: "Attempted override", quantity: "1000", unit: "pcs", remark: "Requested" };
  h.api().saveMaterialRequest(saved.id, mi, false);
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.materialRequests.length, 1);
  assert.equal(saved.materialRequests[0].material, saved.mainData.boardQua || (saved.material === "-" ? "" : saved.material));
  assert.equal(saved.materialRequests[0].unit, "pcs");
  assert.equal(saved.workflow.materialReady, false);

  h.api().saveMaterialRequest(saved.id, { ...mi, status: "released", remark: "Released" }, false);
  saved = h.api().orders[0];
  assert.equal(saved.materialRequests.length, 1);
  assert.equal(saved.materialRequests[0].status, "released");
  assert.equal(saved.workflow.materialReady, true);
  assert.equal(saved.processHistory.filter((entry) => entry.process === "material_request").length, 2);
});

test("Offset Varnish submission persists and is projected to its queue independently of Material and Tooling", () => {
  const preparation = loadTypeScript(path.resolve(__dirname, "../src/lib/offset-preparation.ts"));
  const h = providerHarness();
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" },
    varnish: { state: "submitted" },
    remark: "Parallel varnish",
  });

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
    mcNo: "MC-VARNISH-01", status: "needed", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Tooling",
  };
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "submitted" }, remark: "Submit Varnish",
  });
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
    processHistory: [{ process: "offset_preparation_plan", status: "submitted", date: new Date(Date.parse(withoutVarnishRecord.offsetPreparationPlan.updatedAt) + 1000).toISOString(), user: "Design", changeSummary: "Offset Material preparation submitted: material, tooling.", remark: "" }],
  };
  const recoveredDraft = reconcileOffsetVarnishSubmission(historicalDraft, "2026-11-25T02:02:00.000Z");
  assert.equal(recoveredDraft.offsetPreparationPlan.varnish.state, "submitted");
  assert.equal(recoveredDraft.offsetPreparationRecords.filter((record) => record.kind === "varnish").length, 1);

  const unverifiedDraft = {
    ...historicalDraft,
    offsetPreparationPlan: { ...historicalDraft.offsetPreparationPlan, material: { state: "draft" } },
    offsetPreparationRecords: historicalDraft.offsetPreparationRecords.filter((record) => record.kind !== "material"),
    processHistory: [{ process: "offset_preparation_plan", status: "draft", date: new Date(Date.parse(withoutVarnishRecord.offsetPreparationPlan.updatedAt) + 1000).toISOString(), user: "Design", changeSummary: "Offset preparation plan saved as draft.", remark: "" }],
  };
  assert.equal(reconcileOffsetVarnishSubmission(unverifiedDraft, "2026-11-25T02:03:00.000Z"), unverifiedDraft);
});

test("AC49–AC57: Varnish saves only its submitted branch, validates Revision Required, and records history", () => {
  const h = providerHarness();
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, varnish: { state: "submitted" }, remark: "Prepress handoff",
  });
  const original = structuredClone(h.api().orders[0]);
  const originalHistoryLength = original.processHistory.length;

  h.api().saveOffsetVarnish(original.id, { status: "Revision Required", remark: "   " });
  assert.equal(h.api().orders[0].processHistory.length, originalHistoryLength, "invalid Revision Required does not save");

  h.api().saveOffsetVarnish(original.id, { status: "Ready", remark: "Artwork confirmed" });
  const saved = h.api().orders[0];
  assert.equal(saved.stage, original.stage, "Save Varnish does not advance stage");
  assert.deepEqual(saved.mainData, original.mainData, "master varnish specification is untouched");
  assert.deepEqual(saved.materialRequests, original.materialRequests, "Material is untouched");
  assert.deepEqual(saved.offsetToolingRecords, original.offsetToolingRecords, "Tooling is untouched");
  assert.equal(saved.offsetVarnish.status, "Ready");
  assert.equal(saved.offsetVarnish.remark, "Artwork confirmed");
  assert.equal(saved.processHistory.length, originalHistoryLength + 1);
  assert.deepEqual(saved.processHistory.at(-1).process, "offset_varnish");
  assert.deepEqual(saved.processHistory.at(-1).status, "Ready");
  assert.deepEqual(saved.processHistory.at(-1).remark, "Artwork confirmed");

  const incoming = loadTypeScript(path.resolve(__dirname, "../src/app/orders/components/incoming-orders-table.tsx"));
  assert.equal(incoming.preparationChecks(saved).find((item) => item.label === "Block / Spot Varnish").state, "complete");
  assert.equal(incoming.preparationChecks({ ...saved, offsetVarnish: { ...saved.offsetVarnish, status: "In Progress" } }).find((item) => item.label === "Block / Spot Varnish").state, "empty");
});

test("AC49–AC57: Varnish UI is two-column, branch-specific, and has no continuation action", () => {
  const modalSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-varnish-modal.tsx"), "utf8");
  const detailsSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/offset-varnish-details.tsx"), "utf8");
  const tableSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/order-table.tsx"), "utf8");
  assert.match(modalSource, /modal-form-grid/);
  for (const label of ["Sample Number", "MC No. \/ Code", "Customer", "Description \/ Component", "PIC", "Target Completion Date", "Varnish Type", "Lamination", "Coating Side", "Varnish Status", "Remark"]) assert.match(modalSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(modalSource, /Save Varnish/);
  assert.doesNotMatch(modalSource, /Complete &amp; Continue|advanceOrder/);
  assert.match(modalSource, /validateOffsetVarnishValues/);
  assert.match(detailsSource, /Varnish Status/);
  assert.match(detailsSource, /Remark/);
  assert.match(tableSource, /offsetVarnish\?\.remark\.trim\(\) \|\| "-"/);
  assert.doesNotMatch(tableSource, /previousProcess = "offset_varnish"/);
});

test("Offset Tooling queue projects submitted Tooling independently of Material readiness and Add Tooling requires a project", () => {
  const stageViewSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), "utf8");
  const addModalSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-tooling-management-modals.tsx"), "utf8");
  const providerSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"), "utf8");
  assert.match(stageViewSource, /stage === "offset-plate"/);
  assert.match(stageViewSource, /record\.kind === "tooling" && record\.state === "submitted"/);
  assert.match(stageViewSource, /stage === "offset-varnish"/);
  assert.match(stageViewSource, /isOffsetVarnishQueueOrder/);
  assert.match(stageViewSource, /showOffsetPrepressPreparation=\{stage === "offset-prepress"\}/);
  assert.match(stageViewSource, /statusPresentation=\{statusPresentation\}/);
  assert.match(addModalSource, /Select Active Project/);
  assert.match(addModalSource, /disabled=\{!project\}/);
  assert.doesNotMatch(addModalSource, /Manual Entry \(No Sample Number\)/);
  assert.match(providerSource, /order\.offsetToolingId/);
  assert.match(providerSource, /Offset Tooling \/ Plate .* submitted from Prepress/);
  assert.doesNotMatch(providerSource, /return moveToStage\(\{[\s\S]{0,300}offset-varnish/);
});

test("Offset Prepress remains editable in its persistent queue without resubmitting preparation", () => {
  const h = providerHarness();
  const toolingDraft = {
    mcNo: "MC-PERSISTENT-01", status: "needed", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Draft",
  };
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, remark: "Submit once",
  });
  let saved = h.api().orders[0];
  const recordCount = saved.offsetPreparationRecords.length;
  const historyLength = saved.processHistory.length;
  h.api().saveOffsetPrepress(saved.id, {
    noJoPnCode: saved.mainData.mcNo || saved.no,
    idPlate: "PL-1", plateType: "CD102", fgQuantity: "1000",
    proofColor: "Ready", plot: "Ready", plate: "Ready", ink: "Ready", remark: "Prepress checked",
  }, false);
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.offsetPreparationRecords.length, recordCount);
  assert.equal(saved.processHistory.length, historyLength + 1);
  assert.equal(saved.offsetPrepress.remark, "Prepress checked");

  h.api().submitOffsetMaterialPreparation(saved.id, {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, remark: "Repeat",
  });
  saved = h.api().orders[0];
  assert.equal(saved.offsetPreparationRecords.length, recordCount);
  assert.equal(saved.processHistory.length, historyLength + 1);

  const stageViewSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), "utf8");
  assert.match(stageViewSource, /stage === "offset-prepress"/);
  assert.match(stageViewSource, /order\.workflow\.preparationType === "offset"/);
  assert.match(stageViewSource, /order\.workflow\.currentStatus !== "completed"/);
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
  assert.match(source, /table-cancel-button/);
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
  assert.match(stageViewSource, /Preparation for \$\{historyOrder\.no\} was updated and moved to Material Request \/ MI\./);
  assert.match(stageViewSource, /toast-message/);
  assert.ok(historySource.indexOf("history-project-summary") < historySource.lastIndexOf("<OffsetPrepressPreparationDetails"));
  assert.ok(historySource.lastIndexOf("<OffsetPrepressPreparationDetails") < historySource.lastIndexOf("<OffsetPrepressDetails"));
});
