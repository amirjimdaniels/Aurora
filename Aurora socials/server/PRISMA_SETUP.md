// Prisma setup instructions for Node.js backend with SQLite
// 1. Install Prisma CLI and client
yarn add prisma --dev
yarn add @prisma/client
// or with npm:
npm install prisma --save-dev
npm install @prisma/client

// 2. Initialize Prisma in your backend folder (e.g., Aurora socials/server)
npx prisma init --datasource-provider sqlite

// 3. This creates a prisma/schema.prisma file and .env file
// Edit schema.prisma to define your User model, e.g.:
//
// model User {
//   id       Int    @id @default(autoincrement())
//   username String @unique
//   password String
//   email    String?
// }
//
// 4. Run migration to create the database:
npx prisma migrate dev --name init

// 5. Use Prisma Client in your backend code:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();
// await prisma.user.create({ data: { username, password, email } });

// 6. You can later switch to PostgreSQL by editing schema.prisma and .env, then running migrations again.
