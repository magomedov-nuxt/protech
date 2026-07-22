import { StockMovementType } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { reserveProductStock, restoreProductStock } from "../server/utils/orderStock";

function createStockTransactionMock() {
  return {
    productStock: {
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      upsert: vi.fn()
    },
    stockMovement: {
      create: vi.fn()
    }
  };
}

describe("order stock reservations", () => {
  it("aggregates duplicate products before reserving stock", async () => {
    const tx = createStockTransactionMock();
    tx.productStock.updateMany.mockResolvedValue({ count: 1 });
    tx.productStock.findUniqueOrThrow.mockResolvedValue({ quantity: 7 });
    tx.stockMovement.create.mockResolvedValue({});

    await reserveProductStock(
      tx as never,
      [
        { productId: 3, quantity: 2 },
        { productId: 3, quantity: 3 }
      ],
      { orderId: 10 }
    );

    expect(tx.productStock.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.productStock.updateMany).toHaveBeenCalledWith({
      where: {
        productId: 3,
        quantity: { gte: 5 }
      },
      data: {
        quantity: { decrement: 5 }
      }
    });
    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        productId: 3,
        orderId: 10,
        type: StockMovementType.RESERVE,
        quantityDelta: -5,
        quantityAfter: 7,
        reason: "Order stock reserve"
      }
    });
  });

  it("rejects reservation when stock is insufficient", async () => {
    const tx = createStockTransactionMock();
    tx.productStock.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      reserveProductStock(tx as never, [{ productId: 4, quantity: 9 }])
    ).rejects.toMatchObject({
      statusCode: 409
    });

    expect(tx.productStock.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(tx.stockMovement.create).not.toHaveBeenCalled();
  });

  it("restores stock and records a release movement", async () => {
    const tx = createStockTransactionMock();
    tx.productStock.upsert.mockResolvedValue({ quantity: 12 });
    tx.stockMovement.create.mockResolvedValue({});

    await restoreProductStock(
      tx as never,
      [
        { productId: 5, quantity: 1 },
        { productId: 5, quantity: 4 }
      ],
      { orderId: 11, reason: "Payment canceled" }
    );

    expect(tx.productStock.upsert).toHaveBeenCalledTimes(1);
    expect(tx.productStock.upsert).toHaveBeenCalledWith({
      where: { productId: 5 },
      create: {
        productId: 5,
        quantity: 5
      },
      update: {
        quantity: { increment: 5 }
      },
      select: {
        quantity: true
      }
    });
    expect(tx.stockMovement.create).toHaveBeenCalledWith({
      data: {
        productId: 5,
        orderId: 11,
        type: StockMovementType.RELEASE,
        quantityDelta: 5,
        quantityAfter: 12,
        reason: "Payment canceled"
      }
    });
  });
});
