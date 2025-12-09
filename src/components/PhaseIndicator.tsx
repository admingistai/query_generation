"use client";

import { cn } from "@/lib/utils";
import { Check, Circle, Loader2 } from "lucide-react";

export type PhaseStatus = "pending" | "active" | "completed";

interface Phase {
  id: string;
  label: string;
  status: PhaseStatus;
}

interface PhaseIndicatorProps {
  phases: Phase[];
  className?: string;
}

export function PhaseIndicator({ phases, className }: PhaseIndicatorProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        Journey Progress
      </span>
      <div className="flex items-center gap-2">
        {phases.map((phase, index) => (
          <div key={phase.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                phase.status === "completed" &&
                  "bg-green-500/20 text-green-400 border border-green-500/30",
                phase.status === "active" &&
                  "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                phase.status === "pending" &&
                  "bg-neutral-800 text-neutral-500 border border-neutral-700"
              )}
            >
              {phase.status === "completed" && (
                <Check className="w-3.5 h-3.5" />
              )}
              {phase.status === "active" && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {phase.status === "pending" && (
                <Circle className="w-3.5 h-3.5" />
              )}
              <span>{phase.label}</span>
            </div>
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  phase.status === "completed"
                    ? "bg-green-500/50"
                    : "bg-neutral-700"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
