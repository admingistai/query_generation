"use client";

import { Card, CardContent } from "@/components/ui/card";

interface IcpsListProps {
  icps: string[];
  isLoading?: boolean;
}

export function IcpsList({ icps, isLoading }: IcpsListProps) {
  if (icps.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm">ICPs</h3>
      <div className="space-y-2">
        {icps.map((icp, index) => (
          <Card key={index}>
            <CardContent className="p-3 text-sm">{icp}</CardContent>
          </Card>
        ))}
        {isLoading && (
          <Card>
            <CardContent className="p-3 text-sm text-muted-foreground animate-pulse">
              Loading...
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
