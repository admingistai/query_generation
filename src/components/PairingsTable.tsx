"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PairingResult {
  topic: string;
  icp: string;
  queries: {
    discovery: string;
    consideration: string;
    activation: string;
  };
}

interface PairingsTableProps {
  pairings: PairingResult[];
  isLoading?: boolean;
  totalPairings?: number;
}

export function PairingsTable({
  pairings,
  isLoading,
  totalPairings,
}: PairingsTableProps) {
  if (pairings.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Query Pairings</h3>
        {totalPairings !== undefined && (
          <span className="text-sm text-muted-foreground">
            {pairings.length}/{totalPairings} completed
          </span>
        )}
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Topic</TableHead>
              <TableHead className="w-[200px]">ICP</TableHead>
              <TableHead>Discovery</TableHead>
              <TableHead>Consideration</TableHead>
              <TableHead>Activation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pairings.map((pairing, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{pairing.topic}</TableCell>
                <TableCell className="text-sm">{pairing.icp}</TableCell>
                <TableCell className="text-sm">{pairing.queries.discovery}</TableCell>
                <TableCell className="text-sm">{pairing.queries.consideration}</TableCell>
                <TableCell className="text-sm">{pairing.queries.activation}</TableCell>
              </TableRow>
            ))}
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground animate-pulse">
                  Generating queries...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
