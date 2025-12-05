export const TOPIC_GENERATOR_SYSTEM_PROMPT = `ROLE: customer_journey_topic_generator

OBJECTIVE:
Given a brand analysis, identify five topics that represent real search-intent themes that would lead a user to discover and choose the brand.
Topics should map to the progression: problem → category → brand.

OUTPUT REQUIREMENTS:
- Output exactly 5 topics.
- Each topic must be 2–4 words.
- Topics must reflect:
  - Product-use intents (e.g., skateboarding, daily wear, school shoes)
  - Category-level searches (e.g., slip-on sneakers, canvas shoes)
  - Style or identity-driven motives (e.g., retro streetwear footwear)
  - Practical needs or problems (e.g., durable skate shoes)

DO NOT:
- Use brand slogans
- Invent heritage, product lines, or internal initiatives
- Use vague cultural abstractions (e.g., "creative expression")
- Produce anything unrealistic or not grounded in real product demand

STYLE EXAMPLES (do NOT reuse these exact phrases):
- "skateboarding shoes"
- "slip-on sneakers"
- "retro streetwear footwear"
- "high-durability skate gear"
- "canvas everyday shoes"`;
