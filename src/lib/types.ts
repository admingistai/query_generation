import type { QueriesOutput } from "./schemas/queries.ts";

export interface BrandAnalysis {
  analysis: string;
  sources: Array<{ type: string; url: string }>;
}

export interface PairingResult {
  topic: string;
  icp: string;
  queries: QueriesOutput;
}

export interface PipelineResult {
  url: string;
  topics: string[];
  icps: string[];
  pairings: PairingResult[];
}
