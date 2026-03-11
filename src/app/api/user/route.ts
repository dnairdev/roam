import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true, phone: true, onboarded: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const body = await req.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(body.name  !== undefined && { name:  body.name  }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.onboarded !== undefined && { onboarded: body.onboarded }),
    },
    select: { id: true, name: true, email: true, image: true, phone: true, onboarded: true },
  });

  return NextResponse.json(user);
}
