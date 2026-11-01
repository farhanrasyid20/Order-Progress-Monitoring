/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Exercise the real provider callbacks with synchronous hook state. Effects
// are omitted so these workflow tests never read or overwrite browser storage.
function workflowHarness() {
  const states = [];
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
    useRef: (current) => ({ current }),
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
    new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
    return loadedModule.exports;
  }
  const { WorkflowOrdersProvider } = load(path.resolve(__dirname, "../src/components/workflow/workflow-provider.tsx"));
  const queue = load(path.resolve(__dirname, "../src/lib/requirement-queue.ts"));
  const api = () => {
    cursor = 0;
    return WorkflowOrdersProvider({ children: null, currentUserName: actor }).props.value;
  };
  const original = structuredClone(api().orders[0]);
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

test("Offset keeps its Material to Plate route", () => {
  const h = workflowHarness();
  h.start(["rubber"]);
  const order = h.states[0][0];
  h.states[0] = [{ ...order, stage: "offset-material-request", workflow: {
    ...order.workflow, preparationType: "offset", convertingRoute: null, preparationOrders: [], productionOrder: null,
  } }];
  h.save("mi");
  assert.equal(h.api().orders[0].stage, "offset-plate");
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
