"use client";

import { Fragment } from "react";
import type { Order, WorkflowStage } from "@/types/order";

export type WorkflowPhase = "order" | "preparation" | "process" | "closing";

export type WorkflowFilterCardsProps = {
  orders: Order[];
  selectedPhase: WorkflowPhase | "";
  onPhaseChange: (phase: WorkflowPhase | "") => void;
  onAll?: () => void;
};

type WorkflowCard = {
  phase: WorkflowPhase | "";
  label: string;
  description: string;
};

const workflowCards: WorkflowCard[] = [
  {
    phase: "",
    label: "All",
    description: "All workflow phases",
  },
  {
    phase: "order",
    label: "Order",
    description: "Project & drawing",
  },
  {
    phase: "preparation",
    label: "Preparation",
    description: "Converting & offset",
  },
  {
    phase: "process",
    label: "Process",
    description: "Press & sample",
  },
  {
    phase: "closing",
    label: "Closing",
    description: "QC to approval",
  },
];

const stagePhase: Record<WorkflowStage, WorkflowPhase> = {
  order: "order",
  "design-incoming": "order",
  "design-progress": "order",
  "review-approval": "order",
  "converting-design": "preparation",
  "converting-production": "preparation",
  "tooling-progress": "preparation",
  "rubber-order-setting": "preparation",
  "material-request": "preparation",
  "offset-design": "preparation",
  "offset-prepress": "preparation",
  "offset-material-request": "preparation",
  "offset-plate": "preparation",
  "offset-varnish": "preparation",
  "offset-press": "process",
  "sample-progress": "process",
  "quality-control": "closing",
  "fa-report": "closing",
  "submit-sample": "closing",
  "sample-completed": "closing",
  "order-production": "closing",
  completed: "closing",
};

/** Maps the detailed COTS stage to one of the four diagram swimlanes. */
export function workflowPhaseForStage(stage: WorkflowStage): WorkflowPhase {
  return stagePhase[stage];
}

/**
 * The Incoming Design board is the compact project view of the COTS
 * flow. Cards are filters, rather than a second dashboard summary.
 */
export function WorkflowFilterCards({
  orders,
  selectedPhase,
  onPhaseChange,
  onAll,
}: WorkflowFilterCardsProps) {
  const countForPhase = (phase: WorkflowPhase | "") =>
    phase ? orders.filter((order) => workflowPhaseForStage(order.stage) === phase).length : orders.length;

  return (
    <section className="card workflow-filter-card" aria-label="COTS workflow filter">
      <div className="workflow-filter-heading">
        <div>
          <h2>Workflow Status</h2>
          <p>View projects or filter by workflow phase.</p>
        </div>
        <strong>{orders.length} projects</strong>
      </div>
      <div className="workflow-filter-grid">
        {workflowCards.map((card, index) => (
          <Fragment key={card.phase || "all"}>
            <button
              type="button"
              className={`workflow-filter-item ${selectedPhase === card.phase ? "is-active" : ""}`}
              aria-pressed={selectedPhase === card.phase}
              onClick={() => {
                if (card.phase === "" && onAll) {
                  onAll();
                  return;
                }
                onPhaseChange(selectedPhase === card.phase ? "" : card.phase);
              }}
            >
              <span>{card.label}</span>
              <strong>{countForPhase(card.phase)}</strong>
              <small>{card.description}</small>
            </button>
            {index < workflowCards.length - 1 ? (
              <span className="workflow-filter-arrow" aria-hidden="true">→</span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export default WorkflowFilterCards;
