import { Router } from "express";
import tourController from "../controllers/tourController";
import authController from "../controllers/authController";
import reviewRouter from "./reviewRoutes";

const router = Router();

router
  .route("/top-5-by-rating")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route("/tours-stats")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.getToursStats,
  );

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.getMonthlyPlan,
  );

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getToursWithin);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour,
  );

router
  .route("/:id")
  .get(tourController.getTourById)
  .patch(
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTourPackage,
  )
  .delete(
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTourPackage,
  );

// Nested routes
router.use("/:tourId/reviews", reviewRouter);

export default router;
