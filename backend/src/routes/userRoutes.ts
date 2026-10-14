import express from "express";

import userController from "../controllers/userController";
import authController from "../controllers/authController";
import bookingController from "../controllers/bookingController";
import favoriteController from "../controllers/favoriteController";
import { LoginLimiter } from "../middleware/rateLimiter";

const router = express.Router();

// Authentication routes
router.post("/signup", authController.signup);
router.post("/login", LoginLimiter, authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protects all routes after this middleware
router.use(authController.protect);

// Protected routes
router.get("/me", userController.getMe, userController.getUserById);

// Get all bookings for the current user
router.get("/my-bookings", bookingController.getMyBookings);

// Favourites
router
  .route("/my-favorites")
  .get(favoriteController.setMyFilter, favoriteController.getAllFavorites)
  .post(favoriteController.setMyFavorite, favoriteController.createFavorite);
router.delete(
  "/my-favorites/:id",
  favoriteController.checkFavoriteOwner,
  favoriteController.deleteFavorite,
);

router.patch("/updateMyPassword", authController.updatePassword);
router.patch(
  "/updateMe",
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
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
  .delete(userController.deleteUser);

// Nested route: get all bookings for a specific user (admin only)
router.get("/user-bookings/:userId/bookings", bookingController.getAllBookings);

export default router;
