"use client";

import { useState, useCallback } from "react";
import { IPhoneFrame } from "@/components/IPhoneFrame";
import { SimulationPanel } from "@/components/SimulationPanel";
import { SimulatorChatbot } from "@/components/SimulatorChatbot";
import { PhaseStatus } from "@/components/PhaseIndicator";

export default function DemoPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [icpPersona, setIcpPersona] = useState("");
  const [initialQuery, setInitialQuery] = useState("");
  const [simulationKey, setSimulationKey] = useState(0);
  const [phaseStatuses, setPhaseStatuses] = useState<{
    discovery: PhaseStatus;
    consideration: PhaseStatus;
    activation: PhaseStatus;
  }>({
    discovery: "pending",
    consideration: "pending",
    activation: "pending",
  });

  const handleStart = useCallback((persona: string, query: string) => {
    setIcpPersona(persona);
    setInitialQuery(query);
    setSimulationKey((k) => k + 1); // Force remount of SimulatorChatbot
    setIsRunning(true);
    setPhaseStatuses({
      discovery: "pending",
      consideration: "pending",
      activation: "pending",
    });
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIcpPersona("");
    setInitialQuery("");
    setPhaseStatuses({
      discovery: "pending",
      consideration: "pending",
      activation: "pending",
    });
  }, []);

  const handlePhaseChange = useCallback((phase: string, status: PhaseStatus) => {
    setPhaseStatuses((prev) => ({
      ...prev,
      [phase]: status,
    }));
  }, []);

  const handleComplete = useCallback(() => {
    setIsRunning(false);
  }, []);

  return (
    <div className="h-screen w-full flex bg-neutral-900">
      {/* Left Panel - Configuration (40%) */}
      <div className="w-[40%] min-w-[320px] max-w-[480px]">
        <SimulationPanel
          onStart={handleStart}
          onReset={handleReset}
          isRunning={isRunning}
          phaseStatuses={phaseStatuses}
        />
      </div>

      {/* Right Panel - Simulation (60%) */}
      <div className="flex-1 flex items-center justify-center p-8">
        <IPhoneFrame>
          <SimulatorChatbot
            key={simulationKey}
            icpPersona={icpPersona}
            initialQuery={initialQuery}
            isRunning={isRunning}
            onPhaseChange={handlePhaseChange}
            onComplete={handleComplete}
          />
        </IPhoneFrame>
      </div>
    </div>
  );
}
