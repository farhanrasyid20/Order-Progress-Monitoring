import { ProjectInformation } from "./project-information";
import type { Order } from "@/types/order";
import { MaterialRequestRecordDetails } from "./material-request-details";
import { DetailGrid } from "./requirement-details";
import { OffsetToolingDetails } from "./offset-tooling-details";

export function OffsetPrepressDetails({ order, showMaterialRequest = false, showPlate = false, showVarnish = false, showPress = false, fullProjectInformation = false }: { order: Order; showMaterialRequest?: boolean; showPlate?: boolean; showVarnish?: boolean; showPress?: boolean; fullProjectInformation?: boolean }) {
  const latest = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-prepress" || (!record.stage &&
      ["Material Request / MI", "Offset Material / Create MI", "Offset Material Request"].includes(history[index + 1]?.process)))
  ).at(-1);

  const latestVarnish = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-varnish" || (!record.stage && ["Press / Cetak", "Press / Printing"].includes(history[index + 1]?.process)))
  ).at(-1);

  const latestPress = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-press" || (!record.stage && ["QC Checking", "Quality Control"].includes(history[index + 1]?.process)))
  ).at(-1);

  const latestMaterial = order.materialRequests.filter(record => record.source === order.materialRequestSource).at(-1);

  return <>
    <ProjectInformation order={order} full={fullProjectInformation} />
    <section className="requirement-detail-section" aria-label="Prepress Details">
      <h3>Prepress Details</h3>
      {order.offsetPrepress ? <DetailGrid fields={[
        ["No JO / PN / Code", order.offsetPrepress.noJoPnCode],
        ["ID Plate", order.offsetPrepress.idPlate],
        ["Plate Type", order.offsetPrepress.plateType],
        ["Proof Color", order.offsetPrepress.proofColor],
        ["Plot", order.offsetPrepress.plot],
        ["Plate", order.offsetPrepress.plate],
        ["Ink", order.offsetPrepress.ink],
        ["Remark", order.offsetPrepress.remark],
        ["Recorded At", order.offsetPrepress.recordedAt],
        ["Updated By", order.offsetPrepress.updatedBy],
      ]} /> : <div className="material-details-empty" role="status"><p>No prepress details have been recorded.</p></div>}
    </section>
    <section className="requirement-detail-section" aria-label="Prepress - Latest Input">
      <h3>Prepress - Latest Input</h3>
      {latest ? <DetailGrid fields={[
        ["PIC", latest.pic], ["Target Completion Date", latest.deadline],
        ["Process Notes", latest.remark], ["Recorded At", latest.date], ["Updated By", latest.user],
      ]} /> : <div className="material-details-empty" role="status"><p>No prepress input has been recorded.</p></div>}
    </section>
    {showMaterialRequest || showPlate || showVarnish || showPress ? <section className="requirement-detail-section" aria-label="Material Request / MI Details - Latest Input">
      <h3>Material Request / MI Details - Latest Input</h3>
      {latestMaterial ? <MaterialRequestRecordDetails record={latestMaterial} /> : <div className="material-details-empty" role="status"><p>No material request details have been recorded.</p></div>}
    </section> : null}
    {showPlate || showVarnish || showPress ? <section className="requirement-detail-section" aria-label="Tooling / Plate Details">
      <h3>Tooling / Plate Details</h3>
      <OffsetToolingDetails order={order} />
    </section> : null}
    {showVarnish || showPress ? <section className="requirement-detail-section" aria-label="Block / Spot Varnish - Latest Input">
      <h3>Block / Spot Varnish - Latest Input</h3>
      {latestVarnish ? <DetailGrid fields={[
        ["PIC", latestVarnish.pic], ["Target Completion Date", latestVarnish.deadline],
        ["Process Notes", latestVarnish.remark], ["Recorded At", latestVarnish.date], ["Updated By", latestVarnish.user],
      ]} /> : <div className="material-details-empty" role="status"><p>No block / spot varnish input has been recorded.</p></div>}
    </section> : null}
    {showPress ? <section className="requirement-detail-section" aria-label="Press / Printing - Latest Input">
      <h3>Press / Printing - Latest Input</h3>
      {latestPress ? <DetailGrid fields={[
        ["PIC", latestPress.pic], ["Target Completion Date", latestPress.deadline],
        ["Process Notes", latestPress.remark], ["Recorded At", latestPress.date], ["Updated By", latestPress.user],
      ]} /> : <div className="material-details-empty" role="status"><p>No press / printing input has been recorded.</p></div>}
    </section> : null}
  </>;
}
