-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Poll" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "Poll_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Poll" ("createdAt", "expiresAt", "id", "postId", "question") SELECT "createdAt", "expiresAt", "id", "postId", "question" FROM "Poll";
DROP TABLE "Poll";
ALTER TABLE "new_Poll" RENAME TO "Poll";
CREATE UNIQUE INDEX "Poll_postId_key" ON "Poll"("postId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
