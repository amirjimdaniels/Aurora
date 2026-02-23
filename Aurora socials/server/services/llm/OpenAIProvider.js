import OpenAI from 'openai';
import { BaseLLMProvider } from './BaseLLMProvider.js';

export class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gpt-4o-mini';
  }

  async generateText(systemPrompt, userPrompt) {
    return this.withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
      });
      return response.choices[0].message.content;
    });
  }

  async generateJSON(systemPrompt, userPrompt) {
    return this.withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt + '\nYou must respond with valid JSON only.' },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      });
      return JSON.parse(response.choices[0].message.content);
    });
  }
}
