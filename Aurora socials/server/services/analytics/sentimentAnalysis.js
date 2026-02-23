import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import { callLLM } from '../llm/index.js';

export async function getSentimentOverview() {
  const sentiments = await prisma.postSentiment.findMany({
    select: { sentiment: true, score: true, confidence: true },
  });

  if (sentiments.length === 0) {
    return {
      analyzed: 0,
      unanalyzed: await prisma.post.count(),
      distribution: {},
      averageScore: null,
      averageConfidence: null,
    };
  }

  const distribution = {};
  let totalScore = 0;
  let totalConfidence = 0;

  for (const s of sentiments) {
    distribution[s.sentiment] = (distribution[s.sentiment] || 0) + 1;
    totalScore += s.score;
    totalConfidence += s.confidence;
  }

  const unanalyzed = await prisma.post.count({
    where: {
      sentiment: null,
    },
  });

  return {
    analyzed: sentiments.length,
    unanalyzed,
    distribution,
    averageScore: (totalScore / sentiments.length).toFixed(3),
    averageConfidence: (totalConfidence / sentiments.length).toFixed(3),
  };
}

export async function analyzeSentimentBatch(batchSize = 50) {
  // Find posts without sentiment analysis
  const posts = await prisma.post.findMany({
    where: {
      sentiment: null,
    },
    select: { id: true, content: true },
    take: batchSize,
  });

  if (posts.length === 0) {
    return { analyzed: 0, message: 'All posts already analyzed' };
  }

  const systemPrompt = `You are a sentiment analysis engine. Analyze the sentiment of social media posts.
For each post, return: sentiment (positive, negative, neutral, mixed), score (-1.0 to 1.0), and confidence (0.0 to 1.0).
Return valid JSON only.`;

  // Process in chunks of 10 to avoid token limits
  const chunkSize = 10;
  let totalAnalyzed = 0;
  const errors = [];

  for (let i = 0; i < posts.length; i += chunkSize) {
    const chunk = posts.slice(i, i + chunkSize);
    const postTexts = chunk.map((p, idx) => `[${idx}] "${p.content}"`).join('\n');

    try {
      const result = await callLLM(
        systemPrompt,
        `Analyze sentiment for these posts:\n${postTexts}\n\nReturn JSON: { "results": [{ "index": 0, "sentiment": "positive|negative|neutral|mixed", "score": 0.0, "confidence": 0.0 }, ...] }`,
        { json: true }
      );

      const analyses = result.results || result;

      for (const analysis of analyses) {
        const post = chunk[analysis.index];
        if (!post) continue;

        await prisma.postSentiment.upsert({
          where: { postId: post.id },
          update: {
            sentiment: analysis.sentiment,
            score: analysis.score,
            confidence: analysis.confidence,
            analyzedAt: new Date(),
          },
          create: {
            postId: post.id,
            sentiment: analysis.sentiment,
            score: analysis.score,
            confidence: analysis.confidence,
          },
        });
        totalAnalyzed++;
      }
    } catch (err) {
      errors.push({ chunk: i, error: err.message });
    }
  }

  return {
    analyzed: totalAnalyzed,
    errors: errors.length,
    errorDetails: errors,
    remaining: posts.length - totalAnalyzed,
  };
}
