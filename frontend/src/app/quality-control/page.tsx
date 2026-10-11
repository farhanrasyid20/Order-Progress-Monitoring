import { ClosingStageView } from "@/components/workflow/closing-stage-view";

export default function QualityControlPage() {
  return (
    <ClosingStageView
      stage="quality-control"
      title="QC Checking"
      copy="Inspect Sample or Offset Press results before creating an FA Report."
      queueTitle="QC Checking Queue"
      queueCopy="Converting and Offset results awaiting quality inspection"
      language="en"
      nextLabel="FA Report"
      referenceLabel="QC Number"
      referencePrefix="QC"
      icon="shield"
    />
  );
}
