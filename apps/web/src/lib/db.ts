import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const databaseUrl = process.env.DATABASE_URL ?? "";
const isVercelRuntime = process.env.VERCEL === "1";

if (isVercelRuntime && databaseUrl.startsWith("file:")) {
  throw new Error(
    "Production requires a Postgres DATABASE_URL. SQLite file URLs are local-only and will break deployed auth."
  );
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
