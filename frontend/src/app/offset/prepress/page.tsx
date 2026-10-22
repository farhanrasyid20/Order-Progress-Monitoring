import { OffsetStageView } from "../components";

export default function OffsetPrepressPage() {
  return (
    <OffsetStageView
      stage="offset-prepress"
      title="Prepress"
      copy="Check files, color separations, and prepress readiness before requesting Offset materials."
      queueTitle="Offset Prepress Queue"
      queueCopy="Offset SPKs created during Offset Design"
      nextLabel="Offset Material / Create MI"
      icon="pen"
    />
  );
}
