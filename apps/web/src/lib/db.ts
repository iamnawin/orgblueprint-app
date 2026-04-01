import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const databaseUrl = process.env.DATABASE_URL ?? "";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Configure a hosted Postgres connection string before starting the app."
  );
}

if (databaseUrl.startsWith("file:")) {
  throw new Error(
    "SQLite DATABASE_URL values are no longer supported. Configure hosted Postgres for local and deployed runtime."
  );
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
