"use client";

import { OffsetPrepressDetails } from "./offset-prepress-details";
import { OffsetProjectDetails } from "./offset-project-details";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { englishOffsetLabel } from "@/lib/offset-labels";
import type { Order, ProcessHistoryRecord, StandaloneRequirementKind } from "@/types/order";
import { SampleDecisionDetails } from "./sample-decision-details";
import { ReadyToSubmitDetails } from "./ready-to-submit-details";
import { FaReportDetails } from "./fa-report-details";
import { QcCheckingDetails } from "./qc-checking-details";
import { RequirementDetails } from "./requirement-details";
import { MaterialRequestDetails } from "./material-request-details";
import { SampleProgressDetails } from "./sample-progress-details";
import { ArchiveProjectDetails } from "./archive-project-details";

export type ProjectHistoryModalProps = {
  order: Order;
  onClose: () => void;
  requirementKind?: StandaloneRequirementKind;
  materialRequest?: boolean;
  sampleProgress?: boolean;
  archiveDetails?: boolean;
  offsetDetails?: boolean;
};

function displayHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function historyActivity(record: ProcessHistoryRecord) {
  if (record.process === "handoff_details_updated" && record.stage === "offset-prepress") return "Prepress completed";
  const labels: Record<string, string> = {
    new_project: "New project created",
    version_up: "Version up created",
    incoming_preparation: "Preparation updated",
    drawing_submitted: "Drawing link submitted",
    design_decision: "Design decision updated",
    tooling_requirement: "Tooling requirement updated",
    rubber_requirement: "Rubber requirement updated",
    standalone_tooling_order: "Standalone tooling order created",
    standalone_rubber_order: "Standalone rubber order created",
    material_request: "Material request / MI updated",
    sample_progress: "Sample progress updated",
    offset_spk: "Offset SPK created",
    handoff_details_updated: "Handoff details updated",
    project_details_updated: "Project decision details updated",
    project_updated: "Project information updated",
    project_cancelled: "Project cancelled",
    "Design Process": "Moved to Design Process",
  };

  return labels[record.process] ?? record.process;
}

function historyChange(record: ProcessHistoryRecord) {
  if (record.process === "handoff_details_updated" && record.stage === "offset-prepress") return "Move to Material Request / MI.";
  if (record.changeSummary) return record.changeSummary;
  if (record.process === "new_project") return "Initial project data created.";
  if (record.remark) return record.remark;
  if (record.status) return `Status: ${record.status}`;

  return "-";
}

/** Shared audit detail for records after they move beyond Incoming Design. */
export function ProjectHistoryModal({ order, onClose, requirementKind, materialRequest = false, sampleProgress = false, archiveDetails = false, offsetDetails = false }: ProjectHistoryModalProps) {
  const titleId = useId();
  const prepressDetails = Boolean(offsetDetails && order.stage === "offset-prepress");
  const offsetMaterialDetails = order.workflow.preparationType === "offset" && order.stage === "offset-material-request" && (offsetDetails || materialRequest);
  const offsetPlateDetails = Boolean(offsetDetails && order.stage === "offset-plate");
  const offsetVarnishDetails = Boolean(offsetDetails && order.stage === "offset-varnish");
  const offsetPressDetails = Boolean(offsetDetails && order.stage === "offset-press");
  const offsetQcDetails = order.workflow.preparationType === "offset" && order.stage === "quality-control" && !archiveDetails;
  const offsetFaDetails = order.workflow.preparationType === "offset" && order.stage === "fa-report" && !archiveDetails;
  const offsetReadyDetails = order.workflow.preparationType === "offset" && order.stage === "submit-sample" && !archiveDetails;
  const offsetDecisionDetails = order.workflow.preparationType === "offset" && order.stage === "sample-completed" && !archiveDetails;
  const offsetArchiveDetails = archiveDetails && order.workflow.preparationType === "offset";
  const standardOffsetDetails = prepressDetails || offsetMaterialDetails || offsetPlateDetails || offsetVarnishDetails || offsetPressDetails || offsetQcDetails || offsetFaDetails || offsetReadyDetails || offsetDecisionDetails || offsetArchiveDetails;
  const history = [...order.processHistory].reverse();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`modal-dialog history-dialog${requirementKind || materialRequest || sampleProgress || archiveDetails || offsetDetails || standardOffsetDetails || order.stage === "quality-control" || order.stage === "fa-report" || order.stage === "submit-sample" || order.stage === "sample-completed" ? " incoming-detail-dialog" : ""}${offsetDetails && !standardOffsetDetails ? " archive-detail-dialog" : ""}${offsetDetails && !standardOffsetDetails ? " offset-detail-dialog" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="modal-header">
          <div>
            <h2 id={titleId}>{prepressDetails ? "Offset Prepress Details & History" : sampleProgress ? "Sample Progress Details & History" : materialRequest ? "Material Request / MI Details & History" : requirementKind ? `${requirementKind === "tooling" ? "Tooling" : "Rubber"} Details & History` : "Project Details & History"}</h2>
            <p>{order.no} / {order.customer} / {order.product}{order.requirementBranch ? ` / ${order.requirementBranch === "tooling" ? "Tooling" : "Rubber"}` : ""}</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close project details and history"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="history-modal-body">
          <div className="history-project-summary">
            <div>
              <span>Current Process</span>
              <strong>{englishOffsetLabel(order.process)}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{order.status}</strong>
            </div>
            <div>
              <span>Last Update</span>
              <strong>{displayHistoryTime(order.updatedAt)}</strong>
            </div>
          </div>

          {order.workflow.preparationType === "offset" && !standardOffsetDetails && !archiveDetails && !offsetDetails && !requirementKind && !materialRequest && !sampleProgress ? <OffsetProjectDetails order={order} /> : null}
          {standardOffsetDetails ? <OffsetPrepressDetails order={order} fullProjectInformation={archiveDetails} showMaterialRequest={offsetMaterialDetails || offsetPlateDetails} showPlate={offsetPlateDetails} showVarnish={offsetVarnishDetails} showPress={offsetPressDetails || offsetQcDetails || offsetFaDetails || offsetReadyDetails || offsetDecisionDetails || offsetArchiveDetails} /> : offsetDetails ? <ArchiveProjectDetails order={order} offsetOnly /> : null}
          {requirementKind ? <RequirementDetails order={order} kind={requirementKind} /> : null}
          {materialRequest && !offsetDetails && !offsetMaterialDetails ? <MaterialRequestDetails order={order} /> : null}
          {(archiveDetails && order.workflow.preparationType !== "offset") || sampleProgress || (order.requirementBranch && !archiveDetails && !offsetDetails && !requirementKind && !materialRequest) ? <SampleProgressDetails order={order} fullProjectInformation={archiveDetails} /> : null}

          {archiveDetails || order.stage === "fa-report" || order.stage === "submit-sample" || order.stage === "sample-completed" ? <QcCheckingDetails order={order} /> : null}
          {archiveDetails || order.stage === "submit-sample" || order.stage === "sample-completed" ? <FaReportDetails order={order} /> : null}
          {archiveDetails || order.stage === "sample-completed" ? <ReadyToSubmitDetails order={order} /> : null}
          {archiveDetails ? <SampleDecisionDetails order={order} /> : null}

          <div className="table-wrap history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Updated By</th>
                  <th>Activity</th>
                  <th>Changes</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={`${record.date}-${record.process}-${index}`}>
                    <td>{displayHistoryTime(record.date)}</td>
                    <td>{record.user || "System"}</td>
                    <td>{englishOffsetLabel(historyActivity(record))}</td>
                    <td>{englishOffsetLabel(historyChange(record))}</td>
                    <td>{record.remark || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="modal-actions history-modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </section>
    </div>
  );
}
