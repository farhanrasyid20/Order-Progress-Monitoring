import type { Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

export function SampleDecisionDetails({ order }: { order: Order }) {
  const latest = order.processHistory.filter(record =>
    record.process === "sample_decision" &&
    (!record.source || !order.requirementBranch || record.source === order.requirementBranch)
  ).at(-1);
  const labels: Record<string, string> = {
    approve: "Sample Approve / Continue to Production",
    revision: "Revision / Return to Design", cancel: "Cancel",
  };
  return <section className="requirement-detail-section" aria-label="Sample Decision - Latest Input">
    <h3>Sample Decision - Latest Input</h3>
    {latest ? <DetailGrid fields={[
      ["PIC", latest.pic ?? order.pic], ["Decision", labels[latest.status] ?? latest.status],
      ["Notes", latest.remark], ["Recorded At", latest.date], ["Updated By", latest.user],
    ]} /> : <div className="material-details-empty" role="status"><p>No sample decision has been recorded.</p></div>}
  </section>;
}
