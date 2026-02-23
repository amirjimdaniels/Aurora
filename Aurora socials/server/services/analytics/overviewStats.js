import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function getOverviewStats() {
  const [
    totalUsers,
    syntheticUsers,
    totalPosts,
    totalLikes,
    totalComments,
    totalReactions,
    totalPolls,
    totalGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isSynthetic: true } }),
    prisma.post.count(),
    prisma.like.count(),
    prisma.comment.count(),
    prisma.reaction.count(),
    prisma.poll.count(),
    prisma.group.count(),
  ]);

  // Weekly active users (users who posted or commented in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [weeklyPosters, weeklyCommenters] = await Promise.all([
    prisma.post.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { authorId: true },
      distinct: ['authorId'],
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { authorId: true },
      distinct: ['authorId'],
    }),
  ]);

  const activeUserIds = new Set([
    ...weeklyPosters.map(p => p.authorId),
    ...weeklyCommenters.map(c => c.authorId),
  ]);

  return {
    users: {
      total: totalUsers,
      organic: totalUsers - syntheticUsers,
      synthetic: syntheticUsers,
      weeklyActive: activeUserIds.size,
    },
    content: {
      posts: totalPosts,
      likes: totalLikes,
      comments: totalComments,
      reactions: totalReactions,
      polls: totalPolls,
      groups: totalGroups,
    },
    engagementRate: totalPosts > 0
      ? ((totalLikes + totalComments + totalReactions) / totalPosts).toFixed(2)
      : '0.00',
  };
}
