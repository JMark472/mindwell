import { Router } from "express";
import { csrfMiddleware } from "@/middlewares/csrf-middleware";
import authRoutes from "@/routes/auth-routes";
import userRoutes from "@/routes/user-routes";
import notificationRoutes from "@/routes/notification-routes";
import adminRoutes from "@/routes/admin-routes";
import reportRoutes from "@/routes/report-routes";
import internalRoutes from "@/routes/internal-routes";

const router = Router();

// CSRF applies to cookie-authenticated writes across the public API.
router.use(csrfMiddleware);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/reports", reportRoutes);
// Internal endpoints authenticate with the service key instead of cookies.
router.use("/internal", internalRoutes);

export default router;
