import express from "express";

import userController from "../controllers/userController";
import authController from "../controllers/authController";
import { LoginLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// Authentication routes
router.post("/signup", authController.signup);
router.post("/login", LoginLimiter, authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protected routes
router.get(
  "/me",
  authController.protect,
  userController.getMe,
  userController.getUserById,
);

router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword,
);
router.patch("/updateMe", authController.protect, userController.updateUser);
router.delete("/deleteMe", authController.protect, userController.deleteUser);

// Admin only CRUD routes
router
  .route("/")
  .get(userController.getAllUsers)
  .post(
    authController.protect,
    authController.restrictTo("admin"),
    userController.createUser,
  );

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    userController.updateUser,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    userController.deleteUser,
  );

export default router;
