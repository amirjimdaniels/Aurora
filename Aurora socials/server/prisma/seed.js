import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Bot user configuration
const BOT_USERNAME = 'AuroraBot';
const BOT_PASSWORD = 'bot_secure_password_123';

async function main() {
  console.log('Starting seed (non-destructive mode)...');
  
  // Create or get the bot user
  let botUser = await prisma.user.findUnique({
    where: { username: BOT_USERNAME }
  });
  
  if (!botUser) {
    botUser = await prisma.user.create({
      data: {
        username: BOT_USERNAME,
        password: BOT_PASSWORD,
        bio: '🤖 I am Aurora Bot! I follow back and reply to messages automatically. Use me to test features!',
        profilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=AuroraBot&backgroundColor=0f172a',
      }
    });
    console.log(`Created bot user: ${BOT_USERNAME} (ID: ${botUser.id})`);
  } else {
    console.log(`Bot user already exists: ${BOT_USERNAME} (ID: ${botUser.id})`);
  }

  // Create seed users only if they don't exist (upsert pattern)
  const seedUsernames = ['seeduser1', 'seeduser2', 'seeduser3', 'seeduser4'];
  const seedUsers = [];
  
  for (const username of seedUsernames) {
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          username, 
          password: 'password123',
          profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        }
      });
      console.log(`Created seed user: ${username}`);
    }
    seedUsers.push(user);
  }

  // Sample posts - only create if no posts exist from these seed users
  const samplePosts = [
    { content: 'Welcome to Aurora Socials! This is the first post. ✨ #welcome #aurora', authorUsername: 'seeduser1' },
    { content: 'Check out our new features and updates. 🚀 #updates #features', authorUsername: 'seeduser2' },
    { content: 'Share your thoughts and connect with others. 💬 #connect #community', authorUsername: 'seeduser3' },
    { content: 'Like and save posts you enjoy! ❤️ #tips #social', authorUsername: 'seeduser4' },
    { content: 'Comment below to join the conversation. 🗣️ #discussion #engage', authorUsername: 'seeduser1' },
    { content: '🤖 Hello! I am AuroraBot. Follow me and I will follow you back! Message me and I will reply! #bot #testing', authorUsername: BOT_USERNAME }
  ];

  for (const postData of samplePosts) {
    const author = postData.authorUsername === BOT_USERNAME 
      ? botUser 
      : seedUsers.find(u => u.username === postData.authorUsername);
    
    if (!author) continue;

    // Check if this exact post already exists
    const existingPost = await prisma.post.findFirst({
      where: {
        content: postData.content,
        authorId: author.id
      }
    });

    if (!existingPost) {
      await prisma.post.create({
        data: {
          content: postData.content,
          authorId: author.id
        }
      });
      console.log(`Created post by ${postData.authorUsername}`);
    }
  }

  // Extract and create hashtags from posts
  const hashtagRegex = /#(\w+)/g;
  const allPosts = await prisma.post.findMany();
  
  for (const post of allPosts) {
    const matches = post.content.matchAll(hashtagRegex);
    for (const match of matches) {
      const tagName = match[1].toLowerCase();
      
      // Upsert hashtag
      let hashtag = await prisma.hashtag.findUnique({ where: { name: tagName } });
      if (!hashtag) {
        hashtag = await prisma.hashtag.create({ data: { name: tagName } });
      }
      
      // Check if PostHashtag relation exists
      const existingRelation = await prisma.postHashtag.findFirst({
        where: { postId: post.id, hashtagId: hashtag.id }
      });
      
      if (!existingRelation) {
        await prisma.postHashtag.create({
          data: { postId: post.id, hashtagId: hashtag.id }
        });
      }
    }
  }

  console.log('');
  console.log('=== Seed Complete ===');
  console.log(`Bot User: ${BOT_USERNAME} (ID: ${botUser.id})`);
  console.log('The bot will automatically:');
  console.log('  - Follow back when someone follows it');
  console.log('  - Reply to messages sent to it');
  console.log('');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
