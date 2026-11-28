/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Exercise the real provider callbacks with synchronous hook state and in-memory storage.
function workflowHarness() {
  const states = [];
  const refs = [];
  const persisted = new Map();
  let refCursor = 0;
  let actor = "Farhan";
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
    useRef(current) {
      const isOrdersRef = refCursor === 0;
      const ref = (refs[refCursor++] ??= { current });
      if (isOrdersRef) ref.current = current;
      return ref;
    },
    useEffect: () => {},
  };
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = (specifier) => {
      if (specifier === "react") return react;
      if (specifier.startsWith("@/") || specifier.startsWith(".")) {
        const base = specifier.startsWith("@/")
          ? path.resolve(__dirname, "../src", specifier.slice(2))
          : path.resolve(path.dirname(filename), specifier);
        return load([base, base + ".ts", base + ".tsx"].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()));
      }
      return require(specifier);
    };
    new Function("require", "module", "exports", "window", source)(localRequire, loadedModule, loadedModule.exports, {
      localStorage: { getItem: (key) => persisted.get(key) ?? null, setItem: (key, value) => { persisted.set(key, value); } },
    });
    return loadedModule.exports;
  }
  const { WorkflowOrdersProvider } = load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const queue = load(path.resolve(__dirname, "../src/lib/requirement-queue.ts"));
  const api = () => {
    cursor = 0;
    refCursor = 0;
    return WorkflowOrdersProvider({ children: null, currentUserName: actor }).props.value;
  };
  const original = structuredClone(api().orders[0]);
  states[2] = true;
  function start(kinds) {
    states[0] = [{ ...structuredClone(original), id: "parallel-project", no: "PSR-TEST", stage: "order",
      toolingOrders: [], rubberOrders: [], materialRequests: [], processHistory: [],
      workflow: { ...original.workflow, preparationType: "converting", convertingRoute: "by_production",
        preparationOrders: [], productionOrder: null, materialRequested: false, materialReady: false,
        toolingForwarded: false, rubberForwarded: false, toolingReady: false, rubberReady: false,
        currentStatus: "new" },
    }];
    api().completeIncomingPreparation("parallel-project", {
      route: "by_production", preparationOrders: kinds, productionOrder: kinds[0], materialRequested: true, remark: "Plan",
    });
  }
  const requirement = (kind, status = "received") => ({ requirementType: kind, status, requestedBy: "PIC",
    supplier: "Supplier", orderDate: null, expectedDate: null, arrivalDate: "2026-10-29",
    invoiceNumber: "INV-" + kind, price: "100", remark: kind + " latest input" });
  const material = (status = "released") => ({ miNumber: "MI-TEST", status, requestedBy: "PIC",
    requestDate: "2026-10-29", material: "Board", quantity: "100", unit: "sheet", remark: "MI latest input" });
  function save(task, complete = true, status) {
    const current = api();
    if (task === "mi") current.saveMaterialRequest("parallel-project", material(status), complete);
    else current[task === "tooling" ? "saveToolingRequirement" : "saveRubberRequirement"]("parallel-project", requirement(task, status), complete);
  }
  return { api, queue, start, save, states, load, loginAs: (name) => { actor = name; } };
}

test("history follows the logged-in user across account changes without rewriting earlier events", () => {
  const h = workflowHarness();
  h.start(["tooling", "rubber"]);
  const originalHistory = structuredClone(h.api().orders[0].processHistory);
  assert.ok(originalHistory.length >= 2);
  assert.ok(originalHistory.every(entry => entry.user === "Farhan"));

  for (const [name, task] of [["Jose", "tooling"], ["Anantha", "rubber"], ["Anantha", "mi"]]) {
    h.loginAs(name);
    const before = h.api().orders[0].processHistory.length;
    h.save(task);
    const added = h.api().orders[0].processHistory.slice(before);
    assert.ok(added.length > 0);
    assert.ok(added.every(entry => entry.user === name));
  }
  const beforeQc = h.api().orders[0].processHistory.length;
  h.loginAs("Anisa");
  h.api().moveOrderToStage("parallel-project", "quality-control", { pic: "Different PIC", description: "QC handoff" });
  const final = h.api().orders[0].processHistory;
  assert.ok(final.slice(beforeQc).every(entry => entry.user === "Anisa"));
  assert.ok(final.slice(beforeQc).length >= 2);
  assert.deepEqual(final.slice(0, originalHistory.length), originalHistory);
});

test("project creation and drawing status audit use the account rather than project PIC", () => {
  const h = workflowHarness();
  const { createEmptyProjectFormDraft } = h.load(path.resolve(__dirname, "../src/app/orders/components/project-form-config.ts"));
  const values = createEmptyProjectFormDraft();
  values.preparationType = "converting";
  values.convertingRoute = "by_production";
  values.pic = "Different PIC";
  values.mainData.component = "Audit test";
  values.mainData.custName = "Customer";
  h.loginAs("Anantha");
  h.api().addProject(values);
  const created = h.api().orders[0];
  assert.equal(created.processHistory.at(-1).user, "Anantha");
  h.loginAs("Farhan");
  h.api().updateDrawingStatus(created.id, "drawing_available");
  assert.equal(h.api().orders[0].processHistory.at(-1).user, "Farhan");
  assert.equal(h.api().orders[0].processHistory[0].user, "Anantha");
});

test("Offset Dimensions match Converting, retain all values, and keep Weight optional", () => {
  const h = workflowHarness();
  const config = h.load(path.resolve(__dirname, "../src/app/orders/components/project-form-config.ts"));
  const values = config.createEmptyProjectFormDraft();
  values.preparationType = "offset";
  values.mainData.component = "Offset carton";
  values.mainData.custName = "Customer";
  Object.assign(values.mainData, {
    width: "210", length: "297", dieCutSht: "4", iSizeL: "200",
    iSizeW: "150", iSizeH: "80", weight: "", fgWeight: "0.45",
  });

  const dimensions = (draft) => config.getProjectFormConfig(draft)
    .find((section) => section.id === "dimensions").fields;
  const convertingValues = { ...values, preparationType: "converting", convertingRoute: "by_design" };
  const offsetDimensions = dimensions(values);
  const convertingDimensions = dimensions(convertingValues);

  assert.deepEqual(offsetDimensions.map((field) => [field.key, field.label, field.type]), convertingDimensions.map((field) => [field.key, field.label, field.type]));
  assert.deepEqual(offsetDimensions.map((field) => field.key), ["width", "length", "dieCutSht", "iSizeL", "iSizeW", "iSizeH", "weight", "fgWeight"]);
  assert.equal(offsetDimensions.find((field) => field.key === "weight").required, false);
  assert.equal(convertingDimensions.find((field) => field.key === "weight").required, true);

  h.api().addProject(values);
  const created = h.api().orders[0];
  for (const key of offsetDimensions.map((field) => field.key)) {
    assert.equal(created.mainData[key], values.mainData[key]);
  }

  const edited = { ...values, mainData: { ...created.mainData, iSizeH: "85", fgWeight: "0.48" } };
  h.api().editProject(created.id, edited);
  const saved = h.api().orders[0];
  assert.equal(saved.mainData.iSizeH, "85");
  assert.equal(saved.mainData.fgWeight, "0.48");
});

test("new Sample Numbers use a monthly YYMMNNN sequence without changing stored numbers", () => {
  const h = workflowHarness();
  const { nextOrderCode } = h.load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const november = new Date(2026, 10, 22, 9, 0, 0);
  const december = new Date(2026, 11, 1, 9, 0, 0);
  const existing = [
    { no: "2611001" },
    { no: "2611003" },
    { no: "2610009" },
    { no: "PSR#260860" },
  ];

  assert.equal(nextOrderCode(existing, november), "2611004");
  assert.equal(nextOrderCode(existing, december), "2612001");
  assert.equal(existing[3].no, "PSR#260860");

  const { createEmptyProjectFormDraft } = h.load(path.resolve(__dirname, "../src/app/orders/components/project-form-config.ts"));
  const values = createEmptyProjectFormDraft();
  values.preparationType = "converting";
  values.convertingRoute = "by_design";
  values.mainData.component = "Sequential Code";
  values.mainData.custName = "Customer";
  h.states[0] = [];
  h.api().addProject(values);
  h.api().addProject(values);
  const [second, first] = h.api().orders;
  assert.match(first.no, /^\d{7}$/);
  assert.match(second.no, /^\d{7}$/);
  assert.equal(Number(second.no.slice(-3)), Number(first.no.slice(-3)) + 1);
  assert.notEqual(first.id, second.id);
});

test("legacy PSR Sample Numbers migrate to monthly Sample Numbers without changing project IDs or lineage", () => {
  const h = workflowHarness();
  const { migrateLegacyProjectCodes } = h.load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const original = structuredClone(h.api().orders[0]);
  const legacy = {
    ...original,
    id: "stable-project-id",
    no: "PSR#260860",
    createdAt: "2026-11-18T00:00:00.000Z",
    mainData: { ...original.mainData, mcNo: "PSR#260860" },
    lineage: { entryType: "new", rootProjectNo: "PSR#260860", sourceProjectNo: null, versionNumber: 0 },
  };
  const migrated = migrateLegacyProjectCodes([legacy])[0];
  assert.equal(migrated.id, "stable-project-id");
  assert.equal(migrated.no, "2611001");
  assert.equal(migrated.mainData.mcNo, "2611001");
  assert.equal(migrated.lineage.rootProjectNo, "2611001");
});

function permutations(items) {
  return items.length === 0 ? [[]] : items.flatMap((item, index) =>
    permutations(items.filter((_, i) => i !== index)).map((rest) => [item, ...rest]));
}

for (const kinds of [[], ["rubber"], ["tooling"], ["rubber", "tooling"]]) {
  for (const sequence of permutations([...kinds, "mi"])) {
    test(`shared project waits for all tasks: ${sequence.join(" -> ")}`, () => {
      const h = workflowHarness();
      h.start(kinds);
      sequence.forEach((task, index) => {
        const before = h.api().orders[0];
        for (const kind of kinds) assert.equal(h.queue.isInRequirementQueue(before, kind), true);
        assert.equal(h.queue.materialRequestQueueEntries(before).length, 1);
        h.save(task);
        const orders = h.api().orders;
        assert.equal(orders.length, 1);
        const project = orders[0];
        assert.equal(project.id, "parallel-project");
        if (index < sequence.length - 1) {
          assert.notEqual(project.stage, "sample-progress");
          for (const kind of kinds) assert.equal(h.queue.isInRequirementQueue(project, kind), true);
          assert.equal(h.queue.materialRequestQueueEntries(project).length, 1);
        } else {
          assert.equal(project.stage, "sample-progress");
          for (const kind of kinds) {
            assert.equal(h.queue.isInRequirementQueue(project, kind), false);
            assert.equal(project[kind === "tooling" ? "toolingOrders" : "rubberOrders"].at(-1).remark, kind + " latest input");
          }
          assert.equal(h.queue.materialRequestQueueEntries(project).length, 0);
          assert.equal(project.materialRequests.at(-1).remark, "MI latest input");
          assert.equal(project.processHistory.filter((item) => item.changeSummary === "Moved to Sample Process.").length, 1);
          const { SampleProgressDetails } = h.load(path.resolve(__dirname, "../src/components/workflow/sample-progress-details.tsx"));
          const html = require("react-dom/server").renderToStaticMarkup(SampleProgressDetails({ order: project }));
          for (const kind of kinds) assert.ok(html.includes(kind + " latest input"));
          assert.ok(html.includes("MI latest input"));
        }
      });
    });
  }
}

test("draft saves and incomplete statuses cannot release the shared project", () => {
  const h = workflowHarness();
  h.start(["rubber", "tooling"]);
  h.save("rubber");
  h.save("tooling");
  h.save("mi", false);
  assert.notEqual(h.api().orders[0].stage, "sample-progress");
  h.save("mi", true, "draft");
  assert.notEqual(h.api().orders[0].stage, "sample-progress");
  h.save("rubber", true, "ordered");
  h.save("mi");
  assert.notEqual(h.api().orders[0].stage, "sample-progress");
  h.save("rubber", true, "available");
  assert.equal(h.api().orders[0].stage, "sample-progress");
});

for (const status of ["released", "received"]) {
  test(`MI-only project reaches Sample Progress after ${status}, retaining latest MI input`, () => {
    const h = workflowHarness();
    h.start([]);
    const project = h.api().orders[0];
    assert.equal(h.queue.materialRequestQueueEntries(project).length, 1);
    assert.equal(h.queue.isInRequirementQueue(project, "rubber"), false);
    assert.equal(h.queue.isInRequirementQueue(project, "tooling"), false);
    h.save("mi", false, status);
    assert.notEqual(h.api().orders[0].stage, "sample-progress");
    for (const pendingStatus of ["draft", "requested", "on_hold"]) {
      h.save("mi", true, pendingStatus);
      assert.notEqual(h.api().orders[0].stage, "sample-progress");
      assert.equal(h.queue.materialRequestQueueEntries(h.api().orders[0]).length, 1);
    }
    h.save("mi", true, status);
    const completed = h.api().orders[0];
    assert.equal(completed.stage, "sample-progress");
    assert.equal(h.api().orders.length, 1);
    assert.equal(completed.materialRequests.at(-1).status, status);
    assert.equal(h.queue.materialRequestQueueEntries(completed).length, 0);
    const { SampleProgressDetails } = h.load(path.resolve(__dirname, "../src/components/workflow/sample-progress-details.tsx"));
    const html = require("react-dom/server").renderToStaticMarkup(SampleProgressDetails({ order: completed }));
    assert.ok(html.includes("MI latest input"));
    assert.ok(!html.includes("Tooling Details"));
    assert.ok(!html.includes("Rubber Details"));
  });
}

test("generic handoff cannot bypass unfinished parallel preparation", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  h.api().moveOrderToStage("parallel-project", "material-request");
  h.api().advanceOrder("parallel-project");
  assert.equal(h.api().orders[0].stage, "material-request");
});

test("repeat orders after Sample Progress retain a single project without reentering preparation", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  h.save("rubber"); h.save("mi"); h.save("rubber", false, "ordered");
  assert.equal(h.api().orders.length, 1);
  assert.equal(h.api().orders[0].stage, "sample-progress");
  assert.equal(h.queue.isInRequirementQueue(h.api().orders[0], "rubber"), false);
  assert.equal(h.queue.materialRequestQueueEntries(h.api().orders[0]).length, 0);
});

test("Order Tooling queue status mirrors the latest selected requirement status", () => {
  const h = workflowHarness();
  h.start(["tooling"]);

  h.save("tooling", false, "ordered");
  assert.equal(
    h.queue.requirementQueueDisplay(h.api().orders[0], "tooling").status,
    "Ordered",
  );

  h.save("tooling", false, "available");
  assert.equal(
    h.queue.requirementQueueDisplay(h.api().orders[0], "tooling").status,
    "Available / Existing",
  );
});

test("Order Rubber queue status mirrors the latest selected requirement status", () => {
  const h = workflowHarness();
  h.start(["rubber"]);

  h.save("rubber", false, "ordered");
  assert.equal(
    h.queue.requirementQueueDisplay(h.api().orders[0], "rubber").status,
    "Ordered",
  );

  h.save("rubber", false, "available");
  assert.equal(
    h.queue.requirementQueueDisplay(h.api().orders[0], "rubber").status,
    "Available / Existing",
  );
});

test("Material Request queue status mirrors the latest selected MI status", () => {
  const h = workflowHarness();
  h.start(["tooling"]);

  h.save("mi", false, "released");
  let queueEntries = h.queue.materialRequestQueueEntries(h.api().orders[0]);
  assert.equal(queueEntries.length, 1);
  assert.equal(queueEntries[0].status, "Released");

  h.save("mi", false, "requested");
  queueEntries = h.queue.materialRequestQueueEntries(h.api().orders[0]);
  assert.equal(queueEntries.length, 1);
  assert.equal(queueEntries[0].status, "Requested");
});

test("Save Draft updates Tooling without forwarding its workflow", () => {
  const h = workflowHarness();
  h.start(["tooling"]);
  const prepared = h.api().orders[0];
  h.states[0] = [{
    ...prepared,
    stage: "converting-production",
    workflow: {
      ...prepared.workflow,
      materialRequested: false,
      toolingForwarded: false,
      toolingReady: false,
      currentStatus: "in_progress",
    },
  }];
  const draft = {
    requirementType: "Auto Peeling",
    status: "ordered",
    requestedBy: "PIC",
    supplier: "Supplier",
    orderDate: "2026-10-29",
    expectedDate: "2026-11-04",
    arrivalDate: null,
    invoiceNumber: "INV-DRAFT",
    price: "100",
    remark: "Initial tooling draft",
  };

  h.api().saveToolingRequirement("parallel-project", draft, false, "draft");
  h.api().saveToolingRequirement("parallel-project", { ...draft, remark: "Revised tooling draft" }, false, "draft");

  const saved = h.api().orders[0];
  assert.equal(saved.stage, "converting-production");
  assert.equal(saved.workflow.toolingForwarded, false);
  assert.equal(saved.toolingOrders.length, 1);
  assert.equal(saved.toolingOrders[0].remark, "Revised tooling draft");
});

test("Tooling Save & Continue only forwards a ready non-parallel requirement", () => {
  const h = workflowHarness();
  h.start(["tooling"]);
  const prepared = h.api().orders[0];
  h.states[0] = [{
    ...prepared,
    stage: "converting-production",
    workflow: {
      ...prepared.workflow,
      materialRequested: false,
      toolingForwarded: false,
      toolingReady: false,
      currentStatus: "in_progress",
    },
  }];
  const requirement = {
    requirementType: "Auto Peeling",
    status: "ordered",
    requestedBy: "PIC",
    supplier: "Supplier",
    orderDate: "2026-10-29",
    expectedDate: "2026-11-04",
    arrivalDate: null,
    invoiceNumber: "INV-CONTINUE",
    price: "100",
    remark: "Awaiting tooling",
  };

  h.api().saveToolingRequirement("parallel-project", requirement, true, "draft");
  const pending = h.api().orders[0];
  assert.equal(pending.stage, "converting-production");
  assert.equal(pending.workflow.toolingForwarded, false);

  h.api().saveToolingRequirement("parallel-project", { ...requirement, status: "received" }, true, "draft");
  const continued = h.api().orders[0];
  assert.equal(continued.workflow.toolingForwarded, true);
  assert.equal(continued.stage, "sample-progress");
});

test("Rubber Save Draft and Save & Continue follow the same workflow rules", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  const prepared = h.api().orders[0];
  h.states[0] = [{
    ...prepared,
    stage: "converting-production",
    workflow: {
      ...prepared.workflow,
      materialRequested: false,
      rubberForwarded: false,
      rubberReady: false,
      currentStatus: "in_progress",
    },
  }];
  const requirement = {
    requirementType: "Rubber 4MM",
    status: "ordered",
    requestedBy: "PIC",
    supplier: "Supplier",
    orderDate: "2026-10-29",
    expectedDate: "2026-11-04",
    arrivalDate: null,
    invoiceNumber: "INV-RUBBER",
    price: "100",
    remark: "Initial rubber draft",
  };

  h.api().saveRubberRequirement("parallel-project", requirement, false, "draft");
  h.api().saveRubberRequirement("parallel-project", { ...requirement, remark: "Revised rubber draft" }, false, "draft");
  const saved = h.api().orders[0];
  assert.equal(saved.stage, "converting-production");
  assert.equal(saved.workflow.rubberForwarded, false);
  assert.equal(saved.rubberOrders.length, 1);
  assert.equal(saved.rubberOrders[0].remark, "Revised rubber draft");

  h.api().saveRubberRequirement("parallel-project", requirement, true, "draft");
  const pending = h.api().orders[0];
  assert.equal(pending.stage, "converting-production");
  assert.equal(pending.workflow.rubberForwarded, false);

  h.api().saveRubberRequirement("parallel-project", { ...requirement, status: "received" }, true, "draft");
  const continued = h.api().orders[0];
  assert.equal(continued.workflow.rubberForwarded, true);
  assert.equal(continued.stage, "sample-progress");
});

test("repeat Tooling and Rubber orders remain limited to existing By Production projects", () => {
  const h = workflowHarness();
  h.start(["tooling", "rubber"]);
  h.save("tooling"); h.save("rubber"); h.save("mi");

  const project = h.api().orders[0];
  assert.equal(project.stage, "sample-progress");
  assert.equal(h.queue.canRecordConvertingRequirement(project, "tooling"), true);
  assert.equal(h.queue.canRecordConvertingRequirement(project, "rubber"), true);

  const toolingCount = project.toolingOrders.length;
  const rubberCount = project.rubberOrders.length;
  h.save("tooling", false, "ordered");
  h.save("rubber", false, "ordered");

  const repeated = h.api().orders[0];
  assert.equal(h.api().orders.length, 1);
  assert.equal(repeated.stage, "sample-progress");
  assert.equal(repeated.toolingOrders.length, toolingCount + 1);
  assert.equal(repeated.rubberOrders.length, rubberCount + 1);

  const byDesign = {
    ...repeated,
    workflow: { ...repeated.workflow, convertingRoute: "by_design" },
  };
  const offset = {
    ...repeated,
    workflow: { ...repeated.workflow, preparationType: "offset", convertingRoute: null },
  };
  assert.equal(h.queue.canRecordConvertingRequirement(byDesign, "tooling"), false);
  assert.equal(h.queue.canRecordConvertingRequirement(byDesign, "rubber"), false);
  assert.equal(h.queue.canRecordConvertingRequirement(offset, "tooling"), false);
  assert.equal(h.queue.canRecordConvertingRequirement(offset, "rubber"), false);
});

test("cancelled projects leave every preparation queue", () => {
  const h = workflowHarness();
  h.start(["rubber", "tooling"]);
  h.api().cancelProject("parallel-project", "Cancelled by customer");
  const order = h.api().orders[0];
  assert.equal(h.queue.isInRequirementQueue(order, "rubber"), false);
  assert.equal(h.queue.isInRequirementQueue(order, "tooling"), false);
  assert.equal(h.queue.materialRequestQueueEntries(order).length, 0);
});

test("changing a completed requirement back to Ordered from Incoming Design blocks Sample Progress", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  h.save("rubber");
  const values = { ...h.api().orders[0].rubberOrders.at(-1), status: "ordered" };
  h.api().updateIncomingRequirementDetails("parallel-project", "rubber", values);
  h.save("mi");
  assert.notEqual(h.api().orders[0].stage, "sample-progress");
  h.save("rubber");
  assert.equal(h.api().orders[0].stage, "sample-progress");
});

test("Offset Material readiness remains in its own queue without downstream routing", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  const order = h.states[0][0];
  h.states[0] = [{ ...order, stage: "offset-material-request", workflow: {
    ...order.workflow, preparationType: "offset", convertingRoute: null, preparationOrders: [], productionOrder: null,
  } }];
  h.save("mi");
  assert.equal(h.api().orders[0].stage, "offset-material-request");
  assert.equal(h.api().orders[0].workflow.materialReady, true);
});

test("Offset MI retains legacy next-step metadata without activating its route", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  const order = h.states[0][0];
  h.states[0] = [{ ...order, id: "offset-mi-next-step", stage: "offset-material-request", workflow: {
    ...order.workflow, preparationType: "offset", convertingRoute: null, preparationOrders: [], productionOrder: null,
  } }];
  const values = {
    miNumber: "OMI-TEST", status: "released", requestedBy: "PIC", requestDate: "2026-11-23",
    material: "Ivory", quantity: "1000", unit: "sheet", remark: "Material ready", offsetNextStep: "varnish",
  };

  h.api().saveMaterialRequest("offset-mi-next-step", values, true);
  let saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.materialRequests.at(-1).offsetNextStep, "varnish");
  assert.doesNotMatch(saved.processHistory.findLast((entry) => entry.process === "material_request").changeSummary, /Next step:/);

  h.api().saveMaterialRequest("offset-mi-next-step", { ...values, offsetNextStep: "tooling_plate" }, true);
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-material-request");
  assert.equal(saved.materialRequests.at(-1).offsetNextStep, "tooling_plate");
  assert.equal(saved.materialRequests.length, 1);
});

test("Offset Tooling / Plate stores one project-owned active record without changing project mainData", () => {
  const h = workflowHarness();
  const incoming = structuredClone(h.api().orders[0]);
  const mainData = { ...incoming.mainData, custName: "Offset Customer", component: "Offset carton", boardQua: "Ivory", imposition: "4 UP" };
  h.states[0] = [{
    ...incoming,
    id: "offset-tooling-test",
    stage: "offset-plate",
    mainData,
    processHistory: [],
    workflow: { ...incoming.workflow, preparationType: "offset", convertingRoute: null, currentStatus: "in_progress" },
  }];
  const values = {
    mcNo: "MC-PL-01", status: "ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Hard", machine: "DC TMZ", orderDate: "2026-11-23", receivedDate: "2026-11-25",
    supplier: "Plate Supplier", invoiceNumber: "INV-PL-01", price: "500000", remark: "Tooling note",
  };

  h.api().createOffsetTooling("offset-tooling-test", values);
  let saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-plate");
  assert.equal(saved.offsetToolingRecords.length, 1);
  assert.deepEqual({ ...saved.offsetToolingRecords[0], id: undefined, recordedAt: undefined, updatedBy: undefined }, { ...values, id: undefined, recordedAt: undefined, updatedBy: undefined });
  const firstToolingId = saved.offsetToolingRecords[0].id;
  assert.deepEqual(saved.mainData, mainData);
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_tooling"));

  h.api().createOffsetTooling("offset-tooling-test", { ...values, mcNo: "MC-PL-02", machine: "DC Flat" });
  saved = h.api().orders[0];
  assert.equal(saved.offsetToolingRecords.length, 1);
  assert.equal(saved.offsetToolingId, firstToolingId);
  h.api().updateOffsetTooling("offset-tooling-test", firstToolingId, { ...values, receivedDate: "2026-11-26" });
  saved = h.api().orders[0];
  assert.equal(saved.offsetToolingRecords.find((record) => record.id === firstToolingId).receivedDate, "2026-11-26");
});

test("manual Offset Tooling is retained independently without creating or changing a project", () => {
  const h = workflowHarness();
  const before = structuredClone(h.api().orders);
  h.api().createManualOffsetTooling({
    mcNo: "TOOL-MANUAL-01", customer: "Manual Customer", description: "Manual plate", material: "Ivory",
    imposition: "2 UP", pic: "PIC", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Medium", machine: "DC Flat", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "",
  });
  const current = h.api();
  assert.equal(current.orders.length, before.length);
  assert.deepEqual(current.orders, before);
  assert.equal(current.manualOffsetToolingRecords.length, 1);
  assert.equal(current.manualOffsetToolingRecords[0].mcNo, "TOOL-MANUAL-01");
  assert.equal(current.manualOffsetToolingRecords[0].receivedDate, "");
});

test("manual Offset Tooling cannot be selected by an Offset project", () => {
  const h = workflowHarness();
  const original = structuredClone(h.api().orders[0]);
  h.api().createManualOffsetTooling({
    mcNo: "TOOL-CATALOG-01", customer: "Catalog Customer", description: "Catalog carton", material: "Ivory",
    imposition: "4 UP", pic: "PIC", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Medium", machine: "DC Flat", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "",
  });
  h.states[0] = [{
    ...original,
    id: "offset-catalog-select-test",
    stage: "offset-plate",
    mainData: { ...original.mainData, custName: "Catalog Customer", boardQua: "Ivory", imposition: "4 UP" },
    processHistory: [],
    workflow: { ...original.workflow, preparationType: "offset", convertingRoute: null, currentStatus: "in_progress" },
  }];
  const selected = h.api().orders[0];
  assert.equal(selected.stage, "offset-plate");
  assert.equal(selected.offsetToolingId, undefined);
  assert.equal(selected.processHistory.length, 0);
});

test("received manual tooling remains independent from project history", () => {
  const h = workflowHarness();
  const original = structuredClone(h.api().orders[0]);
  const values = {
    mcNo: "TOOL-RECEIVED-01", customer: "Received Customer", description: "Carton", material: "Ivory",
    imposition: "2 UP", pic: "PIC", status: "not_ordered", grammage: "310 gsm", openWidth: "700", openLength: "1000",
    priority: "Medium", machine: "DC Flat", orderDate: "", receivedDate: "", supplier: "", invoiceNumber: "", price: "", remark: "",
  };
  h.api().createManualOffsetTooling(values);
  const toolingId = h.api().manualOffsetToolingRecords[0].id;
  h.states[0] = [{
    ...original, id: "offset-tooling-received-test", stage: "offset-plate", processHistory: [],
    mainData: { ...original.mainData, custName: "Received Customer", boardQua: "Ivory", imposition: "2 UP" },
    workflow: { ...original.workflow, preparationType: "offset", convertingRoute: null, currentStatus: "in_progress" },
  }];
  h.api().updateManualOffsetTooling(toolingId, { ...values, receivedDate: "2026-11-25", supplier: "Plate Supplier" });
  const current = h.api();
  assert.equal(current.manualOffsetToolingRecords[0].receivedDate, "2026-11-25");
  assert.equal(current.orders[0].stage, "offset-plate");
  assert.equal(current.orders[0].processHistory.length, 0);
});

test("new Offset projects route to Prepress automatically without changing identity or master data", () => {
  const h = workflowHarness();
  const { createEmptyProjectFormDraft } = h.load(path.resolve(__dirname, "../src/app/orders/components/project-form-config.ts"));
  const values = createEmptyProjectFormDraft();
  values.preparationType = "offset";
  values.mainData.component = "Offset carton";
  values.mainData.custName = "Offset Customer";
  values.mainData.pantoneCount = "2";
  values.mainData.specialColourCount = "1";
  values.mainData.emboss = "Yes";
  const masterData = structuredClone(values.mainData);
  const countBefore = h.api().orders.length;

  h.api().addProject(values);

  const created = h.api().orders[0];
  const { matchesProjectVisibility } = h.load(path.resolve(__dirname, "../src/lib/active-project.ts"));
  assert.equal(h.api().orders.length, countBefore + 1);
  assert.equal(created.stage, "offset-prepress");
  assert.equal(matchesProjectVisibility(created, "active"), true);
  assert.equal(created.workflow.currentProcess, "Prepress");
  assert.equal(created.workflow.currentStatus, "waiting");
  assert.equal(created.workflow.progress, created.progress);
  assert.equal(created.no, created.mainData.mcNo);
  assert.equal(created.mainData.component, masterData.component);
  assert.equal(created.mainData.custName, masterData.custName);
  assert.equal(created.mainData.pantoneCount, masterData.pantoneCount);
  assert.equal(created.mainData.specialColourCount, masterData.specialColourCount);
  assert.equal(created.processHistory.filter((entry) => entry.process === "new_project").length, 1);
  const routing = created.processHistory.at(-1);
  assert.equal(routing.process, "Prepress");
  assert.equal(routing.user, "System");
  assert.equal(routing.remark, "");
  assert.equal(routing.changeSummary, "Automatically routed to Prepress after project creation.");
});

test("Offset Prepress edit saves its own details without bypassing the preparation plan", () => {
  const h = workflowHarness();
  const incoming = structuredClone(h.api().orders[0]);
  const mainData = { ...incoming.mainData, remark: "Master Offset remark", fgQuantity: "1000" };
  h.states[0] = [{
    ...incoming,
    id: "offset-prepress-test",
    stage: "offset-prepress",
    mainData,
    processHistory: [],
    workflow: {
      ...incoming.workflow,
      preparationType: "offset",
      convertingRoute: null,
      currentStatus: "in_progress",
      offsetHandoffRemark: "Incoming handoff",
    },
  }];
  const { offsetPreparationSnapshot } = h.load(path.resolve(__dirname, "../src/lib/offset-readiness.ts"));
  const initialSnapshot = offsetPreparationSnapshot(h.api().orders[0], "prepress");
  const values = {
    noJoPnCode: "JO-01",
    idPlate: "PL-100",
    plateType: "CD102",
    fgQuantity: "900",
    proofColor: "Waiting",
    plot: "Ready",
    plate: "Ready",
    ink: "Ready",
    remark: "Waiting material",
  };

  assert.match(h.api().saveOffsetPrepress("offset-prepress-test", { ...values, proofColor: "", remark: "" }, "continue", initialSnapshot), /must be Ready/);
  assert.equal(h.api().orders[0].offsetPrepress, undefined);
  assert.equal(h.api().orders[0].processHistory.length, 0);

  assert.match(h.api().saveOffsetPrepress("offset-prepress-test", { ...values, remark: "" }, "continue", initialSnapshot), /Remark is required/);
  assert.equal(h.api().orders[0].offsetPrepress, undefined);
  assert.equal(h.api().orders[0].processHistory.length, 0);

  h.api().saveOffsetPrepress("offset-prepress-test", values, "draft", initialSnapshot);
  let saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-prepress");
  assert.deepEqual({ ...saved.offsetPrepress, recordedAt: undefined, updatedBy: undefined }, { ...values, noJoPnCode: mainData.mcNo || "", recordedAt: undefined, updatedBy: undefined });
  assert.deepEqual(saved.mainData, mainData);
  assert.equal(saved.workflow.offsetHandoffRemark, "Incoming handoff");
  assert.ok(saved.processHistory.some((entry) => entry.process === "offset_prepress" && entry.remark === "Waiting material"));

  const { normalizePersistedOrder } = h.load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const reloaded = normalizePersistedOrder(JSON.parse(JSON.stringify(saved)));
  assert.equal(reloaded.offsetPrepress.fgQuantity, "900");
  assert.equal(reloaded.offsetPrepress.proofColor, "Waiting");
  assert.equal(reloaded.processHistory.filter((entry) => entry.process === "offset_prepress").length, 1);

  h.api().saveOffsetPrepress("offset-prepress-test", { ...values, proofColor: "Ready", remark: "" }, "continue", offsetPreparationSnapshot(saved, "prepress"));
  saved = h.api().orders[0];
  assert.equal(saved.stage, "offset-prepress");
  assert.equal(saved.offsetPrepress.plate, "Ready");
  assert.equal(saved.offsetPrepress.proofColor, "Ready");
  assert.equal(saved.offsetPrepress.remark, "");
  assert.equal(saved.offsetPrepress.fgQuantity, "900");
  assert.equal(saved.workflow.offsetHandoffRemark, "Incoming handoff");
  assert.deepEqual(saved.mainData, mainData);
  assert.equal(saved.processHistory.filter((entry) => entry.process === "offset_prepress").length, 2);
});

test("Edit Prepress maps project master fields read-only and exposes only approved status choices", () => {
  const modalSource = fs.readFileSync(path.resolve(__dirname, "../src/app/offset/components/offset-prepress-modal.tsx"), "utf8");
  const detailsSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/offset-prepress-details.tsx"), "utf8");

  for (const masterField of [
    "order.no", "order.mainData.mcNo", "order.mainData.custName", "order.mainData.component",
    "order.mainData.boardQua", "order.mainData.fgQuantity", "order.mainData.imposition",
    "order.mainData.colours", "order.mainData.varnish",
  ]) assert.match(modalSource, new RegExp(masterField.replaceAll(".", "\\.")));
  assert.match(modalSource, /const prepressStatuses: readonly Exclude<OffsetPrepressStatus, "">\[\] = \["Ready", "Waiting"\]/);
  assert.match(modalSource, /validateOffsetPrepressValues\(values, "continue"\)/);
  assert.match(modalSource, /modal-dialog modal-dialog-wide/);
  assert.match(detailsSource, /\["FG Qty", order\.offsetPrepress\.fgQuantity\]/);
});

test("target queue Status columns use saved record status and the preceding-stage remark without badges", () => {
  const tableSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/order-table.tsx"), "utf8");
  const stageSource = fs.readFileSync(path.resolve(__dirname, "../src/components/workflow/workflow-stage-view.tsx"), "utf8");
  assert.match(tableSource, /type QueueStatusPresentation = "tooling" \| "rubber" \| "material" \| "offset-prepress" \| "offset-material" \| "offset-tooling"/);
  assert.match(tableSource, /order\.toolingOrders\.at\(-1\)\?\.status \?\? "needed"/);
  assert.match(tableSource, /order\.rubberOrders\.at\(-1\)\?\.status \?\? "needed"/);
  assert.match(tableSource, /order\.materialRequests\.at\(-1\)\?\.status \?\? "draft"/);
  assert.match(tableSource, /offsetToolingQueueStatus\(order\)/);
  assert.doesNotMatch(tableSource, /offset-varnish/);
  assert.match(tableSource, /previousStageRemark/);
  assert.match(tableSource, /prepressStatusSummary/);
  assert.match(tableSource, /prepress-status-grid/);
  assert.match(tableSource, /prepress-status-remark/);
  assert.doesNotMatch(tableSource, /Last update:/);
  assert.match(stageSource, /stage === "tooling-progress"/);
  assert.match(stageSource, /stage === "rubber-order-setting"/);
  assert.match(stageSource, /stage === "offset-material-request"/);
  assert.match(stageSource, /stage === "offset-prepress"/);
  assert.match(stageSource, /stage === "offset-plate"/);
  assert.doesNotMatch(stageSource, /\? "offset-varnish"/);
});

test("Offset retains only the relevant handoff remark for each destination stage", () => {
  const h = workflowHarness();
  const incoming = structuredClone(h.api().orders[0]);
  h.states[0] = [{
    ...incoming,
    id: "offset-handoff-test",
    stage: "order",
    mainData: { ...incoming.mainData, remark: "Master project remark" },
    processHistory: [],
    workflow: {
      ...incoming.workflow,
      preparationType: "offset",
      convertingRoute: null,
      preparationOrders: [],
      productionOrder: null,
      materialRequested: false,
      currentStatus: "new",
    },
  }];

  h.api().completeIncomingPreparation("offset-handoff-test", {
    route: "offset", offsetNextPreparation: "prepress", preparationOrders: [], productionOrder: null,
    materialRequested: false, remark: "Waiting proof color",
  });
  let project = h.api().orders[0];
  assert.equal(project.stage, "offset-prepress");
  assert.equal(project.workflow.offsetHandoffRemark, "Waiting proof color");
  assert.equal(project.mainData.remark, "Master project remark");

  const { offsetPlanSnapshot } = h.load(path.resolve(__dirname, "../src/lib/offset-readiness.ts"));
  assert.equal(h.api().submitOffsetMaterialPreparation(project.id, { rows: [], remark: "Waiting material" },
    offsetPlanSnapshot(project)), "");
  project = h.api().orders[0];
  assert.equal(project.stage, "offset-material-request");
  assert.equal(project.workflow.offsetHandoffRemark, "Waiting material");
  assert.equal(project.mainData.remark, "Master project remark");
  assert.ok(project.processHistory.some((entry) =>
    entry.process === "offset_preparation_plan" && entry.remark === "Waiting material",
  ));

  h.api().advanceOrder("offset-handoff-test", {
    pic: project.pic,
    deadline: project.deadline,
    description: "",
  });
  assert.equal(h.api().orders[0], project);
});

test("standalone requirements keep their direct Material to Sample route", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  const order = h.states[0][0];
  h.states[0] = [{ ...order, id: "standalone-rubber-test", stage: "material-request", workflow: {
    ...order.workflow, materialRequested: false,
  } }];
  h.api().saveMaterialRequest("standalone-rubber-test", {
    miNumber: "MI-STANDALONE", status: "received", requestedBy: "PIC", requestDate: "2026-10-29",
    material: "Board", quantity: "1", unit: "sheet", remark: "Standalone",
  }, true);
  assert.equal(h.api().orders[0].stage, "sample-progress");
});
