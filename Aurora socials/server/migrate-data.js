import { PrismaClient } from '@prisma/client';

// Create two Prisma clients - one for SQLite, one for PostgreSQL
const sqliteClient = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

const postgresClient = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Iamthepostgresgenie2026!@127.0.0.1:5433/aurora_social?schema=public'
    }
  }
});

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...\n');

    // 1. Migrate Users
    console.log('📦 Migrating users...');
    const users = await sqliteClient.user.findMany();
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      await postgresClient.user.create({
        data: {
          id: user.id,
          username: user.username,
          password: user.password,
          email: user.email,
          bio: user.bio,
          profilePicture: user.profilePicture,
          coverPhoto: user.coverPhoto,
          birthday: user.birthday,
          location: user.location,
          isDeveloper: user.isDeveloper,
          createdAt: user.createdAt
        }
      });
    }
    console.log('✅ Users migrated\n');

    // 2. Migrate Posts
    console.log('📦 Migrating posts...');
    const posts = await sqliteClient.post.findMany();
    console.log(`Found ${posts.length} posts`);

    for (const post of posts) {
      await postgresClient.post.create({
        data: {
          id: post.id,
          content: post.content,
          mediaUrl: post.mediaUrl,
          createdAt: post.createdAt,
          authorId: post.authorId
        }
      });
    }
    console.log('✅ Posts migrated\n');

    // 3. Migrate Likes
    console.log('📦 Migrating likes...');
    const likes = await sqliteClient.like.findMany();
    console.log(`Found ${likes.length} likes`);

    for (const like of likes) {
      await postgresClient.like.create({
        data: {
          id: like.id,
          userId: like.userId,
          postId: like.postId
        }
      });
    }
    console.log('✅ Likes migrated\n');

    // 4. Migrate Comments
    console.log('📦 Migrating comments...');
    const comments = await sqliteClient.comment.findMany();
    console.log(`Found ${comments.length} comments`);

    for (const comment of comments) {
      await postgresClient.comment.create({
        data: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          authorId: comment.authorId,
          postId: comment.postId,
          parentId: comment.parentId
        }
      });
    }
    console.log('✅ Comments migrated\n');

    // 5. Migrate Friendships
    console.log('📦 Migrating friendships...');
    const friendships = await sqliteClient.friendship.findMany();
    console.log(`Found ${friendships.length} friendships`);

    for (const friendship of friendships) {
      await postgresClient.friendship.create({
        data: {
          id: friendship.id,
          senderId: friendship.senderId,
          receiverId: friendship.receiverId,
          status: friendship.status,
          createdAt: friendship.createdAt
        }
      });
    }
    console.log('✅ Friendships migrated\n');

    // 6. Migrate Follows
    console.log('📦 Migrating follows...');
    const follows = await sqliteClient.follow.findMany();
    console.log(`Found ${follows.length} follows`);

    for (const follow of follows) {
      await postgresClient.follow.create({
        data: {
          id: follow.id,
          followerId: follow.followerId,
          followingId: follow.followingId,
          createdAt: follow.createdAt
        }
      });
    }
    console.log('✅ Follows migrated\n');

    // Add more tables as needed...

    console.log('🎉 Migration complete!');
    console.log('\nRun check-users.js to verify the migration.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

migrateData();
