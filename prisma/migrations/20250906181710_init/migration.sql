-- CreateTable
CREATE TABLE "GridAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "address" TEXT NOT NULL,
    "voltage" INTEGER NOT NULL,
    "load" REAL NOT NULL,
    "capacity" INTEGER NOT NULL,
    "lastUpdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "site" TEXT,
    "zone" TEXT,
    "woreda" TEXT,
    "category" TEXT,
    "nameLink" TEXT
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");
