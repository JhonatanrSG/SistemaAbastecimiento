-- CreateEnum
CREATE TYPE "public"."RfqClassification" AS ENUM ('ENVIADA', 'RECHAZADA', 'SOSPECHOSA', 'OPCIONADA');

-- AlterTable
ALTER TABLE "public"."Rfq" ADD COLUMN     "classification" "public"."RfqClassification" NOT NULL DEFAULT 'ENVIADA';

-- AlterTable
ALTER TABLE "public"."RfqItem" ADD COLUMN     "quotedUnitPriceCents" INTEGER;
