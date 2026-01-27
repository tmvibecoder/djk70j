-- CreateTable
CREATE TABLE "SalesEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "eventDay" TEXT NOT NULL,
    "enteredBy" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesEntry_enteredBy_fkey" FOREIGN KEY ("enteredBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SalesEntry_productId_idx" ON "SalesEntry"("productId");

-- CreateIndex
CREATE INDEX "SalesEntry_eventDay_idx" ON "SalesEntry"("eventDay");
