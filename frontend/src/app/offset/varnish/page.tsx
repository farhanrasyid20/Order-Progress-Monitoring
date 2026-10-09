import { OffsetStageView } from "../components";

export default function OffsetVarnishPage() {
  return (
    <OffsetStageView
      stage="offset-varnish"
      title="Block / Spot Varnish"
      copy="Siapkan block atau spot varnish sebelum job masuk ke mesin press."
      queueTitle="Antrean Block / Spot Varnish"
      queueCopy="Plate Offset yang sudah siap diproses"
      nextLabel="Press / Cetak"
    />
  );
}
