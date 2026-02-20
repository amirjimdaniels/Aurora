import sqlite3 from 'sqlite3';
import pg from 'pg';
const { Client } = pg;

const sqlite = new sqlite3.Database('./prisma/dev.db', sqlite3.OPEN_READONLY);
const postgres = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'Iamthepostgresgenie2026!',
  database: 'aurora_social'
});

function sqliteAll(query) {
  return new Promise((resolve, reject) => {
    sqlite.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrateData() {
  try {
    await postgres.connect();
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...\n');

    // 1. Migrate Users
    console.log('📦 Migrating users...');
    const users = await sqliteAll('SELECT * FROM User');
    console.log(`Found ${users.length} users`);

    for (const user of users) {
      await postgres.query(
        `INSERT INTO "User" (id, username, password, email, bio, "profilePicture", "coverPhoto", birthday, location, "isDeveloper", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.username, user.password, user.email, user.bio, user.profilePicture,
         user.coverPhoto, user.birthday, user.location, user.isDeveloper === 1, new Date(user.createdAt)]
      );
    }
    console.log(`✅ Migrated ${users.length} users\n`);

    // 2. Migrate Posts
    console.log('📦 Migrating posts...');
    const posts = await sqliteAll('SELECT * FROM Post');
    console.log(`Found ${posts.length} posts`);

    for (const post of posts) {
      await postgres.query(
        `INSERT INTO "Post" (id, content, "mediaUrl", "createdAt", "authorId")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [post.id, post.content, post.mediaUrl, new Date(post.createdAt), post.authorId]
      );
    }
    console.log(`✅ Migrated ${posts.length} posts\n`);

    // 3. Migrate Likes
    console.log('📦 Migrating likes...');
    const likes = await sqliteAll('SELECT * FROM Like');
    console.log(`Found ${likes.length} likes`);

    for (const like of likes) {
      await postgres.query(
        `INSERT INTO "Like" (id, "userId", "postId")
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [like.id, like.userId, like.postId]
      );
    }
    console.log(`✅ Migrated ${likes.length} likes\n`);

    // 4. Migrate Comments
    console.log('📦 Migrating comments...');
    const comments = await sqliteAll('SELECT * FROM Comment');
    console.log(`Found ${comments.length} comments`);

    for (const comment of comments) {
      await postgres.query(
        `INSERT INTO "Comment" (id, content, "createdAt", "authorId", "postId", "parentId")
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [comment.id, comment.content, new Date(comment.createdAt), comment.authorId, comment.postId, comment.parentId]
      );
    }
    console.log(`✅ Migrated ${comments.length} comments\n`);

    // 5. Migrate SavedPosts
    console.log('📦 Migrating saved posts...');
    try {
      const savedPosts = await sqliteAll('SELECT * FROM SavedPost');
      console.log(`Found ${savedPosts.length} saved posts`);

      for (const saved of savedPosts) {
        await postgres.query(
          `INSERT INTO "SavedPost" (id, "userId", "postId")
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO NOTHING`,
          [saved.id, saved.userId, saved.postId]
        );
      }
      console.log(`✅ Migrated ${savedPosts.length} saved posts\n`);
    } catch (e) {
      console.log('⏭️  No SavedPost table found, skipping\n');
    }

    // 6. Migrate Friendships
    console.log('📦 Migrating friendships...');
    try {
      const friendships = await sqliteAll('SELECT * FROM Friendship');
      console.log(`Found ${friendships.length} friendships`);

      for (const friendship of friendships) {
        await postgres.query(
          `INSERT INTO "Friendship" (id, "senderId", "receiverId", status, "createdAt")
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [friendship.id, friendship.senderId, friendship.receiverId, friendship.status, new Date(friendship.createdAt)]
        );
      }
      console.log(`✅ Migrated ${friendships.length} friendships\n`);
    } catch (e) {
      console.log('⏭️  No Friendship table found, skipping\n');
    }

    // 7. Migrate Follows
    console.log('📦 Migrating follows...');
    try {
      const follows = await sqliteAll('SELECT * FROM Follow');
      console.log(`Found ${follows.length} follows`);

      for (const follow of follows) {
        await postgres.query(
          `INSERT INTO "Follow" (id, "followerId", "followingId", "createdAt")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [follow.id, follow.followerId, follow.followingId, new Date(follow.createdAt)]
        );
      }
      console.log(`✅ Migrated ${follows.length} follows\n`);
    } catch (e) {
      console.log('⏭️  No Follow table found, skipping\n');
    }

    // 8. Migrate Messages
    console.log('📦 Migrating messages...');
    try {
      const messages = await sqliteAll('SELECT * FROM Message');
      console.log(`Found ${messages.length} messages`);

      for (const message of messages) {
        await postgres.query(
          `INSERT INTO "Message" (id, content, "createdAt", "senderId", "receiverId", read)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [message.id, message.content, new Date(message.createdAt), message.senderId, message.receiverId, message.read === 1]
        );
      }
      console.log(`✅ Migrated ${messages.length} messages\n`);
    } catch (e) {
      console.log('⏭️  No Message table found, skipping\n');
    }

    // Update sequences to max ID + 1
    console.log('📦 Updating ID sequences...');
    const tables = ['User', 'Post', 'Like', 'Comment', 'SavedPost', 'Friendship', 'Follow', 'Message'];

    for (const table of tables) {
      try {
        await postgres.query(`
          SELECT setval(pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1) + 1, false)
        `);
      } catch (e) {
        // Skip if table doesn't exist
      }
    }
    console.log('✅ Sequences updated\n');

    console.log('🎉 Migration complete!');
    console.log('\n✅ All your old data is now in PostgreSQL!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    sqlite.close();
    await postgres.end();
  }
}

migrateData();
