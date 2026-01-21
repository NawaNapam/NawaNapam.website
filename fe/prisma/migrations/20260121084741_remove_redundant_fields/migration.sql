/*
  Warnings:

  - You are about to drop the column `device` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `lon` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `turnUsed` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Authenticator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Interest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Authenticator" DROP CONSTRAINT "Authenticator_userId_fkey";

-- DropForeignKey
ALTER TABLE "Interest" DROP CONSTRAINT "Interest_userId_fkey";

-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "device",
DROP COLUMN "ip",
DROP COLUMN "lat",
DROP COLUMN "lon",
DROP COLUMN "region",
DROP COLUMN "role",
DROP COLUMN "turnUsed";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image";

-- DropTable
DROP TABLE "Authenticator";

-- DropTable
DROP TABLE "Interest";
