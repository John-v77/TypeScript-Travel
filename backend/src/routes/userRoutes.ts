import express from "express";

import * as userController from "../controllers/userController";
import * as authController from "../controllers/authController";

const router = express.Router();

// Authentication routes
router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);

// Protected routes
router.delete("/deleteMe", authController.protect, authController.deleteUser);

// User Crud routes
router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
