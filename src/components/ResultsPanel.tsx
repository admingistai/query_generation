"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TopicsList } from "./TopicsList";
import { IcpsList } from "./IcpsList";
import { PairingsTable } from "./PairingsTable";
import { Download } from "lucide-react";

interface PairingResult {
  topic: string;
  icp: string;
  queries: {
    discovery: string;
    consideration: string;
    activation: string;
  };
}

interface ResultsPanelProps {
  stage: "idle" | "analyzing" | "topics" | "icps" | "queries" | "complete";
  brandAnalysis: string;
  topics: string[];
  icps: string[];
  pairings: PairingResult[];
  progress: number;
  onExport: () => void;
}

const stageLabels = {
  idle: "Ready",
  analyzing: "Analyzing Brand...",
  topics: "Generating Topics...",
  icps: "Generating ICPs...",
  queries: "Generating Queries...",
  complete: "Complete",
};

export function ResultsPanel({
  stage,
  brandAnalysis,
  topics,
  icps,
  pairings,
  progress,
  onExport,
}: ResultsPanelProps) {
  const isRunning = stage !== "idle" && stage !== "complete";
  const hasResults = topics.length > 0 || icps.length > 0 || pairings.length > 0;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Results</CardTitle>
        {stage === "complete" && hasResults && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-4 overflow-auto">
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{stageLabels[stage]}</span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {brandAnalysis && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Brand Analysis</h3>
            <Card>
              <CardContent className="p-3 text-sm max-h-40 overflow-auto">
                {brandAnalysis}
              </CardContent>
            </Card>
          </div>
        )}

        <TopicsList topics={topics} isLoading={stage === "topics"} />
        <IcpsList icps={icps} isLoading={stage === "icps"} />
        <PairingsTable
          pairings={pairings}
          isLoading={stage === "queries"}
          totalPairings={topics.length * icps.length}
        />

        {!hasResults && stage === "idle" && (
          <div className="text-center text-muted-foreground py-8">
            Enter a URL and click Run Pipeline to get started
          </div>
        )}
      </CardContent>
    </Card>
  );
}
