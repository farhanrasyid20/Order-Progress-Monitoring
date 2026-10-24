import type { Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

/** Show the QC handoff belonging to this project or requirement branch only. */
export function QcCheckingDetails({ order }: { order: Order }) {
  const latest = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (!record.source || !order.requirementBranch || record.source === order.requirementBranch) &&
    (record.stage === "quality-control" || (!record.stage && history[index + 1]?.process === "FA Report"))
  ).at(-1);
  const reference = latest?.remark.match(/^(?:QC Checking|Quality Control):\s*(.*?)(?: - |$)/);
  const notes = reference ? latest!.remark.slice(reference[0].length) : latest?.remark;
  return <section className="requirement-detail-section" aria-label="QC Checking - Latest Input">
    <h3>QC Checking - Latest Input</h3>
    {latest ? <DetailGrid fields={[
      ["PIC", latest.pic], ["QC Number", reference?.[1]],
      ["Notes", notes], ["Recorded At", latest.date], ["Updated By", latest.user],
    ]} /> : <div className="material-details-empty" role="status"><p>No QC checking input has been recorded.</p></div>}
  </section>;
}
