/*
  Warnings:

  - You are about to drop the column `ownerId` on the `FireObject` table. All the data in the column will be lost.
  - The `riskLevel` column on the `FireObject` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FireObject" DROP CONSTRAINT "FireObject_ownerId_fkey";

-- AlterTable
ALTER TABLE "FireObject" DROP COLUMN "ownerId",
DROP COLUMN "riskLevel",
ADD COLUMN     "riskLevel" TEXT NOT NULL DEFAULT 'LOW';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role";

-- DropEnum
DROP TYPE "RiskLevel";

-- DropEnum
DROP TYPE "Role";
