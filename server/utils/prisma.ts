import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

const databaseUrl = getDatabaseUrl();

function createPrismaClient() {
  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prismaContext =
  process.env.NODE_ENV !== "production" && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

export const prisma = prismaContext;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaContext;
}
