import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { env, isProd } from "./utils/env";
import recommendRouter from "./routes/recommend";
import wishlistRouter from "./routes/wishlist";
import chatRouter from "./routes/chat";
import authRouter from "./routes/auth";
import { getUserFromRequest } from "./utils/auth";

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  message: "Too many requests, please slow down."
});

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (env.ORIGIN_ALLOWLIST.length === 0 || env.ORIGIN_ALLOWLIST.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(limiter);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use("/api/auth", authRouter);
app.get("/api/me", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (!user) return res.json({ user: null });
  const { id, name, email, picture } = user;
  return res.json({ user: { id, name, email, picture } });
});
app.use("/api/recommend", recommendRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/chat", chatRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(400).json({ error: err.message });
});

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}${isProd ? "" : " (dev mode)"}`);
});
