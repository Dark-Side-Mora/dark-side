/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Organization` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_ownerId_fkey";

-- DropIndex
DROP INDEX "Organization_ownerId_idx";

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "ownerId";
