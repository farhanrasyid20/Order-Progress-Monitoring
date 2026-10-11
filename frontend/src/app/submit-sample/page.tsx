import { ClosingStageView } from "@/components/workflow/closing-stage-view";

export default function SubmitSamplePage() {
  return (
    <ClosingStageView
      stage="submit-sample"
      title="Submit Sample"
      copy="Record sample submissions before moving to the final sample decision."
      queueTitle="Submit Sample Queue"
      queueCopy="Projects with completed FA Reports ready for sample submission"
      language="en"
      nextLabel="After Sample / Decision"
      referenceLabel="Sample Submission Number"
      referencePrefix="SUB"
      icon="check"
    />
  );
}
