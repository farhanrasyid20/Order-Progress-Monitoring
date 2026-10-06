"use client";

import { useMemo, useState, type ReactNode } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { ProcessSummary } from "@/components/workflow/process-summary";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import type { IconName } from "@/components/ui/icon";
import type { Order, WorkflowStage } from "@/types/order";

export type WorkflowEditModalRenderProps = {
  order: Order;
  onClose: () => void;
};

export type WorkflowStageViewProps = {
  stage: WorkflowStage;
  title: string;
  copy: string;
  icon: IconName;
  queueTitle: string;
  queueCopy: string;
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
  icon,
  queueTitle,
  queueCopy,
  renderEditModal,
}: WorkflowStageViewProps) {
  const { orders } = useWorkflowOrders();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const queueOrders = useMemo(
    () => orders.filter((order) => order.stage === stage),
    [orders, stage],
  );

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
      </div>

      <ProcessSummary icon={icon} />

      <OrderCard title={queueTitle} subtitle={queueCopy}>
        <OrderTable orders={queueOrders} onEditOrder={setEditingOrder} />
      </OrderCard>

      {editingOrder
        ? renderEditModal({
            order: editingOrder,
            onClose: () => setEditingOrder(null),
          })
        : null}
    </>
  );
}
