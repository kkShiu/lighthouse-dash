import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const client = new PrismaClient({ adapter });

  // WAL mode lets the background trigger-run job write while other requests
  // read concurrently; busy_timeout retries instead of immediately throwing
  // "database is locked" when two writers do collide (e.g. two dev instances
  // sharing one dev.db, or two people triggering runs at once).
  client
    .$executeRawUnsafe("PRAGMA journal_mode = WAL;")
    .then(() => client.$executeRawUnsafe("PRAGMA busy_timeout = 5000;"))
    .catch((err) => console.error("Failed to set sqlite pragmas:", err));

  return client;
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
