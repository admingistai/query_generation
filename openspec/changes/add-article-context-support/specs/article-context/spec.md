## ADDED Requirements

### Requirement: Article Context Extraction

The system SHALL accept optional article URLs as additional context for ICP generation.

Article URLs SHALL be processed to extract:
- Audience demographics (explicit mentions)
- Psychographic signals (values, interests)
- Brand mentions and partnerships
- Creator quotes about their audience
- Niche and industry signals

#### Scenario: Interview article with creator quotes
- **GIVEN** an interview article at forbes.com/creator-interview
- **AND** the article contains "My audience is primarily millennial women interested in sustainable fashion"
- **WHEN** article extraction runs
- **THEN** demographics insight includes "millennial women"
- **AND** psychographics insight includes "interested in sustainable fashion"
- **AND** creatorQuotes includes the direct quote
- **AND** qualityScore is >= 4

#### Scenario: Press article with demographic data
- **GIVEN** a press article at techcrunch.com/creator-profile
- **AND** the article states "Her 500K followers are predominantly 25-34 year olds"
- **WHEN** article extraction runs
- **THEN** demographics insight includes "25-34 year olds"
- **AND** evidence type is "article"
- **AND** confidence is "high"

#### Scenario: Article with no audience information
- **GIVEN** an article that only discusses the creator's business
- **AND** no audience demographics are mentioned
- **WHEN** article extraction runs
- **THEN** qualityScore is <= 2
- **AND** minimal evidence is contributed to ICP generation

### Requirement: Non-Breaking Profile Flow

The system SHALL process profile-only requests identically to before.

#### Scenario: No articles provided
- **GIVEN** profile URLs are provided
- **AND** no article URLs are provided
- **WHEN** ICP generation runs
- **THEN** article extraction is NOT invoked
- **AND** existing pipeline runs unchanged
- **AND** results are identical to previous implementation

### Requirement: Article URL Validation

The system SHALL reject social profile URLs in the article input.

#### Scenario: Social URL rejected
- **GIVEN** user enters "instagram.com/creator" in article input
- **WHEN** validation runs
- **THEN** error is shown: "Please enter an article URL, not a social profile"
- **AND** URL is NOT added to article list

#### Scenario: Valid article URL accepted
- **GIVEN** user enters "forbes.com/article"
- **WHEN** validation runs
- **THEN** URL is added to article list
- **AND** no error is shown

### Requirement: Parallel Processing

The system SHALL process articles in parallel with profile research.

#### Scenario: Multiple articles processed concurrently
- **GIVEN** 2 profile URLs and 2 article URLs
- **WHEN** research phase begins
- **THEN** expandUrls runs for profiles
- **AND** extractArticleContext runs for EACH article
- **AND** all operations run concurrently (Promise.all)
- **AND** total time is NOT sum of individual times

### Requirement: Article Evidence Integration

The system SHALL incorporate article evidence into ICP segments.

Article evidence SHALL carry higher weight than inferred evidence:
- Interview with quote: 5 points
- Research article: 4 points
- Press coverage: 3 points

#### Scenario: Article evidence boosts confidence
- **GIVEN** profile research suggests "young professionals" segment
- **AND** article explicitly states "audience is young professionals aged 25-30"
- **WHEN** ICP validation runs
- **THEN** segment confidence is "high"
- **AND** evidence includes both profile and article sources

#### Scenario: Article contradicts profile inference
- **GIVEN** profile hashtags suggest "fitness enthusiasts"
- **AND** interview article states "My audience isn't really into fitness, they follow me for travel content"
- **WHEN** ICP generation runs
- **THEN** creator quote takes precedence
- **AND** "fitness enthusiasts" segment is rejected or low confidence

### Requirement: Article Fetch Failure Handling

The system SHALL gracefully handle article fetch failures.

#### Scenario: Paywalled article
- **GIVEN** article is behind a paywall
- **WHEN** extraction attempts direct fetch
- **THEN** web search fallback is used
- **AND** partial insights are extracted from search results
- **AND** qualityScore reflects limited access

#### Scenario: Article 404
- **GIVEN** article URL returns 404
- **WHEN** extraction runs
- **THEN** article is skipped
- **AND** user is notified: "Article not found, continuing without"
- **AND** remaining articles and profiles are processed

#### Scenario: All articles fail
- **GIVEN** all provided article URLs fail
- **WHEN** processing completes
- **THEN** ICP generation continues with profile data only
- **AND** user is notified of failed articles
- **AND** results are still generated

### Requirement: Article Evidence Display

The system SHALL display article evidence distinctly in the UI.

#### Scenario: Article evidence shown with quote
- **GIVEN** an ICP segment has article evidence with a direct quote
- **WHEN** evidence is displayed
- **THEN** article icon (FileText) is shown
- **AND** source URL is displayed
- **AND** direct quote is shown in italics
- **AND** source type (interview/press/etc) is indicated

### Requirement: Maximum Article Limit

The system SHALL limit article URLs to 3 per request.

#### Scenario: Fourth article rejected
- **GIVEN** user has added 3 article URLs
- **WHEN** user tries to add a fourth
- **THEN** input is disabled or add button hidden
- **AND** message indicates "Maximum 3 articles allowed"

### Requirement: Article Quality Scoring

The system SHALL score article quality based on content.

Quality score SHALL be determined by:
- 5: Multiple direct creator quotes about audience
- 4: Explicit demographic data with sources
- 3: Indirect audience mentions, brand partnerships
- 2: Minimal audience info, mostly about creator
- 1: No useful audience insights

#### Scenario: High quality interview
- **GIVEN** article is a long-form interview
- **AND** creator discusses their audience in detail
- **WHEN** quality is scored
- **THEN** qualityScore is 4 or 5
- **AND** insights have "high" confidence

#### Scenario: Low quality announcement
- **GIVEN** article is a brief product announcement
- **AND** no audience demographics mentioned
- **WHEN** quality is scored
- **THEN** qualityScore is 1 or 2
- **AND** minimal evidence is extracted
