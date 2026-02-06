-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "subject" TEXT,
    "title" TEXT,
    "description" TEXT,
    "message" TEXT,
    "email" TEXT,
    "steps" TEXT,
    "severity" TEXT,
    "useCase" TEXT,
    "postId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL
);
