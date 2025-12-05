"use client";

import { Badge } from "@/components/ui/badge";

interface TopicsListProps {
  topics: string[];
  isLoading?: boolean;
}

export function TopicsList({ topics, isLoading }: TopicsListProps) {
  if (topics.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <Badge key={index} variant="secondary">
            {topic}
          </Badge>
        ))}
        {isLoading && (
          <Badge variant="outline" className="animate-pulse">
            Loading...
          </Badge>
        )}
      </div>
    </div>
  );
}
