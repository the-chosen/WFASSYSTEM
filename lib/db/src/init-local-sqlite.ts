import type Database from "better-sqlite3";

const DEFAULT_ADMIN_PASSWORD_HASH =
  "$2b$10$lAYGlskN24y1Nw9lIrV9LOzxacSCeYbJ4oYgiZ9kax8CFzdpK8JEm";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  display_name TEXT NOT NULL DEFAULT '',
  signature_image TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_type TEXT NOT NULL DEFAULT 'quotation',
  quotation_number TEXT NOT NULL,
  date TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  company_name TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  discount_type TEXT NOT NULL DEFAULT 'fixed',
  discount_value TEXT NOT NULL DEFAULT '0',
  apply_tax INTEGER NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  prepared_by TEXT NOT NULL DEFAULT '',
  signature_image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_by_id INTEGER,
  approved_by_id INTEGER,
  approved_at INTEGER,
  rejection_reason TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  unit TEXT NOT NULL DEFAULT 'unit',
  unit_price TEXT NOT NULL DEFAULT '0',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  product_interest TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  scheduled_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);
`;

function needsSchemaReset(sqlite: Database.Database): boolean {
  const columns = sqlite.prepare("PRAGMA table_info(users)").all() as Array<{
    name: string;
    type: string;
  }>;
  if (columns.length === 0) return false;
  const createdAt = columns.find((column) => column.name === "created_at");
  return createdAt?.type.toUpperCase() === "TEXT";
}

function resetSchema(sqlite: Database.Database) {
  sqlite.exec(`
    DROP TABLE IF EXISTS follow_ups;
    DROP TABLE IF EXISTS leads;
    DROP TABLE IF EXISTS quotations;
    DROP TABLE IF EXISTS inventory_items;
    DROP TABLE IF EXISTS users;
  `);
}

export function initLocalSqlite(sqlite: Database.Database) {
  if (needsSchemaReset(sqlite)) {
    resetSchema(sqlite);
  }

  sqlite.exec(SCHEMA_SQL);

  const existing = sqlite
    .prepare("SELECT id FROM users WHERE username = ?")
    .get("admin");

  if (!existing) {
    const now = Math.floor(Date.now() / 1000);
    sqlite
      .prepare(
        `INSERT INTO users (username, email, password_hash, role, display_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "admin",
        "",
        DEFAULT_ADMIN_PASSWORD_HASH,
        "super_admin",
        "Administrator",
        now,
        now,
      );
    console.log("Seeded default admin user (admin / admin123)");
  }
}
