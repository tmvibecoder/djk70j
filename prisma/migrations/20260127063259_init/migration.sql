-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'helper',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "purchasePrice" REAL NOT NULL,
    "salePrice" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventDay" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesEstimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "eventDay" TEXT NOT NULL,
    "estimatedQuantity" REAL NOT NULL,
    CONSTRAINT "SalesEstimate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "eventDay" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "requiredHelpers" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Shift_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "eventDay" TEXT NOT NULL DEFAULT 'thursday'
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "eventDay" TEXT NOT NULL DEFAULT 'thursday',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "deadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'open',
    "eventDay" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_eventDay_idx" ON "Inventory"("eventDay");

-- CreateIndex
CREATE UNIQUE INDEX "SalesEstimate_productId_eventDay_key" ON "SalesEstimate"("productId", "eventDay");

-- CreateIndex
CREATE INDEX "Shift_stationId_idx" ON "Shift"("stationId");

-- CreateIndex
CREATE INDEX "Shift_eventDay_idx" ON "Shift"("eventDay");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_shiftId_userId_key" ON "ShiftAssignment"("shiftId", "userId");

-- CreateIndex
CREATE INDEX "Participant_teamId_idx" ON "Participant"("teamId");

-- CreateIndex
CREATE INDEX "Participant_eventDay_idx" ON "Participant"("eventDay");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_eventDay_idx" ON "Task"("eventDay");
