-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('PENDIENTE', 'EN_TRAMITE', 'CERRADA');

-- CreateTable
CREATE TABLE "public"."SupplyRequest" (
    "id" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplyRequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "uom" TEXT NOT NULL,
    "brand" TEXT,

    CONSTRAINT "SupplyRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplyRequestItem_requestId_idx" ON "public"."SupplyRequestItem"("requestId");

-- CreateIndex
CREATE INDEX "SupplyRequestItem_productId_idx" ON "public"."SupplyRequestItem"("productId");

-- CreateIndex
CREATE INDEX "SupplyRequestItem_brand_idx" ON "public"."SupplyRequestItem"("brand");

-- AddForeignKey
ALTER TABLE "public"."SupplyRequestItem" ADD CONSTRAINT "SupplyRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."SupplyRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplyRequestItem" ADD CONSTRAINT "SupplyRequestItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
