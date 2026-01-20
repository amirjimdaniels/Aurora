import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  // Ensure there are at least 4 users
  let users = await prisma.user.findMany();
  while (users.length < 4) {
    const newUser = await prisma.user.create({
      data: { username: `seeduser${users.length + 1}`, password: 'password123' }
    });
    users.push(newUser);
  }

  // Create 5 posts, one by each user
  await prisma.post.createMany({
    data: [
      { content: 'Welcome to Aurora Socials! This is the first post.', authorId: users[0].id },
      { content: 'Check out our new features and updates.', authorId: users[1].id },
      { content: 'Share your thoughts and connect with others.', authorId: users[2].id },
      { content: 'Like and save posts you enjoy!', authorId: users[3].id },
      { content: 'Comment below to join the conversation.', authorId: users[0].id }
    ]
  });

  console.log('Seeded 5 posts.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
