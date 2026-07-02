import express from "express";

import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";

const router = express.Router();

// Authentication routes
router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
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
router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
