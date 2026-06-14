-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATEUR');

-- CreateEnum
CREATE TYPE "EmargementMode" AS ENUM ('PDF', 'SIGNATURE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'OPERATEUR';

-- CreateTable
CREATE TABLE "InstanceSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "orgName" TEXT,
    "orgEmail" TEXT,
    "formBaseUrl" TEXT,
    "devisRequired" BOOLEAN NOT NULL DEFAULT true,
    "sendProgrammeOnLaunch" BOOLEAN NOT NULL DEFAULT false,
    "emargementModeDefault" "EmargementMode" NOT NULL DEFAULT 'PDF',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstanceSettings_pkey" PRIMARY KEY ("id")
);
