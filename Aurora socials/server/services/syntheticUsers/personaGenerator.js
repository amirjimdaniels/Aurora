import { callLLM } from '../llm/index.js';

const PERSONA_SYSTEM_PROMPT = `You are a creative writer generating realistic social media user personas.
Generate diverse, believable personas with varied demographics, interests, and posting styles.
Return valid JSON only.`;

export async function generatePersona() {
  return await callLLM(
    PERSONA_SYSTEM_PROMPT,
    `Generate a unique social media user persona. Include these fields:
- firstName (string)
- lastName (string)
- username (lowercase, 3-20 chars, only letters/numbers/underscores)
- age (number, 18-65)
- gender (string)
- location (string, "City, Country" format)
- bio (string, 1-2 sentences, max 200 chars, personality-rich, may include emojis)
- interests (array of 3-7 topic strings)
- personality (string, e.g. "witty", "thoughtful", "enthusiastic")
- postingStyle (string, e.g. "frequent with emojis", "long-form thoughtful", "meme-heavy")
- appearance (string, physical description for generating a profile photo)
- birthday (string, YYYY-MM-DD format, consistent with age)

Return a single JSON object with these fields.`,
    { json: true }
  );
}

export async function generatePersonaBatch(count) {
  const batchSize = Math.min(count, 5);
  return await callLLM(
    PERSONA_SYSTEM_PROMPT,
    `Generate ${batchSize} unique social media user personas. Each should have:
firstName, lastName, username (lowercase, letters/numbers/underscores only, 3-20 chars),
age (18-65), gender, location ("City, Country"), bio (max 200 chars with personality),
interests (array of 3-7 topics), personality, postingStyle, appearance (for photo generation),
birthday (YYYY-MM-DD).

Make them diverse in age, gender, location, and interests.
Return JSON: { "personas": [ ...array of persona objects ] }`,
    { json: true }
  );
}
