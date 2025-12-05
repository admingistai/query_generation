import * as XLSX from "xlsx";
import type { PairingResult } from "./types";

/**
 * Converts pairings data to XLSX workbook and returns as ArrayBuffer.
 * Creates a worksheet with columns: Topic, ICP, Discovery Query, Consideration Query, Activation Query
 */
export function toXLSX(pairings: PairingResult[]): ArrayBuffer {
  const worksheetData = [
    ["Topic", "ICP", "Discovery Query", "Consideration Query", "Activation Query"],
    ...pairings.map((pairing) => [
      pairing.topic,
      pairing.icp,
      pairing.queries.discovery,
      pairing.queries.consideration,
      pairing.queries.activation,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for better readability
  worksheet["!cols"] = [
    { wch: 25 }, // Topic
    { wch: 50 }, // ICP
    { wch: 60 }, // Discovery Query
    { wch: 60 }, // Consideration Query
    { wch: 60 }, // Activation Query
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Query Pairings");

  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}
