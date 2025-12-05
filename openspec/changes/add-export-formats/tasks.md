# Tasks: Add Export Formats

## 1. Install Dependencies
- [x] 1.1 Add `xlsx` package for spreadsheet generation (`bun add xlsx`)

## 2. Create Export Utilities
- [x] 2.1 Create `src/lib/export/types.ts` with ExportFormat type and export data interfaces
- [x] 2.2 Create `src/lib/export/to-csv.ts` with function to convert pairings to CSV string
- [x] 2.3 Create `src/lib/export/to-xlsx.ts` with function to generate XLSX workbook
- [x] 2.4 Create `src/lib/export/download.ts` with unified download function for all formats
- [x] 2.5 Create `src/lib/export/index.ts` barrel export

## 3. Update UI Components
- [x] 3.1 Add dropdown-menu component for export format selection (shadcn DropdownMenu)
- [x] 3.2 Update `ResultsPanel.tsx` to show format selector dropdown
- [x] 3.3 Update export button click handler to use selected format

## 4. Integration
- [x] 4.1 Update `page.tsx` handleExport to support CSV and XLSX formats
- [x] 4.2 Import downloadExport and ExportFormat in page component

## 5. Testing
- [x] 5.1 Build passes with no TypeScript errors
- [x] 5.2 All export utilities created and integrated
- [x] 5.3 UI updated with dropdown menu for format selection
