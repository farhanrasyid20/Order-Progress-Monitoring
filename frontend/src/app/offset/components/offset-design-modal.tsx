"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { OffsetSpkStatus, Order } from "@/types/order";

export type OffsetDesignModalProps = {
  order: Order;
  onClose: () => void;
};

/** SPK fields are based on the supplied Offset SPK workbook. */
export function OffsetDesignModal({ order, onClose }: OffsetDesignModalProps) {
  const titleId = useId();
  const { saveOffsetSpk } = useWorkflowOrders();
  const [fgQuantity, setFgQuantity] = useState("");
  const [paperType, setPaperType] = useState(order.material === "-" ? "" : order.material);
  const [grammage, setGrammage] = useState("");
  const [planoSize, setPlanoSize] = useState("");
  const [up, setUp] = useState("1");
  const [waste, setWaste] = useState("");
  const [planoSheets, setPlanoSheets] = useState("");
  const [colors, setColors] = useState("");
  const [machine, setMachine] = useState("");
  const [finishing, setFinishing] = useState("");
  const [deadline, setDeadline] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const recalculatePlano = (nextFgQuantity: string, nextUp: string, nextWaste: string) => {
    const fg = Number(nextFgQuantity);
    const upValue = Number(nextUp);
    const wasteValue = Number(nextWaste || 0);

    if (Number.isFinite(fg) && fg > 0 && Number.isFinite(upValue) && upValue > 0) {
      setPlanoSheets(String(Math.ceil(fg / upValue + wasteValue)));
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveOffsetSpk(
      order.no,
      {
        customer: order.customer,
        productName: order.product,
        fgQuantity,
        paperType,
        grammage,
        planoSize,
        up,
        waste,
        planoSheets,
        colors,
        machine,
        finishing,
        deadline,
        remark,
        status: "design_offset" satisfies OffsetSpkStatus,
      },
      true,
    );
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-dialog modal-dialog-wide" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal-header">
          <div>
            <h2 id={titleId}>Buat SPK Offset</h2>
            <p>Lengkapi data work order produksi untuk {order.no} sebelum masuk Prepress.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Tutup formulir SPK"
            onClick={onClose}
            autoFocus
          >
            <Icon name="close" size={18} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-form-grid">
            <label className="modal-field">
              <span>Customer</span>
              <input value={order.customer} disabled />
            </label>
            <label className="modal-field">
              <span>Product Name</span>
              <input value={order.product} disabled />
            </label>
            <label className="modal-field">
              <span>FG Qty</span>
              <input
                inputMode="numeric"
                value={fgQuantity}
                onChange={(event) => {
                  setFgQuantity(event.target.value);
                  recalculatePlano(event.target.value, up, waste);
                }}
                required
              />
            </label>
            <label className="modal-field">
              <span>Paper Type</span>
              <input value={paperType} onChange={(event) => setPaperType(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Grammage</span>
              <input value={grammage} onChange={(event) => setGrammage(event.target.value)} placeholder="Contoh: 350 gsm" required />
            </label>
            <label className="modal-field">
              <span>Plano Size</span>
              <input value={planoSize} onChange={(event) => setPlanoSize(event.target.value)} placeholder="Contoh: 65 x 100 cm" required />
            </label>
            <label className="modal-field">
              <span>UP</span>
              <input
                inputMode="numeric"
                value={up}
                onChange={(event) => {
                  setUp(event.target.value);
                  recalculatePlano(fgQuantity, event.target.value, waste);
                }}
                required
              />
            </label>
            <label className="modal-field">
              <span>Waste</span>
              <input
                inputMode="numeric"
                value={waste}
                onChange={(event) => {
                  setWaste(event.target.value);
                  recalculatePlano(fgQuantity, up, event.target.value);
                }}
                placeholder="Jumlah lembar allowance"
              />
            </label>
            <label className="modal-field">
              <span>Plano Sheets</span>
              <input value={planoSheets} onChange={(event) => setPlanoSheets(event.target.value)} required />
            </label>
            <label className="modal-field">
              <span>Colors</span>
              <input value={colors} onChange={(event) => setColors(event.target.value)} placeholder="Contoh: 4C (CMYK)" required />
            </label>
            <label className="modal-field">
              <span>Machine</span>
              <input value={machine} onChange={(event) => setMachine(event.target.value)} placeholder="Contoh: CD102" required />
            </label>
            <label className="modal-field">
              <span>Finishing</span>
              <input value={finishing} onChange={(event) => setFinishing(event.target.value)} placeholder="Contoh: Spot Varnish" required />
            </label>
            <label className="modal-field">
              <span>Deadline SPK</span>
              <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required />
            </label>
            <label className="modal-field modal-field-full">
              <span>Remark</span>
              <textarea
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Instruksi cetak, rerun, perubahan warna, atau catatan produksi"
                rows={3}
              />
            </label>
          </div>
          <footer className="modal-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" icon="arrow">
              Buat SPK &amp; Lanjut ke Prepress
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
