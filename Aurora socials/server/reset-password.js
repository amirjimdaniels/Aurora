// Reset a user's password
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetPassword(username, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  const user = await prisma.user.update({
    where: { username },
    data: { password: hashedPassword }
  });
  
  console.log(`Password reset for ${user.username}`);
  console.log(`New password: ${newPassword}`);
  
  await prisma.$disconnect();
}

// Change 'Aaaaaaaaaaaaaaaaa' to the username and 'newpassword123' to desired password
resetPassword('Aaaaaaaaaaaaaaaaa', 'password123');
