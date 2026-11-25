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

test("Offset preparation submits one project-owned Tooling record in parallel with MI and preserves Varnish as draft", () => {
  const h = providerHarness();
  const original = structuredClone(h.api().orders[0]);
  const toolingDraft = {
    mcNo: "MC-OFFSET-02", status: "needed", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "Keep draft",
  };
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "draft" }, remark: "Create MI",
  });
  let saved = h.api().orders[0];
  assert.equal(saved.id, original.id);
  assert.equal(saved.no, original.no);
  assert.deepEqual(saved.mainData, original.mainData);
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.materialRequests.length, 0);
  assert.deepEqual(saved.offsetPreparationRecords.map((record) => record.kind), ["material", "tooling"]);
  assert.equal(saved.offsetToolingRecords.length, 1);
  assert.equal(saved.offsetToolingId, saved.offsetToolingRecords[0].id);
  assert.deepEqual(saved.offsetToolingRecords[0].mcNo, toolingDraft.mcNo);
  assert.deepEqual(saved.offsetPreparationPlan.tooling.draft, toolingDraft);
  assert.equal(saved.offsetPreparationPlan.varnish.state, "draft");
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_preparation_plan"));
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_tooling" && entry.status === "submitted"));
  assert.ok(saved.processHistory.some((entry) => entry.process === "Offset Material / Create MI"));

  const historyLength = saved.processHistory.length;
  h.api().submitOffsetMaterialPreparation("offset-parallel-foundation", {
    material: { state: "submitted" }, tooling: { state: "submitted", draft: toolingDraft }, varnish: { state: "draft" }, remark: "Create MI",
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

test("Offset Tooling queue projects submitted Tooling independently of Material readiness and Add Tooling requires a project", () => {
  const stageViewSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), "utf8");
  const addModalSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-tooling-management-modals.tsx"), "utf8");
  const providerSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"), "utf8");
  assert.match(stageViewSource, /stage === "offset-plate"/);
  assert.match(stageViewSource, /record\.kind === "tooling" && record\.state === "submitted"/);
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
  assert.match(stageViewSource, /Preparation for \$\{historyOrder\.no\} was updated and moved to Material Request \/ MI\./);
  assert.match(stageViewSource, /toast-message/);
  assert.ok(historySource.indexOf("history-project-summary") < historySource.lastIndexOf("<OffsetPrepressPreparationDetails"));
  assert.ok(historySource.lastIndexOf("<OffsetPrepressPreparationDetails") < historySource.lastIndexOf("<OffsetPrepressDetails"));
});
