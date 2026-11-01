"use client";

import { useMemo, useState, type ReactNode } from "react";
import { OrderCard } from "@/components/workflow/order-card";
import { OrderTable } from "@/components/workflow/order-table";
import { ProcessSummary } from "@/components/workflow/process-summary";
import { RequirementStatusSummary } from "@/components/workflow/requirement-status-summary";
import { RecordFilterCards, type RecordFilterOption } from "@/components/workflow/record-filter-cards";
import { ProjectHistoryModal } from "@/components/workflow/project-history-modal";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import { DateRangeExportControls } from "@/components/ui/date-range-export-controls";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { isInRequirementQueue, requirementQueueDisplay, materialRequestQueueEntries } from "@/lib/requirement-queue";
import type { DateRangeExportReport } from "@/lib/date-range-export";
import type { IconName } from "@/components/ui/icon";
import { OrderFilters } from "@/app/orders/components/order-filters";
import type { MaterialRequestStatus, Order, RequirementStatus, WorkflowStage } from "@/types/order";

export type WorkflowEditModalRenderProps = {
  order: Order;
  onClose: () => void;
};

type ConvertingTableFilterKind = "tooling" | "rubber" | "material" | "sample";

const requirementStatusOptions: readonly RecordFilterOption[] = [
  { value: "needed", label: "Needed" },
  { value: "ordered", label: "Ordered" },
  { value: "received", label: "Received" },
  { value: "available", label: "Available / Existing" },
  { value: "on_hold", label: "On Hold" },
  { value: "repair", label: "Repair" },
  { value: "issue", label: "Issue / Reorder" },
  { value: "cancelled", label: "Cancelled" },
];

const materialStatusOptions: readonly RecordFilterOption[] = [
  { value: "draft", label: "Draft" },
  { value: "requested", label: "Requested" },
  { value: "released", label: "Released" },
  { value: "received", label: "Received" },
  { value: "on_hold", label: "On Hold" },
];

function valueOrDash(value: string | null | undefined) {
  return value?.trim() || "-";
}

function recordStatusFor(order: Order, kind: ConvertingTableFilterKind): RequirementStatus | MaterialRequestStatus | undefined {
  if (kind === "tooling") return order.toolingOrders.at(-1)?.status;
  if (kind === "rubber") return order.rubberOrders.at(-1)?.status;
  if (kind === "material") return order.materialRequests.at(-1)?.status;
  return undefined;
}

function recordPicFor(order: Order, kind: ConvertingTableFilterKind) {
  if (kind === "tooling") return valueOrDash(order.toolingOrders.at(-1)?.requestedBy ?? order.pic);
  if (kind === "rubber") return valueOrDash(order.rubberOrders.at(-1)?.requestedBy ?? order.pic);
  if (kind === "material") return valueOrDash(order.materialRequests.at(-1)?.requestedBy ?? order.pic);
  return valueOrDash(order.sampleProgress?.at(-1)?.pic ?? order.pic);
}

function filterOptionsFor(kind: ConvertingTableFilterKind) {
  return kind === "material" ? materialStatusOptions : requirementStatusOptions;
}

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
  /** Opt-in report source for the four converting date-range exports. */
  dateRangeExport?: (orders: readonly Order[]) => DateRangeExportReport;
  /** Enables only the requested Converting table filters and contextual PIC display. */
  convertingTableFilter?: ConvertingTableFilterKind;
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
  dateRangeExport,
  convertingTableFilter,
  renderEditModal,
  editActionLabel,
}: WorkflowStageViewProps) {
  const { orders } = useWorkflowOrders();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [query, setQuery] = useState("");
  const [pic, setPic] = useState("");
  const [recordStatus, setRecordStatus] = useState("");
  const queueOrders = useMemo(
    () => stage === "tooling-progress" || stage === "rubber-order-setting"
      ? orders.filter((order) => isInRequirementQueue(order, stage === "tooling-progress" ? "tooling" : "rubber"))
        .map((order) => requirementQueueDisplay(order, stage === "tooling-progress" ? "tooling" : "rubber"))
      : stage === "material-request" ? orders.filter((order) => order.workflow.preparationType === "converting").flatMap(materialRequestQueueEntries)
      : orders.filter((order) => order.stage === stage),
    [orders, stage],
  );
  const picOptions = useMemo(
    () => convertingTableFilter
      ? Array.from(new Set(queueOrders.map((order) => recordPicFor(order, convertingTableFilter))))
      : [],
    [convertingTableFilter, queueOrders],
  );
  const filteredQueueOrders = useMemo(() => {
    if (!convertingTableFilter) return queueOrders;

    const normalizedQuery = query.trim().toLowerCase();
    return queueOrders.filter((order) => {
      const matchesQuery = `${order.no} ${order.customer} ${order.product} ${order.mainData.component ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesPic = !pic || recordPicFor(order, convertingTableFilter) === pic;
      const matchesStatus = convertingTableFilter === "sample" || !recordStatus ||
        recordStatusFor(order, convertingTableFilter) === recordStatus;

      return matchesQuery && matchesPic && matchesStatus;
    });
  }, [convertingTableFilter, pic, query, queueOrders, recordStatus]);
  const pagination = useTablePagination(filteredQueueOrders);
  const exportReport = useMemo(
    () => dateRangeExport ? dateRangeExport(orders) : null,
    [dateRangeExport, orders],
  );
  const resetPage = pagination.resetPage;
  const hasRecordFilterCards = Boolean(convertingTableFilter && convertingTableFilter !== "sample");
  const clearTableFilters = () => {
    setQuery("");
    setPic("");
    setRecordStatus("");
    resetPage();
  };

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
        {pageAction}
      </div>

      {convertingTableFilter ? (
        <OrderFilters
          query={query}
          preparationType=""
          pic={pic}
          people={picOptions}
          onQueryChange={(value) => {
            setQuery(value);
            resetPage();
          }}
          onPreparationTypeChange={() => {}}
          onPicChange={(value) => {
            setPic(value);
            resetPage();
          }}
          onClear={clearTableFilters}
          showPreparationType={false}
          showReset={false}
          searchPlaceholder="Search PSR, customer, or product..."
        />
      ) : null}

      {hasRecordFilterCards && convertingTableFilter ? (
        <RecordFilterCards
          title={`${convertingTableFilter === "material" ? "Material Request" : convertingTableFilter === "tooling" ? "Tooling" : "Rubber"} Status`}
          description="Filter records by their saved status."
          options={filterOptionsFor(convertingTableFilter)}
          selectedValue={recordStatus}
          totalCount={queueOrders.length}
          countForValue={(value) => queueOrders.filter((order) => recordStatusFor(order, convertingTableFilter) === value).length}
          onChange={(value) => {
            setRecordStatus(value);
            resetPage();
          }}
        />
      ) : stage === "tooling-progress" || stage === "rubber-order-setting" ? (
        <RequirementStatusSummary orders={queueOrders} kind={stage === "tooling-progress" ? "tooling" : "rubber"} icon={icon} />
      ) : <ProcessSummary icon={icon} language={summaryLanguage} />}

      <OrderCard
        title={queueTitle}
        subtitle={queueCopy}
        action={exportReport ? <DateRangeExportControls report={exportReport} /> : undefined}
      >
        <OrderTable
          orders={pagination.pageItems}
          queueLayout={[
            "tooling-progress", "rubber-order-setting", "material-request", "sample-progress",
            "offset-prepress", "offset-material-request", "offset-plate", "offset-varnish", "offset-press",
            "quality-control", "fa-report", "submit-sample", "sample-completed",
          ].includes(stage)}
          requirementKind={stage === "tooling-progress" ? "tooling" : stage === "rubber-order-setting" ? "rubber" : undefined}
          personLabel={convertingTableFilter ? "PIC" : undefined}
          personForOrder={convertingTableFilter ? (order) => recordPicFor(order, convertingTableFilter) : undefined}
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
