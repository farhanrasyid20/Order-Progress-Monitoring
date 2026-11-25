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
import { QueueTableFilters, type QueueFilterControl } from "@/components/workflow/queue-table-filters";
import type { MaterialRequestStatus, Order, RequirementStatus, WorkflowStage } from "@/types/order";

export type WorkflowEditModalRenderProps = {
  order: Order;
  onClose: () => void;
};

type ConvertingTableFilterKind = "tooling" | "rubber" | "material" | "sample" | "offset-tooling";
type QueueStatusPresentation = "tooling" | "rubber" | "material" | "offset-prepress" | "offset-material" | "offset-tooling";

export type QueueTableFilter = {
  key: string;
  label: string;
  valuesFor: (orders: readonly Order[]) => readonly string[];
  matches: (order: Order, value: string) => boolean;
};

export type QueueTableFilterConfig = {
  searchPlaceholder: string;
  matchesSearch: (order: Order, normalizedQuery: string) => boolean;
  filters: readonly QueueTableFilter[];
};

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
  if (kind === "offset-tooling") return order.offsetToolingRecords?.find((record) => record.id === order.offsetToolingId)?.status ?? order.offsetToolingRecords?.at(-1)?.status ?? "needed";
  if (kind === "rubber") return order.rubberOrders.at(-1)?.status;
  if (kind === "material") return order.materialRequests.at(-1)?.status;
  return undefined;
}

function recordPicFor(order: Order, kind: ConvertingTableFilterKind) {
  if (kind === "tooling") return valueOrDash(order.toolingOrders.at(-1)?.requestedBy ?? order.pic);
  if (kind === "offset-tooling") return valueOrDash(order.pic);
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
  queueTableFilters?: QueueTableFilterConfig;
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
  queueTableFilters,
  renderEditModal,
  editActionLabel,
}: WorkflowStageViewProps) {
  const { orders } = useWorkflowOrders();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [query, setQuery] = useState("");
  const [pic, setPic] = useState("");
  const [recordStatus, setRecordStatus] = useState("");
  const [queueFilterValues, setQueueFilterValues] = useState<Record<string, string>>({});
  const queueOrders = useMemo(
    () => stage === "tooling-progress" || stage === "rubber-order-setting"
      ? orders.filter((order) => isInRequirementQueue(order, stage === "tooling-progress" ? "tooling" : "rubber"))
        .map((order) => requirementQueueDisplay(order, stage === "tooling-progress" ? "tooling" : "rubber"))
      : stage === "material-request" ? orders.filter((order) => order.workflow.preparationType === "converting").flatMap(materialRequestQueueEntries)
      : stage === "offset-plate" ? orders.filter((order) => order.workflow.preparationType === "offset" && order.workflow.currentStatus !== "cancelled" && (
        order.stage === "offset-plate" || order.offsetPreparationRecords?.some((record) => record.kind === "tooling" && record.state === "submitted")
      ))
      : stage === "offset-prepress" ? orders.filter((order) => order.workflow.preparationType === "offset" && order.workflow.currentStatus !== "cancelled" && order.workflow.currentStatus !== "completed")
      : orders.filter((order) => order.stage === stage),
    [orders, stage],
  );
  const picOptions = useMemo(
    () => convertingTableFilter
      ? Array.from(new Set(queueOrders.map((order) => recordPicFor(order, convertingTableFilter))))
      : [],
    [convertingTableFilter, queueOrders],
  );
  const queueFilterControls = useMemo<QueueFilterControl[]>(() => queueTableFilters
    ? queueTableFilters.filters.map((filter) => ({ key: filter.key, label: filter.label, options: Array.from(new Set(filter.valuesFor(queueOrders).filter(Boolean))).sort() }))
    : [], [queueOrders, queueTableFilters]);
  const filteredQueueOrders = useMemo(() => {
    if (queueTableFilters) {
      const normalizedQuery = query.trim().toLowerCase();
      return queueOrders.filter((order) => queueTableFilters.matchesSearch(order, normalizedQuery) && queueTableFilters.filters.every((filter) => !queueFilterValues[filter.key] || filter.matches(order, queueFilterValues[filter.key])));
    }
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
  }, [convertingTableFilter, pic, query, queueFilterValues, queueOrders, queueTableFilters, recordStatus]);
  const pagination = useTablePagination(filteredQueueOrders);
  const exportReport = useMemo(
    () => dateRangeExport ? dateRangeExport(orders) : null,
    [dateRangeExport, orders],
  );
  const resetPage = pagination.resetPage;
  const hasRecordFilterCards = Boolean(convertingTableFilter && convertingTableFilter !== "sample");
  const statusPresentation: QueueStatusPresentation | undefined = stage === "tooling-progress"
    ? "tooling"
    : stage === "rubber-order-setting"
      ? "rubber"
      : stage === "material-request"
        ? "material"
        : stage === "offset-prepress"
          ? "offset-prepress"
        : stage === "offset-material-request"
          ? "offset-material"
          : stage === "offset-plate"
            ? "offset-tooling"
            : undefined;
  const clearTableFilters = () => {
    setQuery("");
    setPic("");
    setRecordStatus("");
    setQueueFilterValues({});
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

      {queueTableFilters ? <QueueTableFilters query={query} searchPlaceholder={queueTableFilters.searchPlaceholder} controls={queueFilterControls} values={queueFilterValues} onQueryChange={(value) => { setQuery(value); resetPage(); }} onValueChange={(key, value) => { setQueueFilterValues((current) => ({ ...current, [key]: value })); resetPage(); }} onReset={clearTableFilters} /> : convertingTableFilter ? (
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
          searchPlaceholder="Search Sample Number, customer, or product..."
        />
      ) : queueTableFilters ? null : <ProcessSummary icon={icon} language={summaryLanguage} />}

      {hasRecordFilterCards && convertingTableFilter ? (
        <RecordFilterCards
          title={`${convertingTableFilter === "material" ? "Material Request" : convertingTableFilter === "rubber" ? "Rubber" : "Tooling"} Status`}
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
      ) : null}

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
          statusPresentation={statusPresentation}
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
        <ProjectHistoryModal order={historyOrder} onClose={() => setHistoryOrder(null)} onPreparationUpdated={stage === "offset-prepress" ? () => {
          setToastMessage(`Preparation for ${historyOrder.no} was updated and moved to Material Request / MI.`);
          window.setTimeout(() => setToastMessage(""), 3200);
        } : undefined} offsetDetails={stage.startsWith("offset-")} requirementKind={stage === "tooling-progress" ? "tooling" : stage === "rubber-order-setting" ? "rubber" : undefined} materialRequest={stage === "material-request" || stage === "offset-material-request"} sampleProgress={stage === "sample-progress"} />
      ) : null}
      {toastMessage ? <div className="toast-message" role="status">{toastMessage}</div> : null}
    </>
  );
}
