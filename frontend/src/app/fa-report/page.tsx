import { ClosingStageView } from "@/components/workflow/closing-stage-view";

export default function FaReportPage() {
  return (
    <ClosingStageView
      stage="fa-report"
      title="FA Report"
      copy="Lengkapi laporan First Article sebelum sample dikirim atau disubmit."
      queueTitle="Antrean FA Report"
      queueCopy="Proyek yang telah melewati QC Checking"
      nextLabel="Submit Sample"
      referenceLabel="Nomor FA Report"
      referencePrefix="FA"
      icon="file"
    />
  );
}
