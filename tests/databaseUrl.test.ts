import { describe, expect, it } from "vitest";
import { getDatabaseUrl } from "../server/utils/databaseUrl";

describe("database URL configuration", () => {
  it("normalizes DATABASE_URL values and adds the default PostgreSQL port", () => {
    const url = getDatabaseUrl({
      DATABASE_URL: ' "postgresql://postgres:postgres@localhost/protech" '
    });

    expect(url).toBe("postgresql://postgres:postgres@localhost:5432/protech");
  });

  it("builds DATABASE_URL from separate component variables", () => {
    const url = getDatabaseUrl({
      DB_HOST: "db.example.com",
      DB_PORT: "6543",
      DB_USER: "protech_user",
      DB_PASSWORD: "p#s/s?%@: word",
      DB_NAME: "default_db",
      DB_SSL: "true"
    });

    expect(url).toBe(
      "postgresql://protech_user:p%23s%2Fs%3F%25%40%3A%20word@db.example.com:6543/default_db?sslmode=require"
    );
  });

  it("uses host:port values when the port is included in DB_HOST", () => {
    const parsed = new URL(
      getDatabaseUrl({
        DB_HOST: "192.168.0.4:6432",
        DB_USER: "protech_user",
        DB_PASSWORD: "password",
        DB_NAME: "default_db"
      })
    );

    expect(parsed.hostname).toBe("192.168.0.4");
    expect(parsed.port).toBe("6432");
  });

  it("prefers complete component variables over a broken DATABASE_URL", () => {
    const url = getDatabaseUrl({
      DATABASE_URL: "postgresql://user:pass@db.example.com:not-a-port/default_db",
      DB_HOST: "db.example.com",
      DB_PORT: "5432",
      DB_USER: "protech_user",
      DB_PASSWORD: "password",
      DB_NAME: "default_db"
    });

    expect(url).toBe("postgresql://protech_user:password@db.example.com:5432/default_db");
  });

  it("fails with a clear message for non-numeric ports", () => {
    expect(() =>
      getDatabaseUrl({
        DB_HOST: "db.example.com",
        DB_PORT: "not-a-port",
        DB_USER: "protech_user",
        DB_PASSWORD: "password",
        DB_NAME: "default_db"
      })
    ).toThrow("DB_PORT must be a numeric PostgreSQL port");
  });
});
