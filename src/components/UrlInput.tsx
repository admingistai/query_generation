"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface UrlInputProps {
  urls: string[];
  onChange: (urls: string[]) => void;
  onRun: () => void;
  isRunning: boolean;
}

export function UrlInput({ urls, onChange, onRun, isRunning }: UrlInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddUrl = () => {
    if (inputValue.trim()) {
      onChange([...urls, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveUrl = (index: number) => {
    onChange(urls.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddUrl();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>URL Input</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isRunning}
          />
          <Button onClick={handleAddUrl} disabled={isRunning || !inputValue.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {urls.length > 0 && (
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveUrl(index)}
                  disabled={isRunning}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          className="w-full"
          onClick={onRun}
          disabled={urls.length === 0 || isRunning}
        >
          {isRunning ? "Running..." : "Run Pipeline"}
        </Button>
      </CardContent>
    </Card>
  );
}
