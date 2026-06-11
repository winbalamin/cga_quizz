-- Alter User table for phone-based auth
DROP INDEX "User_email_key";

ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
