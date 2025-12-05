import { analyzeBrand } from "../generators/analyze-brand";
import { generateTopics } from "../generators/generate-topics";
import { generateICPs } from "../generators/generate-icps";
import { generateQueries } from "../generators/generate-queries";
import type { PipelineResult, PairingResult } from "../types";

export async function runPipeline(url: string): Promise<PipelineResult> {
  console.log(`\n[1/4] Analyzing brand: ${url}`);
  const { analysis, sources } = await analyzeBrand(url);
  console.log(`      Found ${sources.length} sources`);

  console.log(`[2/4] Generating topics...`);
  const topics = await generateTopics(analysis);
  console.log(`      Generated ${topics.length} topics`);

  console.log(`[3/4] Generating ICPs...`);
  const icps = await generateICPs(analysis);
  console.log(`      Generated ${icps.length} ICPs`);

  console.log(`[4/4] Generating queries for ${topics.length * icps.length} pairings...`);
  const pairings: PairingResult[] = [];

  let count = 0;
  for (const topic of topics) {
    for (const icp of icps) {
      const queries = await generateQueries(icp, topic);
      pairings.push({ topic, icp, queries });
      count++;
      if (count % 5 === 0) {
        console.log(`      Completed ${count}/${topics.length * icps.length} pairings`);
      }
    }
  }

  return {
    url,
    topics,
    icps,
    pairings,
  };
}
