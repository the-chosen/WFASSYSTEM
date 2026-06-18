import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "./lib/db/src/schema/pg/index.ts";
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function main() {
  // Use drizzle-kit's push functionality
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  // For push, we need to use the internal push function
  const { pushSchema } = await import("drizzle-kit/push");
  await pushSchema(db, schema, { dialect: "postgresql" });
  console.log("Schema pushed successfully");
  await pool.end();
}

main().catch(console.error);
