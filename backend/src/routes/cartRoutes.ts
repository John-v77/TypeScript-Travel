import { Router } from "express";
import cartController from "../controllers/cartController";
import authController from "../controllers/authController";

const router = Router();

router.use(authController.protect);

router
  .route("/")
  .get(cartController.setMyFilter, cartController.getMyCart)
  .post(cartController.setMyCartItem, cartController.addCartItem);

router.delete("/clear-cart", cartController.clearMyCart);

router
  .route("/:id")
  .patch(
    cartController.checkCartItemOwner,
    cartController.setQuantityOnly,
    cartController.updateCartItem,
  )
  .delete(cartController.checkCartItemOwner, cartController.deleteCartItem);

export default router;
