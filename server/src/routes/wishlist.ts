import { Router } from "express";
import { z } from "zod";
import {
  addToGuestWishlist,
  addToUserWishlist,
  getGuestWishlist,
  getUserWishlist,
  lookupProduct,
  removeFromGuestWishlist,
  removeFromUserWishlist
} from "../services/session";
import { getSessionId } from "../utils/session";
import { getUserFromRequest, ensureGuestCookie } from "../utils/auth";
import { sanitizeAffiliateUrl } from "../utils/url";

const router = Router();

const wishlistBodySchema = z.object({
  productId: z.string().min(1),
  store: z.string().optional()
});

router.get("/", async (req, res) => {
  const user = await getUserFromRequest(req);
  if (user) {
    const products = getUserWishlist(user.id);
    return res.json({ products });
  }
  const guestId = ensureGuestCookie(req, res);
  const products = getGuestWishlist(guestId);
  return res.json({ products });
});

router.post("/add", async (req, res, next) => {
  try {
    const { productId, store } = wishlistBodySchema.parse(req.body);
    const sessionId = getSessionId(req);
    const product = lookupProduct(sessionId, productId, store);

    if (!product) {
      return res.status(404).json({ error: "Product not found in recent recommendations" });
    }

    // sanitize URLs to be safe
    product.affiliate_url = sanitizeAffiliateUrl(product.affiliate_url);
    const user = await getUserFromRequest(req);
    if (user) {
      addToUserWishlist(user.id, product);
    } else {
      const guestId = ensureGuestCookie(req, res);
      addToGuestWishlist(guestId, product);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/remove", async (req, res, next) => {
  try {
    const { productId, store } = wishlistBodySchema.parse(req.body);
    const user = await getUserFromRequest(req);
    if (user) {
      removeFromUserWishlist(user.id, productId, store);
    } else {
      const guestId = ensureGuestCookie(req, res);
      removeFromGuestWishlist(guestId, productId, store);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
