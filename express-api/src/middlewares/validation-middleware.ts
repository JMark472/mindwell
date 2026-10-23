import { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";

export class SchemaError extends Error {
  constructor(
    public issues: { path: string; message: string }[],
  ) {
    super("Validation failed");
    this.name = "SchemaError";
  }
}

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({ body: req.body, query: req.query, params: req.params });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new SchemaError(
            error.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          ),
        );
      }
      return next(error);
    }
  };
}

/** Normalizes errors into a consistent JSON envelope. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof SchemaError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.issues,
    });
  }

  // Business errors thrown by services (auth-service.ApiError and friends).
  const businessError = err as { name?: string; status?: number; message?: string };
  if (
    businessError?.name === "ApiError" &&
    typeof businessError.status === "number"
  ) {
    return res
      .status(businessError.status)
      .json({ status: "error", message: businessError.message });
  }

  // MySQL duplicate key (unique constraint).
  const anyErr = err as { code?: string; errno?: number; message?: string };
  if (anyErr?.code === "ER_DUP_ENTRY" || anyErr?.errno === 1062) {
    return res
      .status(409)
      .json({ status: "error", message: "A record with that value already exists." });
  }

  console.error("[mindwell-api] Unhandled error:", err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
