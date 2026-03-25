-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('PRACTICE', 'QUIZ');

-- AlterTable
ALTER TABLE "assignment" ADD COLUMN     "closesAt" TIMESTAMP(3),
ADD COLUMN     "opensAt" TIMESTAMP(3),
ADD COLUMN     "type" "AssignmentType" NOT NULL DEFAULT 'PRACTICE';

-- AlterTable
ALTER TABLE "submission" ADD COLUMN     "assignmentId" TEXT;

-- CreateIndex
CREATE INDEX "submission_assignmentId_idx" ON "submission"("assignmentId");

-- AddForeignKey
ALTER TABLE "submission" ADD CONSTRAINT "submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
