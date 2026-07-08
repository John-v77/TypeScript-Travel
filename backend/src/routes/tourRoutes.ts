import { Router } from "express";
import tourController from "../controllers/tourController";
import authController from "../controllers/authController";
import reviewRouter from "./reviewRoutes";
const router = Router();

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTourById)
  .patch(tourController.updateTourPackage)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTourPackage,
  );

router.use("/:tourId/reviews", reviewRouter);

export default router;
