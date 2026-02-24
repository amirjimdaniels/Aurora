import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function getEngagementTimeSeries(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Try pre-aggregated table first
  const cached = await prisma.dailyEngagement.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'asc' },
  });

  if (cached.length > 0) {
    return cached.map(row => ({
      date: row.date.toISOString().split('T')[0],
      posts: row.totalPosts,
      likes: row.totalLikes,
      comments: row.totalComments,
      reactions: row.totalReactions,
      activeUsers: row.activeUsers,
      newUsers: row.newUsers,
    }));
  }

  // Fallback: compute on the fly from raw data
  const results = [];
  for (let i = 0; i < days; i++) {
    const dayStart = new Date(since);
    dayStart.setDate(since.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    const range = { gte: dayStart, lt: dayEnd };

    const [posts, likes, comments, reactions, newUsers] = await Promise.all([
      prisma.post.count({ where: { createdAt: range } }),
      prisma.like.count({ where: { post: { createdAt: range } } }),
      prisma.comment.count({ where: { createdAt: range } }),
      prisma.reaction.count({ where: { createdAt: range } }),
      prisma.user.count({ where: { createdAt: range } }),
    ]);

    results.push({
      date: dayStart.toISOString().split('T')[0],
      posts,
      likes,
      comments,
      reactions,
      newUsers,
    });
  }

  return results;
}

export async function getTopCreators(limit = 10) {
  const creators = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      profilePicture: true,
      isSynthetic: true,
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
    orderBy: {
      posts: { _count: 'desc' },
    },
    take: limit,
  });

  return creators.map(u => ({
    id: u.id,
    username: u.username,
    profilePicture: u.profilePicture,
    isSynthetic: u.isSynthetic,
    posts: u._count.posts,
    comments: u._count.comments,
  }));
}
