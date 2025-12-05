"use client";

import { useState, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptEditor } from "@/components/PromptEditor";
import { UrlInput } from "@/components/UrlInput";
import { ResultsPanel } from "@/components/ResultsPanel";
import {
  TOPIC_GENERATOR_SYSTEM_PROMPT,
  ICP_GENERATOR_SYSTEM_PROMPT,
  QUERY_GENERATOR_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { downloadExport, type ExportFormat } from "@/lib/export";

interface PairingResult {
  topic: string;
  icp: string;
  queries: {
    discovery: string;
    consideration: string;
    activation: string;
  };
}

type Stage = "idle" | "analyzing" | "topics" | "icps" | "queries" | "complete";

export default function Home() {
  // Prompt state
  const [topicPrompt, setTopicPrompt] = useState(TOPIC_GENERATOR_SYSTEM_PROMPT);
  const [icpPrompt, setIcpPrompt] = useState(ICP_GENERATOR_SYSTEM_PROMPT);
  const [queryPrompt, setQueryPrompt] = useState(QUERY_GENERATOR_SYSTEM_PROMPT);

  // URL state
  const [urls, setUrls] = useState<string[]>([]);

  // Pipeline state
  const [stage, setStage] = useState<Stage>("idle");
  const [brandAnalysis, setBrandAnalysis] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [icps, setIcps] = useState<string[]>([]);
  const [pairings, setPairings] = useState<PairingResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const runPipeline = useCallback(async () => {
    if (urls.length === 0) return;

    setIsRunning(true);
    setBrandAnalysis("");
    setTopics([]);
    setIcps([]);
    setPairings([]);
    setProgress(0);

    try {
      for (const url of urls) {
        // Stage 1: Analyze brand
        setStage("analyzing");
        setProgress(5);

        const analysisResponse = await fetch("/api/analyze-brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        const analysisReader = analysisResponse.body?.getReader();
        const analysisDecoder = new TextDecoder();
        let analysisResult = "";

        if (analysisReader) {
          while (true) {
            const { done, value } = await analysisReader.read();
            if (done) break;
            analysisResult += analysisDecoder.decode(value, { stream: true });
          }
        }

        if (!analysisResult) {
          throw new Error("Failed to analyze brand");
        }

        setBrandAnalysis(analysisResult);
        setProgress(20);

        // Stage 2: Generate topics
        setStage("topics");
        const topicsResponse = await fetch("/api/generate-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandAnalysis: analysisResult,
            systemPrompt: topicPrompt !== TOPIC_GENERATOR_SYSTEM_PROMPT ? topicPrompt : undefined,
          }),
        });

        const topicsReader = topicsResponse.body?.getReader();
        const topicsDecoder = new TextDecoder();
        let topicsBuffer = "";

        if (topicsReader) {
          while (true) {
            const { done, value } = await topicsReader.read();
            if (done) break;
            topicsBuffer += topicsDecoder.decode(value, { stream: true });
          }
        }

        // Parse the streamed object
        const topicsMatch = topicsBuffer.match(/\{"topics":\s*\[([^\]]*)\]/);
        let generatedTopics: string[] = [];
        if (topicsMatch?.[0]) {
          try {
            const parsed = JSON.parse(topicsMatch[0]);
            generatedTopics = parsed.topics || [];
          } catch {
            // Try to extract topics from partial JSON
            const topicStrings = topicsMatch[1]?.match(/"([^"]+)"/g);
            if (topicStrings) {
              generatedTopics = topicStrings.map((s) => s.replace(/"/g, ""));
            }
          }
        }
        setTopics(generatedTopics);
        setProgress(40);

        // Stage 3: Generate ICPs
        setStage("icps");
        const icpsResponse = await fetch("/api/generate-icps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandAnalysis: analysisResult,
            systemPrompt: icpPrompt !== ICP_GENERATOR_SYSTEM_PROMPT ? icpPrompt : undefined,
          }),
        });

        const icpsReader = icpsResponse.body?.getReader();
        const icpsDecoder = new TextDecoder();
        let icpsBuffer = "";

        if (icpsReader) {
          while (true) {
            const { done, value } = await icpsReader.read();
            if (done) break;
            icpsBuffer += icpsDecoder.decode(value, { stream: true });
          }
        }

        // Parse the streamed object
        const icpsMatch = icpsBuffer.match(/\{"icps":\s*\[([^\]]*)\]/);
        let generatedIcps: string[] = [];
        if (icpsMatch?.[0]) {
          try {
            const parsed = JSON.parse(icpsMatch[0]);
            generatedIcps = parsed.icps || [];
          } catch {
            // Try to extract ICPs from partial JSON
            const icpStrings = icpsMatch[1]?.match(/"([^"]+)"/g);
            if (icpStrings) {
              generatedIcps = icpStrings.map((s) => s.replace(/"/g, ""));
            }
          }
        }
        setIcps(generatedIcps);
        setProgress(60);

        // Stage 4: Generate queries for each pairing
        setStage("queries");
        const totalPairings = generatedTopics.length * generatedIcps.length;
        let completedPairings = 0;

        for (const topic of generatedTopics) {
          for (const icp of generatedIcps) {
            const queriesResponse = await fetch("/api/generate-queries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic,
                icp,
                systemPrompt: queryPrompt !== QUERY_GENERATOR_SYSTEM_PROMPT ? queryPrompt : undefined,
              }),
            });

            const queriesReader = queriesResponse.body?.getReader();
            const queriesDecoder = new TextDecoder();
            let queriesBuffer = "";

            if (queriesReader) {
              while (true) {
                const { done, value } = await queriesReader.read();
                if (done) break;
                queriesBuffer += queriesDecoder.decode(value, { stream: true });
              }
            }

            // Parse the streamed queries object
            try {
              const queriesMatch = queriesBuffer.match(
                /\{"discovery":\s*"([^"]*)"\s*,\s*"consideration":\s*"([^"]*)"\s*,\s*"activation":\s*"([^"]*)"\s*\}/
              );
              if (queriesMatch) {
                const queries = {
                  discovery: queriesMatch[1] || "",
                  consideration: queriesMatch[2] || "",
                  activation: queriesMatch[3] || "",
                };
                setPairings((prev) => [...prev, { topic, icp, queries }]);
              }
            } catch (e) {
              console.error("Failed to parse queries:", e);
            }

            completedPairings++;
            setProgress(60 + (completedPairings / totalPairings) * 40);
          }
        }

        setProgress(100);
        setStage("complete");
      }
    } catch (error) {
      console.error("Pipeline error:", error);
      setStage("idle");
    } finally {
      setIsRunning(false);
    }
  }, [urls, topicPrompt, icpPrompt, queryPrompt]);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      downloadExport(
        {
          brandAnalysis,
          topics,
          icps,
          pairings,
          exportedAt: new Date().toISOString(),
        },
        format
      );
    },
    [brandAnalysis, topics, icps, pairings]
  );

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Query Generation Pipeline</h1>
      </header>
      <main className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full overflow-auto p-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Prompts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <PromptEditor
                    title="Topic Generator"
                    value={topicPrompt}
                    defaultValue={TOPIC_GENERATOR_SYSTEM_PROMPT}
                    onChange={setTopicPrompt}
                    defaultOpen={true}
                  />
                  <PromptEditor
                    title="ICP Generator"
                    value={icpPrompt}
                    defaultValue={ICP_GENERATOR_SYSTEM_PROMPT}
                    onChange={setIcpPrompt}
                  />
                  <PromptEditor
                    title="Query Generator"
                    value={queryPrompt}
                    defaultValue={QUERY_GENERATOR_SYSTEM_PROMPT}
                    onChange={setQueryPrompt}
                  />
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="h-full flex flex-col gap-4 p-4 overflow-hidden">
              <UrlInput
                urls={urls}
                onChange={setUrls}
                onRun={runPipeline}
                isRunning={isRunning}
              />
              <div className="flex-1 overflow-hidden">
                <ResultsPanel
                  stage={stage}
                  brandAnalysis={brandAnalysis}
                  topics={topics}
                  icps={icps}
                  pairings={pairings}
                  progress={progress}
                  onExport={handleExport}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
