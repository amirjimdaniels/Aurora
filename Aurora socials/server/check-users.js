import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });

    console.log('\n📊 Users in database:');
    console.log('Total users:', users.length);
    console.log('\nUsers list:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Email: ${user.email || 'N/A'}`);
    });

    if (users.length === 0) {
      console.log('\n⚠️  No users found! You need to REGISTER a new account first.');
    }

    await prisma.$disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await prisma.$disconnect();
  }
}

checkUsers();
