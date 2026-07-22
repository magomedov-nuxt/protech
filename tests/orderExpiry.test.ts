import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../server/utils/prisma", () => ({
  prisma: {}
}));

vi.mock("../server/utils/orderStatusNotification", () => ({
  broadcastOrderStatusChangeMessage: vi.fn(),
  createOrderStatusChangeMessage: vi.fn()
}));

async function importOrderExpiry() {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/protech_test");

  return await import("../server/utils/orderExpiry");
}

describe("order payment expiry", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses ORDER_PAYMENT_EXPIRY_MINUTES for expiration timestamps", async () => {
    vi.stubEnv("ORDER_PAYMENT_EXPIRY_MINUTES", "15");
    const { getOrderPaymentExpiresAt, getOrderPaymentRemainingSeconds } = await importOrderExpiry();
    const createdAt = new Date("2026-01-01T10:00:00.000Z");

    expect(getOrderPaymentExpiresAt(createdAt).toISOString()).toBe("2026-01-01T10:15:00.000Z");
    expect(getOrderPaymentRemainingSeconds(createdAt, new Date("2026-01-01T10:10:00.000Z"))).toBe(300);
  });

  it("falls back to ten minutes when the env value is invalid", async () => {
    vi.stubEnv("ORDER_PAYMENT_EXPIRY_MINUTES", "0");
    const { getOrderPaymentExpiresAt, getOrderPaymentRemainingSeconds } = await importOrderExpiry();
    const createdAt = new Date("2026-01-01T10:00:00.000Z");

    expect(getOrderPaymentExpiresAt(createdAt).toISOString()).toBe("2026-01-01T10:10:00.000Z");
    expect(getOrderPaymentRemainingSeconds(createdAt, new Date("2026-01-01T10:20:00.000Z"))).toBe(0);
  });
});
