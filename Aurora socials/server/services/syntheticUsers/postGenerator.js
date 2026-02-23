import { callLLM } from '../llm/index.js';

const POST_SYSTEM_PROMPT = `You are generating realistic social media posts for a specific user persona.
Posts should match the persona's interests, personality, and posting style.
Include relevant hashtags naturally in the content.
Vary the content types: opinions, questions, sharing experiences, life updates.
Return valid JSON only.`;

export async function generatePostsForPersona(persona, count = 10) {
  return await callLLM(
    POST_SYSTEM_PROMPT,
    `Generate ${count} social media posts for this persona:
Name: ${persona.firstName} ${persona.lastName}
Interests: ${persona.interests.join(', ')}
Personality: ${persona.personality}
Posting style: ${persona.postingStyle}
Location: ${persona.location}

For each post include:
- content (string, 10-500 chars, include #hashtags naturally in the text)
- type ("regular" | "poll")
- daysAgo (number, 0-90, spread out to simulate realistic posting frequency)
- pollQuestion (string, only if type is "poll")
- pollOptions (array of 2-4 strings, only if type is "poll")

Mix types: ~80% regular, ~20% polls.
Spread daysAgo values across the range.

Return JSON: { "posts": [ ...array of post objects ] }`,
    { json: true }
  );
}
