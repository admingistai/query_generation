## ADDED Requirements

### Requirement: Multi-Format Export
The system SHALL provide export functionality for generated ICPs, topics, and query pairings in multiple formats: JSON, CSV, and XLSX (Excel).

#### Scenario: JSON export produces valid JSON file
- **GIVEN** a completed pipeline run with ICPs, topics, and pairings
- **WHEN** the user selects JSON format and clicks export
- **THEN** a JSON file is downloaded containing brandAnalysis, topics, icps, pairings, and exportedAt timestamp
- **AND** the file is valid JSON that can be parsed

#### Scenario: CSV export produces tabular data
- **GIVEN** a completed pipeline run with ICPs, topics, and pairings
- **WHEN** the user selects CSV format and clicks export
- **THEN** a CSV file is downloaded with columns: Topic, ICP, Discovery Query, Consideration Query, Activation Query
- **AND** each pairing occupies one row
- **AND** values containing commas or quotes are properly escaped

#### Scenario: XLSX export produces Excel workbook
- **GIVEN** a completed pipeline run with ICPs, topics, and pairings
- **WHEN** the user selects XLSX format and clicks export
- **THEN** an XLSX file is downloaded
- **AND** the file contains a worksheet with the pairings data
- **AND** the file opens correctly in Excel or Google Sheets

### Requirement: Export Format Selection
The system SHALL provide a user interface element to select the desired export format before downloading.

#### Scenario: Format selector displays available options
- **GIVEN** the results panel shows completed results
- **WHEN** the user views the export controls
- **THEN** a format selector is visible with options: JSON, CSV, XLSX

#### Scenario: Default export format is JSON
- **GIVEN** the results panel shows completed results
- **WHEN** the export controls are first displayed
- **THEN** JSON is selected as the default format

### Requirement: Export Includes All Generated Data
The system SHALL include all generated data in exports appropriate to each format.

#### Scenario: JSON export includes full data
- **GIVEN** a completed pipeline with brand analysis, topics, ICPs, and pairings
- **WHEN** exported as JSON
- **THEN** the export includes brandAnalysis, topics array, icps array, pairings array, and timestamp

#### Scenario: CSV export includes pairings with queries
- **GIVEN** a completed pipeline with 5 topics and 5 ICPs (25 pairings)
- **WHEN** exported as CSV
- **THEN** the CSV contains a header row plus 25 data rows (one per pairing)

#### Scenario: XLSX export includes pairings with queries
- **GIVEN** a completed pipeline with 5 topics and 5 ICPs (25 pairings)
- **WHEN** exported as XLSX
- **THEN** the spreadsheet contains a header row plus 25 data rows (one per pairing)
