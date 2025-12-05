import type { PairingResult } from "./types";

/**
 * Escapes a CSV field value by wrapping in quotes if it contains
 * commas, quotes, or newlines. Double quotes are escaped as "".
 */
function escapeCSVField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts pairings data to CSV format string.
 * Columns: Topic, ICP, Discovery Query, Consideration Query, Activation Query
 */
export function toCSV(pairings: PairingResult[]): string {
  const headers = [
    "Topic",
    "ICP",
    "Discovery Query",
    "Consideration Query",
    "Activation Query",
  ];

  const rows = pairings.map((pairing) => [
    escapeCSVField(pairing.topic),
    escapeCSVField(pairing.icp),
    escapeCSVField(pairing.queries.discovery),
    escapeCSVField(pairing.queries.consideration),
    escapeCSVField(pairing.queries.activation),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
