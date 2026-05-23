import { Router } from "express";
import * as tourController from "../controllers/tourController";

const router = Router();

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);

router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTourById)
  .patch(tourController.updateTourPackage)
  .delete(tourController.deleteTourPackage);

export default router;
