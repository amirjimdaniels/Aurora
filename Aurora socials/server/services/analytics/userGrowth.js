import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export async function getUserGrowth(days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: {
      createdAt: true,
      isSynthetic: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by day
  const dayMap = {};
  for (const u of users) {
    const day = u.createdAt.toISOString().split('T')[0];
    if (!dayMap[day]) dayMap[day] = { organic: 0, synthetic: 0 };
    if (u.isSynthetic) {
      dayMap[day].synthetic++;
    } else {
      dayMap[day].organic++;
    }
  }

  // Build cumulative series
  const totalBefore = await prisma.user.count({
    where: { createdAt: { lt: since } },
  });

  let cumulative = totalBefore;
  const series = [];
  const sortedDays = Object.keys(dayMap).sort();

  for (const day of sortedDays) {
    const { organic, synthetic } = dayMap[day];
    cumulative += organic + synthetic;
    series.push({
      date: day,
      newOrganic: organic,
      newSynthetic: synthetic,
      newTotal: organic + synthetic,
      cumulative,
    });
  }

  return series;
}

export async function getRetentionCohorts(weeks = 8) {
  const now = new Date();
  const cohorts = [];

  for (let w = 0; w < weeks; w++) {
    const cohortStart = new Date(now);
    cohortStart.setDate(now.getDate() - (w + 1) * 7);
    const cohortEnd = new Date(cohortStart);
    cohortEnd.setDate(cohortStart.getDate() + 7);

    // Users who signed up in this week
    const cohortUsers = await prisma.user.findMany({
      where: {
        createdAt: { gte: cohortStart, lt: cohortEnd },
        isSynthetic: false,
      },
      select: { id: true },
    });

    if (cohortUsers.length === 0) {
      cohorts.push({
        week: `W-${w + 1}`,
        cohortStart: cohortStart.toISOString().split('T')[0],
        signups: 0,
        retained: [],
      });
      continue;
    }

    const userIds = cohortUsers.map(u => u.id);

    // Check activity in subsequent weeks
    const retained = [];
    for (let rw = 1; rw <= w; rw++) {
      const checkStart = new Date(cohortEnd);
      checkStart.setDate(cohortEnd.getDate() + (rw - 1) * 7);
      const checkEnd = new Date(checkStart);
      checkEnd.setDate(checkStart.getDate() + 7);

      const activeInWeek = await prisma.post.findMany({
        where: {
          authorId: { in: userIds },
          createdAt: { gte: checkStart, lt: checkEnd },
        },
        select: { authorId: true },
        distinct: ['authorId'],
      });

      retained.push({
        weekAfter: rw,
        activeUsers: activeInWeek.length,
        rate: ((activeInWeek.length / cohortUsers.length) * 100).toFixed(1),
      });
    }

    cohorts.push({
      week: `W-${w + 1}`,
      cohortStart: cohortStart.toISOString().split('T')[0],
      signups: cohortUsers.length,
      retained,
    });
  }

  return cohorts;
}
