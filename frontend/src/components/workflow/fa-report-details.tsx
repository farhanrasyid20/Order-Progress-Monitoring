import type { Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

export function FaReportDetails({ order }: { order: Order }) {
  const latest = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (!record.source || !order.requirementBranch || record.source === order.requirementBranch) &&
    (record.stage === "fa-report" || (!record.stage && ["Ready to Submit", "Submit Sample"].includes(history[index + 1]?.process)))
  ).at(-1);
  const reference = latest?.remark.match(/^FA Report:\s*(.*?)(?: - |$)/);
  const notes = reference ? latest!.remark.slice(reference[0].length) : latest?.remark;
  return <section className="requirement-detail-section" aria-label="FA Report - Latest Input">
    <h3>FA Report - Latest Input</h3>
    {latest ? <DetailGrid fields={[
      ["PIC", latest.pic], ["FA Report Number", reference?.[1]],
      ["Notes", notes], ["Recorded At", latest.date], ["Updated By", latest.user],
    ]} /> : <div className="material-details-empty" role="status"><p>No FA report input has been recorded.</p></div>}
  </section>;
}
