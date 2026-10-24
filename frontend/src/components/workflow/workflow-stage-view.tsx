"use client";

import { useMemo, useState, type ReactNode } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { ProcessSummary } from "@/components/workflow/process-summary";
import { ProjectHistoryModal } from "@/components/workflow/project-history-modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { isInRequirementQueue, requirementQueueDisplay, materialRequestQueueEntries } from "@/lib/requirement-queue";
import type { IconName } from "@/components/ui/icon";
import type { Order, WorkflowStage } from "@/types/order";

export type WorkflowEditModalRenderProps = {
  order: Order;
  onClose: () => void;
};

export type WorkflowStageViewProps = {
  editActionLabel?: string;
  stage: WorkflowStage;
  title: string;
  copy: string;
  pageAction?: ReactNode;
  icon: IconName;
  queueTitle: string;
  queueCopy: string;
  summaryLanguage?: "id" | "en";
  renderEditModal: (props: WorkflowEditModalRenderProps) => ReactNode;
};

/**
 * Shared queue shell only. Each routed feature supplies its own edit modal so
 * workflow-specific forms remain in that feature's component group.
 */
export function WorkflowStageView({
  stage,
  title,
  copy,
  pageAction,
  icon,
  queueTitle,
  queueCopy,
  summaryLanguage,
  renderEditModal,
  editActionLabel,
}: WorkflowStageViewProps) {
  const { orders } = useWorkflowOrders();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const queueOrders = useMemo(
    () => stage === "tooling-progress" || stage === "rubber-order-setting"
      ? orders.filter((order) => isInRequirementQueue(order, stage === "tooling-progress" ? "tooling" : "rubber"))
        .map((order) => requirementQueueDisplay(order, stage === "tooling-progress" ? "tooling" : "rubber"))
      : stage === "material-request" ? orders.flatMap(materialRequestQueueEntries)
      : orders.filter((order) => order.stage === stage),
    [orders, stage],
  );
  const pagination = useTablePagination(queueOrders);

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
        {pageAction}
      </div>

      <ProcessSummary icon={icon} language={summaryLanguage} />

      <OrderCard title={queueTitle} subtitle={queueCopy}>
        <OrderTable
          orders={pagination.pageItems}
          queueLayout={[
            "tooling-progress", "rubber-order-setting", "material-request", "sample-progress",
            "offset-prepress", "offset-material-request", "offset-plate", "offset-varnish", "offset-press",
            "quality-control", "fa-report", "submit-sample", "sample-completed",
          ].includes(stage)}
          requirementKind={stage === "tooling-progress" ? "tooling" : stage === "rubber-order-setting" ? "rubber" : undefined}
          onViewOrder={setHistoryOrder}
          onEditOrder={setEditingOrder}
          editActionLabel={editActionLabel}
        />
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="projects"
          onPageChange={pagination.goToPage}
        />
      </OrderCard>

      {editingOrder
        ? renderEditModal({
            order: editingOrder,
            onClose: () => setEditingOrder(null),
          })
        : null}
      {historyOrder ? (
        <ProjectHistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} offsetDetails={stage.startsWith("offset-")} requirementKind={stage === "tooling-progress" ? "tooling" : stage === "rubber-order-setting" ? "rubber" : undefined} materialRequest={stage === "material-request" || stage === "offset-material-request"} sampleProgress={stage === "sample-progress"} />
      ) : null}
    </>
  );
}
