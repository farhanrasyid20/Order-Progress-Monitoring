import { ClosingStageView } from "@/components/workflow/closing-stage-view";

export default function QualityControlPage() {
  return (
    <ClosingStageView
      stage="quality-control"
      title="QC Checking"
      copy="Periksa hasil Sample atau Press Offset sebelum dibuatkan FA Report."
      queueTitle="Antrean QC Checking"
      queueCopy="Hasil Converting dan Offset yang menunggu pemeriksaan kualitas"
      nextLabel="FA Report"
      referenceLabel="Nomor QC"
      referencePrefix="QC"
      icon="shield"
    />
  );
}
