import type { ExportData, ExportFormat } from "./types";
import { toCSV } from "./to-csv";
import { toXLSX } from "./to-xlsx";

/**
 * Downloads export data in the specified format.
 */
export function downloadExport(data: ExportData, format: ExportFormat): void {
  const timestamp = Date.now();
  let blob: Blob;
  let filename: string;

  switch (format) {
    case "json": {
      blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      filename = `query-generation-${timestamp}.json`;
      break;
    }
    case "csv": {
      const csvContent = toCSV(data.pairings);
      blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      filename = `query-generation-${timestamp}.csv`;
      break;
    }
    case "xlsx": {
      const xlsxBuffer = toXLSX(data.pairings);
      blob = new Blob([xlsxBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      filename = `query-generation-${timestamp}.xlsx`;
      break;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
