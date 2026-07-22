import { Pool, type PoolClient } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getDatabasePoolConfig } from "./databaseUrl";

function getIntegerEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name]);

  if (!Number.isInteger(value) || value < min || value > max) {
    return fallback;
  }

  return value;
}

const maxPoolSize = getIntegerEnv("DATABASE_POOL_MAX", 10, 1, 100);
const minPoolSize = getIntegerEnv("DATABASE_POOL_MIN", 0, 0, maxPoolSize);

const serializedClients = new WeakSet<PoolClient>();

// Prisma may issue multiple statements on one transaction client for nested writes/includes.
// pg 8.22 warns on queued client.query calls, and pg 9 will remove that queueing behavior.
function serializeClientQueries(client: PoolClient) {
  if (serializedClients.has(client)) {
    return;
  }

  serializedClients.add(client);

  const query = client.query.bind(client) as (...args: unknown[]) => unknown;
  let queue = Promise.resolve();

  client.query = ((...args: unknown[]) => {
    const maybeCallback = args.at(-1);

    if (typeof maybeCallback === "function") {
      const originalCallback = maybeCallback as (...callbackArgs: unknown[]) => void;
      const callbackArgs = [...args];
      let releaseQueue = () => {};

      callbackArgs[callbackArgs.length - 1] = (...resultArgs: unknown[]) => {
        try {
          originalCallback(...resultArgs);
        } finally {
          releaseQueue();
        }
      };

      const operation = queue.then(() => new Promise<void>((resolve) => {
        releaseQueue = resolve;

        try {
          query(...callbackArgs);
        } catch (error) {
          try {
            originalCallback(error);
          } finally {
            resolve();
          }
        }
      }));

      queue = operation.then(() => undefined, () => undefined);

      return undefined;
    }

    const operation = queue.then(() => query(...args));
    queue = operation.then(() => undefined, () => undefined);

    return operation;
  }) as PoolClient["query"];
}

function createPool() {
  const pool = new Pool({
    ...getDatabasePoolConfig(),
    max: maxPoolSize,
    min: minPoolSize,
    statement_timeout: getIntegerEnv("DATABASE_STATEMENT_TIMEOUT_MS", 10000, 1000, 60000),
    connectionTimeoutMillis: getIntegerEnv("DATABASE_CONNECTION_TIMEOUT_MS", 5000, 1000, 60000),
    idleTimeoutMillis: getIntegerEnv("DATABASE_IDLE_TIMEOUT_MS", 15000, 1000, 120000),
  });

  pool.on("connect", serializeClientQueries);

  return pool;
}

function createPrismaClient() {
  const pool = createPool();
  const adapter = new PrismaPg(pool);

  return {
    pool,
    prisma: new PrismaClient({ adapter })
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

const prismaContext =
  process.env.NODE_ENV !== "production" && globalForPrisma.prisma && globalForPrisma.prismaPool
    ? { prisma: globalForPrisma.prisma, pool: globalForPrisma.prismaPool }
    : createPrismaClient();

export const prisma = prismaContext.prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaContext.prisma;
  globalForPrisma.prismaPool = prismaContext.pool;
}
