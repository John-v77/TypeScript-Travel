import { Router } from "express";
import gearController from "../controllers/gearController";
import authController from "../controllers/authController";

const router = Router();

router.get("/", gearController.getAllGear);

router.post(
  "/checkout-session",
  authController.protect,
  gearController.getCheckoutSession,
);
router.get("/my-orders", authController.protect, gearController.getMyOrders);
router.post(
  "/orders/confirm/:sessionId",
  authController.protect,
  gearController.confirmOrder,
);
router.get(
  "/orders",
  authController.protect,
  authController.restrictTo("admin"),
  gearController.getAllOrders,
);

router.get("/:id", gearController.getGear);

router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  gearController.createGear,
);

router
  .route("/:id")
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    gearController.updateGear,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    gearController.deleteGear,
  );

export default router;
