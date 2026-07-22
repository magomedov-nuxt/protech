import { expireUnpaidOrders } from "~~/server/utils/orderExpiry";
import { getPositiveIntegerEnv } from "~~/server/utils/env";

const globalForOrderExpiry = globalThis as typeof globalThis & {
  __protechOrderExpiryTimer?: NodeJS.Timeout;
};

export default defineNitroPlugin(() => {
  if (process.env.ORDER_EXPIRY_JOB_DISABLED === "true") {
    return;
  }

  if (globalForOrderExpiry.__protechOrderExpiryTimer) {
    clearInterval(globalForOrderExpiry.__protechOrderExpiryTimer);
  }

  const intervalMs = getPositiveIntegerEnv("ORDER_EXPIRY_JOB_INTERVAL_MS", 5 * 60_000);
  let isRunning = false;

  const run = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      await expireUnpaidOrders();
    } catch (error) {
      console.error("Failed to expire unpaid orders", error);
    } finally {
      isRunning = false;
    }
  };

  if (process.env.ORDER_EXPIRY_JOB_RUN_ON_STARTUP !== "false") {
    void run();
  }

  const timer = setInterval(() => {
    void run();
  }, intervalMs);

  timer.unref?.();
  globalForOrderExpiry.__protechOrderExpiryTimer = timer;
});
