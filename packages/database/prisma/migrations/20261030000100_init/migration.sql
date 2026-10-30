-- Phase 03: baseline relational database and geospatial foundation.
-- This migration is intentionally explicit and is committed to version control.
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'PROVIDER', 'ADMIN');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "PricingType" AS ENUM ('FIXED', 'INSPECTION');
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'REQUESTED', 'OFFERED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

CREATE TABLE "User" (
  "id" UUID NOT NULL,
  "phone" VARCHAR(20),
  "email" VARCHAR(254),
  "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "User_contact_check" CHECK ("phone" IS NOT NULL OR "email" IS NOT NULL)
);

CREATE TABLE "CustomerProfile" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "displayName" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderProfile" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "displayName" VARCHAR(120) NOT NULL,
  "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "isOnline" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceCategory" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Service" (
  "id" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED',
  "basePricePaise" INTEGER NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Service_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Service_price_nonnegative_check" CHECK ("basePricePaise" >= 0),
  CONSTRAINT "Service_duration_positive_check" CHECK ("durationMinutes" > 0)
);

CREATE TABLE "ProviderSkill" (
  "providerId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderSkill_pkey" PRIMARY KEY ("providerId", "serviceId")
);

CREATE TABLE "ProviderAvailability" (
  "id" UUID NOT NULL,
  "providerId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startTime" VARCHAR(5) NOT NULL,
  "endTime" VARCHAR(5) NOT NULL,
  "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "ProviderAvailability_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProviderAvailability_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "ProviderAvailability_time_check" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" > "startTime")
);

CREATE TABLE "ProviderServiceArea" (
  "id" UUID NOT NULL,
  "providerId" UUID NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "radiusKm" INTEGER NOT NULL DEFAULT 10,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT "ProviderServiceArea_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProviderServiceArea_latitude_check" CHECK ("latitude" BETWEEN -90 AND 90),
  CONSTRAINT "ProviderServiceArea_longitude_check" CHECK ("longitude" BETWEEN -180 AND 180),
  CONSTRAINT "ProviderServiceArea_radius_check" CHECK ("radiusKm" BETWEEN 1 AND 100)
);

CREATE TABLE "Address" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "label" VARCHAR(60) NOT NULL,
  "line1" VARCHAR(255) NOT NULL,
  "line2" VARCHAR(255),
  "city" VARCHAR(120) NOT NULL,
  "state" VARCHAR(120) NOT NULL,
  "postalCode" VARCHAR(12) NOT NULL,
  "latitude" DECIMAL(9,6) NOT NULL,
  "longitude" DECIMAL(9,6) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Address_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Address_latitude_check" CHECK ("latitude" BETWEEN -90 AND 90),
  CONSTRAINT "Address_longitude_check" CHECK ("longitude" BETWEEN -180 AND 180)
);

CREATE TABLE "Booking" (
  "id" UUID NOT NULL,
  "customerId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "addressId" UUID NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
  "scheduledFor" TIMESTAMPTZ(6) NOT NULL,
  "problemDescription" TEXT,
  "estimatedPricePaise" INTEGER NOT NULL,
  "finalPricePaise" INTEGER,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Booking_estimated_price_check" CHECK ("estimatedPricePaise" >= 0),
  CONSTRAINT "Booking_final_price_check" CHECK ("finalPricePaise" IS NULL OR "finalPricePaise" >= 0)
);

CREATE TABLE "BookingStatusEvent" (
  "id" UUID NOT NULL,
  "bookingId" UUID NOT NULL,
  "actorUserId" UUID,
  "fromStatus" "BookingStatus",
  "toStatus" "BookingStatus" NOT NULL,
  "reason" VARCHAR(500),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingStatusEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AssignmentOffer" (
  "id" UUID NOT NULL,
  "bookingId" UUID NOT NULL,
  "providerId" UUID NOT NULL,
  "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "respondedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssignmentOffer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderAssignment" (
  "id" UUID NOT NULL,
  "bookingId" UUID NOT NULL,
  "providerId" UUID NOT NULL,
  "confirmedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMPTZ(6),
  CONSTRAINT "ProviderAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
  "id" UUID NOT NULL,
  "bookingId" UUID NOT NULL,
  "amountPaise" INTEGER NOT NULL,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "gateway" VARCHAR(50) NOT NULL,
  "gatewayPaymentId" VARCHAR(150),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Payment_amount_check" CHECK ("amountPaise" > 0)
);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");
CREATE INDEX "ProviderProfile_verificationStatus_isOnline_idx" ON "ProviderProfile"("verificationStatus", "isOnline");
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");
CREATE INDEX "Service_categoryId_isActive_idx" ON "Service"("categoryId", "isActive");
CREATE INDEX "ProviderSkill_serviceId_approved_idx" ON "ProviderSkill"("serviceId", "approved");
CREATE UNIQUE INDEX "ProviderAvailability_providerId_weekday_startTime_key" ON "ProviderAvailability"("providerId", "weekday", "startTime");
CREATE INDEX "ProviderAvailability_providerId_isActive_idx" ON "ProviderAvailability"("providerId", "isActive");
CREATE INDEX "ProviderServiceArea_providerId_isActive_idx" ON "ProviderServiceArea"("providerId", "isActive");
CREATE INDEX "Address_userId_idx" ON "Address"("userId");
CREATE INDEX "Address_city_idx" ON "Address"("city");
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");
CREATE INDEX "Booking_status_scheduledFor_idx" ON "Booking"("status", "scheduledFor");
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");
CREATE INDEX "Booking_addressId_idx" ON "Booking"("addressId");
CREATE INDEX "BookingStatusEvent_bookingId_createdAt_idx" ON "BookingStatusEvent"("bookingId", "createdAt");
CREATE INDEX "AssignmentOffer_bookingId_status_idx" ON "AssignmentOffer"("bookingId", "status");
CREATE INDEX "AssignmentOffer_providerId_status_idx" ON "AssignmentOffer"("providerId", "status");
CREATE INDEX "AssignmentOffer_expiresAt_status_idx" ON "AssignmentOffer"("expiresAt", "status");
CREATE UNIQUE INDEX "ProviderAssignment_bookingId_key" ON "ProviderAssignment"("bookingId");
CREATE INDEX "ProviderAssignment_providerId_idx" ON "ProviderAssignment"("providerId");
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");
CREATE INDEX "Payment_bookingId_status_idx" ON "Payment"("bookingId", "status");

ALTER TABLE "CustomerProfile" ADD CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderSkill" ADD CONSTRAINT "ProviderSkill_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderSkill" ADD CONSTRAINT "ProviderSkill_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderServiceArea" ADD CONSTRAINT "ProviderServiceArea_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookingStatusEvent" ADD CONSTRAINT "BookingStatusEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingStatusEvent" ADD CONSTRAINT "BookingStatusEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssignmentOffer" ADD CONSTRAINT "AssignmentOffer_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssignmentOffer" ADD CONSTRAINT "AssignmentOffer_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderAssignment" ADD CONSTRAINT "ProviderAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAssignment" ADD CONSTRAINT "ProviderAssignment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Geography expression indexes keep location data in Prisma-friendly DECIMAL columns
-- while supporting meter-accurate PostGIS lookups without geometric shadow columns.
CREATE INDEX "ProviderServiceArea_geography_idx"
  ON "ProviderServiceArea"
  USING GIST ((ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography));
CREATE INDEX "Address_geography_idx"
  ON "Address"
  USING GIST ((ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography));
