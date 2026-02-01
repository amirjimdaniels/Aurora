// Migration script to hash existing plain text passwords
// Run this ONCE after upgrading to JWT auth: node migrate-passwords.js

import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function migratePasswords() {
  console.log('Starting password migration...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, username: true, password: true }
    });
    
    let migrated = 0;
    let skipped = 0;
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        console.log(`Skipping ${user.username} - already hashed`);
        skipped++;
        continue;
      }
      
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      // Update user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`Migrated ${user.username}`);
      migrated++;
    }
    
    console.log(`\nMigration complete!`);
    console.log(`  Migrated: ${migrated} users`);
    console.log(`  Skipped: ${skipped} users (already hashed)`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePasswords();
