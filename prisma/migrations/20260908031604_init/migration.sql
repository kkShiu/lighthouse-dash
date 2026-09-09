-- CreateTable
CREATE TABLE "urls" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" DATETIME
);

-- CreateTable
CREATE TABLE "runs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "urlId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "fetchTime" TEXT,
    "errorMessage" TEXT,
    "perfScore" INTEGER,
    "accessibilityScore" INTEGER,
    "bestPracticesScore" INTEGER,
    "seoScore" INTEGER,
    "pwaScore" INTEGER,
    "auditsJson" TEXT,
    CONSTRAINT "runs_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "urls_url_key" ON "urls"("url");

-- CreateIndex
CREATE INDEX "runs_urlId_triggeredAt_idx" ON "runs"("urlId", "triggeredAt");
