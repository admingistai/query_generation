## ADDED Requirements

### Requirement: Evidence-Based ICP Generation

The system SHALL generate ICPs only when supporting evidence exists.

Each ICP segment SHALL include:
- primarySources: array of evidence sources with type, detail, and source URL
- confidenceLevel: "high" | "medium" | "low"
- confidenceReason: explanation of confidence score

Evidence types SHALL include:
- hashtag: hashtags used in content
- content: themes from posts/videos
- collaboration: partner creators
- comment: engagement patterns
- bio: profile description
- comparable_creator: similar creator's known audience

#### Scenario: High confidence ICP with multiple evidence sources
- **GIVEN** a creator with 80% music production content and #producerlife hashtag used 47 times
- **WHEN** the ICP generator runs
- **THEN** "Aspiring Producer" segment is generated
- **AND** confidenceLevel is "high"
- **AND** primarySources includes hashtag and content evidence

#### Scenario: Low confidence ICP triggers rejection
- **GIVEN** an ICP segment with only comparable_creator evidence and score < 3
- **WHEN** validation runs
- **THEN** the segment is rejected
- **AND** segment appears in excludedSegments with reason

#### Scenario: No evidence prevents segment generation
- **GIVEN** no evidence supporting a "Berlin Creative Networkers" segment
- **AND** creator is US-based
- **WHEN** ICP generation runs
- **THEN** "Berlin Creative Networkers" is NOT generated
- **AND** if attempted, it appears in excludedSegments

### Requirement: Niche Classification

The system SHALL classify the creator's niche before generating ICPs.

Niche classification SHALL include:
- primaryNiche: industry, subNiche, specificGenre
- nicheEvidence: signals with source and confidence
- audienceConstraints: likelyAgeRange, likelyGeography, likelyInterests
- unlikelySegments: audiences that DON'T make sense for this niche

ICPs that contradict audienceConstraints SHALL be rejected.

#### Scenario: Music creator niche classification
- **GIVEN** a creator with bio "House music producer" and 60% DJ content
- **WHEN** niche classification runs
- **THEN** primaryNiche.industry is "Music"
- **AND** primaryNiche.subNiche is "Electronic/Dance"
- **AND** unlikelySegments includes audiences like "Classical enthusiasts", "Rural audiences"

#### Scenario: Unlikely segment rejection
- **GIVEN** niche classification with unlikelySegments containing "Retirees"
- **WHEN** an ICP "Senior Music Enthusiasts" is generated
- **THEN** validation rejects the segment
- **AND** rejection reason references unlikelySegments constraint

### Requirement: URL Expansion

The system SHALL discover related URLs to expand research surface.

URL expansion SHALL find:
- Other social platforms (Instagram, TikTok, YouTube, X, LinkedIn)
- Website, Linktree, press kit
- Podcast appearances and interviews
- Collaborator profiles
- Similar creators for comparative analysis

#### Scenario: Multi-platform discovery
- **GIVEN** an Instagram URL as input
- **AND** creator has TikTok and Spotify in bio
- **WHEN** URL expansion runs
- **THEN** discoveredUrls includes TikTok and Spotify URLs
- **AND** source indicates "bio link"

#### Scenario: Collaborator discovery
- **GIVEN** creator has 3 posts featuring @producerX
- **WHEN** URL expansion runs
- **THEN** collaborators includes producerX with relationship "featured collaboration"

### Requirement: Comparative Analysis

The system SHALL use similar creators' audiences as templates for ICP generation.

Comparative analysis SHALL:
- Find 3-5 creators in same niche with similar follower count (within 2-3x)
- Research their known audiences
- Use as templates for target creator's ICPs
- Cite comparable_creator as evidence source

#### Scenario: Template from similar creator
- **GIVEN** similar creator "DJ_Similar" has known audience "Aspiring DJs"
- **AND** target creator is in same niche with similar size
- **WHEN** ICP generation uses comparative analysis
- **THEN** "Aspiring DJs" is considered as template
- **AND** if generated, evidence includes comparable_creator source

### Requirement: Confidence Scoring Display

The system SHALL display confidence levels for each ICP in the UI.

Confidence display SHALL include:
- Visual indicator: High (green), Medium (yellow), Low (orange)
- Confidence reason tooltip
- Expandable evidence section showing all sources

#### Scenario: High confidence display
- **GIVEN** an ICP with confidenceLevel "high"
- **WHEN** rendered in UI
- **THEN** green badge with "✓✓ HIGH" is shown
- **AND** evidence section lists all primarySources

### Requirement: Excluded Segments Transparency

The system SHALL show users why segments were filtered out.

Excluded segments display SHALL include:
- Segment name that was rejected
- Rejection reason (evidence score, niche constraint, etc.)
- Collapsible UI section

#### Scenario: Show filtered segment
- **GIVEN** "Berlin Creative Networkers" was rejected due to no evidence
- **WHEN** results are displayed
- **THEN** "Filtered Out" section shows the segment
- **AND** reason is "No evidence for Berlin connection. Creator is US-based."

### Requirement: Multi-URL Input

The system SHALL accept multiple URLs to improve research quality.

Multi-URL input SHALL support:
- Single URL (current behavior)
- Array of 1-5 URLs
- Optional hints: creatorName, knownNiche
- Config: researchDepth (quick | standard | deep)

#### Scenario: Multiple URLs improve evidence
- **GIVEN** Instagram and TikTok URLs for same creator
- **WHEN** research runs on both
- **THEN** evidence is aggregated from both platforms
- **AND** confidence scores reflect richer data
