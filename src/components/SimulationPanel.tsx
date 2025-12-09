"use client";

import { useState } from "react";
import { PhaseIndicator, PhaseStatus } from "./PhaseIndicator";
import { Play, RotateCcw, Sparkles } from "lucide-react";

interface SimulationPanelProps {
  onStart: (icpPersona: string, initialQuery: string) => void;
  onReset: () => void;
  isRunning: boolean;
  phaseStatuses: {
    discovery: PhaseStatus;
    consideration: PhaseStatus;
    activation: PhaseStatus;
  };
}

const EXAMPLE_ICPS = [
  {
    label: "Preschool Teacher",
    persona:
      "A preschool teacher in their 30s, looking for safe, age-appropriate classroom supplies. They prioritize safety and educational value, have a limited budget, and prefer products with good reviews from other educators.",
    query: "What are the best art supplies for preschool classrooms?",
  },
  {
    label: "Tech Startup Founder",
    persona:
      "A first-time startup founder in their late 20s, building a SaaS product. They need to learn about cloud infrastructure, have limited technical background, and are cost-conscious but willing to invest in the right tools.",
    query: "How do I choose the right cloud provider for my startup?",
  },
  {
    label: "Home Chef",
    persona:
      "An enthusiastic home cook in their 40s, interested in upgrading their kitchen equipment. They watch cooking shows, follow food influencers, and want professional-quality results at home.",
    query: "What makes a good chef's knife for home cooking?",
  },
];

export function SimulationPanel({
  onStart,
  onReset,
  isRunning,
  phaseStatuses,
}: SimulationPanelProps) {
  const [icpPersona, setIcpPersona] = useState("");
  const [initialQuery, setInitialQuery] = useState("");

  const handleStart = () => {
    if (icpPersona.trim() && initialQuery.trim()) {
      onStart(icpPersona.trim(), initialQuery.trim());
    }
  };

  const handleExampleSelect = (example: (typeof EXAMPLE_ICPS)[0]) => {
    setIcpPersona(example.persona);
    setInitialQuery(example.query);
  };

  const phases = [
    { id: "discovery", label: "Discovery", status: phaseStatuses.discovery },
    {
      id: "consideration",
      label: "Consideration",
      status: phaseStatuses.consideration,
    },
    { id: "activation", label: "Activation", status: phaseStatuses.activation },
  ];

  const isComplete = Object.values(phaseStatuses).every(
    (status) => status === "completed"
  );

  return (
    <div className="flex flex-col h-full p-6 bg-neutral-950 border-r border-neutral-800">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">User Simulator</h2>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* ICP Persona Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-300">
            ICP Persona
          </label>
          <textarea
            value={icpPersona}
            onChange={(e) => setIcpPersona(e.target.value)}
            placeholder="Describe the ideal customer profile persona that will conduct the research journey..."
            className="w-full h-32 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            disabled={isRunning}
          />
        </div>

        {/* Initial Query Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-300">
            Initial Query
          </label>
          <input
            type="text"
            value={initialQuery}
            onChange={(e) => setInitialQuery(e.target.value)}
            placeholder="Enter the first discovery phase query..."
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            disabled={isRunning}
          />
        </div>

        {/* Example ICPs */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Quick Examples
          </label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_ICPS.map((example) => (
              <button
                key={example.label}
                onClick={() => handleExampleSelect(example)}
                disabled={isRunning}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-full text-xs text-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>

        {/* Phase Indicator */}
        <PhaseIndicator phases={phases} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-neutral-800">
        {!isRunning && !isComplete ? (
          <button
            onClick={handleStart}
            disabled={!icpPersona.trim() || !initialQuery.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            Start Simulation
          </button>
        ) : (
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
