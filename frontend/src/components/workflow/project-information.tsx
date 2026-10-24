import { OffsetProjectDetails } from "./offset-project-details";
import type { Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

export function ProjectInformation({ order, full = false }: { order: Order; full?: boolean }) {
  if (full) return <section className="requirement-detail-section project-information" aria-label="Project Information">
    <h3>Project Information</h3>
    <OffsetProjectDetails order={order} />
  </section>;
  if (order.workflow.preparationType === "offset") return <OffsetProjectDetails order={order} />;
  return <section className="requirement-detail-section project-information" aria-label="Project information">
    <h3>Project Information</h3>
    <DetailGrid fields={[
      ["PSR / Code", order.no], ["Customer", order.customer],
      ["Product / Component", order.product], ["Material", order.material],
      ["Description", order.description], ["Designer / PIC", order.pic],
      ["Project Date", order.projectDate], ["Deadline", order.deadline],
    ]} />
    {order.workflow.drawingLink ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">Open Drawing</a> : null}
  </section>;
}
