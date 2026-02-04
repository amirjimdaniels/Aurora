/**
 * Data Migration Script: SQLite to PostgreSQL
 * This script exports data from the SQLite database and imports it into PostgreSQL
 * 
 * Usage:
 * 1. Make sure PostgreSQL is running (docker-compose up -d)
 * 2. Run: node migrate-data-to-postgres.js
 */

import Database from 'better-sqlite3';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to SQLite
const sqliteDb = new Database(path.join(__dirname, 'prisma', 'dev.db'));

// Connect to PostgreSQL via Prisma
const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Starting data migration from SQLite to PostgreSQL...\n');

  try {
    // 1. Migrate Users
    console.log('📦 Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM User').all();
    for (const user of users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          username: user.username,
          password: user.password,
          email: user.email,
          bio: user.bio,
          profilePicture: user.profilePicture,
          coverPhoto: user.coverPhoto,
          birthday: user.birthday,
          location: user.location,
          createdAt: new Date(user.createdAt)
        }
      });
    }
    console.log(`   ✅ Migrated ${users.length} users`);

    // 2. Migrate Posts
    console.log('📦 Migrating posts...');
    const posts = sqliteDb.prepare('SELECT * FROM Post').all();
    for (const post of posts) {
      await prisma.post.upsert({
        where: { id: post.id },
        update: {},
        create: {
          id: post.id,
          content: post.content,
          mediaUrl: post.mediaUrl,
          createdAt: new Date(post.createdAt),
          authorId: post.authorId
        }
      });
    }
    console.log(`   ✅ Migrated ${posts.length} posts`);

    // 3. Migrate Likes
    console.log('📦 Migrating likes...');
    const likes = sqliteDb.prepare('SELECT * FROM Like').all();
    for (const like of likes) {
      await prisma.like.upsert({
        where: { id: like.id },
        update: {},
        create: {
          id: like.id,
          userId: like.userId,
          postId: like.postId
        }
      });
    }
    console.log(`   ✅ Migrated ${likes.length} likes`);

    // 4. Migrate Comments
    console.log('📦 Migrating comments...');
    const comments = sqliteDb.prepare('SELECT * FROM Comment').all();
    // First pass: create comments without parent references
    for (const comment of comments) {
      await prisma.comment.upsert({
        where: { id: comment.id },
        update: {},
        create: {
          id: comment.id,
          content: comment.content,
          createdAt: new Date(comment.createdAt),
          authorId: comment.authorId,
          postId: comment.postId,
          parentId: comment.parentId
        }
      });
    }
    console.log(`   ✅ Migrated ${comments.length} comments`);

    // 5. Migrate CommentLikes
    console.log('📦 Migrating comment likes...');
    const commentLikes = sqliteDb.prepare('SELECT * FROM CommentLike').all();
    for (const cl of commentLikes) {
      await prisma.commentLike.upsert({
        where: { id: cl.id },
        update: {},
        create: {
          id: cl.id,
          userId: cl.userId,
          commentId: cl.commentId
        }
      });
    }
    console.log(`   ✅ Migrated ${commentLikes.length} comment likes`);

    // 6. Migrate SavedPosts
    console.log('📦 Migrating saved posts...');
    const savedPosts = sqliteDb.prepare('SELECT * FROM SavedPost').all();
    for (const sp of savedPosts) {
      await prisma.savedPost.upsert({
        where: { id: sp.id },
        update: {},
        create: {
          id: sp.id,
          userId: sp.userId,
          postId: sp.postId
        }
      });
    }
    console.log(`   ✅ Migrated ${savedPosts.length} saved posts`);

    // 7. Migrate Reactions
    console.log('📦 Migrating reactions...');
    const reactions = sqliteDb.prepare('SELECT * FROM Reaction').all();
    for (const r of reactions) {
      await prisma.reaction.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          emoji: r.emoji,
          label: r.label,
          category: r.category,
          createdAt: new Date(r.createdAt),
          userId: r.userId,
          postId: r.postId
        }
      });
    }
    console.log(`   ✅ Migrated ${reactions.length} reactions`);

    // 8. Migrate Friendships
    console.log('📦 Migrating friendships...');
    const friendships = sqliteDb.prepare('SELECT * FROM Friendship').all();
    for (const f of friendships) {
      await prisma.friendship.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          senderId: f.senderId,
          receiverId: f.receiverId,
          status: f.status,
          createdAt: new Date(f.createdAt)
        }
      });
    }
    console.log(`   ✅ Migrated ${friendships.length} friendships`);

    // 9. Migrate Follows
    console.log('📦 Migrating follows...');
    const follows = sqliteDb.prepare('SELECT * FROM Follow').all();
    for (const f of follows) {
      await prisma.follow.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          followerId: f.followerId,
          followingId: f.followingId,
          createdAt: new Date(f.createdAt)
        }
      });
    }
    console.log(`   ✅ Migrated ${follows.length} follows`);

    // 10. Migrate Messages
    console.log('📦 Migrating messages...');
    const messages = sqliteDb.prepare('SELECT * FROM Message').all();
    for (const m of messages) {
      await prisma.message.upsert({
        where: { id: m.id },
        update: {},
        create: {
          id: m.id,
          content: m.content,
          createdAt: new Date(m.createdAt),
          senderId: m.senderId,
          receiverId: m.receiverId,
          read: Boolean(m.read)
        }
      });
    }
    console.log(`   ✅ Migrated ${messages.length} messages`);

    // 11. Migrate Hashtags (if they exist)
    console.log('📦 Migrating hashtags...');
    try {
      const hashtags = sqliteDb.prepare('SELECT * FROM Hashtag').all();
      for (const h of hashtags) {
        await prisma.hashtag.upsert({
          where: { id: h.id },
          update: {},
          create: {
            id: h.id,
            name: h.name,
            createdAt: new Date(h.createdAt)
          }
        });
      }
      console.log(`   ✅ Migrated ${hashtags.length} hashtags`);
    } catch (e) {
      console.log('   ⏭️  No hashtags table found (skipping)');
    }

    // 12. Migrate PostHashtags (if they exist)
    console.log('📦 Migrating post-hashtag relations...');
    try {
      const postHashtags = sqliteDb.prepare('SELECT * FROM PostHashtag').all();
      for (const ph of postHashtags) {
        await prisma.postHashtag.upsert({
          where: { id: ph.id },
          update: {},
          create: {
            id: ph.id,
            postId: ph.postId,
            hashtagId: ph.hashtagId,
            createdAt: new Date(ph.createdAt)
          }
        });
      }
      console.log(`   ✅ Migrated ${postHashtags.length} post-hashtag relations`);
    } catch (e) {
      console.log('   ⏭️  No PostHashtag table found (skipping)');
    }

    // Reset sequences for PostgreSQL auto-increment
    console.log('\n🔧 Resetting PostgreSQL sequences...');
    await prisma.$executeRawUnsafe(`SELECT setval('"User_id_seq"', (SELECT MAX(id) FROM "User"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Post_id_seq"', (SELECT MAX(id) FROM "Post"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Like_id_seq"', (SELECT MAX(id) FROM "Like"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Comment_id_seq"', (SELECT MAX(id) FROM "Comment"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"CommentLike_id_seq"', (SELECT MAX(id) FROM "CommentLike"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"SavedPost_id_seq"', (SELECT MAX(id) FROM "SavedPost"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Reaction_id_seq"', (SELECT MAX(id) FROM "Reaction"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Friendship_id_seq"', (SELECT MAX(id) FROM "Friendship"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Follow_id_seq"', (SELECT MAX(id) FROM "Follow"));`);
    await prisma.$executeRawUnsafe(`SELECT setval('"Message_id_seq"', (SELECT MAX(id) FROM "Message"));`);
    console.log('   ✅ Sequences reset');

    console.log('\n✨ Data migration completed successfully!');
    console.log('   Your data has been preserved in PostgreSQL.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await prisma.$disconnect();
  }
}

migrateData();
