import { NextResponse } from "next/server";
import { guardAuth, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authError = await guardAuth();
  if (authError) return authError;
  const agents = await prisma.agent.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const authError = await guardAuth();
  if (authError) return authError;

  const body = await req.json().catch(() => null);
  if (!body?.name) return jsonError("Name is required");

  const agent = await prisma.agent.create({
    data: {
      name: String(body.name),
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
    },
  });
  return NextResponse.json({ agent });
}
