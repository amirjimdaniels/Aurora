import { OpenAIProvider } from './OpenAIProvider.js';
import { AnthropicProvider } from './AnthropicProvider.js';

export class LLMProviderFactory {
  static createProvider(providerName) {
    switch (providerName) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
        return new OpenAIProvider({
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        });
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
        return new AnthropicProvider({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        });
      default:
        throw new Error(`Unknown LLM provider: ${providerName}`);
    }
  }

  static getProviderChain() {
    const primary = process.env.LLM_PRIMARY_PROVIDER || 'openai';
    const all = ['openai', 'anthropic'];
    return [primary, ...all.filter(p => p !== primary)];
  }
}
