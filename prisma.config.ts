import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./server/prisma/",
  migrations: {
    path: "./server/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
