-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "system_key" TEXT NOT NULL,
    "system_domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL
);
