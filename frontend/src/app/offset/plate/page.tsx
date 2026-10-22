import { OffsetStageView } from "../components";

export default function OffsetPlatePage() {
  return (
    <OffsetStageView
      stage="offset-plate"
      title="Tooling / Plate"
      copy="Track plate and tooling requirements for Offset jobs."
      queueTitle="Tooling / Plate Queue"
      queueCopy="Offset materials released and awaiting plate preparation"
      nextLabel="Block / Spot Varnish"
    />
  );
}
