import { DetailGrid } from "./requirement-details";
import { OffsetProjectDetails } from "./offset-project-details";
import { defaultOffsetPreparationStatus, offsetPreparationStatusLabel } from "@/lib/offset-preparation-status";
import type { Order } from "@/types/order";

const valueOrDash = (value: string | undefined) => value?.trim() || "-";

/** Read-only counterpart of the Varnish editor; no branch may be edited here. */
export function OffsetVarnishDetails({ order }: { order: Order }) {
  return <section className="requirement-detail-section" aria-label="Block / Spot Varnish Details">
    <h3>Block / Spot Varnish Details</h3>
    <OffsetProjectDetails order={order} />
    <DetailGrid fields={[
      ["Sample Number", valueOrDash(order.no)], ["MC No. / Code", valueOrDash(order.mainData.mcNo)],
      ["Customer", valueOrDash(order.customer)], ["Description / Component", valueOrDash(order.mainData.component ?? order.product)],
      ["PIC", valueOrDash(order.pic)], ["Target Completion Date", valueOrDash(order.deadline)],
      ["Varnish Type", valueOrDash(order.mainData.varnish)], ["Lamination", valueOrDash(order.mainData.lamination)],
      ["Coating Side", valueOrDash(order.mainData.coatingSide)], ["Varnish Status", offsetPreparationStatusLabel(order.offsetVarnish?.status ?? defaultOffsetPreparationStatus)],
      ["Remark", valueOrDash(order.offsetVarnish?.remark)],
    ]} />
  </section>;
}
