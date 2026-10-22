import { OffsetStageView } from "../components";

export default function OffsetPressPage() {
  return (
    <OffsetStageView
      stage="offset-press"
      title="Press / Printing"
      copy="Manage Offset printing before quality control inspection."
      queueTitle="Press / Printing Queue"
      queueCopy="Offset jobs with completed plate and varnish preparation"
      nextLabel="QC Checking"
    />
  );
}
