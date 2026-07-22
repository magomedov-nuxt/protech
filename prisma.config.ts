import "dotenv/config";
import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./server/utils/databaseUrl";

export default defineConfig({
  schema: "./server/prisma/",
  migrations: {
    path: "./server/prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
