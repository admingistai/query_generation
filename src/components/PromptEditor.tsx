"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface PromptEditorProps {
  title: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
  defaultOpen?: boolean;
}

export function PromptEditor({
  title,
  value,
  defaultValue,
  onChange,
  defaultOpen = false,
}: PromptEditorProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          {title}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(defaultValue)}
          disabled={value === defaultValue}
        >
          Reset to Default
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
