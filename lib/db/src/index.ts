import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import pg from "pg";
import Database from "better-sqlite3";
import { initLocalSqlite } from "./init-local-sqlite";
import * as pgSchema from "./schema/pg/index.js";
import * as sqliteSchema from "./schema/sqlite/index.js";
import * as schema from "./schema/index.js";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
let pool: any;

if (databaseUrl?.startsWith("postgres")) {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle(pool, { schema: pgSchema });
} else {
  console.warn("⚠️  Using SQLite for local development. Set DATABASE_URL for cloud database.");
  const sqlite = new Database("./local-dev.sqlite");
  initLocalSqlite(sqlite);
  db = drizzleSqlite(sqlite, { schema: sqliteSchema }) as any;
}

export { db, pool };
export * from "./schema/index.js";
