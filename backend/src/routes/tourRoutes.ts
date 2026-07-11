import { Router } from "express";
import tourController from "../controllers/tourController";
import authController from "../controllers/authController";
import reviewRouter from "./reviewRoutes";
const router = Router();

// Unprotected routes
router.route("/").get(authController.protect, tourController.getAllTours);
router.route("/:id").get(tourController.getTourById);
router.use("/:tourId/reviews", reviewRouter);

// Protects all routes after this middleware
router.use(authController.protect);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

router.route("/").post(tourController.createTour);

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

export default router;
