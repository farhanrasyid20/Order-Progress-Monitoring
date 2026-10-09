import { OffsetStageView } from "../components";

export default function OffsetPrepressPage() {
  return (
    <OffsetStageView
      stage="offset-prepress"
      title="Prepress / Pra-Cetak"
      copy="Pastikan file, separasi warna, dan kesiapan pra-cetak sebelum material Offset diminta."
      queueTitle="Antrean Prepress Offset"
      queueCopy="SPK Offset yang telah dibuat dari Design Offset"
      nextLabel="Offset Material / Create MI"
      icon="pen"
    />
  );
}
