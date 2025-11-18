-- AlterTable
ALTER TABLE "Log" ADD COLUMN     "success" BOOLEAN;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
