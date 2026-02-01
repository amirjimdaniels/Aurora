// Quick check script
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { username: 'Aaaaaaaaaaaaaaaaa' }
  });
  
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  console.log('User found:', user.username);
  console.log('Password hash starts with:', user.password.substring(0, 10));
  console.log('Is bcrypt hash:', user.password.startsWith('$2b$') || user.password.startsWith('$2a$'));
  
  // Test with what might be the original password
  const testPasswords = ['Aaaaaaaaaaaaaaaaa', 'password', '12345678', 'Aaaaaaaaa'];
  
  for (const pwd of testPasswords) {
    const match = await bcrypt.compare(pwd, user.password);
    console.log(`Testing "${pwd}": ${match ? 'MATCH!' : 'no match'}`);
  }
  
  await prisma.$disconnect();
}

checkUser();
