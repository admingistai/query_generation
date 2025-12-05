# Change: Add Export Formats for Generated Results

## Why
Users currently can only export generated ICPs, topics, and queries as JSON. For workflow integration with spreadsheet tools (Excel, Google Sheets) and data pipelines, CSV and XLSX formats are needed. This enables easier data analysis, sharing with stakeholders, and import into other marketing/SEO tools.

## What Changes
- **NEW** Export format selector dropdown (JSON, CSV, XLSX)
- **NEW** CSV export functionality converting pairings to tabular format
- **NEW** XLSX (Excel) export functionality with formatted spreadsheet output
- **MODIFY** Export button to support multiple formats
- **NEW** Utility functions for data transformation to CSV and XLSX formats

## Impact
- Affected specs: `export-results` (new capability)
- Affected code: `src/app/page.tsx`, `src/components/ResultsPanel.tsx`, new `src/lib/export/` utilities
- Dependencies: Add `xlsx` package for spreadsheet generation
