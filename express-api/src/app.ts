import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import { ENV } from "@/config/env";
import routes from "@/routes";
import { errorHandler } from "@/middlewares/validation-middleware";

const app = express();

app.set("trust proxy", 1);

// --- Core Middleware ---
// Cookies are sent with every request, so the API must echo back the exact
// request origin instead of using a wildcard. Unknown origins are rejected.
const allowedOrigins = new Set(ENV.FRONTEND_ORIGINS);
if (!ENV.isProduction) {
  allowedOrigins.add("http://localhost:5173");
  allowedOrigins.add("http://localhost:8080");
  allowedOrigins.add("http://127.0.0.1:5173");
  allowedOrigins.add("http://127.0.0.1:8080");
}

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Same-origin / server-to-server requests have no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin.replace(/\/$/, ""))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Accept", "Authorization", "Content-Type", "x-csrf-token", "x-service-key"],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(hpp());

// --- Health checks ---
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: `${ENV.APP_NAME} is healthy`,
    timestamp: new Date().toISOString(),
    timezone: ENV.APP_TIMEZONE,
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// --- API Routes ---
app.use("/api", routes);

// --- 404 Handler ---
app.use((req: Request, res: Response) => {
  res
    .status(404)
    .json({ status: "error", message: `Cannot ${req.method} ${req.originalUrl}` });
});

// --- Global Error Handler ---
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  errorHandler(err, _req, res, _next);
});

export default app;
