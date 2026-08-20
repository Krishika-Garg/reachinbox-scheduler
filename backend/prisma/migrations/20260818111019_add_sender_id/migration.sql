-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "senderId" TEXT NOT NULL DEFAULT 'default-sender';
