import { Router } from "express";
import reviewController from "../controllers/reviewController";
import authController from "../controllers/authController";

const router = Router({ mergeParams: true });
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview,
  )
  .delete(
    authController.protect,
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview,
  );
export default router;
