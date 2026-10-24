import type { Order } from "@/types/order";
import { MaterialRequestDetails } from "./material-request-details";
import { DetailGrid } from "./requirement-details";

export function SampleProgressDetails({ order, fullProjectInformation = false }: { order: Order; fullProjectInformation?: boolean }) {
  const latest = order.sampleProgress?.at(-1);
  return <>
    <MaterialRequestDetails order={order} allSources={!order.requirementBranch} fullProjectInformation={fullProjectInformation} />
    <section className="requirement-detail-section" aria-label="Sample progress input details">
      <h3>Sample Progress Details - Latest Input</h3>
      {latest ? <DetailGrid fields={[
        ["Sample PIC", latest.pic], ["Target Completion Date", latest.deadline],
        ["Sample Number", latest.sampleNumber], ["Production Notes", latest.notes],
        ["Recorded At", latest.recordedAt],
      ]} /> : <div className="material-details-empty" role="status">
        <p>No sample progress details have been recorded.</p>
      </div>}
    </section>
  </>;
}
