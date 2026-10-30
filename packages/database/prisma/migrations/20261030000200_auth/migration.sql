-- Phase 04: one-time phone OTP challenges and revocable refresh sessions.
CREATE TABLE "AuthOtpChallenge" (
  "id" UUID NOT NULL,
  "phone" VARCHAR(20) NOT NULL,
  "role" "UserRole" NOT NULL,
  "codeHash" VARCHAR(64) NOT NULL,
  "requesterHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthOtpChallenge_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AuthOtpChallenge_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5)
);

CREATE INDEX "AuthOtpChallenge_phone_createdAt_idx" ON "AuthOtpChallenge"("phone", "createdAt");
CREATE INDEX "AuthOtpChallenge_requesterHash_createdAt_idx" ON "AuthOtpChallenge"("requesterHash", "createdAt");

CREATE TABLE "AuthSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "refreshHash" VARCHAR(64) NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "revokedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
