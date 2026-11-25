"use client";

import type { OffsetToolingRecord, Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

/** Read-only companion to the Offset Tooling / Plate form. */
export function offsetToolingRecordsFor(order: Order): OffsetToolingRecord[] {
  if (order.offsetToolingRecords?.length) return order.offsetToolingRecords;
  return order.offsetTooling ? [{ ...order.offsetTooling, id: `legacy-offset-tooling-${order.id}` }] : [];
}

export function selectedOffsetTooling(order: Order) {
  const records = offsetToolingRecordsFor(order);
  return records.find((record) => record.id === order.offsetToolingId) ?? records.at(-1);
}

export function OffsetToolingDetails({ order }: { order: Order }) {
  const tooling = selectedOffsetTooling(order);
  if (!tooling) return <div className="material-details-empty" role="status"><p>No tooling / plate details have been recorded.</p></div>;
  const customer = order.mainData.custName || order.customer;
  const component = order.mainData.component || order.product;
  const material = order.mainData.boardQua || order.material;
  const imposition = order.mainData.imposition;
  const pic = order.pic;
  return <>
    <DetailGrid fields={[
      ["MC No. / Code", tooling.mcNo], ["Customer", customer],
      ["Description", component], ["Material", material],
      ["Imposition / UP", imposition], ["Gramatur", tooling.grammage],
      ["Open Size Width", tooling.openWidth], ["Open Size Length", tooling.openLength],
      ["Priority", tooling.priority], ["PIC", pic], ["Machine", tooling.machine],
      ["Status", tooling.status ?? "needed"],
      ["Order Date", tooling.orderDate], ["Received Date", tooling.receivedDate],
      ["Supplier", tooling.supplier], ["Invoice Number", tooling.invoiceNumber],
      ["Price", tooling.price], ["Remark", tooling.remark],
      ["Recorded At", tooling.recordedAt], ["Updated By", tooling.updatedBy],
    ]} />
  </>;
}
