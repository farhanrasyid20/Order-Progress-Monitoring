"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { TablePagination } from "@/components/ui/table-pagination";
import { useTablePagination } from "@/components/ui/use-table-pagination";
import { useWorkflowOrders } from "@/components/workflow/workflow-provider";
import type { OffsetSpkStatus } from "@/types/order";

const spkStatusLabels: Record<OffsetSpkStatus, string> = {
  design_offset: "Design Offset",
  prepress: "Prepress",
  material: "Material / MI",
  plate: "Tooling / Plate",
  varnish: "Block / Spot Varnish",
  press: "Press / Cetak",
  finishing: "Finishing",
  qc: "QC Checking",
};

/** Consolidated SPK register; SPKs remain children of their parent project. */
export function OffsetSpkView() {
  const { orders } = useWorkflowOrders();
  const spks = useMemo(
    () =>
      orders.flatMap((order) =>
        order.offsetSpks.map((spk) => ({
          ...spk,
          projectNo: order.no,
          projectStatus: order.status,
        })),
      ),
    [orders],
  );
  const pagination = useTablePagination(spks);

  return (
    <>
      <div className="page-intro">
        <div>
          <h1>Offset SPK Jobs</h1>
          <p>Register SPK Offset yang dibuat dari proyek dan drawing yang sudah disetujui.</p>
        </div>
      </div>

      <section className="card full-orders">
        <div className="section-head">
          <div>
            <h2>Daftar SPK Offset</h2>
            <p>SPK tetap terhubung ke project induknya dan mengikuti history proyek tersebut.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SPK</th>
                <th>Project</th>
                <th>Customer &amp; Product</th>
                <th>FG Qty</th>
                <th>Material / Plano</th>
                <th>Colors / Machine</th>
                <th>Deadline</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((spk) => (
                <tr key={spk.id}>
                  <td><strong className="order-number">{spk.id}</strong></td>
                  <td>{spk.projectNo}</td>
                  <td>
                    <strong>{spk.customer}</strong>
                    <span>{spk.productName}</span>
                  </td>
                  <td>{spk.fgQuantity}</td>
                  <td>
                    <strong>{spk.paperType}</strong>
                    <span>{spk.grammage} / {spk.planoSize}</span>
                  </td>
                  <td>
                    <strong>{spk.colors}</strong>
                    <span>{spk.machine}</span>
                  </td>
                  <td>{spk.deadline}</td>
                  <td><Badge tone="info">{spkStatusLabels[spk.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination.totalItems === 0 ? (
            <div className="empty-state">
              <div><Icon name="file" /></div>
              <h3>Belum ada SPK Offset</h3>
              <p>SPK akan muncul setelah proyek menyelesaikan Design Offset.</p>
            </div>
          ) : null}
        </div>
        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          itemLabel="SPK jobs"
          onPageChange={pagination.goToPage}
        />
      </section>
    </>
  );
}
