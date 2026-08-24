import { cookies } from "next/headers";
import { AUTH_COOKIE } from "./constants";
import {
  createSessionToken,
  expectedPassword,
  verifySessionToken,
} from "./auth-token";

export { createSessionToken, expectedPassword, verifySessionToken };

export async function isAuthenticated() {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export async function requireAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    throw new Error("UNAUTHORIZED");
  }
}
