import { OffsetStageView } from "../components";

export default function OffsetVarnishPage() {
  return (
    <OffsetStageView
      stage="offset-varnish"
      title="Block / Spot Varnish"
      copy="Prepare blocks or spot varnish before jobs move to the printing press."
      queueTitle="Block / Spot Varnish Queue"
      queueCopy="Offset plates ready for varnish preparation"
      nextLabel="Press / Printing"
    />
  );
}
