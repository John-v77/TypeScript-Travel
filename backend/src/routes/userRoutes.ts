import express from "express";

import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";
import LoginLimiter from "../middleware/rateLimiter";

const router = express.Router();

// Authentication routes
router.post("/signup", authController.signup);
router.post("/login", LoginLimiter, authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protected routes
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword,
);
router.patch("/updateMe", authController.protect, authController.updateUser);
router.delete("/deleteMe", authController.protect, authController.deleteUser);

// User Crud routes
router.get("/", userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
