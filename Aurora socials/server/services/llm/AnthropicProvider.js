import Anthropic from '@anthropic-ai/sdk';
import { BaseLLMProvider } from './BaseLLMProvider.js';

export class AnthropicProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  async generateText(systemPrompt, userPrompt) {
    return this.withRetry(async () => {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      return response.content[0].text;
    });
  }

  async generateJSON(systemPrompt, userPrompt) {
    return this.withRetry(async () => {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt + '\nYou must respond with valid JSON only. No markdown, no explanation.',
        messages: [{ role: 'user', content: userPrompt }],
      });
      const text = response.content[0].text.trim();
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```json?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
      return JSON.parse(cleaned);
    });
  }
}
