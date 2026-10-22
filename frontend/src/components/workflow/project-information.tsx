import type { Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

export function ProjectInformation({ order }: { order: Order }) {
  return <section className="requirement-detail-section project-information" aria-label="Project information">
    <h3>Project Information</h3>
    <DetailGrid fields={[
      ["PSR / Code", order.no], ["Customer", order.customer],
      ["Product / Component", order.product], ["Material", order.material],
      ["Description", order.description], ["Designer / PIC", order.pic],
      ["Project Date", order.projectDate], ["Deadline", order.deadline],
      ["Priority", order.priority],
    ]} />
    {order.workflow.drawingLink ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">Open Drawing</a> : null}
  </section>;
}
