import { OffsetStageView } from "../components";

export default function OffsetPressPage() {
  return (
    <OffsetStageView
      stage="offset-press"
      title="Press / Cetak"
      copy="Kelola proses cetak Offset sebelum hasilnya diperiksa oleh QC."
      queueTitle="Antrean Press / Cetak"
      queueCopy="Job Offset yang sudah menyelesaikan plate dan varnish"
      nextLabel="QC Checking"
    />
  );
}
