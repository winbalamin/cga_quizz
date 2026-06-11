CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);
