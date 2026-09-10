-- Freescale is still in its test phase. Purge every test identity and its
-- application-owned data from the database used by the deployed application.
-- This migration is intentionally one-shot and must not be reused after launch.
BEGIN;

DELETE FROM "Organization";
DELETE FROM "User";
DELETE FROM "verification";
DELETE FROM "VerificationToken";
DELETE FROM "Payment";
DELETE FROM "Premium";

COMMIT;
