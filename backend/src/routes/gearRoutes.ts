import { Router } from "express";
import gearController from "../controllers/gearController";
import authController from "../controllers/authController";

const router = Router();


router.get("/", gearController.getAllGear);
router.get("/:id", gearController.getGear);


router.post("/",authController.protect, authController.restrictTo("admin"), gearController.createGear);

router
  .route("/:id")
  .patch(authController.protect, authController.restrictTo("admin"), gearController.updateGear)
  .delete(authController.protect, authController.restrictTo("admin"), gearController.deleteGear);

export default router;
