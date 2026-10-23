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
app.use(helmet());
app.use(
  cors({
    origin: ENV.FRONTEND_URL,
    credentials: true,
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
