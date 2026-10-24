import type { Order } from "@/types/order";
import { DetailGrid } from "./requirement-details";

export function ReadyToSubmitDetails({ order }: { order: Order }) {
  const latest = order.sampleSubmissions?.at(-1);
  const activity = order.processHistory.filter(record =>
    record.process === "sample_submitted" &&
    (!record.source || !order.requirementBranch || record.source === order.requirementBranch)
  ).at(-1);
  return <section className="requirement-detail-section" aria-label="Ready to Submit - Latest Input">
    <h3>Ready to Submit - Latest Input</h3>
    {latest ? <DetailGrid fields={[
      ["Submission Date", latest.submittedDate],
      ["Submission Confirmed", "Yes"],
      ["Recorded At", latest.recordedAt],
      ["Updated By", activity?.user],
    ]} /> : <div className="material-details-empty" role="status"><p>No sample submission has been recorded.</p></div>}
  </section>;
}
