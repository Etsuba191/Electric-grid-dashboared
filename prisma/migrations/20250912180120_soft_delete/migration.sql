-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GridAsset" (
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
    "nameLink" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_GridAsset" ("address", "capacity", "category", "id", "lastUpdate", "latitude", "load", "longitude", "name", "nameLink", "site", "status", "type", "voltage", "woreda", "zone") SELECT "address", "capacity", "category", "id", "lastUpdate", "latitude", "load", "longitude", "name", "nameLink", "site", "status", "type", "voltage", "woreda", "zone" FROM "GridAsset";
DROP TABLE "GridAsset";
ALTER TABLE "new_GridAsset" RENAME TO "GridAsset";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
