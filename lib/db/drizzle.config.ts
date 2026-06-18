import { defineConfig } from "drizzle-kit";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️  DATABASE_URL not set. Using local SQLite for development.");
  console.warn("Set DATABASE_URL for production cloud database.");
}

export default defineConfig({
  schema: databaseUrl?.startsWith("postgres")
    ? "./src/schema/pg/*.ts"
    : "./src/schema/sqlite/*.ts",
  dialect: databaseUrl?.startsWith("postgres") ? "postgresql" : "sqlite",
  dbCredentials: databaseUrl
    ? { url: databaseUrl }
    : { url: "./local-dev.sqlite" },
});
