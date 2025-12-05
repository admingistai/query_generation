export type ExportFormat = "json" | "csv" | "xlsx";

export interface PairingResult {
  topic: string;
  icp: string;
  queries: {
    discovery: string;
    consideration: string;
    activation: string;
  };
}

export interface ExportData {
  brandAnalysis: string;
  topics: string[];
  icps: string[];
  pairings: PairingResult[];
  exportedAt: string;
}
