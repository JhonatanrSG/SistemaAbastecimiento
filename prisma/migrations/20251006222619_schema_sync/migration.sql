/*
  Warnings:

  - The values [PARCIAL,COMPLETA] on the enum `PoStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `PoItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PoStatus_new" AS ENUM ('EMITIDA', 'APROBADA', 'RECIBIDA', 'CANCELADA');
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" TYPE "public"."PoStatus_new" USING ("status"::text::"public"."PoStatus_new");
ALTER TYPE "public"."PoStatus" RENAME TO "PoStatus_old";
ALTER TYPE "public"."PoStatus_new" RENAME TO "PoStatus";
DROP TYPE "public"."PoStatus_old";
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" SET DEFAULT 'EMITIDA';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."PoItem" DROP CONSTRAINT "PoItem_poId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PoItem" DROP CONSTRAINT "PoItem_productId_fkey";

-- DropTable
DROP TABLE "public"."PoItem";
