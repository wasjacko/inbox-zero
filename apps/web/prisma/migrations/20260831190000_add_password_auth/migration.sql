-- Add an optional password hash for Better Auth credential accounts.
ALTER TABLE "Account" ADD COLUMN "password" TEXT;
