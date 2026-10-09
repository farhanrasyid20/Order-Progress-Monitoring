import { ClosingStageView } from "@/components/workflow/closing-stage-view";

export default function SubmitSamplePage() {
  return (
    <ClosingStageView
      stage="submit-sample"
      title="Submit Sample"
      copy="Catat pengiriman sample sebelum masuk ke keputusan akhir sample."
      queueTitle="Antrean Submit Sample"
      queueCopy="FA Report yang siap dikirim untuk keputusan sample"
      nextLabel="After Sample / Decision"
      referenceLabel="Nomor Submit Sample"
      referencePrefix="SUB"
      icon="check"
    />
  );
}
