import { Router } from "express";
import bookingController from "../controllers/bookingController";
import authController from "../controllers/authController";

const router = Router();

router.use(authController.protect);

router.get("/checkout-session/:tourId", bookingController.getCheckoutSession);

export default router;
