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

// Protect all routes after this middleware
router.use(authController.protect);

// Protected routes
router.get("/me", userController.getMe, userController.getUserById);

router.patch("/updateMyPassword", authController.updatePassword);
router.patch("/updateMe", userController.updateUser);
router.delete("/deleteMe", userController.deleteMe);

// Admin only CRUD routes
router.use(authController.restrictTo("admin"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
