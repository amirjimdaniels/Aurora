/*
  Warnings:

  - You are about to drop the `CommentLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN "mediaUrl" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CommentLike";
PRAGMA foreign_keys=on;
