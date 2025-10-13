/*
  Warnings:

  - The values [APROBADA,RECIBIDA] on the enum `PoStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `PurchaseOrderItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PoStatus_new" AS ENUM ('EMITIDA', 'PARCIAL', 'COMPLETA', 'CANCELADA');
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" TYPE "public"."PoStatus_new" USING ("status"::text::"public"."PoStatus_new");
ALTER TYPE "public"."PoStatus" RENAME TO "PoStatus_old";
ALTER TYPE "public"."PoStatus_new" RENAME TO "PoStatus";
DROP TYPE "public"."PoStatus_old";
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" SET DEFAULT 'EMITIDA';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_poId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_productId_fkey";

-- DropTable
DROP TABLE "public"."PurchaseOrderItem";

-- CreateTable
CREATE TABLE "public"."PoItem" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qtyOrdered" DOUBLE PRECISION NOT NULL,
    "qtyReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom" TEXT NOT NULL,
    "brand" TEXT,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "PoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoodsReceipt" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoodsReceiptItem" (
    "id" TEXT NOT NULL,
    "grnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PoItem_poId_idx" ON "public"."PoItem"("poId");

-- CreateIndex
CREATE INDEX "PoItem_productId_idx" ON "public"."PoItem"("productId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_poId_idx" ON "public"."GoodsReceipt"("poId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_grnId_idx" ON "public"."GoodsReceiptItem"("grnId");

-- CreateIndex
CREATE INDEX "GoodsReceiptItem_productId_idx" ON "public"."GoodsReceiptItem"("productId");

-- AddForeignKey
ALTER TABLE "public"."PoItem" ADD CONSTRAINT "PoItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PoItem" ADD CONSTRAINT "PoItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_poId_fkey" FOREIGN KEY ("poId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_grnId_fkey" FOREIGN KEY ("grnId") REFERENCES "public"."GoodsReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
