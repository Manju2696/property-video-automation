import { NextResponse } from "next/server";
import { createSessionToken, expectedPassword } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (password !== expectedPassword()) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
