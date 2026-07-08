import { Router } from "express";
import reviewController from "../controllers/reviewController";
import authController from "../controllers/authController";

const router = Router();
router
  .route("/")
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.createReview,
  );
export default router;
