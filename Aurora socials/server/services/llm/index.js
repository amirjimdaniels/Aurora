import { LLMProviderFactory } from './LLMProviderFactory.js';

export async function callLLM(systemPrompt, userPrompt, options = {}) {
  const chain = LLMProviderFactory.getProviderChain();

  for (let i = 0; i < chain.length; i++) {
    const name = chain[i];
    try {
      const provider = LLMProviderFactory.createProvider(name);
      if (options.json) {
        return await provider.generateJSON(systemPrompt, userPrompt);
      }
      return await provider.generateText(systemPrompt, userPrompt);
    } catch (err) {
      console.error(`[LLM] Provider "${name}" failed: ${err.message}`);
      if (i === chain.length - 1) {
        throw new Error(`All LLM providers failed. Last error: ${err.message}`);
      }
      console.log(`[LLM] Falling back to next provider...`);
    }
  }
}

export { LLMProviderFactory };
