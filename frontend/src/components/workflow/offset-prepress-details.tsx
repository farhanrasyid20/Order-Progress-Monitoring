import { ProjectInformation } from "./project-information";
import type { Order } from "@/types/order";
import { MaterialRequestRecordDetails } from "./material-request-details";
import { DetailGrid } from "./requirement-details";

export function OffsetPrepressDetails({ order, showMaterialRequest = false, showPlate = false, showVarnish = false, showPress = false, fullProjectInformation = false }: { order: Order; showMaterialRequest?: boolean; showPlate?: boolean; showVarnish?: boolean; showPress?: boolean; fullProjectInformation?: boolean }) {
  const fields: [string, string | undefined][] = [
    ["PSR / Code", order.no],
    ["MC No. / Code", order.mainData.mcNo],
    ["Customer", order.customer],
    ["Material", order.mainData.boardQua || order.material],
    ["FG Qty (SHT)", order.mainData.fgQuantity],
    ["Imposition / UP", order.mainData.imposition],
    ["Gramatur", order.mainData.grammage],
    ["Printing Side", order.mainData.printingSide],
    ["Machine", order.mainData.printingMachine],
    ["Designer", order.pic],
    ["Deadline", order.deadline],
  ];
  const latest = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-prepress" || (!record.stage &&
      ["Material Request / MI", "Offset Material / Create MI", "Offset Material Request"].includes(history[index + 1]?.process)))
  ).at(-1);

  const latestPlate = order.processHistory.filter((record, index, history) =>
    record.process === "handoff_details_updated" &&
    (record.stage === "offset-plate" || (!record.stage && history[index + 1]?.process === "Block / Spot Varnish"))
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
    {fullProjectInformation ? <ProjectInformation order={order} full /> : <section className="requirement-detail-section project-information" aria-label="Project Information">
      <h3>Project Information</h3>
      <DetailGrid fields={fields} />
      {order.workflow.drawingLink ? <a className="drawing-link" href={order.workflow.drawingLink} target="_blank" rel="noopener noreferrer">{order.workflow.drawingFileName ?? "Open Drawing"}</a> : null}
    </section>}
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
    {showPlate || showVarnish || showPress ? <section className="requirement-detail-section" aria-label="Tooling / Plate - Latest Input">
      <h3>Tooling / Plate - Latest Input</h3>
      {latestPlate ? <DetailGrid fields={[
        ["PIC", latestPlate.pic], ["Target Completion Date", latestPlate.deadline],
        ["Process Notes", latestPlate.remark], ["Recorded At", latestPlate.date], ["Updated By", latestPlate.user],
      ]} /> : <div className="material-details-empty" role="status"><p>No tooling / plate input has been recorded.</p></div>}
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
