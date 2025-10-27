import { Router } from "express";
import { z } from "zod";
import { buildGoogleAuthUrl, clearStateCookie, ensureGuestCookie, exchangeCodeForTokens, getUserFromRequest, issueStateCookie, setAuthCookies, verifyGoogleIdToken } from "../utils/auth";
import { upsertUserByGoogle } from "../services/user";
import { mergeGuestWishlistIntoUser } from "../services/session";
import { env } from "../utils/env";

const router = Router();

router.get("/google", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.SERVER_BASE_URL) {
    return res.status(500).send("Google OAuth is not configured on the server.");
  }
  const state = issueStateCookie(res);
  // ensure guest cookie exists for potential merge later
  ensureGuestCookie(req, res);
  const url = buildGoogleAuthUrl(state);
  res.redirect(url);
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const schema = z.object({ code: z.string().min(1), state: z.string().min(1) });
    const { code, state } = schema.parse(req.query);
    const expectedState = req.cookies?.["oauth_state"];
    if (!expectedState || expectedState !== state) {
      return res.status(400).send("Invalid OAuth state");
    }

    const { id_token } = await exchangeCodeForTokens(code);
    const googleProfile = await verifyGoogleIdToken(id_token);
    const user = upsertUserByGoogle(googleProfile);

    // Merge guest wishlist if present
    const guestId = req.cookies?.["guest_session_id"] as string | undefined;
    if (guestId) {
      mergeGuestWishlistIntoUser(guestId, user.id);
    }

    // Issue our own cookies
    const [access, refresh] = await Promise.all([
      (await import("../utils/auth")).signAccessToken(user),
      (await import("../utils/auth")).signRefreshToken(user)
    ]);
    setAuthCookies(res, access, refresh);
    clearStateCookie(res);

    const redirectTo = env.CLIENT_BASE_URL ?? (env.ORIGIN_ALLOWLIST[0] ?? "/");
    res.redirect(redirectTo);
  } catch (err) {
    next(err);
  }
});

// /api/me is handled in index.ts for clarity

export default router;
