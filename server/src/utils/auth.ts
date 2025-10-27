import type { Request, Response, NextFunction } from "express";
import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";
import { env, isProd } from "./env";
import { getUserById, type User } from "../services/user";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
export const GUEST_COOKIE = "guest_session_id";
const OAUTH_STATE_COOKIE = "oauth_state";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const signAccessToken = async (user: User) => {
  const ttl = env.ACCESS_TOKEN_TTL_MIN * 60; // seconds
  return await new SignJWT({ sub: user.id, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(nowSeconds() + ttl)
    .sign(new TextEncoder().encode(env.JWT_SECRET || "dev-secret"));
};

export const signRefreshToken = async (user: User) => {
  const ttl = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60; // seconds
  return await new SignJWT({ sub: user.id, typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(nowSeconds() + ttl)
    .sign(new TextEncoder().encode(env.REFRESH_SECRET || env.JWT_SECRET || "dev-secret"));
};

export const setAuthCookies = (res: Response, access: string, refresh: string) => {
  const common = {
    httpOnly: true as const,
    secure: isProd as boolean,
    sameSite: "lax" as const,
    path: "/"
  };
  res.cookie(ACCESS_COOKIE, access, { ...common, maxAge: env.ACCESS_TOKEN_TTL_MIN * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, {
    ...common,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  });
};

export const clearAuthCookies = (res: Response) => {
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
  res.clearCookie(ACCESS_COOKIE, opts);
  res.clearCookie(REFRESH_COOKIE, opts);
};

export const ensureGuestCookie = (req: Request, res: Response) => {
  let guestId = req.cookies?.[GUEST_COOKIE] as string | undefined;
  if (!guestId) {
    guestId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    res.cookie(GUEST_COOKIE, guestId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }
  return guestId;
};

export const getUserFromRequest = async (req: Request): Promise<User | null> => {
  try {
    const token = req.cookies?.[ACCESS_COOKIE];
    if (!token) return null;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env.JWT_SECRET || "dev-secret")
    );
    if (payload.typ !== "access" || !payload.sub || typeof payload.sub !== "string") return null;
    return getUserById(payload.sub) ?? null;
  } catch {
    return null;
  }
};

export const issueStateCookie = (res: Response) => {
  const state = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000 // 10 min
  });
  return state;
};

export const readStateCookie = (req: Request) => req.cookies?.[OAUTH_STATE_COOKIE] as
  | string
  | undefined;

export const clearStateCookie = (res: Response) => {
  res.clearCookie(OAUTH_STATE_COOKIE, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
};

export const buildGoogleAuthUrl = (state: string) => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${env.SERVER_BASE_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code: string) => {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID || "",
    client_secret: env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: `${env.SERVER_BASE_URL}/api/auth/google/callback`,
    grant_type: "authorization_code"
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!res.ok) throw new Error("Failed to exchange Google auth code");
  return (await res.json()) as { id_token: string };
};

export const verifyGoogleIdToken = async (idToken: string) => {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: env.GOOGLE_CLIENT_ID || ""
  });
  const sub = payload.sub as string;
  const email = payload.email as string;
  const name = (payload.name as string) || email;
  const picture = payload.picture as string | undefined;
  if (!sub || !email) throw new Error("Invalid Google token payload");
  return { sub, email, name, picture };
};
