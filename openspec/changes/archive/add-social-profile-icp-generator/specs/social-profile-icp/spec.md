## ADDED Requirements

### Requirement: Social Profile URL Input
The system SHALL accept social media profile URLs from the following platforms:
- Instagram (instagram.com)
- TikTok (tiktok.com)
- X/Twitter (twitter.com, x.com)
- YouTube (youtube.com)
- LinkedIn (linkedin.com)

The system SHALL auto-detect the platform from the URL and display the appropriate platform icon.

The system SHALL validate that the URL matches a supported platform pattern before processing.

#### Scenario: Valid Instagram profile URL accepted
- **WHEN** user enters "https://instagram.com/kimkardashian"
- **THEN** the system detects platform as "instagram"
- **AND** displays the Instagram icon
- **AND** enables the generate button

#### Scenario: Invalid URL rejected
- **WHEN** user enters "https://example.com/profile"
- **THEN** the system displays an error "Unsupported platform"
- **AND** the generate button remains disabled

#### Scenario: Platform variants handled
- **WHEN** user enters "https://x.com/elonmusk" or "https://twitter.com/elonmusk"
- **THEN** the system detects platform as "twitter"
- **AND** normalizes both URL formats

### Requirement: Profile Data Extraction
The system SHALL extract profile information using web search, including:
- Profile bio/description
- Follower count (approximate)
- Content themes and topics
- Recent content summaries
- Collaboration/brand mentions

The system SHALL NOT require direct API access to social platforms.

The system SHALL handle rate limits gracefully with retry logic.

#### Scenario: Public profile data extracted
- **GIVEN** a valid public profile URL
- **WHEN** profile extraction is invoked
- **THEN** the system returns structured profile data
- **AND** includes bio, follower count estimate, and content themes

#### Scenario: Private profile handled gracefully
- **GIVEN** a private/protected profile URL
- **WHEN** profile extraction is invoked
- **THEN** the system returns an error message
- **AND** suggests trying a public profile instead

### Requirement: Content Analysis for Audience Inference
The system SHALL analyze extracted profile content to infer audience characteristics, including:
- Content tone (aspirational, educational, entertaining, controversial)
- Engagement patterns (what content gets most interaction)
- Audience demographics signals
- Purchase behavior indicators

The analysis SHALL focus on WHY people follow the creator, not just WHO they are.

#### Scenario: Content analysis produces audience signals
- **GIVEN** extracted profile data with content themes
- **WHEN** content analysis is performed
- **THEN** the system returns audience signals including likely demographics, interests, and motivations

#### Scenario: Analysis handles sparse content
- **GIVEN** a profile with limited public content
- **WHEN** content analysis is performed
- **THEN** the system produces analysis with appropriate confidence levels
- **AND** indicates limited data availability

### Requirement: ICP Generation from Social Profile
The system SHALL generate 3-6 distinct Ideal Customer Profile (ICP) segments representing different audience types that follow the creator.

Each ICP segment MUST include:
- Segment name (e.g., "Aspirational Beauty Enthusiast")
- Persona description (1-2 sentences, max 200 characters)
- Demographics (age range, gender distribution, occupation)
- Psychographics (values, aspirations, pain points, lifestyle)
- Behaviors (follow reason, engagement style, purchase influence, content preferences)
- Brand affinities (brands this segment likely engages with)
- Estimated segment size (percentage of followers)

The system SHALL ensure ICP segments are meaningfully distinct (not just age variations).

#### Scenario: Multiple distinct ICPs generated
- **GIVEN** a profile URL for a major influencer (e.g., @kimkardashian)
- **WHEN** ICP generation completes
- **THEN** the system returns 3-6 ICP segments
- **AND** each segment has a unique primary characteristic
- **AND** no two segments have overlapping primary traits

#### Scenario: ICP includes unexpected segments
- **GIVEN** any creator profile
- **WHEN** ICP generation completes
- **THEN** at least one segment represents a non-obvious follower type
- **AND** may include hate-followers, professional observers, or algorithm-driven followers

#### Scenario: ICPs avoid generic demographics
- **GIVEN** any creator profile
- **WHEN** ICP generation completes
- **THEN** no ICP contains only demographic labels like "millennials" or "women 18-34"
- **AND** each ICP explains behavioral and psychographic motivations

### Requirement: ICP Output Schema Validation
The system SHALL return ICPs as a structured object validated by Zod schema.

The output MUST conform to:
```typescript
z.object({
  profileAnalyzed: z.string(),
  platform: z.enum(['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin']),
  totalFollowers: z.string(),
  icpSegments: z.array(ICPSegmentSchema).min(3).max(6),
})
```

#### Scenario: Schema validation passes
- **GIVEN** a successful ICP generation
- **WHEN** the output is validated
- **THEN** the output conforms to the schema
- **AND** contains between 3 and 6 ICP segments

### Requirement: Streaming UI with Tool Visibility
The system SHALL stream the generation process to the UI, showing:
- Profile lookup progress
- Content analysis progress
- ICP generation progress
- Final results

Users SHALL see intermediate tool invocations as the agent works.

#### Scenario: User sees generation progress
- **GIVEN** user submits a profile URL
- **WHEN** generation begins
- **THEN** the UI displays "Looking up profile..."
- **AND** then "Analyzing content..."
- **AND** then "Generating ICPs..."
- **AND** finally displays the completed ICP cards

#### Scenario: Errors displayed during stream
- **GIVEN** an error occurs during generation
- **WHEN** the error is detected
- **THEN** the UI displays the error message in context
- **AND** allows the user to retry

### Requirement: Demo3 Page
The system SHALL provide a dedicated page at `/demo3` for the Social Profile ICP Generator.

The page SHALL include:
- A prominent URL input field with platform detection
- A "Generate ICPs" button
- A grid of ICP cards displaying results
- Loading states during generation

#### Scenario: Demo3 page loads correctly
- **GIVEN** user navigates to /demo3
- **WHEN** the page loads
- **THEN** the user sees the Social Profile ICP Generator interface
- **AND** can enter a profile URL
- **AND** can trigger ICP generation
