/*
  Warnings:

  - You are about to drop the column `event` on the `Webhook` table. All the data in the column will be lost.
  - Added the required column `action` to the `Webhook` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Webhook" DROP COLUMN "event",
ADD COLUMN     "action" INTEGER NOT NULL;
