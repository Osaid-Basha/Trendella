import { Router } from "express";
import { z } from "zod";
import { addToWishlist, getWishlist, lookupProduct, removeFromWishlist } from "../services/session";
import { getSessionId } from "../utils/session";

const router = Router();

const wishlistBodySchema = z.object({
  productId: z.string().min(1)
});

router.get("/", (req, res) => {
  const sessionId = getSessionId(req);
  const wishlist = getWishlist(sessionId);
  res.json({ products: wishlist });
});

router.post("/add", (req, res, next) => {
  try {
    const { productId } = wishlistBodySchema.parse(req.body);
    const sessionId = getSessionId(req);
    const product = lookupProduct(sessionId, productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found in recent recommendations" });
    }

    addToWishlist(sessionId, product);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/remove", (req, res, next) => {
  try {
    const { productId } = wishlistBodySchema.parse(req.body);
    const sessionId = getSessionId(req);
    removeFromWishlist(sessionId, productId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
