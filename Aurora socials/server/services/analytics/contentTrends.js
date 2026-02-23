import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function getTrendingHashtags(days = 7, limit = 20) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get hashtags used in recent posts
  const trending = await prisma.postHashtag.findMany({
    where: {
      post: { createdAt: { gte: since } },
    },
    select: {
      hashtagId: true,
      hashtag: { select: { name: true } },
      post: {
        select: {
          _count: {
            select: { likes: true, comments: true, reactions: true },
          },
        },
      },
    },
  });

  // Aggregate by hashtag
  const tagStats = {};
  for (const entry of trending) {
    const name = entry.hashtag.name;
    if (!tagStats[name]) {
      tagStats[name] = { name, postCount: 0, engagement: 0 };
    }
    tagStats[name].postCount++;
    tagStats[name].engagement +=
      entry.post._count.likes +
      entry.post._count.comments +
      entry.post._count.reactions;
  }

  return Object.values(tagStats)
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, limit);
}

export async function getContentDistribution() {
  const [totalPosts, postsWithPolls, postsWithMedia] = await Promise.all([
    prisma.post.count(),
    prisma.poll.count(),
    prisma.post.count({ where: { mediaUrl: { not: null } } }),
  ]);

  const textOnly = totalPosts - postsWithPolls - postsWithMedia;

  return {
    total: totalPosts,
    breakdown: {
      textOnly: { count: textOnly, pct: totalPosts > 0 ? ((textOnly / totalPosts) * 100).toFixed(1) : '0.0' },
      withMedia: { count: postsWithMedia, pct: totalPosts > 0 ? ((postsWithMedia / totalPosts) * 100).toFixed(1) : '0.0' },
      polls: { count: postsWithPolls, pct: totalPosts > 0 ? ((postsWithPolls / totalPosts) * 100).toFixed(1) : '0.0' },
    },
  };
}

export async function getPostingPatterns() {
  const posts = await prisma.post.findMany({
    select: { createdAt: true },
  });

  const hourBuckets = Array(24).fill(0);
  const dayBuckets = Array(7).fill(0);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const p of posts) {
    hourBuckets[p.createdAt.getHours()]++;
    dayBuckets[p.createdAt.getDay()]++;
  }

  return {
    byHour: hourBuckets.map((count, hour) => ({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      posts: count,
    })),
    byDay: dayBuckets.map((count, i) => ({
      day: dayNames[i],
      posts: count,
    })),
  };
}
