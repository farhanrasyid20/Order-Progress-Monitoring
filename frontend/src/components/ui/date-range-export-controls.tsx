"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createCsv,
  exportFileName,
  filterRowsByDateRange,
  type DateRangeExportReport,
} from "@/lib/date-range-export";

export type DateRangeExportControlsProps = {
  report: DateRangeExportReport;
  onExported?: () => void;
};

/** Compact date-range controls that export a report without depending on table state. */
export function DateRangeExportControls({
  report,
  onExported,
}: DateRangeExportControlsProps) {
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [message, setMessage] = useState("");

  const handleExport = () => {
    const result = filterRowsByDateRange(report.rows, openDate, closeDate);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    if (result.rows.length === 0) {
      setMessage("No records found for the selected date range.");
      return;
    }

    const blob = new Blob([`\uFEFF${createCsv(report.columns, result.rows)}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = exportFileName(report, openDate, closeDate);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setMessage(`${result.rows.length} record${result.rows.length === 1 ? "" : "s"} exported.`);
    onExported?.();
  };

  return (
    <div className="date-range-export" aria-label="Export date range">
      <label className="date-range-export-field">
        <span>Open Month</span>
        <input
          type="date"
          value={openDate}
          onChange={(event) => setOpenDate(event.target.value)}
          aria-label="Open Month"
        />
      </label>
      <label className="date-range-export-field">
        <span>Close Month</span>
        <input
          type="date"
          value={closeDate}
          onChange={(event) => setCloseDate(event.target.value)}
          aria-label="Close Month"
        />
      </label>
      <Button type="button" variant="secondary" icon="download" onClick={handleExport}>
        Export
      </Button>
      {message ? <span className="date-range-export-message" role="status">{message}</span> : null}
    </div>
  );
}

export default DateRangeExportControls;
