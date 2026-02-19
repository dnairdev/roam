import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const buckets = await prisma.bucket.findMany({
    where: { userId },
    include: { _count: { select: { ideas: true } } },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(buckets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session as any).userId;
  const body = await req.json();

  const bucket = await prisma.bucket.create({
    data: {
      name: body.name || "New Bucket",
      emoji: body.emoji || "📁",
      order: body.order ?? 0,
      userId,
    },
    include: { _count: { select: { ideas: true } } },
  });

  return NextResponse.json(bucket, { status: 201 });
}
