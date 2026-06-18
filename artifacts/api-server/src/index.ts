import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initDb() {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) return;
  const ADMIN_PASSWORD_HASH = "$2b$10$qjnMeCA0tvIyzdeuqGZCcOs05cTJfvVhtEh0KOjDVCjQ5QH70re3u";
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid VARCHAR NOT NULL PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, email TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user',
      display_name TEXT NOT NULL DEFAULT '', signature_image TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY, document_type TEXT NOT NULL DEFAULT 'quotation',
      quotation_number TEXT NOT NULL, date TEXT NOT NULL, valid_until TEXT NOT NULL,
      client_name TEXT NOT NULL DEFAULT '', company_name TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
      items JSONB NOT NULL DEFAULT '[]', discount_type TEXT NOT NULL DEFAULT 'fixed',
      discount_value NUMERIC(12,2) NOT NULL DEFAULT '0', apply_tax BOOLEAN NOT NULL DEFAULT true,
      notes TEXT NOT NULL DEFAULT '', prepared_by TEXT NOT NULL DEFAULT '',
      signature_image TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
      submitted_by_id INTEGER, approved_by_id INTEGER, approved_at TIMESTAMPTZ,
      rejection_reason TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory_items (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'General', unit TEXT NOT NULL DEFAULT 'unit',
      unit_price NUMERIC(14,2) NOT NULL DEFAULT '0', is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY, client_name TEXT NOT NULL, company_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
      product_interest TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS follow_ups (
      id SERIAL PRIMARY KEY, lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      scheduled_date TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  const existing = await pool.query("SELECT id FROM users WHERE username = $1", ["admin"]);
  if (existing.rows.length === 0) {
    await pool.query(
      "INSERT INTO users (username, email, password_hash, role, display_name) VALUES ($1,$2,$3,$4,$5)",
      ["admin", "admin@example.com", ADMIN_PASSWORD_HASH, "super_admin", "Administrator"],
    );
    logger.info("Seeded default admin user (admin / admin)");
  }
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  await initDb();
  logger.info({ port }, "Server listening");
});
