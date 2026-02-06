/**
 * Script to set developer status for users
 * 
 * Usage:
 *   node set-developer.js <userId> [true|false]
 * 
 * Examples:
 *   node set-developer.js 1 true    # Make user 1 a developer
 *   node set-developer.js 1 false   # Remove developer status from user 1
 *   node set-developer.js 1         # Toggle developer status for user 1
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setDeveloperStatus() {
  const userId = parseInt(process.argv[2]);
  const statusArg = process.argv[3];

  if (!userId || isNaN(userId)) {
    console.log('\nUsage: node set-developer.js <userId> [true|false]\n');
    console.log('Examples:');
    console.log('  node set-developer.js 1 true    # Make user 1 a developer');
    console.log('  node set-developer.js 1 false   # Remove developer status');
    console.log('  node set-developer.js 1         # Toggle developer status\n');
    
    // List all users
    const users = await prisma.user.findMany({
      select: { id: true, username: true, isDeveloper: true }
    });
    console.log('Current users:');
    console.table(users.map(u => ({
      ID: u.id,
      Username: u.username,
      Developer: u.isDeveloper ? '✅ Yes' : '❌ No'
    })));
    
    await prisma.$disconnect();
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      console.log(`User with ID ${userId} not found.`);
      await prisma.$disconnect();
      return;
    }

    let newStatus;
    if (statusArg === 'true') {
      newStatus = true;
    } else if (statusArg === 'false') {
      newStatus = false;
    } else {
      // Toggle
      newStatus = !user.isDeveloper;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isDeveloper: newStatus }
    });

    console.log(`\n✅ User "${user.username}" (ID: ${userId}) developer status: ${newStatus ? 'ENABLED' : 'DISABLED'}\n`);

  } catch (err) {
    console.error('Error:', err.message);
  }

  await prisma.$disconnect();
}

setDeveloperStatus();
