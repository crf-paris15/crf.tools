/*
  Warnings:

  - A unique constraint covering the columns `[nukiAccountId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nukiAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nukiAccountId_key" ON "User"("nukiAccountId");
