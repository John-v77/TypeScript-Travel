import { Router } from "express";
import reviewController from "../controllers/reviewController";
import authController from "../controllers/authController";

const router = Router();
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.createReview,
  );
export default router;
