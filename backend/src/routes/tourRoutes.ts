import { Router } from "express";
import * as tourController from "../controllers/tourController";

const router = Router();

router
  .route("/")
  .get(tourController.getAllTours)
  .post(tourController.createTour);

router
  .route("/:id")
  .get(tourController.getTourById)
  .delete(tourController.deleteTourPackage);

export default router;
