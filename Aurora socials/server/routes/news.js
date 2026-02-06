import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

// News sources - using free APIs that don't require authentication
// Primary: Hacker News API (tech news) - completely free
// Secondary: Reddit RSS as JSON (various topics)

// Hacker News top stories
async function fetchHackerNews(limit = 5) {
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topStoryIds = await topStoriesRes.json();
    
    const stories = await Promise.all(
      topStoryIds.slice(0, limit).map(async (id) => {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return storyRes.json();
      })
    );
    
    return stories.map(story => ({
      id: story.id,
      title: story.title,
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      source: 'Hacker News',
      time: getTimeAgo(story.time * 1000),
      score: story.score,
      type: 'tech'
    }));
  } catch (error) {
    console.error('Failed to fetch Hacker News:', error);
    return [];
  }
}

// Reddit popular posts (using JSON endpoint)
async function fetchRedditNews(subreddit = 'worldnews', limit = 5) {
  try {
    const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`, {
      headers: {
        'User-Agent': 'Aurora Social App/1.0'
      }
    });
    const data = await res.json();
    
    return data.data.children.map(post => ({
      id: post.data.id,
      title: post.data.title,
      url: post.data.url.startsWith('/r/') 
        ? `https://reddit.com${post.data.url}` 
        : post.data.url,
      source: `r/${subreddit}`,
      time: getTimeAgo(post.data.created_utc * 1000),
      score: post.data.score,
      type: subreddit === 'worldnews' ? 'world' : subreddit === 'technology' ? 'tech' : 'general'
    }));
  } catch (error) {
    console.error(`Failed to fetch Reddit ${subreddit}:`, error);
    return [];
  }
}

// NewsAPI.org (if API key is provided in environment)
async function fetchNewsAPI(category = 'general', limit = 5) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];
  
  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=${limit}&apiKey=${apiKey}`
    );
    const data = await res.json();
    
    if (data.status !== 'ok') return [];
    
    return data.articles.map((article, idx) => ({
      id: `newsapi-${idx}`,
      title: article.title,
      url: article.url,
      source: article.source.name,
      time: getTimeAgo(new Date(article.publishedAt).getTime()),
      image: article.urlToImage,
      type: category
    }));
  } catch (error) {
    console.error('Failed to fetch NewsAPI:', error);
    return [];
  }
}

// Helper function to format time ago
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

// GET /api/news - Fetch aggregated news from multiple sources
router.get('/', async (req, res) => {
  try {
    const { category = 'mixed', limit = 10 } = req.query;
    let news = [];
    
    if (category === 'tech' || category === 'mixed') {
      const hn = await fetchHackerNews(category === 'mixed' ? 3 : Number(limit));
      news = [...news, ...hn];
    }
    
    if (category === 'world' || category === 'mixed') {
      const reddit = await fetchRedditNews('worldnews', category === 'mixed' ? 3 : Number(limit));
      news = [...news, ...reddit];
    }
    
    if (category === 'mixed') {
      const techReddit = await fetchRedditNews('technology', 2);
      news = [...news, ...techReddit];
    }
    
    // Also try NewsAPI if key is available
    if (process.env.NEWS_API_KEY) {
      const newsApi = await fetchNewsAPI(
        category === 'tech' ? 'technology' : category === 'world' ? 'general' : 'general',
        category === 'mixed' ? 2 : Number(limit)
      );
      news = [...news, ...newsApi];
    }
    
    // Shuffle for mixed category
    if (category === 'mixed') {
      news = news.sort(() => Math.random() - 0.5);
    }
    
    res.json(news.slice(0, Number(limit)));
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// GET /api/news/sources - Available news sources
router.get('/sources', (req, res) => {
  res.json({
    sources: [
      { id: 'hackernews', name: 'Hacker News', category: 'tech' },
      { id: 'reddit-worldnews', name: 'Reddit World News', category: 'world' },
      { id: 'reddit-technology', name: 'Reddit Technology', category: 'tech' }
    ],
    hasNewsAPIKey: !!process.env.NEWS_API_KEY
  });
});

export default router;
