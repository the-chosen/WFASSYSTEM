import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  console.error("Please set DATABASE_URL in your environment or .env file");
  process.exit(1);
}

console.log("🔍 Testing database connection...");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const client = await pool.connect();
  console.log("✅ Database connection successful!");
  
  const result = await client.query("SELECT version()");
  console.log("📊 Database version:", result.rows[0].version.split("\n")[0]);
  
  client.release();
  await pool.end();
  process.exit(0);
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
  await pool.end();
  process.exit(1);
}
