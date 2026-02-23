export class BaseLLMProvider {
  constructor(config) {
    this.config = config;
  }

  async generateText(systemPrompt, userPrompt) {
    throw new Error('generateText must be implemented by subclass');
  }

  async generateJSON(systemPrompt, userPrompt) {
    throw new Error('generateJSON must be implemented by subclass');
  }

  async withRetry(fn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const isRateLimit = err.status === 429 || err.code === 'rate_limit_exceeded';
        if (attempt === maxRetries || !isRateLimit) throw err;
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`[LLM] Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
}
