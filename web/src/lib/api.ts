import { NextResponse } from "next/server";
import { isAuthenticated } from "./auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function guardAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return jsonError("Unauthorized", 401);
  }
  return null;
}
