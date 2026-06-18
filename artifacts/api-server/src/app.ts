import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";

const PgSession = connectPgSimple(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session store configuration
const sessionStore = process.env.DATABASE_URL?.startsWith("postgres")
  ? new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "sessions",
    })
  : new session.MemoryStore(); // Fallback to memory store for SQLite

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET ?? "wichi-farms-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }),
);

app.use("/api", router);

const frontendDist = path.resolve("artifacts/wichi-quotation/dist");
app.use(express.static(frontendDist));

app.get(/\/.*/, (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
