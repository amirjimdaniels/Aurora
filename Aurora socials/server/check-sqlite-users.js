import Database from 'better-sqlite3';

try {
  const db = new Database('./prisma/dev.db', { readonly: true });

  const users = db.prepare('SELECT id, username, email, createdAt FROM User').all();
  const posts = db.prepare('SELECT COUNT(*) as count FROM Post').get();

  console.log('\n📦 OLD SQLite Database Contents:');
  console.log('Total users:', users.length);
  console.log('Total posts:', posts.count);
  console.log('\nUsers:');
  users.forEach(user => {
    console.log(`- ${user.username} (ID: ${user.id})`);
  });

  db.close();
} catch (err) {
  console.error('❌ Error reading SQLite database:', err.message);
}
