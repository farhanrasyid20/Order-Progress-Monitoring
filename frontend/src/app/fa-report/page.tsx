import { ClosingStageView } from "@/components/workflow/closing-stage-view";

export default function FaReportPage() {
  return (
    <ClosingStageView
      stage="fa-report"
      title="FA Report"
      copy="Complete the First Article report before sending or submitting the sample."
      queueTitle="FA Report Queue"
      queueCopy="Projects that have completed QC Checking"
      language="en"
      nextLabel="Submit Sample"
      referenceLabel="FA Report Number"
      referencePrefix="FA"
      icon="file"
    />
  );
}
